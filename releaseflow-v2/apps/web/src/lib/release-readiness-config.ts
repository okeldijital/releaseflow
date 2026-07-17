/**
 * CE-009 — Configurable readiness weights and thresholds.
 * Never hardcode weights in scoring logic — always read from here.
 */

export interface ReadinessWeights {
  assignmentCompletion: number;
  noOverdueWork: number;
  noBlockers: number;
  approvalsComplete: number;
  metadataComplete: number;
  artworkComplete: number;
}

/** Default weights sum to 1.0 (100%). */
export const DEFAULT_READINESS_WEIGHTS: ReadinessWeights = {
  assignmentCompletion: 0.40,
  noOverdueWork: 0.20,
  noBlockers: 0.20,
  approvalsComplete: 0.10,
  metadataComplete: 0.05,
  artworkComplete: 0.05,
};

export interface ReadinessThresholds {
  /** Score >= green → Ready */
  greenMin: number;
  /** Score >= yellow → Needs Attention; below → Not Ready */
  yellowMin: number;
  /** Days until release for yellow countdown */
  countdownYellowDays: number;
  /** Days until release for red countdown */
  countdownRedDays: number;
  /** Hours for "due soon" warning */
  dueSoonHours: number;
}

export const DEFAULT_READINESS_THRESHOLDS: ReadinessThresholds = {
  greenMin: 85,
  yellowMin: 55,
  countdownYellowDays: 14,
  countdownRedDays: 3,
  dueSoonHours: 24,
};

export type Recommendation = 'ready' | 'needs_attention' | 'not_ready';

export function recommendationFromScore(
  score: number,
  hasBlockers: boolean,
  thresholds: ReadinessThresholds = DEFAULT_READINESS_THRESHOLDS,
): Recommendation {
  if (hasBlockers) return 'not_ready';
  if (score >= thresholds.greenMin) return 'ready';
  if (score >= thresholds.yellowMin) return 'needs_attention';
  return 'not_ready';
}

export function normalizeWeights(weights: ReadinessWeights): ReadinessWeights {
  const sum =
    weights.assignmentCompletion
    + weights.noOverdueWork
    + weights.noBlockers
    + weights.approvalsComplete
    + weights.metadataComplete
    + weights.artworkComplete;
  if (sum <= 0) return { ...DEFAULT_READINESS_WEIGHTS };
  return {
    assignmentCompletion: weights.assignmentCompletion / sum,
    noOverdueWork: weights.noOverdueWork / sum,
    noBlockers: weights.noBlockers / sum,
    approvalsComplete: weights.approvalsComplete / sum,
    metadataComplete: weights.metadataComplete / sum,
    artworkComplete: weights.artworkComplete / sum,
  };
}
