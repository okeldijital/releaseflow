import {
  doc, getDoc, updateDoc, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';
import type { TrackCredit } from '@/app/(app)/types';

export type { TrackCredit };

export async function getCreditsByTrack(trackId: string): Promise<TrackCredit[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) return [];
  const data = snap.data();
  return (data.credits as TrackCredit[]) ?? [];
}

export async function setTrackCredits(trackId: string, credits: TrackCredit[]): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  await updateDoc(doc(db, 'tracks', trackId), {
    credits,
    updatedAt: Timestamp.now(),
  });
}

export async function addTrackCredit(trackId: string, credit: TrackCredit): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) throw new Error('Track not found');
  const existing: TrackCredit[] = snap.data().credits ?? [];
  await updateDoc(doc(db, 'tracks', trackId), {
    credits: [...existing, credit],
    updatedAt: Timestamp.now(),
  });
}

export async function removeTrackCredit(trackId: string, index: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) throw new Error('Track not found');
  const existing: TrackCredit[] = snap.data().credits ?? [];
  existing.splice(index, 1);
  await updateDoc(doc(db, 'tracks', trackId), {
    credits: existing,
    updatedAt: Timestamp.now(),
  });
}

export async function updateTrackCredit(trackId: string, index: number, credit: TrackCredit): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) throw new Error('Track not found');
  const existing: TrackCredit[] = snap.data().credits ?? [];
  if (index < 0 || index >= existing.length) throw new Error('Credit index out of range');
  existing[index] = credit;
  await updateDoc(doc(db, 'tracks', trackId), {
    credits: existing,
    updatedAt: Timestamp.now(),
  });
}
