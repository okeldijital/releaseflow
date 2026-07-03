import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export type SpecType = 'mastering' | 'mixing' | 'artwork';
export type SpecStatus = 'draft' | 'active' | 'completed' | 'submitted' | 'approved' | 'changes_requested';

export interface SpecRecord {
  id: string;
  trackId: string;
  organizationId: string;
  type: SpecType;
  title: string;
  status: SpecStatus;
  fields: Record<string, string | number | boolean>;
  revisionNumber: number;
  acceptanceCriteria?: string | null;
  reviewerId?: string | null;
  assignedPersonId?: string | null;
  taskId?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export async function createSpecification(
  trackId: string,
  orgId: string,
  type: SpecType,
  title: string,
  fields: Record<string, string | number | boolean>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'specifications'), {
    trackId,
    organizationId: orgId,
    type,
    title,
    status: 'draft' as SpecStatus,
    fields,
    revisionNumber: 1,
    acceptanceCriteria: null,
    reviewerId: null,
    assignedPersonId: null,
    taskId: null,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function updateSpecification(
  specId: string,
  fields: Partial<Pick<SpecRecord, 'status' | 'fields' | 'assignedPersonId' | 'taskId' | 'revisionNumber' | 'acceptanceCriteria' | 'reviewerId'>>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'specifications', specId), { ...fields, updatedAt: Timestamp.now() });
}

export async function getSpecification(specId: string): Promise<SpecRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'specifications', specId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SpecRecord;
}

export async function getSpecificationsByTrack(trackId: string): Promise<SpecRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'specifications'),
      where('trackId', '==', trackId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SpecRecord);
}

export async function completeSpecification(specId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'specifications', specId), {
    status: 'completed' as SpecStatus,
    updatedAt: Timestamp.now(),
  });
}

export async function submitSpecForReview(specId: string, revisionNumber: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'specifications', specId), {
    status: 'submitted' as SpecStatus,
    revisionNumber: revisionNumber + 1,
    updatedAt: Timestamp.now(),
  });
}

export async function approveSpec(specId: string, reviewerId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'specifications', specId), {
    status: 'approved' as SpecStatus,
    reviewerId,
    updatedAt: Timestamp.now(),
  });
}

export async function requestSpecChanges(specId: string, reviewerId: string, _notes?: string | null): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'specifications', specId), {
    status: 'changes_requested' as SpecStatus,
    reviewerId,
    updatedAt: Timestamp.now(),
  });
}

export async function getSpecVersionHistory(specId: string): Promise<SpecRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'specifications', specId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SpecRecord;
}
