import { collection, doc, getDocs, query, where, orderBy, updateDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { computeProgress } from '@/lib/workflow-progress';
import { computeWorkflowHealth } from '@/lib/workflow-health';
import { logActivity } from '@/lib/workflow-service';
import type { Stage } from '@/app/(app)/types';

export async function stageComplete(
  workflowId: string,
  stageId: string,
  releaseId: string,
  actorId: string,
) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const stagesSnap = await getDocs(
    query(
      collection(db, 'stages'),
      where('workflowId', '==', workflowId),
      orderBy('order', 'asc'),
    ),
  );

  const stages = stagesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Stage[];

  const currentIdx = stages.findIndex((s) => s.id === stageId);
  if (currentIdx === -1) throw new Error('Stage not found in workflow');

  const currentStage = stages[currentIdx] as Stage;
  const completedAt = Timestamp.now();

  const startedAt = currentStage.startedAt
    ? toDateValue(currentStage.startedAt)
    : null;
  const daysInStage = startedAt
    ? daysBetween(startedAt, completedAt.toDate())
    : 0;

  await updateDoc(doc(db, 'stages', stageId), {
    status: 'completed',
    completedAt,
    daysInStage,
  });

  const nextIdx = currentIdx + 1;

  const progressData = computeProgress(
    stages.map((s, i) =>
      i === currentIdx ? { ...s, status: 'completed' as const } : s,
    ),
  );

  if (nextIdx < stages.length) {
    const nextStage = stages[nextIdx] as Stage;
    const now = Timestamp.now();
    await updateDoc(doc(db, 'stages', nextStage.id), {
      status: 'in_progress',
      startedAt: now,
    });

    const health = computeWorkflowHealth({
      stages: stages.map((s, i) => {
        if (i === currentIdx) return { ...s, status: 'completed' as const };
        if (i === nextIdx) return { ...s, status: 'in_progress' as const, startedAt: now };
        return s;
      }),
    });

    await updateDoc(doc(db, 'workflows', workflowId), {
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
        i === currentIdx ? { ...s, status: 'completed' as const } : s,
      ),
    });

    await updateDoc(doc(db, 'workflows', workflowId), {
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
