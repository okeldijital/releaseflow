import { Timestamp } from '@firebase/firestore';
import { getStages, updateStage, updateWorkflow } from './workflow-repository';
import { computeProgress } from './workflow-progress';
import { computeWorkflowHealth } from './workflow-health';
import type { StageRecord } from './workflow-repository';
import type { Stage } from '@/app/(app)/types';
import { logActivity } from './workflow-service';

function toStage(s: StageRecord): Stage {
  return s as unknown as Stage;
}

export async function stageComplete(
  workflowId: string,
  stageId: string,
  releaseId: string,
  actorId: string,
) {
  const stages = await getStages(workflowId);
  if (stages.length === 0) throw new Error('No stages found in workflow');

  const currentIdx = stages.findIndex((s) => s.id === stageId);
  if (currentIdx === -1) throw new Error('Stage not found in workflow');

  const currentStage = toStage(stages[currentIdx] as StageRecord);
  const completedAt = Timestamp.now();

  const startedAt = currentStage.startedAt
    ? toDateValue(currentStage.startedAt)
    : null;
  const daysInStage = startedAt
    ? daysBetween(startedAt, completedAt.toDate())
    : 0;

  await updateStage(stageId, {
    status: 'completed',
    completedAt,
    daysInStage,
  });

  const nextIdx = currentIdx + 1;

  const progressData = computeProgress(
    stages.map((s, i) =>
      i === currentIdx ? { ...toStage(s), status: 'completed' as const } : toStage(s),
    ),
  );

  if (nextIdx < stages.length) {
    const nextStage = toStage(stages[nextIdx] as StageRecord);
    const now = Timestamp.now();
    await updateStage(nextStage.id, {
      status: 'in_progress',
      startedAt: now,
    });

    const health = computeWorkflowHealth({
      stages: stages.map((s, i) => {
        if (i === currentIdx) return { ...toStage(s), status: 'completed' as const };
        if (i === nextIdx) return { ...toStage(s), status: 'in_progress' as const, startedAt: now };
        return toStage(s);
      }),
    });

    await updateWorkflow(workflowId, {
      status: 'in_progress',
      currentStageId: nextStage.id,
      progress: progressData.progress,
      health,
      updatedAt: Timestamp.now(),
    });

    await Promise.all([
      logActivity({
        type: 'stage.completed',
        releaseId,
        workflowId,
        stageId,
        actorId,
        metadata: { stageName: currentStage.name, daysInStage },
      }),
      logActivity({
        type: 'stage.started',
        releaseId,
        workflowId,
        stageId: nextStage.id,
        actorId,
        metadata: { stageName: nextStage.name },
      }),
    ]);
  } else {
    const health = computeWorkflowHealth({
      stages: stages.map((s, i) =>
        i === currentIdx ? { ...toStage(s), status: 'completed' as const } : toStage(s),
      ),
    });

    await updateWorkflow(workflowId, {
      status: 'completed',
      currentStageId: null,
      progress: 100,
      health,
      updatedAt: Timestamp.now(),
    });

    await logActivity({
      type: 'stage.completed',
      releaseId,
      workflowId,
      stageId,
      actorId,
      metadata: { stageName: currentStage.name, daysInStage, final: true },
    });
  }

  return { completed: currentStage, progress: progressData.progress };
}

function toDateValue(ts: unknown): Date | null {
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

function daysBetween(a: Date, b: Date): number {
  const diff = b.getTime() - a.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
