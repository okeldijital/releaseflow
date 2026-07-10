import {
  createReleaseWithWorkflow,
  deleteRelease,
  getRelease,
  getReleasesByOrganization,
  updateRelease,
  updateReleaseStatus,
} from './release-repository';
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
  organizationId?: string,
): Promise<void> {
  const { getTracksByRelease, removeTrackFromRelease } = await import('./release-track-repository');
  const { removeTrack } = await import('./track-service');
  const { getAssignmentsByEntity, deleteAssignment } = await import('./assignment-repository');
  const { getActivityByEntity, deleteActivityEvent } = await import('./activity-service');
  const { getAssetsByRelease, deleteAsset } = await import('./asset-repository');

  const assets = await getAssetsByRelease(releaseId);
  for (const asset of assets) {
    await deleteAsset(asset.id);
  }

  const orgId = organizationId ?? (await getRelease(releaseId))?.organizationId ?? '';

  const releaseActivities = await getActivityByEntity(orgId, 'release', releaseId);
  for (const activity of releaseActivities) {
    await deleteActivityEvent(activity.id);
  }

  const releaseAssignments = await getAssignmentsByEntity('release', releaseId);
  for (const assignment of releaseAssignments) {
    await deleteAssignment(assignment.id);
  }

  const trackRecords = await getTracksByRelease(releaseId);
  for (const record of trackRecords) {
    const trackAssignments = await getAssignmentsByEntity('track', record.trackId);
    for (const assignment of trackAssignments) {
      await deleteAssignment(assignment.id);
    }

    const trackActivities = await getActivityByEntity(orgId, 'track', record.trackId);
    for (const activity of trackActivities) {
      await deleteActivityEvent(activity.id);
    }

    await removeTrackFromRelease(record.id);
    await removeTrack(record.trackId, organizationId, actorId);
  }

  return deleteRelease(releaseId, organizationId, actorId);
}

export async function fetchRelease(releaseId: string) {
  return getRelease(releaseId);
}

export async function fetchReleasesByOrg(orgId: string) {
  return getReleasesByOrganization(orgId);
}
