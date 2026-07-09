import { getDb } from './firebase';

export interface ProductionStatusSummary {
  trackId: string;
  specs: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    changesRequested: number;
    completed: number;
  };
  deliverables: {
    total: number;
    expected: number;
    submitted: number;
    underReview: number;
    approved: number;
    changesRequested: number;
  };
  submissions: {
    total: number;
    pending: number;
    approved: number;
    changesRequested: number;
  };
}

export async function submitForReview(
  entityType: 'deliverable' | 'specification',
  entityId: string,
  orgId: string,
  submittedBy: string,
  notes?: string | null,
): Promise<string> {
  const { recordActivity } = await import('@/lib/activity-service');
  const { createNotification } = await import('@/lib/notification-service');

  let deliverableId = entityId;

  if (entityType === 'specification') {
    const { getSpecification } = await import('@/lib/specification-repository');
    const spec = await getSpecification(entityId);
    if (!spec) throw new Error('Specification not found');

    if (spec.assignedPersonId) {
      await createNotification({
        userId: spec.assignedPersonId,
        type: 'approval.requested',
        title: 'Specification Submitted for Review',
        message: `Specification ${spec.title} has been submitted for review`,
        referenceId: entityId,
        referenceType: 'specification',
      });
    }

    deliverableId = entityId;
  } else {
    const { getDeliverable } = await import('@/lib/deliverable-management-repository');
    const { doc, updateDoc, Timestamp } = await import('@firebase/firestore');
    const db = getDb();
    if (!db) throw new Error('Firestore not initialized');
    const del = await getDeliverable(entityId);
    if (!del) throw new Error('Deliverable not found');
    await updateDoc(doc(db, 'production_deliverables', entityId), {
      status: 'under_review',
      updatedAt: Timestamp.now(),
    });
  }

  const { createSubmission } = await import('@/lib/submission-repository');
  const submissionId = await createSubmission({
    deliverableId,
    entityType,
    entityId,
    organizationId: orgId,
    submittedBy,
    revisionNumber: 1,
    submissionNotes: notes ?? null,
  });

  await recordActivity({
    entityType: entityType === 'specification' ? 'specification' : 'task',
    entityId,
    organizationId: orgId,
    actorId: submittedBy,
    action: 'submitted_for_review',
    details: `Submitted ${entityType} for review`,
  });

  return submissionId;
}

export async function approveSubmission(
  submissionId: string,
  reviewerId: string,
  notes?: string | null,
): Promise<void> {
  const { recordActivity } = await import('@/lib/activity-service');
  const { getSubmission } = await import('@/lib/submission-repository');
  const { reviewSubmission } = await import('@/lib/submission-repository');

  const submission = await getSubmission(submissionId);
  if (!submission) throw new Error('Submission not found');

  await reviewSubmission(submissionId, reviewerId, 'approved', notes);

  if (submission.entityType === 'specification') {
    const { approveSpec } = await import('@/lib/specification-repository');
    await approveSpec(submission.entityId, reviewerId);
  } else {
    const { approveDeliverable } = await import('@/lib/deliverable-management-repository');
    await approveDeliverable(submission.entityId, reviewerId);
  }

  await recordActivity({
    entityType: submission.entityType === 'specification' ? 'specification' : 'task',
    entityId: submission.entityId,
    organizationId: submission.organizationId,
    actorId: reviewerId,
    action: 'approved_submission',
    details: notes ?? 'Submission approved',
  });
}

export async function requestSubmissionChanges(
  submissionId: string,
  reviewerId: string,
  notes?: string | null,
): Promise<void> {
  const { recordActivity } = await import('@/lib/activity-service');
  const { createNotification } = await import('@/lib/notification-service');
  const { getSubmission } = await import('@/lib/submission-repository');
  const { reviewSubmission } = await import('@/lib/submission-repository');

  const submission = await getSubmission(submissionId);
  if (!submission) throw new Error('Submission not found');

  await reviewSubmission(submissionId, reviewerId, 'changes_requested', notes);

  if (submission.entityType === 'specification') {
    const { requestSpecChanges } = await import('@/lib/specification-repository');
    await requestSpecChanges(submission.entityId, reviewerId, notes);
  } else {
    const { requestDeliverableChanges } = await import('@/lib/deliverable-management-repository');
    await requestDeliverableChanges(submission.entityId, notes);
  }

  await createNotification({
    userId: submission.submittedBy,
    type: 'approval.responded',
    title: 'Changes Requested',
    message: notes ?? 'Changes have been requested on your submission',
    referenceId: submissionId,
    referenceType: 'submission',
  });

  await recordActivity({
    entityType: submission.entityType === 'specification' ? 'specification' : 'task',
    entityId: submission.entityId,
    organizationId: submission.organizationId,
    actorId: reviewerId,
    action: 'requested_changes',
    details: notes ?? 'Changes requested on submission',
  });
}

export async function getProductionStatus(trackId: string): Promise<ProductionStatusSummary> {
  const { getSpecificationsByTrack } = await import('@/lib/specification-repository');
  const { getDeliverablesByTrack } = await import('@/lib/deliverable-management-repository');
  const { getDb } = await import('@/lib/firebase');

  const [specs, deliverables] = await Promise.all([
    getSpecificationsByTrack(trackId),
    getDeliverablesByTrack(trackId),
  ]);

  const db = getDb();
  const submissions: { total: number; pending: number; approved: number; changesRequested: number } = {
    total: 0,
    pending: 0,
    approved: 0,
    changesRequested: 0,
  };

  if (db && deliverables.length > 0) {
    const deliverableIds = deliverables.map((d) => d.id);
    const { getSubmissionsByDeliverable } = await import('@/lib/submission-repository');
    const allSubmissions = (await Promise.all(deliverableIds.map((id) => getSubmissionsByDeliverable(id)))).flat();
    submissions.total = allSubmissions.length;
    submissions.pending = allSubmissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length;
    submissions.approved = allSubmissions.filter((s) => s.status === 'approved').length;
    submissions.changesRequested = allSubmissions.filter((s) => s.status === 'changes_requested').length;
  }

  return {
    trackId,
    specs: {
      total: specs.length,
      draft: specs.filter((s) => s.status === 'draft').length,
      submitted: specs.filter((s) => s.status === 'submitted').length,
      approved: specs.filter((s) => s.status === 'approved').length,
      changesRequested: specs.filter((s) => s.status === 'changes_requested').length,
      completed: specs.filter((s) => s.status === 'completed').length,
    },
    deliverables: {
      total: deliverables.length,
      expected: deliverables.filter((d) => d.status === 'expected').length,
      submitted: deliverables.filter((d) => d.status === 'submitted').length,
      underReview: deliverables.filter((d) => d.status === 'under_review').length,
      approved: deliverables.filter((d) => d.status === 'approved').length,
      changesRequested: deliverables.filter((d) => d.status === 'changes_requested').length,
    },
    submissions,
  };
}
