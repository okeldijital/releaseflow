import { getReleasesByOrganization } from './release-repository';
import { getWorkflow, getStages, getActivities } from './workflow-repository';
import { getDependenciesByRelease } from './dependency-service';
import { getRequirementsByRelease } from './requirement-service';
import { getDeliverablesByRelease } from './deliverable-service';

export interface ReadinessReport {
  percentage: number;
  ready: boolean;
  missing: string[];
  breakdown: {
    requirements: { approved: number; total: number; pct: number };
    workflow: { completed: number; total: number; pct: number } | null;
    deliverables: { approved: number; total: number; pct: number } | null;
    dependencies: { completed: number; totalBlocking: number; pct: number } | null;
  };
}

export type HealthState = 'Excellent' | 'Healthy' | 'Attention' | 'Blocked' | 'Critical';

export interface ReleaseIntelligence {
  releaseId: string;
  releaseName: string;
  artistName: string;
  releaseType: string;
  status: string;
  healthPct: number;
  healthState: HealthState;
  readinessPct: number;
  readinessReady: boolean;
  currentStage: string;
  stageProgressPct: number;
  blockerCount: number;
  attentionItems: string[];
  dueDate?: Date;
  owner?: string;
  daysUntilRelease?: number;
}

export interface OrgIntelligence {
  releases: ReleaseIntelligence[];
  alerts: AlertItem[];
  blockedItems: BlockedItem[];
  deadlines: DeadlineItem[];
  activities: ActivityItem[];
  pulseMetrics: PulseMetrics;
  aggregateHealthPct: number;
  aggregateReadinessPct: number;
  aggregateConfidencePct: number;
  majorityStage: string;
  nearestDeadlineDays: number | null;
}

export interface AlertItem {
  id: string; releaseId: string; priority: 'high' | 'medium' | 'low';
  message: string; entityType: string; entityId: string; rule: string; createdAt: unknown;
}

export interface BlockedItem {
  id: string; releaseId: string; name: string; type: 'stage' | 'dependency' | 'approval';
  owner?: string; age: string; status: string;
}

export interface DeadlineItem {
  id: string; releaseId: string; title: string; type: 'task' | 'campaign_task' | 'dependency';
  dueDate: Date; priority: string;
}

export interface ActivityItem {
  id: string; message: string; releaseId: string; type: string; createdAt: Date;
}

export interface PulseMetrics {
  activeReleases: number;
  blockedReleases: number;
  overBudget: number;
  overdueDeadlines: number;
  shippedThisMonth: number;
  campaignsActive: number;
}

export function computeHealth(percentage: number): HealthState {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Healthy';
  if (percentage >= 50) return 'Attention';
  if (percentage >= 30) return 'Blocked';
  return 'Critical';
}

export function computeReadiness(
  requirements: { status: string }[],
  stages: { status: string }[],
  deliverables: { status: string }[],
  dependencies?: { blocking: boolean; status: string }[],
): ReadinessReport {
  const reqTotal = requirements.length;
  const reqApproved = requirements.filter((r) => r.status === 'approved').length;
  const reqPct = reqTotal > 0 ? (reqApproved / reqTotal) * 100 : 0;

  const stageTotal = stages.length;
  const stageCompleted = stages.filter((s) => s.status === 'completed').length;
  const stagePct = stageTotal > 0 ? (stageCompleted / stageTotal) * 100 : 0;

  const delTotal = deliverables.length;
  const delApproved = deliverables.filter((d) => d.status === 'approved').length;
  const delPct = delTotal > 0 ? (delApproved / delTotal) * 100 : 0;

  const deps = dependencies ?? [];
  const blockingDeps = deps.filter((d) => d.blocking);
  const depCompleted = blockingDeps.filter((d) => d.status === 'completed').length;
  const depPct = blockingDeps.length > 0 ? (depCompleted / blockingDeps.length) * 100 : 100;

  let weights = 0;
  let weighted = 0;
  weighted += reqPct; weights += 1;
  if (stageTotal > 0) { weighted += stagePct; weights += 1; }
  if (delTotal > 0) { weighted += delPct; weights += 1; }
  if (blockingDeps.length > 0) { weighted += depPct; weights += 1; }

  const percentage = weights > 0 ? Math.round(weighted / weights) : 0;
  const missing = requirements.filter((r) => r.status !== 'approved').map((r) => (r as unknown as { name: string }).name);
  if (blockingDeps.length > 0 && depPct < 100) {
    missing.push(`${blockingDeps.length - depCompleted} blocking dependencies incomplete`);
  }

  return {
    percentage, ready: percentage === 100, missing,
    breakdown: {
      requirements: { approved: reqApproved, total: reqTotal, pct: Math.round(reqPct) },
      workflow: stageTotal > 0 ? { completed: stageCompleted, total: stageTotal, pct: Math.round(stagePct) } : null,
      deliverables: delTotal > 0 ? { approved: delApproved, total: delTotal, pct: Math.round(delPct) } : null,
      dependencies: blockingDeps.length > 0 ? { completed: depCompleted, totalBlocking: blockingDeps.length, pct: Math.round(depPct) } : null,
    },
  };
}

export function computeWorkflowHealth(input: { stages: { status: string; dueDate?: unknown }[] } | { status: string; dueDate?: unknown }[]): HealthState {
  const stages = Array.isArray(input) ? input : input.stages;
  const hasBlocked = stages.some((s) => s.status === 'blocked');
  if (hasBlocked) return 'Critical';
  const now = Date.now();
  const hasOverdue = stages.some((s) => {
    if (s.status === 'completed') return false;
    const d = s.dueDate;
    if (!d) return false;
    const date = d instanceof Date ? d : (d as { toDate?: () => Date }).toDate ? (d as { toDate: () => Date }).toDate()! : new Date((d as { seconds: number }).seconds * 1000);
    return date.getTime() < now;
  });
  if (hasOverdue) return 'Blocked';
  const allDone = stages.every((s) => s.status === 'completed');
  if (allDone) return 'Excellent';
  return 'Healthy';
}

export function daysUntil(date: Date): number {
  return Math.max(0, Math.floor((date.getTime() - Date.now()) / 86400000));
}

function ageLabel(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return `${Math.floor((Date.now() - date.getTime()) / 3600000)}h`;
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

export async function fetchOrgIntelligence(orgId: string): Promise<OrgIntelligence> {
  const releases = await getReleasesByOrganization(orgId);
  const activeReleases = releases.filter((r) => r.status !== 'archived' && r.status !== 'cancelled');

  const now = new Date();
  const thisMonth = now.getMonth();

  const alerts: AlertItem[] = [];
  const blockedItems: BlockedItem[] = [];
  const deadlines: DeadlineItem[] = [];
  const activities: ActivityItem[] = [];
  const intelligence: ReleaseIntelligence[] = [];

  for (const release of activeReleases) {
    const [workflow, stages, deps, reqs, dels, acts] = await Promise.all([
      getWorkflow(release.id),
      (async () => { const w = await getWorkflow(release.id); return w ? getStages(w.id) : []; })(),
      getDependenciesByRelease(release.id).catch(() => []),
      getRequirementsByRelease(release.id).catch(() => []),
      getDeliverablesByRelease(release.id).catch(() => []),
      getActivities(release.id, 5).catch(() => []),
    ]);

    const readiness = computeReadiness(reqs, stages, dels, deps);
    const blockDeps = deps.filter((d) => d.blocking && d.status !== 'completed');
    const stageName = workflow
      ? stages.find((s) => s.id === workflow.currentStageId)?.name ?? release.status.replace(/_/g, ' ')
      : release.status.replace(/_/g, ' ');

    for (const a of acts) {
      activities.push({ id: a.id, message: a.type.replace(/_/g, ' '), releaseId: release.id, type: a.type, createdAt: a.createdAt });
    }
    for (const d of blockDeps) {
      blockedItems.push({ id: d.id, releaseId: release.id, name: d.title, type: 'dependency', owner: d.owner, age: ageLabel((d as { createdAt?: unknown }).createdAt as Date ?? new Date()), status: 'blocked' });
    }
    const blockedStages = stages.filter((s) => s.status === 'blocked');
    for (const s of blockedStages) {
      blockedItems.push({ id: s.id, releaseId: release.id, name: s.name, type: 'stage', owner: s.assignedRole ?? undefined, age: ageLabel((s.startedAt as Date) ?? new Date()), status: 'blocked' });
    }

    const healthPct = readiness.percentage;
    intelligence.push({
      releaseId: release.id,
      releaseName: release.title,
      artistName: (release as unknown as Record<string, unknown>).artistName as string ?? '—',
      releaseType: release.releaseType,
      status: release.status,
      healthPct,
      healthState: computeHealth(healthPct),
      readinessPct: readiness.percentage,
      readinessReady: readiness.ready,
      currentStage: stageName,
      stageProgressPct: stages.length > 0 ? Math.round((stages.filter((s) => s.status === 'completed').length / stages.length) * 100) : 0,
      blockerCount: blockDeps.length + blockedStages.length,
      attentionItems: readiness.missing,
      owner: release.createdBy ? release.createdBy.slice(0, 8) : '—',
      daysUntilRelease: release.targetReleaseDate instanceof Date ? daysUntil(release.targetReleaseDate) : undefined,
    });
  }

  const shippedThisMonth = releases.filter((r) => {
    if (r.status !== 'released') return false;
    const d = (r.updatedAt as { toDate?: () => Date })?.toDate?.();
    return d ? d.getMonth() === thisMonth : false;
  }).length;

  const aggHealth = intelligence.length > 0
    ? Math.round(intelligence.reduce((s, i) => s + i.healthPct, 0) / intelligence.length)
    : 100;
  const aggReadiness = intelligence.length > 0
    ? Math.round(intelligence.reduce((s, i) => s + i.readinessPct, 0) / intelligence.length)
    : 100;
  const aggConfidence = Math.round((aggHealth + aggReadiness) / 2);

  const stageCount: Record<string, number> = {};
  for (const r of intelligence) {
    const s = r.currentStage;
    stageCount[s] = (stageCount[s] ?? 0) + 1;
  }
  const majorityStage = Object.entries(stageCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Operations';

  const nearestDeadline = intelligence
    .filter((r) => r.daysUntilRelease !== undefined)
    .map((r) => r.daysUntilRelease!)
    .sort((a, b) => a - b)[0] ?? null;

  return {
    releases: intelligence,
    alerts,
    blockedItems,
    deadlines,
    activities,
    pulseMetrics: {
      activeReleases: intelligence.length,
      blockedReleases: intelligence.filter((r) => r.blockerCount > 0).length,
      overBudget: 0,
      overdueDeadlines: deadlines.length,
      shippedThisMonth,
      campaignsActive: 0,
    },
    aggregateHealthPct: aggHealth,
    aggregateReadinessPct: aggReadiness,
    aggregateConfidencePct: aggConfidence,
    majorityStage,
    nearestDeadlineDays: nearestDeadline,
  };
}
