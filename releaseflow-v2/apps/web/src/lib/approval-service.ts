import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { logActivity } from '@/lib/workflow-service';
import type { ApprovalRequest } from '@/app/(app)/types';

export async function createApprovalRequest(
  deliverableId: string,
  requesterId: string,
  approverId: string,
  releaseId: string,
) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = await addDoc(collection(db, 'approval_requests'), {
    deliverableId,
    requesterId,
    approverId,
    status: 'pending',
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
