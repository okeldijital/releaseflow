import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Artist, ArtistType, ArtistStatus, ReleaseArtist, ReleaseArtistRole, TrackCredit, CreditRole } from '@/app/(app)/types';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export interface CreateArtistFields {
  name: string;
  artistType: ArtistType;
  bio?: string;
  country?: string;
  genres?: string[];
  imageUrl?: string;
  socialLinks?: Record<string, string>;
}

export async function createArtist(fields: CreateArtistFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'artists'), {
    name: fields.name,
    slug: slugify(fields.name),
    artistType: fields.artistType,
    bio: fields.bio ?? null,
    country: fields.country ?? null,
    genres: fields.genres ?? null,
    imageUrl: fields.imageUrl ?? null,
    socialLinks: fields.socialLinks ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateArtist(artistId: string, fields: Partial<CreateArtistFields & { status: ArtistStatus }>): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.name !== undefined) { update.name = fields.name; update.slug = slugify(fields.name); }
  if (fields.artistType !== undefined) update.artistType = fields.artistType;
  if (fields.bio !== undefined) update.bio = fields.bio;
  if (fields.country !== undefined) update.country = fields.country;
  if (fields.genres !== undefined) update.genres = fields.genres;
  if (fields.imageUrl !== undefined) update.imageUrl = fields.imageUrl;
  if (fields.socialLinks !== undefined) update.socialLinks = fields.socialLinks;
  if (fields.status !== undefined) update.status = fields.status;
  await updateDoc(doc(db, 'artists', artistId), update);
}

export async function getArtists(limit_ = 50): Promise<Artist[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'artists'), orderBy('name', 'asc'), limit(limit_)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Artist);
}

export async function getArtist(artistId: string): Promise<Artist | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'artists', artistId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Artist;
}

export async function linkArtistToRelease(releaseId: string, artistId: string, role: ReleaseArtistRole, isPrimary: boolean): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'release_artists'), { releaseId, artistId, role, isPrimary });
  return ref.id;
}

export async function getArtistsByRelease(releaseId: string): Promise<ReleaseArtist[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'release_artists'), where('releaseId', '==', releaseId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseArtist);
}

export async function addTrackCredit(trackId: string, artistId: string, role: CreditRole): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'track_credits'), { trackId, artistId, role });
  return ref.id;
}

export async function getCreditsByTrack(trackId: string): Promise<TrackCredit[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_credits'), where('trackId', '==', trackId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackCredit);
}

export async function getCreditsByArtist(artistId: string): Promise<TrackCredit[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_credits'), where('artistId', '==', artistId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackCredit);
}

export interface ArtistReadinessResult {
  ready: boolean;
  percentage: number;
  missing: string[];
}

export async function checkArtistReadiness(artistId: string): Promise<ArtistReadinessResult> {
  const artist = await getArtist(artistId);
  if (!artist) return { ready: false, percentage: 0, missing: ['Artist not found'] };

  const checks: [boolean, string][] = [
    [!artist.name, 'Name'],
    [!artist.bio, 'Bio'],
    [!artist.imageUrl, 'Artist Image'],
    [!artist.country, 'Country'],
    [!artist.genres || artist.genres.length === 0, 'Genre'],
    [!artist.socialLinks || Object.values(artist.socialLinks).every((v) => !v), 'Social Links'],
  ];

  const total = checks.length;
  const passeed = checks.filter(([fail]) => !fail).length;
  const missing = checks.filter(([fail]) => fail).map(([, label]) => label);

  return {
    ready: missing.length === 0,
    percentage: Math.round((passeed / total) * 100),
    missing,
  };
}
