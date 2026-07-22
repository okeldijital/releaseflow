import { getTasksByStage } from '@/lib/workflow-task-service';

export interface TaskProgressData {
  completed: number;
  total: number;
  progress: number;
}

export async function computeStageTaskProgress(stageId: string): Promise<TaskProgressData> {
  const tasks = await getTasksByStage(stageId);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  return {
    total,
    completed,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
