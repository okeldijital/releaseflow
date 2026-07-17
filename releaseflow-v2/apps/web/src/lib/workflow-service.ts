import { getWorkflow, getStages } from './workflow-repository';
import { getStageTemplatesForReleaseType } from './workflow-templates';
import { getRelease } from './release-repository';
import { recordActivity, getActivityByEntity } from './activity-service';
import type { ActivityEventRecord } from './activity-service';

export type { WorkflowRecord, StageRecord } from './workflow-repository';
export type { ActivityEventRecord };

export async function fetchWorkflow(releaseId: string) {
  return getWorkflow(releaseId);
}

export async function fetchStages(workflowId: string) {
  return getStages(workflowId);
}

export async function logActivity(fields: {
  type: string;
  releaseId: string;
  workflowId?: string | null;
  stageId?: string | null;
  actorId: string;
  metadata?: Record<string, unknown> | null;
}) {
  const release = await getRelease(fields.releaseId);
  const organizationId = release?.organizationId ?? '';
  return recordActivity({
    entityType: 'release',
    entityId: fields.releaseId,
    organizationId,
    actorId: fields.actorId,
    action: fields.type,
    metadata: {
      ...(fields.metadata ?? {}),
      workflowId: fields.workflowId,
      stageId: fields.stageId,
    },
  });
}

export async function fetchActivity(releaseId: string, max = 50) {
  const release = await getRelease(releaseId);
  if (!release) return [];
  const acts = await getActivityByEntity(release.organizationId, 'release', releaseId);
  return acts.slice(0, max);
}

export async function fetchActivityByEntity(
  organizationId: string,
  entityType: ActivityEventRecord['entityType'],
  entityId: string,
  max = 50,
): Promise<ActivityEventRecord[]> {
  if (!organizationId || !entityId) return [];
  const acts = await getActivityByEntity(organizationId, entityType, entityId);
  return acts.slice(0, max);
}

export function getStageTemplates(releaseType: string) {
  return getStageTemplatesForReleaseType(releaseType as 'single' | 'ep' | 'album' | 'remix' | 'compilation');
}
