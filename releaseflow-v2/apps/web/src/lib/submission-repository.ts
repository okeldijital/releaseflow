import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type SubmissionEntityType = 'deliverable' | 'specification';
export type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'changes_requested';

export interface SubmissionRecord {
  id: string;
  deliverableId: string;
  entityType: SubmissionEntityType;
  entityId: string;
  organizationId: string;
  submittedBy: string;
  submissionNotes?: string | null;
  revisionNumber: number;
  submittedAt: unknown;
  status: SubmissionStatus;
}

export interface CreateSubmissionFields {
  deliverableId: string;
  entityType: SubmissionEntityType;
  entityId: string;
  organizationId: string;
  submittedBy: string;
  submissionNotes?: string | null;
  revisionNumber: number;
}

export async function createSubmission(fields: CreateSubmissionFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'deliverable_submissions'), {
    deliverableId: fields.deliverableId,
    entityType: fields.entityType,
    entityId: fields.entityId,
    organizationId: fields.organizationId,
    submittedBy: fields.submittedBy,
    submissionNotes: fields.submissionNotes ?? null,
    revisionNumber: fields.revisionNumber,
    submittedAt: now,
    status: 'submitted' as SubmissionStatus,
  });

  return ref.id;
}

export async function reviewSubmission(
  submissionId: string,
  _reviewerId: string,
  outcome: 'approved' | 'changes_requested',
  notes?: string | null,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'deliverable_submissions', submissionId), {
    status: outcome as SubmissionStatus,
    submissionNotes: notes ?? null,
  });
}

export async function getSubmissionsByDeliverable(deliverableId: string): Promise<SubmissionRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_submissions'),
      where('deliverableId', '==', deliverableId),
      orderBy('revisionNumber', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SubmissionRecord);
}

export async function getPendingSubmissions(orgId: string): Promise<SubmissionRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_submissions'),
      where('organizationId', '==', orgId),
      where('status', 'in', ['submitted', 'under_review']),
      orderBy('submittedAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SubmissionRecord);
}

export async function getSubmission(submissionId: string): Promise<SubmissionRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'deliverable_submissions', submissionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SubmissionRecord;
}
