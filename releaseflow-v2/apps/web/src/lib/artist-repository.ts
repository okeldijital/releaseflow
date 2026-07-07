import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, writeBatch, Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { normalizeArtistName } from './artist-field-picker-logic';

export interface ArtistRecord {
  id: string;
  name: string;
  slug: string;
  normalizedName: string;
  stageName?: string | null;
  legalName?: string | null;
  artistType: string;
  bio?: string | null;
  country?: string | null;
  genres?: string[] | null;
  imageUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  isni?: string | null;
  ipi?: string | null;
  notes?: string | null;
  contact?: string | null;
  aliases?: string[] | null;
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
  stageName?: string;
  legalName?: string;
  artistType: string;
  organizationId: string;
  bio?: string;
  country?: string;
  genres?: string[];
  imageUrl?: string;
  socialLinks?: Record<string, string>;
  isni?: string;
  ipi?: string;
  notes?: string;
  contact?: string;
  aliases?: string[];
}

export interface CreateArtistResult {
  id: string;
  name: string;
  created: boolean;
}

export interface UpdateArtistFields {
  name?: string;
  stageName?: string | null;
  legalName?: string | null;
  artistType?: string;
  bio?: string | null;
  country?: string | null;
  genres?: string[] | null;
  imageUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  isni?: string | null;
  ipi?: string | null;
  notes?: string | null;
  contact?: string | null;
  aliases?: string[] | null;
  status?: string;
}

export interface ArtistUsageResult {
  tracks: number;
  releases: number;
  publishingCredits: number;
  featuredAppearances: number;
  remixes: number;
}

export interface ArtistReferenceSummary {
  tracks: number;
  releases: number;
  publishingRecords: number;
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
    stageName: (data.stageName as string | null) ?? null,
    legalName: (data.legalName as string | null) ?? null,
    artistType: (data.artistType as string) ?? 'original_artist',
    bio: (data.bio as string | null) ?? null,
    country: (data.country as string | null) ?? null,
    genres: (data.genres as string[] | null) ?? null,
    imageUrl: (data.imageUrl as string | null) ?? null,
    socialLinks: (data.socialLinks as Record<string, string> | null) ?? null,
    isni: (data.isni as string | null) ?? null,
    ipi: (data.ipi as string | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    contact: (data.contact as string | null) ?? null,
    aliases: (data.aliases as string[] | null) ?? null,
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
    stageName: fields.stageName ?? null,
    legalName: fields.legalName ?? null,
    artistType: fields.artistType,
    organizationId: fields.organizationId,
    bio: fields.bio ?? null,
    country: fields.country ?? null,
    genres: fields.genres ?? null,
    imageUrl: fields.imageUrl ?? null,
    socialLinks: fields.socialLinks ?? null,
    isni: fields.isni ?? null,
    ipi: fields.ipi ?? null,
    notes: fields.notes ?? null,
    contact: fields.contact ?? null,
    aliases: fields.aliases ?? null,
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
  if (fields.stageName !== undefined) update.stageName = fields.stageName;
  if (fields.legalName !== undefined) update.legalName = fields.legalName;
  if (fields.artistType !== undefined) update.artistType = fields.artistType;
  if (fields.bio !== undefined) update.bio = fields.bio;
  if (fields.country !== undefined) update.country = fields.country;
  if (fields.genres !== undefined) update.genres = fields.genres;
  if (fields.imageUrl !== undefined) update.imageUrl = fields.imageUrl;
  if (fields.socialLinks !== undefined) update.socialLinks = fields.socialLinks;
  if (fields.isni !== undefined) update.isni = fields.isni;
  if (fields.ipi !== undefined) update.ipi = fields.ipi;
  if (fields.notes !== undefined) update.notes = fields.notes;
  if (fields.contact !== undefined) update.contact = fields.contact;
  if (fields.aliases !== undefined) update.aliases = fields.aliases;
  if (fields.status !== undefined) update.status = fields.status;

  await updateDoc(ref, update);
}

export async function archiveArtist(organizationId: string, artistId: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = artistDocument(db, organizationId, artistId);
  await updateDoc(ref, { status: 'archived', updatedAt: Timestamp.now() });
}

export async function restoreArtist(organizationId: string, artistId: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = artistDocument(db, organizationId, artistId);
  await updateDoc(ref, { status: 'active', updatedAt: Timestamp.now() });
}

export async function deleteArtist(organizationId: string, artistId: string, actorId?: string, deleteReason?: string): Promise<void> {
  if (actorId) {
    const { softDelete } = await import('@/lib/retention/lifecycle-service');
    await softDelete({ entityType: 'artist', entityId: artistId, organizationId, actorId, deleteReason });
    return;
  }

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

export async function listArtists(organizationId: string, opts?: { includeArchived?: boolean }): Promise<ArtistRecord[]> {
  const db = getDb();
  if (!db || !organizationId) return [];

  const constraints: QueryConstraint[] = [orderBy('name', 'asc')];
  if (!opts?.includeArchived) {
    constraints.unshift(where('status', '!=', 'archived'));
  }

  const snap = await getDocs(
    query(artistsCollection(db, organizationId), ...constraints),
  );

  return snap.docs.map((d) => toArtistRecord(d.id, d.data() as Record<string, unknown>, organizationId));
}

export async function searchArtists(
  organizationId: string,
  search: string,
  opts?: { includeArchived?: boolean },
): Promise<ArtistRecord[]> {
  const catalogue = await listArtists(organizationId, opts);
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return catalogue;
  return catalogue.filter((artist) => {
    if (artist.name.toLowerCase().includes(normalizedSearch)) return true;
    if (artist.stageName?.toLowerCase().includes(normalizedSearch)) return true;
    if (artist.legalName?.toLowerCase().includes(normalizedSearch)) return true;
    if (artist.aliases?.some((a) => a.toLowerCase().includes(normalizedSearch))) return true;
    return false;
  });
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

export async function getArtistUsage(organizationId: string, artistId: string): Promise<ArtistUsageResult> {
  const db = getDb();
  if (!db) return { tracks: 0, releases: 0, publishingCredits: 0, featuredAppearances: 0, remixes: 0 };

  const trackArtistsSnap = await getDocs(
    query(collection(db, 'track_artists'), where('artistId', '==', artistId)),
  );

  const releaseArtistsSnap = await getDocs(
    query(collection(db, 'release_artists'), where('artistId', '==', artistId)),
  );

  const creditsSnap = await getDocs(
    query(collection(db, 'track_credits'), where('artistId', '==', artistId)),
  );

  const trackArtists = trackArtistsSnap.docs.map((d) => d.data());
  const trackArtistRoles = trackArtists.map((t) => (t as { role?: string }).role ?? '');

  const tracks = new Set(trackArtists.map((t) => (t as { trackId?: string }).trackId).filter(Boolean)).size;
  const releases = releaseArtistsSnap.size;
  const publishingCredits = creditsSnap.size;
  const featuredAppearances = trackArtistRoles.filter((r) =>
    r === 'FEATURED_ARTIST' || r === 'featured_artist',
  ).length;
  const remixes = trackArtistRoles.filter((r) =>
    r === 'REMIX_ARTIST' || r === 'remixer',
  ).length;

  return {
    tracks: Math.max(tracks, releases),
    releases,
    publishingCredits,
    featuredAppearances,
    remixes,
  };
}

export async function canDeleteArtist(organizationId: string, artistId: string): Promise<{ allowed: boolean; references: ArtistReferenceSummary }> {
  const db = getDb();
  if (!db) return { allowed: false, references: { tracks: 0, releases: 0, publishingRecords: 0 } };

  const trackArtistsSnap = await getDocs(
    query(collection(db, 'track_artists'), where('artistId', '==', artistId)),
  );

  const releaseArtistsSnap = await getDocs(
    query(collection(db, 'release_artists'), where('artistId', '==', artistId)),
  );

  const creditsSnap = await getDocs(
    query(collection(db, 'track_credits'), where('artistId', '==', artistId)),
  );

  const trackArtistIds = trackArtistsSnap.docs.map((d) => (d.data() as { trackId?: string }).trackId).filter(Boolean);
  const uniqueTracks = new Set(trackArtistIds).size;
  const releaseCount = releaseArtistsSnap.size;
  const creditCount = creditsSnap.size;

  const allowed = uniqueTracks === 0 && releaseCount === 0 && creditCount === 0;

  return {
    allowed,
    references: {
      tracks: uniqueTracks,
      releases: releaseCount,
      publishingRecords: creditCount,
    },
  };
}

export async function findDuplicateArtists(
  organizationId: string,
  name: string,
  stageName?: string,
): Promise<ArtistRecord[]> {
  const db = getDb();
  if (!db) return [];

  const all = await listArtists(organizationId, { includeArchived: true });
  const normalizedInput = normalizeArtistName(name);

  return all.filter((a) => {
    if (normalizeArtistName(a.name) === normalizedInput) return true;
    if (stageName && a.stageName && normalizeArtistName(a.stageName) === normalizeArtistName(stageName)) return true;
    if (a.aliases?.some((alias) => normalizeArtistName(alias) === normalizedInput)) return true;
    return false;
  });
}

export async function mergeArtists(
  organizationId: string,
  sourceArtistId: string,
  destinationArtistId: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const batch = writeBatch(db);

  const trackArtistsSnap = await getDocs(
    query(collection(db, 'track_artists'), where('artistId', '==', sourceArtistId)),
  );
  for (const d of trackArtistsSnap.docs) {
    batch.update(d.ref, { artistId: destinationArtistId, updatedAt: Timestamp.now() });
  }

  const releaseArtistsSnap = await getDocs(
    query(collection(db, 'release_artists'), where('artistId', '==', sourceArtistId)),
  );
  for (const d of releaseArtistsSnap.docs) {
    batch.update(d.ref, { artistId: destinationArtistId, updatedAt: Timestamp.now() });
  }

  const creditsSnap = await getDocs(
    query(collection(db, 'track_credits'), where('artistId', '==', sourceArtistId)),
  );
  for (const d of creditsSnap.docs) {
    batch.update(d.ref, { artistId: destinationArtistId, updatedAt: Timestamp.now() });
  }

  const sourceRef = artistDocument(db, organizationId, sourceArtistId);
  batch.delete(sourceRef);

  await batch.commit();
}
