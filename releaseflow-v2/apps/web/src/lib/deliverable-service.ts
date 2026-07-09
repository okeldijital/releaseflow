import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { logActivity } from '@/lib/workflow-service';
import type { Deliverable, DeliverableType } from '@/app/(app)/types';

export interface CreateDeliverableFields {
  title: string;
  type?: DeliverableType;
  version?: string;
  stageId?: string;
  taskId?: string;
  campaignId?: string;
}

function meta(deliverableId: string, fields?: Record<string, unknown>): Record<string, unknown> {
  return { deliverableId, ...fields };
}

export async function createDeliverable(
  releaseId: string,
  ownerId: string,
  actorId: string,
  fields: CreateDeliverableFields,
) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'deliverables'), {
    releaseId,
    stageId: fields.stageId ?? null,
    taskId: fields.taskId ?? null,
    campaignId: fields.campaignId ?? null,
    type: fields.type ?? 'other',
    title: fields.title,
    status: 'draft',
    version: fields.version ?? null,
    ownerId,
    createdAt: now,
  });

  await logActivity({
    type: 'deliverable.created',
    releaseId,
    stageId: fields.stageId,
    actorId,
    metadata: meta(ref.id, { title: fields.title, type: fields.type }),
  });

  return ref.id;
}

export async function updateDeliverable(
  deliverableId: string,
  releaseId: string,
  stageId: string | undefined,
  actorId: string,
  fields: Partial<Pick<Deliverable, 'title' | 'type' | 'version' | 'stageId' | 'taskId' | 'campaignId'>>,
) {
  const db = getDb();
  if (!db) return;

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) update[k] = v;
  }

  if (Object.keys(update).length === 0) return;

  await updateDoc(doc(db, 'deliverables', deliverableId), update);

  await logActivity({
    type: 'deliverable.updated',
    releaseId,
    stageId,
    actorId,
    metadata: meta(deliverableId, { changes: update }),
  });
}

export async function approveDeliverable(
  deliverableId: string,
  releaseId: string,
  stageId: string | undefined,
  actorId: string,
) {
  const db = getDb();
  if (!db) return;

  await updateDoc(doc(db, 'deliverables', deliverableId), { status: 'approved' });

  await logActivity({
    type: 'deliverable.approved',
    releaseId,
    stageId,
    actorId,
    metadata: { deliverableId },
  });
}

export async function rejectDeliverable(
  deliverableId: string,
  releaseId: string,
  stageId: string | undefined,
  actorId: string,
  reason?: string,
) {
  const db = getDb();
  if (!db) return;

  await updateDoc(doc(db, 'deliverables', deliverableId), { status: 'rejected' });

  await logActivity({
    type: 'deliverable.rejected',
    releaseId,
    stageId,
    actorId,
    metadata: { deliverableId, reason: reason ?? null },
  });
}

export async function archiveDeliverable(deliverableId: string) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'deliverables', deliverableId), { status: 'archived' });
}

/**
 * Creates the artwork deliverable for a release on first upload, or updates the
 * existing one to point at the newly uploaded Media Asset. The hero artwork
 * renders from this linked Media Asset (canonical model: Release → Artwork
 * Deliverable → mediaAssetId → Media Asset → Cloudinary).
 */
export async function upsertArtworkDeliverable(
  releaseId: string,
  ownerId: string,
  actorId: string,
  fields: { title: string; mediaAssetId: string; url: string },
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const existing = await getDocs(
    query(
      collection(db, 'deliverables'),
      where('releaseId', '==', releaseId),
      where('type', '==', 'artwork'),
    ),
  );

  const now = Timestamp.now();

  if (!existing.empty) {
    const first = existing.docs[0];
    if (!first) return '';
    await updateDoc(doc(db, 'deliverables', first.id), {
      mediaAssetId: fields.mediaAssetId,
      url: fields.url,
      status: 'approved',
      updatedAt: now,
    });
    return first.id;
  }

  const ref = await addDoc(collection(db, 'deliverables'), {
    releaseId,
    stageId: null,
    taskId: null,
    campaignId: null,
    type: 'artwork',
    title: fields.title,
    status: 'approved',
    version: null,
    ownerId,
    mediaAssetId: fields.mediaAssetId,
    url: fields.url,
    createdAt: now,
    updatedAt: now,
  });

  await logActivity({
    type: 'deliverable.created',
    releaseId,
    actorId,
    metadata: { title: fields.title, type: 'artwork' },
  });

  return ref.id;
}

export async function getDeliverablesByRelease(releaseId: string): Promise<Deliverable[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'deliverables'), where('releaseId', '==', releaseId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deliverable);
}

export async function getDeliverablesByStage(stageId: string): Promise<Deliverable[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'deliverables'), where('stageId', '==', stageId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deliverable);
}

export async function getDeliverablesByTask(taskId: string): Promise<Deliverable[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'deliverables'), where('taskId', '==', taskId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deliverable);
}
