import {
  doc, getDocs, addDoc, deleteDoc, writeBatch,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type TrackArtistRole =
  | 'PRIMARY_ARTIST'
  | 'FEATURED_ARTIST'
  | 'ORIGINAL_ARTIST'
  | 'REMIX_ARTIST'
  | 'PRODUCER'
  | 'COMPOSER'
  | 'WRITER'
  | 'MIX_ENGINEER'
  | 'MASTERING_ENGINEER';

export interface TrackArtistRecord {
  id: string;
  trackId: string;
  artistId: string;
  role: TrackArtistRole;
  position: number;
  creditedAs?: string;
  isPrimary?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AddArtistToTrackFields {
  trackId: string;
  artistId: string;
  role: TrackArtistRole;
  position: number;
  creditedAs?: string;
  isPrimary?: boolean;
}

function normalizeDoc(d: { id: string; [key: string]: unknown }): TrackArtistRecord {
  const data = d as Record<string, unknown>;
  let role = data.role as TrackArtistRole | undefined;
  if (!role && data.artistType) {
    const legacy = data.artistType as string;
    const map: Record<string, TrackArtistRole> = {
      original_artist: 'ORIGINAL_ARTIST',
      remixer: 'REMIX_ARTIST',
      featured_artist: 'FEATURED_ARTIST',
      composer: 'COMPOSER',
      producer: 'PRODUCER',
    };
    role = map[legacy] ?? ('ORIGINAL_ARTIST' as TrackArtistRole);
  }
  let position = (data.position as number) ?? (data.billingOrder as number) ?? 0;
  if (typeof position !== 'number') position = 0;

  return {
    id: d.id,
    trackId: data.trackId as string,
    artistId: data.artistId as string,
    role: role ?? 'ORIGINAL_ARTIST',
    position,
    creditedAs: (data.creditedAs as string) ?? (data.creditName as string) ?? undefined,
    isPrimary: (data.isPrimary as boolean) ?? undefined,
    createdAt: (data.createdAt as Timestamp) ?? Timestamp.now(),
    updatedAt: (data.updatedAt as Timestamp) ?? (data.createdAt as Timestamp) ?? Timestamp.now(),
  };
}

export async function addArtistToTrack(fields: AddArtistToTrackFields): Promise<TrackArtistRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'track_artists'), {
    trackId: fields.trackId,
    artistId: fields.artistId,
    role: fields.role,
    position: fields.position,
    creditedAs: fields.creditedAs ?? null,
    isPrimary: fields.isPrimary ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: ref.id,
    trackId: fields.trackId,
    artistId: fields.artistId,
    role: fields.role,
    position: fields.position,
    creditedAs: fields.creditedAs,
    isPrimary: fields.isPrimary,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateArtistPosition(recordId: string, position: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  const { updateDoc } = await import('@firebase/firestore');
  await updateDoc(doc(db, 'track_artists', recordId), { position, updatedAt: Timestamp.now() });
}

export async function updateArtistsPositions(updates: { recordId: string; position: number }[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  if (updates.length === 0) return;
  const batch = writeBatch(db);
  const now = Timestamp.now();
  for (const u of updates) {
    batch.update(doc(db, 'track_artists', u.recordId), { position: u.position, updatedAt: now });
  }
  await batch.commit();
}

export async function removeArtistFromTrack(recordId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'track_artists', recordId));
}

export async function removeArtistsFromTrackByRole(trackId: string, role: TrackArtistRole): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDocs(
    query(collection(db, 'track_artists'), where('trackId', '==', trackId), where('role', '==', role)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  for (const d of snap.docs) batch.delete(d.ref);
  await batch.commit();
}

export async function removeAllArtistsFromTrack(trackId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDocs(
    query(collection(db, 'track_artists'), where('trackId', '==', trackId)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  for (const d of snap.docs) batch.delete(d.ref);
  await batch.commit();
}

export async function getArtistsByRole(trackId: string, role: TrackArtistRole): Promise<TrackArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'track_artists'),
      where('trackId', '==', trackId),
      where('role', '==', role),
      orderBy('position', 'asc'),
    ),
  );
  return snap.docs.map((d) => normalizeDoc({ id: d.id, ...d.data() }));
}

export async function getArtistsByTrack(trackId: string): Promise<TrackArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'track_artists'),
      where('trackId', '==', trackId),
      orderBy('position', 'asc'),
    ),
  );
  return snap.docs.map((d) => normalizeDoc({ id: d.id, ...d.data() }));
}

export async function getTracksByArtist(artistId: string): Promise<TrackArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_artists'), where('artistId', '==', artistId)),
  );
  return snap.docs.map((d) => normalizeDoc({ id: d.id, ...d.data() }));
}

/** EPIC-202 — tracks where artist is credited in a specific role */
export async function getTracksByArtistRole(
  artistId: string,
  role: TrackArtistRole,
): Promise<TrackArtistRecord[]> {
  const all = await getTracksByArtist(artistId);
  return all
    .filter((l) => l.role === role)
    .sort((a, b) => a.position - b.position);
}

export async function getTracksAsOriginalArtist(artistId: string): Promise<TrackArtistRecord[]> {
  const all = await getTracksByArtist(artistId);
  return all.filter(
    (l) => l.role === 'ORIGINAL_ARTIST' || l.role === 'PRIMARY_ARTIST',
  );
}

export async function getTracksAsFeaturedArtist(artistId: string): Promise<TrackArtistRecord[]> {
  return getTracksByArtistRole(artistId, 'FEATURED_ARTIST');
}

export async function getTracksAsRemixArtist(artistId: string): Promise<TrackArtistRecord[]> {
  return getTracksByArtistRole(artistId, 'REMIX_ARTIST');
}

/** Union of every role for an artist (may include same track multiple times if multi-credited). */
export async function getAllArtistTracks(artistId: string): Promise<TrackArtistRecord[]> {
  return getTracksByArtist(artistId);
}

export async function ensureArtistInTrack(
  trackId: string,
  artistId: string,
  role: TrackArtistRole,
  position: number,
  isPrimary?: boolean,
): Promise<TrackArtistRecord | null> {
  const existing = await getArtistsByRole(trackId, role);
  const already = existing.find((a) => a.artistId === artistId);
  if (already) return already;
  return addArtistToTrack({ trackId, artistId, role, position, isPrimary });
}
