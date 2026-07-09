import { collection, query, where, getDocs } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface CollabReadiness {
  awaitingResponse: number;
  awaitingApproval: number;
  overdueApprovals: number;
  unreadMentions: number;
  unresolvedComments: number;
  activeReviewers: number;
  percentage: number;
}

export async function computeCollaborationReadiness(
  entityType: string,
  entityId: string,
  _orgId: string,
): Promise<CollabReadiness> {
  const db = getDb();
  if (!db) {
    return {
      awaitingResponse: 0, awaitingApproval: 0, overdueApprovals: 0,
      unreadMentions: 0, unresolvedComments: 0, activeReviewers: 0, percentage: 0,
    };
  }

  let awaitingResponse = 0;
  let awaitingApproval = 0;
  let overdueApprovals = 0;
  let unreadMentions = 0;
  let unresolvedComments = 0;
  let activeReviewers = 0;

  try {
    const { getCommentsByEntity } = await import('@/lib/comments-repository');
    const comments = await getCommentsByEntity(entityType as 'release' | 'track' | 'task' | 'specification' | 'asset' | 'distribution_package', entityId);

    unresolvedComments = comments.filter((c) => !c.isResolved).length;

    const topLevel = comments.filter((c) => !c.parentCommentId);
    const replyMap = new Map<string, typeof comments>();
    for (const c of comments) {
      if (c.parentCommentId) {
        const list = replyMap.get(c.parentCommentId) || [];
        list.push(c);
        replyMap.set(c.parentCommentId, list);
      }
    }

    for (const comment of topLevel) {
      if (!comment.isResolved && replyMap.has(comment.id)) {
        const replies = replyMap.get(comment.id)!;
        if (replies.some((r) => r.authorId !== comment.authorId)) {
          awaitingResponse++;
        }
      }
    }
  } catch { /* safe */ }

  try {
    const { getApprovalsByEntity } = await import('@/lib/approval-service');
    const approvals = await getApprovalsByEntity(entityType as never, entityId);
    const now = new Date();
    const nowStr = now.toISOString().slice(0, 10);

    const pending = approvals.filter(
      (a) => a.lifecycleState === 'requested' || a.lifecycleState === 'under_review',
    );
    awaitingApproval = pending.length;

    overdueApprovals = approvals.filter((a) => {
      if (a.lifecycleState !== 'requested' && a.lifecycleState !== 'under_review') return false;
      if (!a.dueDate) return false;
      return String(a.dueDate) < nowStr;
    }).length;

    activeReviewers = new Set(pending.map((a) => a.approverId)).size;
  } catch { /* safe */ }

  try {
    const snap = await getDocs(
      query(
        collection(db, 'notifications'),
        where('referenceId', '==', entityId),
        where('referenceType', '==', entityType),
        where('type', '==', 'mention'),
        where('read', '==', false),
      ),
    );
    unreadMentions = snap.size;
  } catch { /* safe */ }

  const categories = 5;
  let met = 0;
  if (awaitingResponse === 0) met++;
  if (awaitingApproval === 0) met++;
  if (overdueApprovals === 0) met++;
  if (unreadMentions === 0) met++;
  if (unresolvedComments === 0) met++;
  const percentage = Math.round((met / categories) * 100);

  return {
    awaitingResponse,
    awaitingApproval,
    overdueApprovals,
    unreadMentions,
    unresolvedComments,
    activeReviewers,
    percentage,
  };
}

export async function getUserCollaborationStats(
  userId: string,
): Promise<CollabReadiness> {
  const db = getDb();
  if (!db) {
    return {
      awaitingResponse: 0, awaitingApproval: 0, overdueApprovals: 0,
      unreadMentions: 0, unresolvedComments: 0, activeReviewers: 0, percentage: 0,
    };
  }

  let awaitingResponse = 0;
  let awaitingApproval = 0;
  let overdueApprovals = 0;
  let unreadMentions = 0;
  let unresolvedComments = 0;
  let activeReviewers = 0;

  try {
    const snap = await getDocs(
      query(
        collection(db, 'entity_comments'),
        where('authorId', '==', userId),
        where('isResolved', '==', false),
      ),
    );
    const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    unresolvedComments = comments.length;

    for (const comment of comments) {
      const repliesSnap = await getDocs(
        query(
          collection(db, 'entity_comments'),
          where('parentCommentId', '==', comment.id),
        ),
      );
      const replies = repliesSnap.docs.map((d) => d.data());
      if (replies.some((r) => r.authorId !== userId)) {
        awaitingResponse++;
      }
    }
  } catch { /* safe */ }

  try {
    const [requestedSnap, underReviewSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, 'approval_requests'),
          where('approverId', '==', userId),
          where('lifecycleState', '==', 'requested'),
        ),
      ),
      getDocs(
        query(
          collection(db, 'approval_requests'),
          where('approverId', '==', userId),
          where('lifecycleState', '==', 'under_review'),
        ),
      ),
    ]);

    const allPending: Array<Record<string, unknown> & { id: string }> = [
      ...requestedSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      ...underReviewSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ];
    awaitingApproval = allPending.length;

    const nowStr = new Date().toISOString().slice(0, 10);
    overdueApprovals = allPending.filter((a) => {
      const due = a.dueDate as string | null | undefined;
      return due && due < nowStr;
    }).length;

    activeReviewers = new Set(allPending.map((a) => a.requesterId as string)).size;
  } catch { /* safe */ }

  try {
    const snap = await getDocs(
      query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('type', '==', 'mention'),
        where('read', '==', false),
      ),
    );
    unreadMentions = snap.size;
  } catch { /* safe */ }

  const categories = 5;
  let met = 0;
  if (awaitingResponse === 0) met++;
  if (awaitingApproval === 0) met++;
  if (overdueApprovals === 0) met++;
  if (unreadMentions === 0) met++;
  if (unresolvedComments === 0) met++;
  const percentage = Math.round((met / categories) * 100);

  return {
    awaitingResponse,
    awaitingApproval,
    overdueApprovals,
    unreadMentions,
    unresolvedComments,
    activeReviewers,
    percentage,
  };
}
