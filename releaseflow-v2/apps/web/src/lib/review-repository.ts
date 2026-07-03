import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export type ReviewEntityType = 'deliverable' | 'specification';
export type ReviewStatus = 'pending' | 'in_progress' | 'completed';
export type ReviewOutcome = 'approved' | 'changes_requested';

export interface ReviewRecord {
  id: string;
  entityType: ReviewEntityType;
  entityId: string;
  organizationId: string;
  reviewerId: string;
  submissionId?: string | null;
  status: ReviewStatus;
  outcome?: ReviewOutcome | null;
  reviewerNotes?: string | null;
  decisionNotes?: string | null;
  reviewedAt?: unknown | null;
  dueDate?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateReviewFields {
  entityType: ReviewEntityType;
  entityId: string;
  organizationId: string;
  reviewerId: string;
  submissionId?: string | null;
  dueDate?: string | null;
}

export async function assignReviewer(fields: CreateReviewFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'deliverable_reviews'), {
    entityType: fields.entityType,
    entityId: fields.entityId,
    organizationId: fields.organizationId,
    reviewerId: fields.reviewerId,
    submissionId: fields.submissionId ?? null,
    status: 'pending' as ReviewStatus,
    outcome: null,
    reviewerNotes: null,
    decisionNotes: null,
    reviewedAt: null,
    dueDate: fields.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function startReview(reviewId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'deliverable_reviews', reviewId), {
    status: 'in_progress' as ReviewStatus,
    updatedAt: Timestamp.now(),
  });
}

export async function completeReview(
  reviewId: string,
  outcome: ReviewOutcome,
  decisionNotes?: string | null,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'deliverable_reviews', reviewId), {
    status: 'completed' as ReviewStatus,
    outcome,
    decisionNotes: decisionNotes ?? null,
    reviewedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function getReview(reviewId: string): Promise<ReviewRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'deliverable_reviews', reviewId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ReviewRecord;
}

export async function getReviewsByEntity(
  entityType: ReviewEntityType,
  entityId: string,
): Promise<ReviewRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_reviews'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReviewRecord);
}

export async function getPendingReviews(reviewerId: string): Promise<ReviewRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_reviews'),
      where('reviewerId', '==', reviewerId),
      where('status', '!=', 'completed'),
      orderBy('status'),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReviewRecord);
}

export async function getReviewHistory(
  entityType: ReviewEntityType,
  entityId: string,
): Promise<ReviewRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_reviews'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReviewRecord);
}
