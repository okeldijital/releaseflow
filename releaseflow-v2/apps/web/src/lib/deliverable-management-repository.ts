import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export type ProductionDeliverableType = 'audio' | 'artwork' | 'video' | 'document' | 'other';
export type DeliverableKind =
  | 'mix'
  | 'master'
  | 'instrumental'
  | 'cover'
  | 'social'
  | 'banner'
  | 'lyric_video'
  | 'music_video'
  | 'visualizer'
  | 'pdf_booklet';
export type ProductionDeliverableStatus = 'expected' | 'submitted' | 'under_review' | 'approved' | 'changes_requested';

export interface ProductionDeliverableRecord {
  id: string;
  specId?: string | null;
  trackId: string;
  organizationId: string;
  type: ProductionDeliverableType;
  deliverableType: DeliverableKind;
  version: number;
  fileUrl?: string | null;
  filename?: string | null;
  fileMetadata?: Record<string, unknown> | null;
  submissionNotes?: string | null;
  status: ProductionDeliverableStatus;
  submittedBy?: string | null;
  submittedAt?: unknown | null;
  approvedBy?: string | null;
  approvedAt?: unknown | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateExpectedDeliverableFields {
  specId?: string | null;
  trackId: string;
  organizationId: string;
  type: ProductionDeliverableType;
  deliverableType: DeliverableKind;
  version?: number;
  submissionNotes?: string | null;
}

export async function createExpectedDeliverable(fields: CreateExpectedDeliverableFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'production_deliverables'), {
    specId: fields.specId ?? null,
    trackId: fields.trackId,
    organizationId: fields.organizationId,
    type: fields.type,
    deliverableType: fields.deliverableType,
    version: fields.version ?? 1,
    fileUrl: null,
    filename: null,
    fileMetadata: null,
    submissionNotes: fields.submissionNotes ?? null,
    status: 'expected' as ProductionDeliverableStatus,
    submittedBy: null,
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function submitDeliverable(
  deliverableId: string,
  fileUrl: string,
  filename: string,
  fileMetadata?: Record<string, unknown> | null,
  notes?: string | null,
  submittedBy?: string | null,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'production_deliverables', deliverableId), {
    fileUrl,
    filename,
    fileMetadata: fileMetadata ?? null,
    submissionNotes: notes ?? null,
    status: 'submitted' as ProductionDeliverableStatus,
    submittedBy: submittedBy ?? null,
    submittedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function approveDeliverable(deliverableId: string, approvedBy: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'production_deliverables', deliverableId), {
    status: 'approved' as ProductionDeliverableStatus,
    approvedBy,
    approvedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function requestDeliverableChanges(deliverableId: string, notes?: string | null): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'production_deliverables', deliverableId), {
    status: 'changes_requested' as ProductionDeliverableStatus,
    submissionNotes: notes ?? null,
    updatedAt: Timestamp.now(),
  });
}

export async function getDeliverablesByTrack(trackId: string): Promise<ProductionDeliverableRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'production_deliverables'),
      where('trackId', '==', trackId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProductionDeliverableRecord);
}

export async function getDeliverablesBySpec(specId: string): Promise<ProductionDeliverableRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'production_deliverables'),
      where('specId', '==', specId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProductionDeliverableRecord);
}

export async function getDeliverable(deliverableId: string): Promise<ProductionDeliverableRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'production_deliverables', deliverableId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ProductionDeliverableRecord;
}
