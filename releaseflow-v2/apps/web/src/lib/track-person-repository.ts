import {
  doc, getDocs, addDoc, deleteDoc,
  collection, query, where, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface TrackPersonRecord {
  id: string;
  trackId: string;
  personId: string;
  primaryRole: string;
  responsibility?: string;
  status: 'active' | 'inactive';
  createdAt: unknown;
}

export interface AddPersonToTrackFields {
  trackId: string;
  personId: string;
  primaryRole: string;
  responsibility?: string;
  status?: 'active' | 'inactive';
}

export async function addPersonToTrack(fields: AddPersonToTrackFields): Promise<TrackPersonRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'track_people'), {
    trackId: fields.trackId,
    personId: fields.personId,
    primaryRole: fields.primaryRole,
    responsibility: fields.responsibility ?? null,
    status: fields.status ?? 'active',
    createdAt: now,
  });
  return {
    id: ref.id,
    trackId: fields.trackId,
    personId: fields.personId,
    primaryRole: fields.primaryRole,
    responsibility: fields.responsibility,
    status: fields.status ?? 'active',
    createdAt: now,
  };
}

export async function removePersonFromTrack(recordId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'track_people', recordId));
}

export async function getPeopleByTrack(trackId: string): Promise<TrackPersonRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_people'), where('trackId', '==', trackId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackPersonRecord);
}

export async function getTracksByPerson(personId: string): Promise<TrackPersonRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_people'), where('personId', '==', personId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackPersonRecord);
}
