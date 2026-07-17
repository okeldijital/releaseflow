import {
  doc, getDocs, addDoc, deleteDoc,
  collection, query, where, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface AssignmentWatcherRecord {
  id: string;
  assignmentId: string;
  userId: string;
  createdAt: Timestamp;
}

function toRecord(id: string, data: Record<string, unknown>): AssignmentWatcherRecord {
  return {
    id,
    assignmentId: data.assignmentId as string,
    userId: data.userId as string,
    createdAt: data.createdAt as Timestamp,
  };
}

export async function addWatcher(
  assignmentId: string,
  userId: string,
): Promise<AssignmentWatcherRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const data = {
    assignmentId,
    userId,
    createdAt: now,
  };
  const ref = await addDoc(collection(db, 'assignment_watchers'), data);
  return toRecord(ref.id, { ...data, id: ref.id });
}

export async function removeWatcher(
  assignmentId: string,
  userId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDocs(
    query(
      collection(db, 'assignment_watchers'),
      where('assignmentId', '==', assignmentId),
      where('userId', '==', userId),
    ),
  );
  const deletions = snap.docs.map((d) => deleteDoc(doc(db, 'assignment_watchers', d.id)));
  await Promise.all(deletions);
}

export async function getWatchers(
  assignmentId: string,
): Promise<AssignmentWatcherRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'assignment_watchers'),
      where('assignmentId', '==', assignmentId),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function isWatching(
  assignmentId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const snap = await getDocs(
    query(
      collection(db, 'assignment_watchers'),
      where('assignmentId', '==', assignmentId),
      where('userId', '==', userId),
    ),
  );
  return snap.docs.length > 0;
}

export async function getWatchedAssignments(
  userId: string,
): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'assignment_watchers'),
      where('userId', '==', userId),
    ),
  );
  return snap.docs.map((d) => (d.data() as Record<string, unknown>).assignmentId as string);
}
