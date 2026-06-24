import type { Dependency } from '@/app/(app)/types';
import type { RuleFinding } from '@/lib/rule-engine';

function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as Record<string, unknown>;
    if (typeof obj.toDate === 'function') return (obj as { toDate: () => Date }).toDate();
    if (typeof obj.seconds === 'number') return new Date((obj as { seconds: number }).seconds * 1000);
  }
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export interface DependencyHealthReport {
  blocked: Dependency[];
  overdue: Dependency[];
  atRisk: Dependency[];
  total: number;
  completed: number;
  blockingCount: number;
  blockingIncomplete: number;
}

export function checkDependencyHealth(dependencies: Dependency[]): DependencyHealthReport {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const blocked = dependencies.filter((d) => d.status === 'blocked');
  const overdue: Dependency[] = [];
  const atRisk: Dependency[] = [];
  const completed = dependencies.filter((d) => d.status === 'completed');

  for (const d of dependencies) {
    if (d.status === 'completed' || d.status === 'blocked') continue;
    const due = toDate(d.dueDate);
    if (due && due < now) overdue.push(d);
    else if (due && due < weekFromNow) atRisk.push(d);
  }

  const blocking = dependencies.filter((d) => d.blocking);
  const blockingIncomplete = blocking.filter((d) => d.status !== 'completed');

  return {
    blocked,
    overdue,
    atRisk,
    total: dependencies.length,
    completed: completed.length,
    blockingCount: blocking.length,
    blockingIncomplete: blockingIncomplete.length,
  };
}

export function checkDependencyRules(releaseId: string, dependencies: Dependency[]): RuleFinding[] {
  const findings: RuleFinding[] = [];
  const health = checkDependencyHealth(dependencies);

  for (const d of health.blocked) {
    findings.push({
      releaseId, rule: 'dependency_blocked', priority: 'high',
      message: `Dependency blocked: ${d.title} (${d.category})`, entityType: 'dependency', entityId: d.id,
    });
  }
  for (const d of health.overdue) {
    findings.push({
      releaseId, rule: 'dependency_overdue', priority: 'high',
      message: `Dependency overdue: ${d.title} (${d.category})`, entityType: 'dependency', entityId: d.id,
    });
  }
  for (const d of health.atRisk) {
    findings.push({
      releaseId, rule: 'dependency_at_risk', priority: 'medium',
      message: `Dependency at risk: ${d.title} (${d.category})`, entityType: 'dependency', entityId: d.id,
    });
  }

  return findings;
}
