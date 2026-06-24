import type { ReleaseRequirement, Stage, Deliverable, Dependency } from '@/app/(app)/types';

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

export function computeReadiness(
  requirements: ReleaseRequirement[],
  stages: Stage[],
  deliverables: Deliverable[],
  dependencies?: Dependency[],
): ReadinessReport {
  const reqTotal = requirements.length;
  const reqApproved = requirements.filter((r) => r.status === 'approved').length;
  const reqPct = reqTotal > 0 ? (reqApproved / reqTotal) * 100 : 0;

  const stageTotal = stages.length;
  const stageCompleted = stages.filter((s) => s.status === 'completed').length;
  const stagePct = stageTotal > 0 ? (stageCompleted / stageTotal) * 100 : 0;
  const hasWorkflow = stageTotal > 0;

  const delTotal = deliverables.length;
  const delApproved = deliverables.filter((d) => d.status === 'approved').length;
  const delPct = delTotal > 0 ? (delApproved / delTotal) * 100 : 0;
  const hasDeliverables = delTotal > 0;

  const deps = dependencies ?? [];
  const blockingDeps = deps.filter((d) => d.blocking);
  const depCompleted = blockingDeps.filter((d) => d.status === 'completed').length;
  const depPct = blockingDeps.length > 0 ? (depCompleted / blockingDeps.length) * 100 : 100;
  const hasDependencies = blockingDeps.length > 0;

  let weights = 0;
  let weighted = 0;

  weighted += reqPct;
  weights += 1;

  if (hasWorkflow) { weighted += stagePct; weights += 1; }
  if (hasDeliverables) { weighted += delPct; weights += 1; }
  if (hasDependencies) { weighted += depPct; weights += 1; }

  const percentage = weights > 0 ? Math.round(weighted / weights) : 0;

  const missing = requirements
    .filter((r) => r.status !== 'approved')
    .map((r) => r.name);

  if (hasDependencies && depPct < 100) {
    missing.push(`${blockingDeps.length - depCompleted} blocking dependencies incomplete`);
  }

  return {
    percentage,
    ready: percentage === 100,
    missing,
    breakdown: {
      requirements: { approved: reqApproved, total: reqTotal, pct: Math.round(reqPct) },
      workflow: hasWorkflow ? { completed: stageCompleted, total: stageTotal, pct: Math.round(stagePct) } : null,
      deliverables: hasDeliverables ? { approved: delApproved, total: delTotal, pct: Math.round(delPct) } : null,
      dependencies: hasDependencies ? { completed: depCompleted, totalBlocking: blockingDeps.length, pct: Math.round(depPct) } : null,
    },
  };
}
