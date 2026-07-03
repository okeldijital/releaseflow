import {
  createReleaseWithWorkflow,
  deleteRelease,
  getRelease,
  getReleasesByOrganization,
  updateRelease,
  updateReleaseStatus,
} from './release-repository';
import { logActivity } from './workflow-service';
import type {
  ReleaseStatus,
} from '@/app/(app)/types';
import type { CreateReleaseFields, UpdateReleaseFields } from './release-repository';

export type {
  CreateReleaseFields,
  UpdateReleaseFields,
} from './release-repository';

export async function createReleaseWithFullWorkflow(
  fields: CreateReleaseFields,
  stageTemplates: { name: string; order: number; assignedRole?: string }[],
  requirementNames: string[],
  actorId: string,
): Promise<{ releaseId: string; workflowId: string | null }> {
  if (!fields.title.trim()) throw new Error('Release title is required');
  if (!fields.organizationId) throw new Error('Organization is required');

  return createReleaseWithWorkflow(fields, stageTemplates, requirementNames, actorId);
}

export async function editRelease(
  releaseId: string,
  fields: UpdateReleaseFields,
  actorId: string,
): Promise<void> {
  if (fields.title !== undefined && !fields.title.trim()) throw new Error('Release title is required');
  return updateRelease(releaseId, fields, actorId);
}

export async function changeReleaseStatus(
  releaseId: string,
  status: ReleaseStatus,
  actorId: string,
  reason?: string,
): Promise<void> {
  const validStatuses: ReleaseStatus[] = [
    'draft', 'planning', 'in_production', 'on_hold',
    'ready_for_distribution', 'released', 'cancelled', 'archived',
  ];
  if (!validStatuses.includes(status)) throw new Error(`Invalid status: ${status}`);

  const metadata: Record<string, unknown> = {};
  if (reason) metadata.reason = reason;

  return updateReleaseStatus(releaseId, status, actorId, metadata);
}

export async function removeRelease(
  releaseId: string,
  actorId: string,
): Promise<void> {
  await logActivity({
    type: 'release.deleted' as 'release.created',
    releaseId,
    actorId,
    metadata: { deletedAt: new Date().toISOString() },
  });
  return deleteRelease(releaseId);
}

export async function fetchRelease(releaseId: string) {
  return getRelease(releaseId);
}

export async function fetchReleasesByOrg(orgId: string) {
  return getReleasesByOrganization(orgId);
}
