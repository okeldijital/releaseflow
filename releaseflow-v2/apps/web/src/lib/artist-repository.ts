import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface ArtistRecord {
  id: string;
  name: string;
  slug: string;
  artistType: string;
  bio?: string | null;
  country?: string | null;
  genres?: string[] | null;
  imageUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  status: string;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface ReleaseArtistRecord {
  id: string;
  releaseId: string;
  artistId: string;
  role: string;
  isPrimary: boolean;
}

export interface TrackCreditRecord {
  id: string;
  trackId: string;
  artistId: string;
  role: string;
}

export interface CreateArtistFields {
  name: string;
  artistType: string;
  bio?: string;
  country?: string;
  genres?: string[];
  imageUrl?: string;
  socialLinks?: Record<string, string>;
}

export interface UpdateArtistFields {
  name?: string;
  artistType?: string;
  bio?: string | null;
  country?: string | null;
  genres?: string[] | null;
  imageUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  status?: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

export async function updateArtist(artistId: string, fields: UpdateArtistFields): Promise<void> {
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

export async function deleteArtist(artistId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'artists', artistId));
}

export async function getArtist(artistId: string): Promise<ArtistRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'artists', artistId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ArtistRecord;
}

export async function getArtists(maxResults = 50): Promise<ArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'artists'), orderBy('name', 'asc'), limit(maxResults)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ArtistRecord);
}

export async function getArtistsByRelease(releaseId: string): Promise<ReleaseArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'release_artists'), where('releaseId', '==', releaseId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseArtistRecord);
}

export async function getArtistReleases(artistId: string): Promise<{ id: string; title: string; role: string; status: string; releaseType: string }[]> {
  const db = getDb();
  if (!db) return [];
  const artSnap = await getDocs(
    query(collection(db, 'release_artists'), where('artistId', '==', artistId)),
  );
  const rels = artSnap.docs.map((d) => d.data() as ReleaseArtistRecord);
  const results: { id: string; title: string; role: string; status: string; releaseType: string }[] = [];
  for (const rel of rels) {
    const rSnap = await getDoc(doc(db, 'releases', rel.releaseId));
    if (rSnap.exists()) {
      const rData = rSnap.data();
      results.push({ id: rSnap.id, title: rData.title as string, role: rel.role, status: rData.status as string, releaseType: rData.releaseType as string });
    }
  }
  return results;
}

export async function getCreditsByArtist(artistId: string): Promise<TrackCreditRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_credits'), where('artistId', '==', artistId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackCreditRecord);
}

export async function getTrackTitle(trackId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) return null;
  return (snap.data() as { title?: string }).title ?? null;
}
