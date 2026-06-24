import type { Stage } from '@/app/(app)/types';

export interface ProgressData {
  completed: number;
  total: number;
  progress: number;
}

export function computeProgress(stages: Stage[]): ProgressData {
  const total = stages.length;
  const completed = stages.filter((s) => s.status === 'completed').length;
  return {
    completed,
    total,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
