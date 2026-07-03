export interface ProductionReadiness {
  specificationCompletion: number;
  deliverableCompletion: number;
  revisionCount: number;
  reviewEfficiency: number;
  checklistCompletion: number;
  overallReadiness: number;
}

export async function computeProductionReadiness(
  trackId: string,
): Promise<ProductionReadiness> {
  const { getSpecificationsByTrack } = await import('@/lib/specification-repository');
  const { getDeliverablesByTrack } = await import('@/lib/deliverable-management-repository');
  const { getChecklistByTrack } = await import('@/lib/checklist-repository');
  const { getRevisionsByEntity } = await import('@/lib/revision-repository');
  const { getReviewsByEntity } = await import('@/lib/review-repository');

  let specificationCompletion = 0;
  let deliverableCompletion = 0;
  let revisionCount = 0;
  let reviewEfficiency: number;
  let checklistCompletion = 0;
  try {
    const specs = await getSpecificationsByTrack(trackId);
    if (specs.length > 0) {
      const approvedOrCompleted = specs.filter(
        (s) => s.status === 'approved' || s.status === 'completed',
      );
      specificationCompletion = Math.round((approvedOrCompleted.length / specs.length) * 100);
    } else {
      specificationCompletion = 0;
    }
  } catch {
    /* ignore */
  }

  try {
    const deliverables = await getDeliverablesByTrack(trackId);
    if (deliverables.length > 0) {
      const approved = deliverables.filter((d) => d.status === 'approved');
      deliverableCompletion = Math.round((approved.length / deliverables.length) * 100);
    } else {
      deliverableCompletion = 0;
    }
  } catch {
    /* ignore */
  }

  try {
    const specRevisions = await getRevisionsByEntity('specification', trackId);
    const delRevisions = await getRevisionsByEntity('deliverable', trackId);
    revisionCount = specRevisions.length + delRevisions.length;
  } catch {
    /* ignore */
  }

  try {
    const specReviews = await getReviewsByEntity('specification', trackId);
    const delReviews = await getReviewsByEntity('deliverable', trackId);
    const allReviews = [...specReviews, ...delReviews];
    const completedReviews = allReviews.filter(
      (r) => r.status === 'completed' && r.reviewedAt,
    );
    if (completedReviews.length > 0) {
      let totalHours = 0;
      for (const review of completedReviews) {
        const created = review.createdAt as { toDate?: () => Date; seconds?: number };
        const reviewed = review.reviewedAt as { toDate?: () => Date; seconds?: number };
        let createdMs = 0;
        let reviewedMs = 0;
        if (created && typeof created === 'object' && 'toDate' in created) {
          createdMs = (created as { toDate: () => Date }).toDate().getTime();
        } else if (created && typeof created === 'object' && 'seconds' in created) {
          createdMs = (created as { seconds: number }).seconds * 1000;
        }
        if (reviewed && typeof reviewed === 'object' && 'toDate' in reviewed) {
          reviewedMs = (reviewed as { toDate: () => Date }).toDate().getTime();
        } else if (reviewed && typeof reviewed === 'object' && 'seconds' in reviewed) {
          reviewedMs = (reviewed as { seconds: number }).seconds * 1000;
        }
        if (createdMs > 0 && reviewedMs > 0) {
          totalHours += (reviewedMs - createdMs) / (1000 * 60 * 60);
        }
      }
      reviewEfficiency = Math.round(totalHours / completedReviews.length);
    } else {
      reviewEfficiency = 48;
    }
  } catch {
    reviewEfficiency = 48;
  }

  try {
    const checklists = await getChecklistByTrack(trackId);
    if (checklists.length > 0) {
      let totalItems = 0;
      let checkedItems = 0;
      for (const cl of checklists) {
        totalItems += cl.items.length;
        checkedItems += cl.items.filter((i) => i.checked).length;
      }
      if (totalItems > 0) {
        checklistCompletion = Math.round((checkedItems / totalItems) * 100);
      } else {
        checklistCompletion = 0;
      }
    } else {
      checklistCompletion = 0;
    }
  } catch {
    /* ignore */
  }

  const weights = [0.3, 0.3, 0.0, 0.2, 0.2];
  const factors = [
    specificationCompletion,
    deliverableCompletion,
    revisionCount > 0 ? 100 : 0,
    reviewEfficiency <= 48 ? 100 : Math.max(0, 100 - (reviewEfficiency - 48)),
    checklistCompletion,
  ];
  const overallReadiness = Math.round(
    factors.reduce((sum, f, i) => sum + f * (weights[i] ?? 0), 0),
  );

  return {
    specificationCompletion,
    deliverableCompletion,
    revisionCount,
    reviewEfficiency,
    checklistCompletion,
    overallReadiness,
  };
}
