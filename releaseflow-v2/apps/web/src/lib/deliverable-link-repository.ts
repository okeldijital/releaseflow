import {
  doc, getDocs, addDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type DeliverableLinkProvider = 'google_drive' | 'dropbox' | 'onedrive' | 'frame_io' | 'wetransfer' | 'other';

export interface DeliverableLinkRecord {
  id: string;
  assignmentId: string;
  organizationId: string;
  provider: DeliverableLinkProvider;
  url: string;
  label: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface CreateDeliverableLinkFields {
  assignmentId: string;
  organizationId: string;
  provider: DeliverableLinkProvider;
  url: string;
  label: string;
  createdBy: string;
}

function toRecord(id: string, data: Record<string, unknown>): DeliverableLinkRecord {
  return {
    id,
    assignmentId: data.assignmentId as string || '',
    organizationId: data.organizationId as string || '',
    provider: (data.provider as DeliverableLinkProvider) || 'other',
    url: data.url as string || '',
    label: data.label as string || '',
    createdBy: data.createdBy as string || '',
    createdAt: data.createdAt as Timestamp,
  };
}

export async function createDeliverableLink(fields: CreateDeliverableLinkFields): Promise<DeliverableLinkRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'deliverable_links'), {
    ...fields,
    createdAt: now,
  });
  return toRecord(ref.id, { ...fields, id: ref.id, createdAt: now });
}

export async function getDeliverableLinksByAssignment(assignmentId: string): Promise<DeliverableLinkRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'deliverable_links'),
      where('assignmentId', '==', assignmentId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function deleteDeliverableLink(linkId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'deliverable_links', linkId));
}
