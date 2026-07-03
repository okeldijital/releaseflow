import { getWorkflow, getStages, createActivity, getActivities } from './workflow-repository';
import { getStageTemplatesForReleaseType } from './workflow-templates';

export type { WorkflowRecord, StageRecord, ActivityRecord } from './workflow-repository';

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
  return createActivity(fields);
}

export async function fetchActivity(releaseId: string, max = 50) {
  return getActivities(releaseId, max);
}

export function getStageTemplates(releaseType: string) {
  return getStageTemplatesForReleaseType(releaseType as 'single' | 'ep' | 'album' | 'remix' | 'compilation');
}
