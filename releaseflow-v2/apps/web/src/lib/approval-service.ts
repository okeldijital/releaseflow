import { collection, doc, getDoc, addDoc, updateDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { logActivity } from '@/lib/workflow-service';
import { recordActivity } from '@/lib/activity-service';
import type { ApprovalRequest, ApprovalEntityType } from '@/app/(app)/types';

export async function createApprovalRequest(
  deliverableId: string,
  requesterId: string,
  approverId: string,
  releaseId: string,
  entityType?: string,
  entityId?: string,
) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = await addDoc(collection(db, 'approval_requests'), {
    deliverableId,
    requesterId,
    approverId,
    status: 'pending',
    entityType: entityType ?? null,
    entityId: entityId ?? null,
    lifecycleState: 'requested',
    respondedAt: null,
    createdAt: Timestamp.now(),
  });

  await logActivity({
    type: 'approval.requested',
    releaseId,
    actorId: requesterId,
    metadata: { requestId: ref.id, deliverableId, approverId },
  });

  return ref.id;
}

export async function approveRequest(requestId: string, actorId: string, releaseId: string) {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'approval_requests', requestId), {
    status: 'approved',
    respondedAt: now,
  });

  await logActivity({
    type: 'approval.approved',
    releaseId,
    actorId,
    metadata: { requestId },
  });
}

export async function rejectRequest(requestId: string, actorId: string, releaseId: string) {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'approval_requests', requestId), {
    status: 'rejected',
    respondedAt: now,
  });

  await logActivity({
    type: 'approval.rejected',
    releaseId,
    actorId,
    metadata: { requestId },
  });
}

export async function getPendingRequestsByApprover(approverId: string): Promise<ApprovalRequest[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'approval_requests'),
      where('approverId', '==', approverId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApprovalRequest);
}

export async function getDeliverableApprovalStatus(deliverableId: string): Promise<ApprovalRequest | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, 'approval_requests'),
      where('deliverableId', '==', deliverableId),
      orderBy('createdAt', 'desc'),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  const firstDoc = snap.docs[0];
  if (!firstDoc) return null;
  return { id: firstDoc.id, ...firstDoc.data() } as ApprovalRequest;
}

export async function requestApproval(
  entityType: ApprovalEntityType,
  entityId: string,
  orgId: string,
  requesterId: string,
  approverId: string,
  releaseId?: string,
  dueDate?: string,
  notes?: string,
) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = await addDoc(collection(db, 'approval_requests'), {
    entityType,
    entityId,
    organizationId: orgId,
    requesterId,
    approverId,
    lifecycleState: 'requested' as const,
    status: 'pending' as const,
    dueDate: dueDate ?? null,
    notes: notes ?? null,
    releaseId: releaseId ?? '',
    deliverableId: '',
    respondedAt: null,
    createdAt: Timestamp.now(),
  });

  await recordActivity({
    entityType: 'approval',
    entityId: ref.id,
    organizationId: orgId,
    actorId: requesterId,
    action: 'approval.requested',
    metadata: { requestId: ref.id, entityType, entityId, approverId },
  });

  return ref.id;
}

export async function startReview(requestId: string, actorId: string) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const snap = await getDoc(doc(db, 'approval_requests', requestId));
  if (!snap.exists()) throw new Error('Approval request not found');
  const data = snap.data();

  await updateDoc(doc(db, 'approval_requests', requestId), {
    lifecycleState: 'under_review',
  });

  const orgId = data.organizationId ?? '';
  await recordActivity({
    entityType: 'approval',
    entityId: requestId,
    organizationId: orgId,
    actorId,
    action: 'approval.review_started',
    metadata: { requestId },
  });
}

export async function approveWithNote(requestId: string, actorId: string, notes?: string) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const snap = await getDoc(doc(db, 'approval_requests', requestId));
  if (!snap.exists()) throw new Error('Approval request not found');
  const data = snap.data();

  const now = Timestamp.now();
  await updateDoc(doc(db, 'approval_requests', requestId), {
    lifecycleState: 'approved',
    status: 'approved',
    notes: notes ?? data.notes ?? null,
    respondedAt: now,
  });

  const orgId = data.organizationId ?? '';
  await recordActivity({
    entityType: 'approval',
    entityId: requestId,
    organizationId: orgId,
    actorId,
    action: 'approval.approved',
    details: notes ?? null,
    metadata: { requestId },
  });
}

export async function requestChanges(requestId: string, actorId: string, notes?: string) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const snap = await getDoc(doc(db, 'approval_requests', requestId));
  if (!snap.exists()) throw new Error('Approval request not found');
  const data = snap.data();

  const now = Timestamp.now();
  await updateDoc(doc(db, 'approval_requests', requestId), {
    lifecycleState: 'changes_requested',
    status: 'rejected',
    notes: notes ?? null,
    respondedAt: now,
  });

  const orgId = data.organizationId ?? '';
  await recordActivity({
    entityType: 'approval',
    entityId: requestId,
    organizationId: orgId,
    actorId,
    action: 'approval.changes_requested',
    details: notes ?? null,
    metadata: { requestId, requesterId: data.requesterId },
  });

  return { requesterId: data.requesterId as string };
}

export async function getApprovalsByEntity(
  entityType: ApprovalEntityType,
  entityId: string,
): Promise<ApprovalRequest[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'approval_requests'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApprovalRequest);
}

export async function getPendingApprovals(orgId: string): Promise<ApprovalRequest[]> {
  const db = getDb();
  if (!db) return [];

  const [requestedSnap, underReviewSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'approval_requests'),
        where('organizationId', '==', orgId),
        where('lifecycleState', '==', 'requested'),
        orderBy('createdAt', 'desc'),
      ),
    ),
    getDocs(
      query(
        collection(db, 'approval_requests'),
        where('organizationId', '==', orgId),
        where('lifecycleState', '==', 'under_review'),
        orderBy('createdAt', 'desc'),
      ),
    ),
  ]);

  const all = [
    ...requestedSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApprovalRequest),
    ...underReviewSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApprovalRequest),
  ];

  return all.sort((a, b) => {
    const ad = (a.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
    const bd = (b.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
    return bd - ad;
  });
}
