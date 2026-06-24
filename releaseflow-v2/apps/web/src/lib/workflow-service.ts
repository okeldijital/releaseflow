import { collection, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getStageTemplatesForReleaseType, initialStageStatus } from '@/lib/workflow-templates';
import type { Release, ActivityType } from '@/app/(app)/types';

export async function generateWorkflowForRelease(
  releaseId: string,
  releaseType: Release['releaseType'],
  actorId: string,
) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const templates = getStageTemplatesForReleaseType(releaseType);
  if (templates.length === 0) return;

  const workflowRef = await addDoc(collection(db, 'workflows'), {
    releaseId,
    templateId: releaseType,
    status: 'in_progress',
    progress: 0,
    currentStageId: null,
    startedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const workflowId = workflowRef.id;

  let firstStageId: string | null = null;
  const now = Timestamp.now();
  for (const tpl of templates) {
    const stageRef = await addDoc(collection(db, 'stages'), {
      workflowId,
      name: tpl.name,
      order: tpl.order,
      status: tpl.order === 1 ? 'in_progress' : initialStageStatus,
      startedAt: tpl.order === 1 ? now : null,
      dueDate: null,
      assignedRole: tpl.assignedRole ?? null,
      completedAt: null,
    });
    if (tpl.order === 1) firstStageId = stageRef.id;
  }

  const updates: Record<string, unknown> = {
    currentStageId: firstStageId,
    status: 'in_progress',
    progress: 0,
  };
  await updateDoc(workflowRef, updates);

  await Promise.all([
    logActivity({
      type: 'workflow.generated',
      releaseId,
      workflowId,
      actorId,
    }),
    logActivity({
      type: 'stage.started',
      releaseId,
      workflowId,
      stageId: firstStageId ?? undefined,
      actorId,
    }),
  ]);

  return workflowId;
}

export async function logActivity(fields: {
  type: ActivityType;
  releaseId: string;
  workflowId?: string;
  stageId?: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  if (!db) return;
  await addDoc(collection(db, 'activities'), {
    type: fields.type,
    releaseId: fields.releaseId,
    workflowId: fields.workflowId ?? null,
    stageId: fields.stageId ?? null,
    actorId: fields.actorId,
    metadata: fields.metadata ?? null,
    createdAt: Timestamp.now(),
  });
}
