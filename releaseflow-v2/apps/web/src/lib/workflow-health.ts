import type { Stage, HealthStatus } from '@/app/(app)/types';

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

export interface HealthInput {
  stages: Stage[];
  targetReleaseDate?: unknown;
}

export function computeWorkflowHealth(input: HealthInput): HealthStatus {
  const { stages, targetReleaseDate } = input;
  const now = Date.now();

  const hasBlocked = stages.some(
    (s) => s.status === 'blocked',
  );
  if (hasBlocked) return 'red';

  const hasOverdue = stages.some((s) => {
    if (s.status === 'completed') return false;
    const due = toDate(s.dueDate);
    return due !== null && due.getTime() < now;
  });
  if (hasOverdue) return 'red';

  const allDone = stages.every((s) => s.status === 'completed');
  if (allDone) return 'green';

  if (targetReleaseDate) {
    const target = toDate(targetReleaseDate);
    if (target) {
      const daysUntilTarget = (target.getTime() - now) / (1000 * 60 * 60 * 24);
      if (daysUntilTarget < 7) return 'amber';
    }
  }

  return 'green';
}
