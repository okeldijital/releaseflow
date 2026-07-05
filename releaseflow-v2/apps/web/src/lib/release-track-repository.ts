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

  console.log("QUERY 1");
  let snap;
  try {
    snap = await getDocs(
      query(collection(db, 'release_tracks'), where('releaseId', '==', releaseId), orderBy('position', 'asc')),
    );
    console.log("QUERY 1 OK — size:", snap.size);
  } catch (error) {
    console.error("QUERY 1 FAILED");
    console.error(error);
    throw error;
  }

  console.log("RAW RELEASE_TRACK DOCS");
  console.table(
    snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  );
  console.log("release_tracks:", snap.size);

  const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseTrackRecord);
  const results: (ReleaseTrackRecord & { track: TrackRecord | null })[] = [];

  for (const rec of records) {
    console.log("QUERY 2 — tracks/" + rec.trackId);
    let tSnap;
    try {
      tSnap = await getDoc(doc(db, 'tracks', rec.trackId));
      console.log("QUERY 2 OK — exists:", tSnap.exists());
    } catch (error) {
      console.error("QUERY 2 FAILED");
      console.error(error);
      throw error;
    }

    if (tSnap.exists()) {
      const data = tSnap.data();
      results.push({
        ...rec,
        track: { id: tSnap.id, ...data, recordingType: resolveRecordingType(data.recordingType) } as TrackRecord,
      });
    } else {
      results.push({ ...rec, track: null });
    }
  }

  console.log("RAW TRACK DOCS");
  console.table(
    results.map((track) => ({
      id: track.track?.id ?? null,
      title: track.track?.title ?? null,
      organizationId: track.track?.organizationId ?? null,
    }))
  );
  console.log("tracks:", results.length);
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
