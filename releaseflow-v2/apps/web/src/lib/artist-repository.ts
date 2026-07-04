import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { normalizeArtistName } from './artist-field-picker-logic';

export interface ArtistRecord {
  id: string;
  name: string;
  slug: string;
  normalizedName: string;
  artistType: string;
  bio?: string | null;
  country?: string | null;
  genres?: string[] | null;
  imageUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  organizationId: string;
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
  organizationId: string;
  bio?: string;
  country?: string;
  genres?: string[];
  imageUrl?: string;
  socialLinks?: Record<string, string>;
}

export interface CreateArtistResult {
  id: string;
  name: string;
  created: boolean;
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
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function artistsCollection(db: ReturnType<typeof getDb>, organizationId: string) {
  return collection(db!, 'organizations', organizationId, 'artists');
}

function artistDocument(db: ReturnType<typeof getDb>, organizationId: string, artistId: string) {
  return doc(db!, 'organizations', organizationId, 'artists', artistId);
}

function toArtistRecord(id: string, data: Record<string, unknown>, organizationId: string): ArtistRecord {
  const name = (data.name as string) ?? '';
  return {
    id,
    name,
    slug: (data.slug as string) ?? slugify(name),
    normalizedName: (data.normalizedName as string) ?? normalizeArtistName(name),
    artistType: (data.artistType as string) ?? 'original_artist',
    bio: (data.bio as string | null) ?? null,
    country: (data.country as string | null) ?? null,
    genres: (data.genres as string[] | null) ?? null,
    imageUrl: (data.imageUrl as string | null) ?? null,
    socialLinks: (data.socialLinks as Record<string, string> | null) ?? null,
    organizationId: (data.organizationId as string) ?? organizationId,
    status: (data.status as string) ?? 'active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function findArtistByNormalizedName(
  organizationId: string,
  name: string,
): Promise<ArtistRecord | null> {
  const db = getDb();
  if (!db || !organizationId) return null;
  const normalized = normalizeArtistName(name);
  if (!normalized) return null;

  const snap = await getDocs(
    query(
      artistsCollection(db, organizationId),
      where('normalizedName', '==', normalized),
      limit(1),
    ),
  );
  if (snap.empty) return null;

  const d = snap.docs[0]!;
  return toArtistRecord(d.id, d.data() as Record<string, unknown>, organizationId);
}

export async function createArtist(fields: CreateArtistFields): Promise<CreateArtistResult> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  if (!fields.organizationId) throw new Error('Organization ID is required');

  const trimmedName = fields.name.trim();
  if (!trimmedName) throw new Error('Artist name is required');

  const existing = await findArtistByNormalizedName(fields.organizationId, trimmedName);
  if (existing) {
    return { id: existing.id, name: existing.name, created: false };
  }

  const now = Timestamp.now();
  const normalized = normalizeArtistName(trimmedName);
  const ref = await addDoc(artistsCollection(db, fields.organizationId), {
    name: trimmedName,
    slug: slugify(trimmedName),
    normalizedName: normalized,
    artistType: fields.artistType,
    organizationId: fields.organizationId,
    bio: fields.bio ?? null,
    country: fields.country ?? null,
    genres: fields.genres ?? null,
    imageUrl: fields.imageUrl ?? null,
    socialLinks: fields.socialLinks ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  return { id: ref.id, name: trimmedName, created: true };
}

export async function updateArtist(
  organizationId: string,
  artistId: string,
  fields: UpdateArtistFields,
): Promise<void> {
  const db = getDb();
  if (!db || !organizationId) return;

  const ref = artistDocument(db, organizationId, artistId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return;

  if (fields.name !== undefined) {
    const trimmed = fields.name.trim();
    if (!trimmed) throw new Error('Artist name is required');
    const conflict = await findArtistByNormalizedName(organizationId, trimmed);
    if (conflict && conflict.id !== artistId) {
      throw new Error('An artist with this name already exists in your organisation.');
    }
  }

  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.name !== undefined) {
    update.name = fields.name.trim();
    update.slug = slugify(fields.name);
    update.normalizedName = normalizeArtistName(fields.name);
  }
  if (fields.artistType !== undefined) update.artistType = fields.artistType;
  if (fields.bio !== undefined) update.bio = fields.bio;
  if (fields.country !== undefined) update.country = fields.country;
  if (fields.genres !== undefined) update.genres = fields.genres;
  if (fields.imageUrl !== undefined) update.imageUrl = fields.imageUrl;
  if (fields.socialLinks !== undefined) update.socialLinks = fields.socialLinks;
  if (fields.status !== undefined) update.status = fields.status;

  await updateDoc(ref, update);
}

export async function deleteArtist(organizationId: string, artistId: string): Promise<void> {
  const db = getDb();
  if (!db || !organizationId) return;

  const ref = artistDocument(db, organizationId, artistId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
  }
}

export async function getArtist(organizationId: string, artistId: string): Promise<ArtistRecord | null> {
  const db = getDb();
  if (!db || !organizationId || !artistId) return null;

  const snap = await getDoc(artistDocument(db, organizationId, artistId));
  if (!snap.exists()) return null;

  return toArtistRecord(snap.id, snap.data() as Record<string, unknown>, organizationId);
}

export async function listArtists(organizationId: string): Promise<ArtistRecord[]> {
  const db = getDb();
  if (!db || !organizationId) return [];

  const snap = await getDocs(
    query(artistsCollection(db, organizationId), orderBy('name', 'asc')),
  );

  return snap.docs.map((d) => toArtistRecord(d.id, d.data() as Record<string, unknown>, organizationId));
}

export async function searchArtists(organizationId: string, search: string): Promise<ArtistRecord[]> {
  const catalogue = await listArtists(organizationId);
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return catalogue;
  return catalogue.filter((artist) => artist.name.toLowerCase().includes(normalizedSearch));
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