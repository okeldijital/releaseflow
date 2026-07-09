import {
  collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface PublishingSplitRecord {
  id: string;
  trackId: string;
  organizationId: string;
  personId: string;
  role: 'writer' | 'publisher';
  share: number;
  ipi?: string;
  pro?: string;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export async function createPublishingSplit(fields: {
  trackId: string;
  organizationId: string;
  personId: string;
  role: PublishingSplitRecord['role'];
  share: number;
  ipi?: string;
  pro?: string;
  notes?: string;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'publishing_splits'), {
    ...fields,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updatePublishingSplit(
  splitId: string,
  fields: {
    role?: PublishingSplitRecord['role'];
    share?: number;
    ipi?: string;
    pro?: string;
    notes?: string;
  },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'publishing_splits', splitId), {
    ...fields,
    updatedAt: Timestamp.now(),
  });
}

export async function deletePublishingSplit(splitId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'publishing_splits', splitId));
}

export async function getPublishingSplitsByTrack(trackId: string): Promise<PublishingSplitRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'publishing_splits'), where('trackId', '==', trackId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PublishingSplitRecord);
}

export async function getTotalWriterShare(trackId: string): Promise<number> {
  const splits = await getPublishingSplitsByTrack(trackId);
  return splits.filter((s) => s.role === 'writer').reduce((sum, s) => sum + s.share, 0);
}

export async function getTotalPublisherShare(trackId: string): Promise<number> {
  const splits = await getPublishingSplitsByTrack(trackId);
  return splits.filter((s) => s.role === 'publisher').reduce((sum, s) => sum + s.share, 0);
}
