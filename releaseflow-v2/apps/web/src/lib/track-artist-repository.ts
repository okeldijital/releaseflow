import {
  doc, getDocs, addDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface TrackArtistRecord {
  id: string;
  trackId: string;
  artistId: string;
  artistType: 'original_artist' | 'featured_artist' | 'remixer' | 'composer' | 'producer';
  creditName?: string;
  billingOrder?: number;
  createdAt: unknown;
}

export interface AddArtistToTrackFields {
  trackId: string;
  artistId: string;
  artistType: TrackArtistRecord['artistType'];
  creditName?: string;
  billingOrder?: number;
}

export async function addArtistToTrack(fields: AddArtistToTrackFields): Promise<TrackArtistRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'track_artists'), {
    trackId: fields.trackId,
    artistId: fields.artistId,
    artistType: fields.artistType,
    creditName: fields.creditName ?? null,
    billingOrder: fields.billingOrder ?? null,
    createdAt: now,
  });
  return {
    id: ref.id,
    trackId: fields.trackId,
    artistId: fields.artistId,
    artistType: fields.artistType,
    creditName: fields.creditName,
    billingOrder: fields.billingOrder,
    createdAt: now,
  };
}

export async function removeArtistFromTrack(recordId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'track_artists', recordId));
}

export async function getArtistsByTrack(trackId: string): Promise<TrackArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'track_artists'),
      where('trackId', '==', trackId),
      orderBy('billingOrder', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackArtistRecord);
}

export async function getTracksByArtist(artistId: string): Promise<TrackArtistRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_artists'), where('artistId', '==', artistId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackArtistRecord);
}
