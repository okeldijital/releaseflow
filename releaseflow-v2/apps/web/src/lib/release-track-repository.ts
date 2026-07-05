import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { TrackRecord } from './track-repository';
import { resolveRecordingType } from '@/lib/recording-type';

export interface ReleaseTrackRecord {
  id: string;
  releaseId: string;
  trackId: string;
  position: number;
  createdAt: Timestamp;
}

export async function addTrackToRelease(releaseId: string, trackId: string, position: number): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'release_tracks'), {
    releaseId,
    trackId,
    position,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function removeTrackFromRelease(recordId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'release_tracks', recordId));
}

export async function getTracksByRelease(releaseId: string): Promise<(ReleaseTrackRecord & { track: TrackRecord | null })[]> {
  const db = getDb();
  if (!db) return [];

  const snap = await getDocs(
    query(collection(db, 'release_tracks'), where('releaseId', '==', releaseId), orderBy('position', 'asc')),
  );

  const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseTrackRecord);
  const results: (ReleaseTrackRecord & { track: TrackRecord | null })[] = [];

  for (const rec of records) {
    try {
      const tSnap = await getDoc(doc(db, 'tracks', rec.trackId));
      if (!tSnap.exists()) {
        console.warn('[release_tracks] orphan detected', rec.id, rec.trackId);
        continue;
      }
      const data = tSnap.data();
      results.push({
        ...rec,
        track: { id: tSnap.id, ...data, recordingType: resolveRecordingType(data.recordingType) } as TrackRecord,
      });
    } catch (error) {
      console.warn('[release_tracks] failed to load track', rec.trackId, error);
    }
  }

  return results;
}

export async function getReleasesByTrack(trackId: string): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'release_tracks'), where('trackId', '==', trackId)),
  );
  return snap.docs.map((d) => (d.data() as { releaseId: string }).releaseId);
}

export async function reorderTrack(releaseId: string, trackId: string, newPosition: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDocs(
    query(collection(db, 'release_tracks'), where('releaseId', '==', releaseId), where('trackId', '==', trackId)),
  );
  if (snap.docs.length === 0) return;
  const firstDoc = snap.docs[0];
  if (!firstDoc) return;
  await updateDoc(doc(db, 'release_tracks', firstDoc.id), { position: newPosition });
}
