import { getDocs, collection, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export async function autoAssignReviewer(
  entityType: 'deliverable' | 'specification',
  entityId: string,
  orgId: string,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  const { assignReviewer } = await import('@/lib/review-repository');


  let assignedPersonId: string | null;

  if (entityType === 'specification') {
    const { getSpecification } = await import('@/lib/specification-repository');
    const spec = await getSpecification(entityId);
    if (!spec) return null;
    assignedPersonId = spec.reviewerId ?? spec.assignedPersonId ?? null;
  } else {
    const { getDeliverable } = await import('@/lib/deliverable-management-repository');
    const del = await getDeliverable(entityId);
    if (!del) return null;
    assignedPersonId = del.submittedBy ?? del.approvedBy ?? null;
  }

  if (!assignedPersonId) {
    try {
      const { getAssignmentsByEntity } = await import('@/lib/assignment-repository');
      const assignments = await getAssignmentsByEntity('track' as never, entityId);
      const firstAssignment = assignments[0];
      if (firstAssignment) {
        assignedPersonId = firstAssignment.assigneeId;
      }
    } catch {
      /* ignore */
    }
  }

  if (!assignedPersonId) return null;

  try {
    const reviewId = await assignReviewer({
      entityType,
      entityId,
      organizationId: orgId,
      reviewerId: assignedPersonId,
    });
    return reviewId;
  } catch {
    return null;
  }
}

export async function autoCloseCompletedReviews(
  entityType: 'deliverable' | 'specification',
  entityId: string,
): Promise<void> {
  const { getReviewsByEntity, completeReview } = await import('@/lib/review-repository');

  try {
    const reviews = await getReviewsByEntity(entityType, entityId);
    const activeReviews = reviews.filter(
      (r) => r.status === 'pending' || r.status === 'in_progress',
    );

    for (const review of activeReviews) {
      let isApproved = false;
      let wasChangesRequested = false;

      if (entityType === 'specification') {
        const { getSpecification } = await import('@/lib/specification-repository');
        const spec = await getSpecification(entityId);
        if (spec) {
          isApproved = spec.status === 'approved';
          wasChangesRequested = spec.status === 'changes_requested';
        }
      } else {
        const { getDeliverable } = await import('@/lib/deliverable-management-repository');
        const del = await getDeliverable(entityId);
        if (del) {
          isApproved = del.status === 'approved';
          wasChangesRequested = del.status === 'changes_requested';
        }
      }

      if (isApproved) {
        await completeReview(review.id, 'approved');
      } else if (wasChangesRequested) {
        await completeReview(review.id, 'changes_requested');
      }
    }
  } catch {
    /* ignore */
  }
}

export async function escalateOverdueReviews(orgId: string): Promise<string[]> {
  const db = getDb();
  if (!db) return [];

  const overdueIds: string[] = [];
  const nowStr = new Date().toISOString().slice(0, 10);

  try {
    const snap = await getDocs(
      query(
        collection(db, 'deliverable_reviews'),
        where('organizationId', '==', orgId),
        where('status', '!=', 'completed'),
      ),
    );
    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{ id: string; dueDate?: unknown; status?: unknown }>;

    for (const review of reviews) {
      if (review.dueDate && typeof review.dueDate === 'string' && review.dueDate < nowStr) {
        overdueIds.push(review.id);
      }
    }
  } catch {
    /* ignore */
  }

  return overdueIds;
}

export async function notifyOnResubmission(
  entityType: 'deliverable' | 'specification',
  entityId: string,
  submittedBy: string,
): Promise<void> {
  try {
    const { getReviewsByEntity } = await import('@/lib/review-repository');
    const { createNotification } = await import('@/lib/notification-service');

    const reviews = await getReviewsByEntity(entityType, entityId);
    const previousReviewers = new Set<string>();

    for (const review of reviews) {
      if (review.reviewerId && review.reviewerId !== submittedBy) {
        previousReviewers.add(review.reviewerId);
      }
    }

    for (const reviewerId of previousReviewers) {
      await createNotification({
        userId: reviewerId,
        type: 'approval.requested',
        title: 'Resubmission Ready for Review',
        message: `A ${entityType} you previously reviewed has been resubmitted`,
        referenceId: entityId,
        referenceType: entityType,
      });
    }
  } catch {
    /* ignore */
  }
}
