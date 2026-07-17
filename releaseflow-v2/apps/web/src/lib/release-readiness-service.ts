/**
 * CE-009 — Release Readiness Service (projection only).
 * Aggregates assignments, metadata, artwork, milestones, activity.
 * Never owns or mutates release status. Score is always computed.
 */

import type { AssignmentRecord } from './assignment-repository';
import type { ReleaseRecord } from './release-repository';
import type { MilestoneRecord } from './milestone-repository';
import type { ActivityEventRecord } from './activity-service';
import type { Artwork } from './artwork/artwork-types';
import {
  DEFAULT_READINESS_THRESHOLDS,
  DEFAULT_READINESS_WEIGHTS,
  normalizeWeights,
  recommendationFromScore,
  type ReadinessThresholds,
  type ReadinessWeights,
  type Recommendation,
} from './release-readiness-config';
import { toDate } from './schedule-date-utils';
import { fetchRelease } from './release-service';
import { getAssignmentsByEntity, listAssignments } from './assignment-repository';
import { getTracksByRelease } from './release-track-repository';
import { fetchMilestonesByRelease } from './milestone-service';
import { getActivityByEntity } from './activity-service';
import { getArtworkByRelease } from './artwork/artwork-service';
import { generateNotificationEvent } from './notification-event-service';
import { recordActivity } from './activity-service';
import {
  getLastReadinessSnapshot,
  saveReadinessTransition,
  type ReadinessHistoryRecord,
} from './release-readiness-history-repository';

export type { Recommendation };

export interface ReadinessIssue {
  id: string;
  kind: 'blocker' | 'warning';
  code: string;
  message: string;
  href?: string;
  sourceType?: string;
  sourceId?: string;
}

export interface MilestoneProgressItem {
  key: string;
  label: string;
  pct: number;
}

export interface AssignmentSummary {
  completed: number;
  inProgress: number;
  blocked: number;
  review: number;
  notStarted: number;
  overdue: number;
  total: number;
}

export interface CriticalPathItem {
  assignmentId: string;
  title: string;
  status: string;
  dueDate: Date | null;
  reason: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  at: Date | null;
  kind: 'system' | 'activity' | 'milestone' | 'release';
}

export interface CountdownInfo {
  releaseDate: Date | null;
  days: number | null;
  hours: number | null;
  color: 'green' | 'yellow' | 'red' | 'none';
  overdue: boolean;
}

export interface ReleaseReadiness {
  releaseId: string;
  organizationId: string;
  title: string;
  readinessScore: number;
  recommendation: Recommendation;
  blockers: ReadinessIssue[];
  warnings: ReadinessIssue[];
  assignmentSummary: AssignmentSummary;
  completedAssignments: number;
  remainingAssignments: number;
  overdueAssignments: number;
  reviewAssignments: number;
  milestoneProgress: MilestoneProgressItem[];
  criticalPath: CriticalPathItem[];
  timeline: TimelineEvent[];
  countdown: CountdownInfo;
  health: {
    healthScore: number;
    overdueCount: number;
    blockedCount: number;
    reviewQueue: number;
  };
  scoreBreakdown: {
    key: keyof ReadinessWeights;
    label: string;
    weight: number;
    componentScore: number; // 0-100
    contribution: number; // 0-100 of total
  }[];
  calculatedAt: Date;
  weights: ReadinessWeights;
}

export interface ComputeReadinessInput {
  release: ReleaseRecord;
  assignments: AssignmentRecord[];
  milestones: MilestoneRecord[];
  activities: ActivityEventRecord[];
  artwork: Artwork | null;
  weights?: ReadinessWeights;
  thresholds?: ReadinessThresholds;
  now?: Date;
}

const TERMINAL = new Set(['completed', 'cancelled', 'archived', 'declined']);
const ACTIVE_BLOCKED = 'blocked';
const REVIEW = 'review';
const NOT_STARTED = new Set(['draft', 'assigned', 'accepted']);

function isOverdue(a: AssignmentRecord, now: Date): boolean {
  if (TERMINAL.has(a.status)) return false;
  const due = toDate(a.dueDate);
  if (!due) return false;
  return due.getTime() < now.getTime();
}

function isRequiredAssignment(a: AssignmentRecord): boolean {
  // High/urgent priority treated as required for critical path
  return a.priority === 'high' || a.priority === 'urgent' || a.role?.toLowerCase().includes('required');
}

function metadataCompleteness(release: ReleaseRecord): number {
  const fields = [
    release.title,
    release.releaseType,
    release.genre,
    release.label,
    release.upc,
    release.language ?? release.copyright,
    release.targetReleaseDate ?? release.estimatedReleaseDate,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined && String(f).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function artworkCompleteness(artwork: Artwork | null): number {
  if (!artwork) return 0;
  if (artwork.secureUrl || (artwork as { url?: string }).url) return 100;
  return 40;
}

export function computeReleaseReadiness(input: ComputeReadinessInput): ReleaseReadiness {
  const now = input.now ?? new Date();
  const weights = normalizeWeights(input.weights ?? DEFAULT_READINESS_WEIGHTS);
  const thresholds = input.thresholds ?? DEFAULT_READINESS_THRESHOLDS;
  const { release, assignments, milestones, activities, artwork } = input;

  const releaseDate =
    toDate(release.targetReleaseDate) ?? toDate(release.estimatedReleaseDate);

  const active = assignments.filter((a) => a.status !== 'archived');
  const completed = active.filter((a) => a.status === 'completed');
  const blocked = active.filter((a) => a.status === ACTIVE_BLOCKED);
  const review = active.filter((a) => a.status === REVIEW);
  const inProgress = active.filter((a) => a.status === 'in_progress');
  const notStarted = active.filter((a) => NOT_STARTED.has(a.status));
  const overdue = active.filter((a) => isOverdue(a, now));
  const remaining = active.filter((a) => !TERMINAL.has(a.status));
  const rejected = active.filter((a) => a.reviewOutcome === 'rejected');

  const assignmentSummary: AssignmentSummary = {
    completed: completed.length,
    inProgress: inProgress.length,
    blocked: blocked.length,
    review: review.length,
    notStarted: notStarted.length,
    overdue: overdue.length,
    total: active.length,
  };

  // ── Blockers ─────────────────────────────────────────────────────
  const blockers: ReadinessIssue[] = [];
  for (const a of blocked) {
    blockers.push({
      id: `blocked-${a.id}`,
      kind: 'blocker',
      code: 'assignment_blocked',
      message: `Blocked assignment: ${a.title}`,
      href: `/assignments/${a.id}`,
      sourceType: 'assignment',
      sourceId: a.id,
    });
  }
  for (const a of rejected) {
    blockers.push({
      id: `rejected-${a.id}`,
      kind: 'blocker',
      code: 'review_rejected',
      message: `Rejected review: ${a.title}`,
      href: `/assignments/${a.id}`,
      sourceType: 'assignment',
      sourceId: a.id,
    });
  }
  if (!artwork?.secureUrl && !(artwork as { url?: string } | null)?.url) {
    blockers.push({
      id: 'missing-artwork',
      kind: 'blocker',
      code: 'missing_artwork',
      message: 'Missing release artwork',
      href: `/releases/${release.id}`,
      sourceType: 'release',
      sourceId: release.id,
    });
  }
  const metaScore = metadataCompleteness(release);
  if (metaScore < 50) {
    blockers.push({
      id: 'missing-metadata',
      kind: 'blocker',
      code: 'missing_metadata',
      message: 'Required metadata incomplete',
      href: `/releases/${release.id}/edit`,
      sourceType: 'release',
      sourceId: release.id,
    });
  }
  for (const a of review) {
    blockers.push({
      id: `review-${a.id}`,
      kind: 'blocker',
      code: 'approval_pending',
      message: `Approval pending: ${a.title}`,
      href: `/assignments/${a.id}`,
      sourceType: 'assignment',
      sourceId: a.id,
    });
  }
  for (const a of overdue.filter((x) => isRequiredAssignment(x) || x.priority === 'urgent')) {
    blockers.push({
      id: `crit-overdue-${a.id}`,
      kind: 'blocker',
      code: 'critical_overdue',
      message: `Critical overdue work: ${a.title}`,
      href: `/assignments/${a.id}`,
      sourceType: 'assignment',
      sourceId: a.id,
    });
  }

  // ── Warnings ─────────────────────────────────────────────────────
  const warnings: ReadinessIssue[] = [];
  const soonMs = thresholds.dueSoonHours * 60 * 60 * 1000;
  for (const a of remaining) {
    const due = toDate(a.dueDate);
    if (!due || isOverdue(a, now)) continue;
    const diff = due.getTime() - now.getTime();
    if (diff <= soonMs) {
      warnings.push({
        id: `due-soon-${a.id}`,
        kind: 'warning',
        code: 'due_soon',
        message: `Due within ${thresholds.dueSoonHours}h: ${a.title}`,
        href: `/assignments/${a.id}`,
        sourceType: 'assignment',
        sourceId: a.id,
      });
    }
  }
  if (overdue.length >= 3) {
    warnings.push({
      id: 'many-overdue',
      kind: 'warning',
      code: 'multiple_overdue',
      message: `${overdue.length} overdue assignments`,
      href: `/releases/${release.id}/readiness`,
    });
  }
  if (review.length > 0) {
    warnings.push({
      id: 'reviews-open',
      kind: 'warning',
      code: 'review_queue',
      message: `${review.length} assignment(s) awaiting review`,
    });
  }

  // ── Component scores 0–100 ───────────────────────────────────────
  const assignmentCompletionScore =
    active.length === 0 ? 100 : Math.round((completed.length / active.length) * 100);
  const noOverdueScore =
    remaining.length === 0 ? 100 : Math.round((1 - overdue.length / Math.max(remaining.length, 1)) * 100);
  const noBlockersScore = blockers.filter((b) => b.code !== 'approval_pending').length === 0
    ? 100
    : Math.max(0, 100 - blockers.filter((b) => b.code !== 'approval_pending').length * 25);
  const approvalsScore =
    review.length + rejected.length === 0
      ? 100
      : Math.max(0, 100 - (review.length + rejected.length) * 30);
  const metadataScore = metaScore;
  const artScore = artworkCompleteness(artwork);

  const components: ReleaseReadiness['scoreBreakdown'] = [
    {
      key: 'assignmentCompletion',
      label: 'Assignment completion',
      weight: weights.assignmentCompletion,
      componentScore: assignmentCompletionScore,
      contribution: Math.round(assignmentCompletionScore * weights.assignmentCompletion),
    },
    {
      key: 'noOverdueWork',
      label: 'No overdue work',
      weight: weights.noOverdueWork,
      componentScore: noOverdueScore,
      contribution: Math.round(noOverdueScore * weights.noOverdueWork),
    },
    {
      key: 'noBlockers',
      label: 'No blockers',
      weight: weights.noBlockers,
      componentScore: noBlockersScore,
      contribution: Math.round(noBlockersScore * weights.noBlockers),
    },
    {
      key: 'approvalsComplete',
      label: 'Approvals complete',
      weight: weights.approvalsComplete,
      componentScore: approvalsScore,
      contribution: Math.round(approvalsScore * weights.approvalsComplete),
    },
    {
      key: 'metadataComplete',
      label: 'Metadata complete',
      weight: weights.metadataComplete,
      componentScore: metadataScore,
      contribution: Math.round(metadataScore * weights.metadataComplete),
    },
    {
      key: 'artworkComplete',
      label: 'Artwork complete',
      weight: weights.artworkComplete,
      componentScore: artScore,
      contribution: Math.round(artScore * weights.artworkComplete),
    },
  ];

  const readinessScore = Math.min(
    100,
    Math.max(0, components.reduce((s, c) => s + c.contribution, 0)),
  );

  const hardBlockers = blockers.length > 0;
  const recommendation = recommendationFromScore(readinessScore, hardBlockers, thresholds);

  // ── Critical path ────────────────────────────────────────────────
  const criticalPath: CriticalPathItem[] = remaining
    .filter((a) => {
      const due = toDate(a.dueDate);
      const beforeRelease = !releaseDate || !due || due.getTime() <= releaseDate.getTime();
      return (
        beforeRelease
        && (
          a.status === ACTIVE_BLOCKED
          || isRequiredAssignment(a)
          || isOverdue(a, now)
          || a.status === REVIEW
        )
      );
    })
    .map((a) => ({
      assignmentId: a.id,
      title: a.title,
      status: a.status,
      dueDate: toDate(a.dueDate),
      reason:
        a.status === ACTIVE_BLOCKED
          ? 'Blocked'
          : isOverdue(a, now)
            ? 'Overdue before release'
            : a.status === REVIEW
              ? 'Awaiting review'
              : 'Required incomplete',
    }))
    .slice(0, 20);

  // ── Milestone progress (derived) ─────────────────────────────────
  const milestoneProgress = buildMilestoneProgress(
    active,
    artwork,
    metaScore,
    milestones,
    recommendation,
  );

  // ── Timeline ─────────────────────────────────────────────────────
  const timeline = buildTimeline(release, activities, milestones, artwork);

  // ── Countdown ────────────────────────────────────────────────────
  const countdown = buildCountdown(releaseDate, now, thresholds);

  return {
    releaseId: release.id,
    organizationId: release.organizationId,
    title: release.title,
    readinessScore,
    recommendation,
    blockers,
    warnings,
    assignmentSummary,
    completedAssignments: completed.length,
    remainingAssignments: remaining.length,
    overdueAssignments: overdue.length,
    reviewAssignments: review.length,
    milestoneProgress,
    criticalPath,
    timeline,
    countdown,
    health: {
      healthScore: readinessScore,
      overdueCount: overdue.length,
      blockedCount: blocked.length,
      reviewQueue: review.length,
    },
    scoreBreakdown: components,
    calculatedAt: now,
    weights,
  };
}

function buildMilestoneProgress(
  assignments: AssignmentRecord[],
  artwork: Artwork | null,
  metaScore: number,
  milestones: MilestoneRecord[],
  recommendation: Recommendation,
): MilestoneProgressItem[] {
  const total = assignments.length || 1;
  const completed = assignments.filter((a) => a.status === 'completed').length;
  const assignmentPct = Math.round((completed / total) * 100);
  const planningPct = Math.min(100, Math.round(assignmentPct * 0.3 + (metaScore > 30 ? 40 : 10)));
  const productionPct = assignmentPct;
  const artPct = artworkCompleteness(artwork);
  const reviewTotal = assignments.filter((a) => a.status === 'review' || a.reviewOutcome).length || 0;
  const reviewDone = assignments.filter((a) => a.reviewOutcome === 'approved' || a.status === 'completed').length;
  const reviewPct = reviewTotal === 0
    ? (assignmentPct >= 80 ? 100 : 50)
    : Math.round((reviewDone / Math.max(reviewTotal, 1)) * 100);
  const deliveryPct = recommendation === 'ready' ? 100 : Math.min(assignmentPct, artPct, metaScore);

  // Blend named release_milestones if present
  const named = milestones.length > 0
    ? Math.round(
      (milestones.filter((m) => m.status === 'completed').length / milestones.length) * 100,
    )
    : null;

  return [
    { key: 'planning', label: 'Planning', pct: planningPct },
    { key: 'production', label: 'Production', pct: productionPct },
    { key: 'artwork', label: 'Artwork', pct: artPct },
    { key: 'metadata', label: 'Metadata', pct: metaScore },
    { key: 'reviews', label: 'Reviews', pct: reviewPct },
    { key: 'delivery', label: 'Delivery Ready', pct: named !== null ? Math.round((deliveryPct + named) / 2) : deliveryPct },
  ];
}

function buildTimeline(
  release: ReleaseRecord,
  activities: ActivityEventRecord[],
  milestones: MilestoneRecord[],
  artwork: Artwork | null,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const created = toDate(release.createdAt);
  events.push({ id: 'created', label: 'Release Created', at: created, kind: 'release' });
  events.push({ id: 'planning', label: 'Planning', at: created, kind: 'system' });

  if (artwork) {
    events.push({
      id: 'artwork',
      label: 'Artwork',
      at: toDate((artwork as { createdAt?: unknown }).createdAt) ?? created,
      kind: 'system',
    });
  } else {
    events.push({ id: 'artwork', label: 'Artwork', at: null, kind: 'system' });
  }

  events.push({
    id: 'metadata',
    label: 'Metadata',
    at: metadataCompleteness(release) >= 50 ? (toDate(release.updatedAt) ?? created) : null,
    kind: 'system',
  });

  const assignActs = activities.filter((a) =>
    ['assigned', 'started', 'completed', 'review.requested', 'review.approved'].includes(a.action)
    || a.action.startsWith('status.'),
  );
  if (assignActs.length > 0) {
    events.push({
      id: 'assignments',
      label: 'Assignments',
      at: toDate(assignActs[assignActs.length - 1]?.createdAt) ?? null,
      kind: 'activity',
    });
  } else {
    events.push({ id: 'assignments', label: 'Assignments', at: null, kind: 'activity' });
  }

  const reviewActs = activities.filter((a) => a.action.includes('review') || a.action.includes('approv'));
  events.push({
    id: 'reviews',
    label: 'Reviews',
    at: reviewActs.length ? toDate(reviewActs[0]?.createdAt) : null,
    kind: 'activity',
  });

  for (const m of milestones.slice(0, 6)) {
    events.push({
      id: `ms-${m.id}`,
      label: m.title,
      at: toDate(m.dueDate) ?? toDate(m.completedAt),
      kind: 'milestone',
    });
  }

  events.push({
    id: 'ready',
    label: 'Ready',
    at: null,
    kind: 'system',
  });
  events.push({
    id: 'release-date',
    label: 'Release Date',
    at: toDate(release.targetReleaseDate) ?? toDate(release.estimatedReleaseDate),
    kind: 'release',
  });

  return events;
}

function buildCountdown(
  releaseDate: Date | null,
  now: Date,
  thresholds: ReadinessThresholds,
): CountdownInfo {
  if (!releaseDate) {
    return { releaseDate: null, days: null, hours: null, color: 'none', overdue: false };
  }
  const diff = releaseDate.getTime() - now.getTime();
  const overdue = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let color: CountdownInfo['color'] = 'green';
  if (overdue || days <= thresholds.countdownRedDays) color = 'red';
  else if (days <= thresholds.countdownYellowDays) color = 'yellow';
  return {
    releaseDate,
    days: overdue ? -days : days,
    hours,
    color,
    overdue,
  };
}

/**
 * Load all release-scoped assignments (direct release + track entities).
 */
export async function loadReleaseAssignments(
  releaseId: string,
  organizationId: string,
): Promise<AssignmentRecord[]> {
  const direct = await getAssignmentsByEntity('release', releaseId);
  const tracks = await getTracksByRelease(releaseId);
  const trackAssignments: AssignmentRecord[] = [];
  for (const t of tracks) {
    const list = await getAssignmentsByEntity('track', t.trackId);
    trackAssignments.push(...list);
  }
  // Also catch org list filter for entityId matches (safety)
  const all = await listAssignments(organizationId);
  const related = all.filter(
    (a) =>
      (a.entityType === 'release' && a.entityId === releaseId)
      || (a.entityType === 'track' && tracks.some((t) => t.trackId === a.entityId)),
  );

  const map = new Map<string, AssignmentRecord>();
  for (const a of [...direct, ...trackAssignments, ...related]) {
    if (a.organizationId === organizationId || !a.organizationId) {
      map.set(a.id, a);
    }
  }
  return [...map.values()];
}

/**
 * Full readiness computation for a release id.
 * Single aggregate pass — reuse result across UI widgets.
 */
export async function getReleaseReadiness(
  releaseId: string,
  opts?: {
    weights?: ReadinessWeights;
    thresholds?: ReadinessThresholds;
    actorId?: string;
    emitEvents?: boolean;
  },
): Promise<ReleaseReadiness | null> {
  const release = await fetchRelease(releaseId);
  if (!release) return null;

  // fetchRelease may return domain Release type — normalize fields
  const releaseRecord = release as unknown as ReleaseRecord;
  const orgId = releaseRecord.organizationId;
  if (!orgId) return null;

  const [assignments, milestones, activities] = await Promise.all([
    loadReleaseAssignments(releaseId, orgId),
    fetchMilestonesByRelease(releaseId).catch(() => [] as MilestoneRecord[]),
    getActivityByEntity(orgId, 'release', releaseId).catch(() => [] as ActivityEventRecord[]),
  ]);

  let artwork: Artwork | null = (releaseRecord.artwork as Artwork | null) ?? null;
  if (!artwork) {
    try {
      artwork = await getArtworkByRelease(orgId, releaseId);
    } catch {
      artwork = null;
    }
  }

  const model = computeReleaseReadiness({
    release: releaseRecord,
    assignments,
    milestones,
    activities,
    artwork,
    weights: opts?.weights,
    thresholds: opts?.thresholds,
  });

  if (opts?.emitEvents && opts.actorId) {
    await maybeEmitReadinessTransitions(model, opts.actorId);
  }

  return model;
}

async function maybeEmitReadinessTransitions(
  model: ReleaseReadiness,
  actorId: string,
): Promise<void> {
  const prev = await getLastReadinessSnapshot(model.releaseId);
  const changed =
    !prev
    || prev.recommendation !== model.recommendation
    || Math.abs(prev.readinessScore - model.readinessScore) >= 5
    || prev.blockerCount !== model.blockers.length;

  if (!changed) return;

  await saveReadinessTransition({
    releaseId: model.releaseId,
    organizationId: model.organizationId,
    readinessScore: model.readinessScore,
    recommendation: model.recommendation,
    blockerCount: model.blockers.length,
    warningCount: model.warnings.length,
  });

  const scoreChanged = prev && prev.readinessScore !== model.readinessScore;
  const recChanged = prev && prev.recommendation !== model.recommendation;
  const blockersAdded = prev && model.blockers.length > prev.blockerCount;
  const blockersRemoved = prev && model.blockers.length < prev.blockerCount;

  if (scoreChanged || !prev) {
    await recordActivity({
      entityType: 'release',
      entityId: model.releaseId,
      organizationId: model.organizationId,
      actorId,
      action: 'readiness.score_changed',
      details: `Readiness score ${prev?.readinessScore ?? '—'} → ${model.readinessScore}`,
      metadata: {
        details: `Readiness score ${prev?.readinessScore ?? '—'} → ${model.readinessScore}`,
        score: model.readinessScore,
        recommendation: model.recommendation,
      },
    });
    await generateNotificationEvent({
      type: 'release.readiness_changed',
      organizationId: model.organizationId,
      actorId,
      entityId: model.releaseId,
      entityType: 'release',
      metadata: { score: model.readinessScore, recommendation: model.recommendation },
    });
  }

  if (recChanged || (!prev && model.recommendation === 'ready')) {
    const action =
      model.recommendation === 'ready' ? 'readiness.ready' : 'readiness.not_ready';
    await recordActivity({
      entityType: 'release',
      entityId: model.releaseId,
      organizationId: model.organizationId,
      actorId,
      action,
      details: `Release readiness: ${model.recommendation}`,
      metadata: { recommendation: model.recommendation, score: model.readinessScore },
    });
    await generateNotificationEvent({
      type: model.recommendation === 'ready' ? 'release.ready' : 'release.not_ready',
      organizationId: model.organizationId,
      actorId,
      entityId: model.releaseId,
      entityType: 'release',
      metadata: { score: model.readinessScore },
    });
  }

  if (blockersAdded) {
    await recordActivity({
      entityType: 'release',
      entityId: model.releaseId,
      organizationId: model.organizationId,
      actorId,
      action: 'readiness.blocker_added',
      details: `Blockers: ${model.blockers.length}`,
    });
    await generateNotificationEvent({
      type: 'release.blocker_added',
      organizationId: model.organizationId,
      actorId,
      entityId: model.releaseId,
      entityType: 'release',
      metadata: { blockerCount: model.blockers.length },
    });
  }
  if (blockersRemoved) {
    await recordActivity({
      entityType: 'release',
      entityId: model.releaseId,
      organizationId: model.organizationId,
      actorId,
      action: 'readiness.blocker_removed',
      details: `Blockers: ${model.blockers.length}`,
    });
  }
}

export async function getOrgReadinessSummaries(
  organizationId: string,
): Promise<Pick<ReleaseReadiness, 'releaseId' | 'title' | 'readinessScore' | 'recommendation' | 'blockers' | 'overdueAssignments' | 'countdown'>[]> {
  const { fetchReleasesByOrg } = await import('./release-service');
  const releases = await fetchReleasesByOrg(organizationId);
  const active = releases.filter(
    (r) => !['released', 'cancelled', 'archived'].includes(r.status),
  );
  const results = [];
  for (const r of active.slice(0, 30)) {
    const model = await getReleaseReadiness(r.id);
    if (model) {
      results.push({
        releaseId: model.releaseId,
        title: model.title,
        readinessScore: model.readinessScore,
        recommendation: model.recommendation,
        blockers: model.blockers,
        overdueAssignments: model.overdueAssignments,
        countdown: model.countdown,
      });
    }
  }
  return results;
}

export type { ReadinessHistoryRecord };
