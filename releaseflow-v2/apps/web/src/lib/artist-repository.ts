import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  collection, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { normalizeArtistName } from './artist-field-picker-logic';

/** Canonical path: organizations/{organizationId}/artists/{artistId} */
const LEGACY_COLLECTION = 'artists';

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
  migratedFromLegacy?: boolean;
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
    migratedFromLegacy: data.migratedFromLegacy as boolean | undefined,
  };
}

export function mergeArtistCatalogues(
  legacyArtists: ArtistRecord[],
  nestedArtists: ArtistRecord[],
): ArtistRecord[] {
  const byId = new Map<string, ArtistRecord>();
  for (const a of legacyArtists) byId.set(a.id, a);
  for (const a of nestedArtists) byId.set(a.id, a);
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function findArtistByNormalizedName(
  organizationId: string,
  name: string,
): Promise<ArtistRecord | null> {
  const db = getDb();
  if (!db || !organizationId) return null;
  const normalized = normalizeArtistName(name);
  if (!normalized) return null;

  try {
    const nestedSnap = await getDocs(
      query(
        artistsCollection(db, organizationId),
        where('normalizedName', '==', normalized),
        limit(1),
      ),
    );
    if (!nestedSnap.empty) {
      const d = nestedSnap.docs[0]!;
      return toArtistRecord(d.id, d.data() as Record<string, unknown>, organizationId);
    }
  } catch (error) {
    console.warn('[ArtistRepository] Nested duplicate lookup unavailable', error);
  }

  try {
    const legacySnap = await getDocs(
      query(
        collection(db, LEGACY_COLLECTION),
        where('organizationId', '==', organizationId),
        where('normalizedName', '==', normalized),
        limit(1),
      ),
    );
    if (!legacySnap.empty) {
      const d = legacySnap.docs[0]!;
      return toArtistRecord(d.id, d.data() as Record<string, unknown>, organizationId);
    }

    const legacyNameSnap = await getDocs(
      query(
        collection(db, LEGACY_COLLECTION),
        where('organizationId', '==', organizationId),
        limit(200),
      ),
    );
    const legacyMatch = legacyNameSnap.docs.find(
      (d) => normalizeArtistName((d.data().name as string) ?? '') === normalized,
    );
    if (legacyMatch) {
      return toArtistRecord(legacyMatch.id, legacyMatch.data() as Record<string, unknown>, organizationId);
    }
  } catch (error) {
    console.warn('[ArtistRepository] Legacy duplicate lookup unavailable', error);
  }

  return null;
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

  const nestedRef = artistDocument(db, organizationId, artistId);
  const nestedSnap = await getDoc(nestedRef);
  if (nestedSnap.exists()) {
    await updateDoc(nestedRef, update);
    return;
  }

  const legacyRef = doc(db, LEGACY_COLLECTION, artistId);
  const legacySnap = await getDoc(legacyRef);
  if (legacySnap.exists()) {
    await updateDoc(legacyRef, update);
  }
}

export async function deleteArtist(organizationId: string, artistId: string): Promise<void> {
  const db = getDb();
  if (!db || !organizationId) return;

  const nestedRef = artistDocument(db, organizationId, artistId);
  const nestedSnap = await getDoc(nestedRef);
  if (nestedSnap.exists()) {
    await deleteDoc(nestedRef);
    return;
  }

  const legacyRef = doc(db, LEGACY_COLLECTION, artistId);
  const legacySnap = await getDoc(legacyRef);
  if (legacySnap.exists()) {
    await deleteDoc(legacyRef);
  }
}

export async function getArtist(organizationId: string, artistId: string): Promise<ArtistRecord | null> {
  const db = getDb();
  if (!db || !organizationId || !artistId) return null;

  const nestedSnap = await getDoc(artistDocument(db, organizationId, artistId));
  if (nestedSnap.exists()) {
    return toArtistRecord(nestedSnap.id, nestedSnap.data() as Record<string, unknown>, organizationId);
  }

  const legacySnap = await getDoc(doc(db, LEGACY_COLLECTION, artistId));
  if (legacySnap.exists()) {
    const data = legacySnap.data() as Record<string, unknown>;
    if ((data.organizationId as string) === organizationId) {
      return toArtistRecord(legacySnap.id, data, organizationId);
    }
  }

  return null;
}

async function listNestedArtists(organizationId: string): Promise<ArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  console.log('[ArtistRepository] Query path: organizations/' + organizationId + '/artists');
  const snap = await getDocs(
    query(artistsCollection(db, organizationId), orderBy('name', 'asc')),
  );
  console.log('[ArtistRepository] Nested snapshot size:', snap.size);
  return snap.docs.map((d) => toArtistRecord(d.id, d.data() as Record<string, unknown>, organizationId));
}

async function listLegacyArtists(organizationId: string): Promise<ArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  console.log('[ArtistRepository] Query path: artists (organizationId == ' + organizationId + ')');
  const snap = await getDocs(
    query(
      collection(db, LEGACY_COLLECTION),
      where('organizationId', '==', organizationId),
      orderBy('name', 'asc'),
    ),
  );
  console.log('[ArtistRepository] Legacy snapshot size:', snap.size);
  return snap.docs.map((d) => toArtistRecord(d.id, d.data() as Record<string, unknown>, organizationId));
}

export async function listArtists(organizationId: string): Promise<ArtistRecord[]> {
  console.group('[ArtistRepository] listArtists');
  console.log('organizationId:', organizationId);

  if (!organizationId) {
    console.warn('[ArtistRepository] listArtists aborted — organizationId is empty');
    console.groupEnd();
    return [];
  }

  let nestedArtists: ArtistRecord[] = [];
  let legacyArtists: ArtistRecord[] = [];
  let nestedFailed = false;
  let legacyFailed = false;

  try {
    nestedArtists = await listNestedArtists(organizationId);
  } catch (error) {
    nestedFailed = true;
    console.warn('[ArtistRepository] Nested catalogue unavailable', error);
  }

  try {
    legacyArtists = await listLegacyArtists(organizationId);
  } catch (error) {
    legacyFailed = true;
    console.warn('[ArtistRepository] Legacy catalogue unavailable', error);
  }

  const merged = mergeArtistCatalogues(legacyArtists, nestedArtists);

  console.log('Nested artists count:', nestedArtists.length);
  console.log('Legacy artists count:', legacyArtists.length);
  console.log('Merged count:', merged.length);

  if (merged.length === 0 && (nestedFailed || legacyFailed)) {
    console.warn('[ArtistRepository] Catalogue empty — nested failed:', nestedFailed, 'legacy failed:', legacyFailed);
  }

  console.groupEnd();
  return merged;
}

export async function searchArtists(organizationId: string, search: string): Promise<ArtistRecord[]> {
  const catalogue = await listArtists(organizationId);
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return catalogue;
  return catalogue.filter((artist) => artist.name.toLowerCase().includes(normalizedSearch));
}

/** @deprecated Use listArtists */
export async function getArtists(orgId?: string, _maxResults = 50): Promise<ArtistRecord[]> {
  if (!orgId) return [];
  return listArtists(orgId);
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

export async function writeArtistToCanonicalPath(
  organizationId: string,
  artistId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const name = (data.name as string) ?? '';
  await setDoc(artistDocument(db, organizationId, artistId), {
    ...data,
    organizationId,
    normalizedName: (data.normalizedName as string) ?? normalizeArtistName(name),
    slug: (data.slug as string) ?? slugify(name),
    migratedFromLegacy: true,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}