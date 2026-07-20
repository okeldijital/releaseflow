/**
 * BUILD-004 — Work Score Engine
 *
 * Deterministic prioritisation. No magic numbers in UI.
 * Service computes workScore; workspace sorts Needs Attention DESC.
 */

export const WORK_SCORE_WEIGHTS = {
  overdue: 100,
  blocked: 80,
  dueToday: 60,
  highPriority: 40,
  review: 30,
  assignedToMe: 20,
  updatedToday: 10,
} as const;

export type WorkScoreFlags = {
  isOverdue: boolean;
  isBlocked: boolean;
  isDueToday: boolean;
  isHighPriority: boolean;
  requiresReview: boolean;
  isAssignedToMe: boolean;
  updatedToday: boolean;
};

export function computeWorkScore(flags: WorkScoreFlags): number {
  let score = 0;
  if (flags.isOverdue) score += WORK_SCORE_WEIGHTS.overdue;
  if (flags.isBlocked) score += WORK_SCORE_WEIGHTS.blocked;
  if (flags.isDueToday) score += WORK_SCORE_WEIGHTS.dueToday;
  if (flags.isHighPriority) score += WORK_SCORE_WEIGHTS.highPriority;
  if (flags.requiresReview) score += WORK_SCORE_WEIGHTS.review;
  if (flags.isAssignedToMe) score += WORK_SCORE_WEIGHTS.assignedToMe;
  if (flags.updatedToday) score += WORK_SCORE_WEIGHTS.updatedToday;
  return score;
}

export type AssignmentUrgency = 'critical' | 'high' | 'normal' | 'low';

export function resolveUrgency(workScore: number, flags: WorkScoreFlags): AssignmentUrgency {
  if (flags.isOverdue || flags.isBlocked || workScore >= 100) return 'critical';
  if (flags.isDueToday || workScore >= 60) return 'high';
  if (workScore >= 30) return 'normal';
  return 'low';
}
