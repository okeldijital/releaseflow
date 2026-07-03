import {
  doc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export type RevisionEntityType = 'deliverable' | 'specification';

export interface RevisionRecord {
  id: string;
  entityType: RevisionEntityType;
  entityId: string;
  organizationId: string;
  revisionNumber: number;
  submittedBy: string;
  changeNotes?: string | null;
  reviewOutcome?: 'approved' | 'changes_requested' | null;
  reviewedBy?: string | null;
  submittedAt: unknown;
  reviewedAt?: unknown | null;
}

export interface CreateRevisionFields {
  entityType: RevisionEntityType;
  entityId: string;
  organizationId: string;
  revisionNumber: number;
  submittedBy: string;
  changeNotes?: string | null;
}

export async function recordRevision(fields: CreateRevisionFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'deliverable_revisions'), {
    entityType: fields.entityType,
    entityId: fields.entityId,
    organizationId: fields.organizationId,
    revisionNumber: fields.revisionNumber,
    submittedBy: fields.submittedBy,
    changeNotes: fields.changeNotes ?? null,
    reviewOutcome: null,
    reviewedBy: null,
    submittedAt: now,
    reviewedAt: null,
  });

  return ref.id;
}

export async function updateRevisionOutcome(
  revisionId: string,
  outcome: 'approved' | 'changes_requested',
  reviewedBy: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'deliverable_revisions', revisionId), {
    reviewOutcome: outcome,
    reviewedBy,
    reviewedAt: Timestamp.now(),
  });
}

export async function getRevisionsByEntity(
  entityType: RevisionEntityType,
  entityId: string,
): Promise<RevisionRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_revisions'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('revisionNumber', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RevisionRecord);
}

export async function getLatestRevision(
  entityType: RevisionEntityType,
  entityId: string,
): Promise<RevisionRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_revisions'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('revisionNumber', 'desc'),
    ),
  );
  if (snap.docs.length === 0 || !snap.docs[0]) return null;
  const first = snap.docs[0];
  return { id: first.id, ...first.data() } as RevisionRecord;
}

export async function getRevisionCount(
  entityType: RevisionEntityType,
  entityId: string,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_revisions'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
    ),
  );
  return snap.size;
}
