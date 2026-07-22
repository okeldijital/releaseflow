import {
  collection, query, where, getDocs,
} from '@firebase/firestore';
import {
  createReleaseWithWorkflow,
  deleteRelease,
  getRelease,
  getReleasesByOrganization,
  updateRelease,
  updateReleaseStatus,
  getDraftByUser,
  getDraftsByUser,
  getOrganizationDrafts,
  createReleaseDraft,
  updateReleaseDraft,
  completeDraft,
  createWorkflowForRelease,
  markExpiredDrafts as markExpiredDraftsRepo,
  getAllReleases,
  getDraftReleases,
  getActiveReleases,
  getReleasedReleases,
  getReleases,
  duplicateRelease,
  renameDraft,
  deleteDraft,
  getReleasesNeedingAttention,
  getContinueWorkingReleases,
  getUpcomingReleases,
  getRecentlyUpdatedReleases,
} from './release-repository';
import { getDb } from './firebase';
import type { ReleaseStatus } from '@/app/(app)/types';
import type { CreateReleaseFields, UpdateReleaseFields } from './release-repository';
import {
  toReleaseCardModels,
  type ReleaseCardModel,
} from './release-card-model';

export type { ReleaseCardModel };
export { toReleaseCardModel, toReleaseCardModels } from './release-card-model';

export type {
  CreateReleaseFields,
  UpdateReleaseFields,
} from './release-repository';

const RELEASE_LINK_PROTOCOLS = ['http:', 'https:'];

export function isValidReleaseLink(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return RELEASE_LINK_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

export function validateReleaseLink(value: string): string | null {
  if (!isValidReleaseLink(value)) return 'Enter a valid URL starting with http:// or https://';
  return null;
}

export async function createReleaseWithFullWorkflow(
  fields: CreateReleaseFields,
  stageTemplates: { name: string; order: number; assignedRole?: string }[],
  requirementNames: string[],
  actorId: string,
): Promise<{ releaseId: string; workflowId: string | null }> {
  if (!fields.title.trim()) throw new Error('Release title is required');
  if (!fields.organizationId) throw new Error('Organization is required');

  // AUTH-001 — single AuthorizationService decision.
  const { AuthorizationService } = await import('@/lib/auth/authorization-service');
  await AuthorizationService.requireCreateRelease(fields.organizationId, actorId);

  return createReleaseWithWorkflow(fields, stageTemplates, requirementNames, actorId);
}

export async function editRelease(
  releaseId: string,
  fields: UpdateReleaseFields,
  actorId: string,
): Promise<void> {
  if (fields.title !== undefined && !fields.title.trim()) throw new Error('Release title is required');
  const existing = await getRelease(releaseId);
  if (existing?.organizationId) {
    const { AuthorizationService } = await import('@/lib/auth/authorization-service');
    await AuthorizationService.requireEditRelease(existing.organizationId, actorId);
  }
  return updateRelease(releaseId, fields, actorId);
}

export async function changeReleaseStatus(
  releaseId: string,
  status: ReleaseStatus,
  actorId: string,
  reason?: string,
): Promise<void> {
  const validStatuses: ReleaseStatus[] = [
    'planning', 'in_production', 'on_hold',
    'ready_for_distribution', 'released', 'cancelled', 'archived',
  ];
  if (!validStatuses.includes(status)) throw new Error(`Invalid status: ${status}`);

  const existing = await getRelease(releaseId);
  if (existing?.organizationId) {
    const { AuthorizationService } = await import('@/lib/auth/authorization-service');
    if (status === 'released' || status === 'archived') {
      await AuthorizationService.requirePublishRelease(existing.organizationId, actorId);
    } else {
      await AuthorizationService.requireEditRelease(existing.organizationId, actorId);
    }
  }

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

  const orgId = organizationId ?? (await getRelease(releaseId))?.organizationId ?? '';
  if (orgId) {
    const { AuthorizationService } = await import('@/lib/auth/authorization-service');
    await AuthorizationService.requireDeleteRelease(orgId, actorId);
  }

  const assets = await getAssetsByRelease(releaseId);
  for (const asset of assets) {
    await deleteAsset(asset.id);
  }

  const releaseActivities = await getActivityByEntity(orgId, 'release', releaseId);
  for (const activity of releaseActivities) {
    await deleteActivityEvent(activity.id);
  }

  const releaseAssignments = await getAssignmentsByEntity('release', releaseId, {
    includeTerminal: true,
  });
  for (const assignment of releaseAssignments) {
    await deleteAssignment(assignment.id);
  }

  const trackRecords = await getTracksByRelease(releaseId);
  for (const record of trackRecords) {
    const trackAssignments = await getAssignmentsByEntity('track', record.trackId, {
      includeTerminal: true,
    });
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

  return deleteRelease(releaseId);
}

export async function fetchRelease(releaseId: string) {
  const release = await getRelease(releaseId);
  if (!release) return null;
  const models = await toReleaseCardModels(release.organizationId, [release]);
  return models[0] ?? null;
}

import type { ReleaseQueryOptions } from './release-repository';

export async function fetchReleasesByOrg(orgId: string, options?: Omit<ReleaseQueryOptions, 'pagination'>) {
  const releases = options
    ? await getReleases(orgId, options)
    : await getReleasesByOrganization(orgId);
  return toReleaseCardModels(orgId, releases);
}

export async function fetchReleasesByArtist(orgId: string, artistId: string): Promise<ReleaseCardModel[]> {
  const db = getDb();
  if (!db) return [];
  const relSnap = await getDocs(
    query(collection(db, 'release_artists'), where('artistId', '==', artistId)),
  );
  const releaseIds = relSnap.docs.map((d) => (d.data() as { releaseId: string }).releaseId);
  if (releaseIds.length === 0) return [];
  const releases = await getReleasesByOrganization(orgId);
  const matched = releases.filter((r) => releaseIds.includes(r.id));
  return toReleaseCardModels(orgId, matched);
}

export async function fetchDraftByUser(orgId: string, userId: string) {
  const release = await getDraftByUser(orgId, userId);
  if (!release) return null;
  const models = await toReleaseCardModels(orgId, [release]);
  return models[0] ?? null;
}

export async function fetchDraftsByUser(orgId: string, userId: string) {
  const releases = await getDraftsByUser(orgId, userId);
  return toReleaseCardModels(orgId, releases);
}

/**
 * BUG-009 / BUILD-015A — org-scoped drafts with canonical ReleaseCardModel
 * (same artwork + progress enrichment as Releases page).
 */
export async function fetchOrganizationDrafts(orgId: string): Promise<ReleaseCardModel[]> {
  const releases = await getOrganizationDrafts(orgId);
  return toReleaseCardModels(orgId, releases);
}

export async function saveReleaseDraft(
  releaseId: string,
  wizardData: Record<string, unknown>,
  actorId: string,
  expectedVersion?: number,
): Promise<void> {
  return updateReleaseDraft(releaseId, wizardData, actorId, expectedVersion);
}

export async function createNewReleaseDraft(
  fields: CreateReleaseFields,
  wizardData: Record<string, unknown>,
  actorId: string,
): Promise<string> {
  if (!fields.title.trim()) throw new Error('Release title is required');
  if (!fields.organizationId) throw new Error('Organization is required');
  const { AuthorizationService } = await import('@/lib/auth/authorization-service');
  await AuthorizationService.requireCreateRelease(fields.organizationId, actorId);
  return createReleaseDraft(fields, wizardData, actorId);
}

export async function finalizeDraft(releaseId: string, actorId: string): Promise<void> {
  return completeDraft(releaseId, actorId);
}

export async function addWorkflowToRelease(
  releaseId: string,
  stageTemplates: { name: string; order: number; assignedRole?: string }[],
  requirementNames: string[],
  actorId: string,
): Promise<{ workflowId: string | null }> {
  const existing = await getRelease(releaseId);
  if (existing?.organizationId) {
    const { AuthorizationService } = await import('@/lib/auth/authorization-service');
    await AuthorizationService.requireEditRelease(existing.organizationId, actorId);
  }
  return createWorkflowForRelease(releaseId, stageTemplates, requirementNames, actorId);
}

export async function markExpiredDrafts(olderThanDays = 180): Promise<{ marked: number }> {
  return markExpiredDraftsRepo(olderThanDays);
}

export async function fetchAllReleases(orgId: string) {
  return toReleaseCardModels(orgId, await getAllReleases(orgId));
}

export async function fetchDraftReleases(orgId: string, userId?: string) {
  return toReleaseCardModels(orgId, await getDraftReleases(orgId, userId));
}

export async function fetchActiveReleases(orgId: string) {
  return toReleaseCardModels(orgId, await getActiveReleases(orgId));
}

export async function fetchReleasedReleases(orgId: string) {
  return toReleaseCardModels(orgId, await getReleasedReleases(orgId));
}

export async function duplicateDraft(releaseId: string, actorId: string): Promise<string> {
  const existing = await getRelease(releaseId);
  if (existing?.organizationId) {
    const { AuthorizationService } = await import('@/lib/auth/authorization-service');
    await AuthorizationService.requireEditRelease(existing.organizationId, actorId);
  }
  return duplicateRelease(releaseId, actorId);
}

export async function renameReleaseDraft(
  releaseId: string,
  newTitle: string,
  actorId: string,
): Promise<void> {
  const existing = await getRelease(releaseId);
  if (existing?.organizationId) {
    const { AuthorizationService } = await import('@/lib/auth/authorization-service');
    await AuthorizationService.requireEditRelease(existing.organizationId, actorId);
  }
  return renameDraft(releaseId, newTitle, actorId);
}

export async function deleteReleaseDraft(
  releaseId: string,
  actorId: string,
): Promise<void> {
  const existing = await getRelease(releaseId);
  if (existing?.organizationId) {
    const { AuthorizationService } = await import('@/lib/auth/authorization-service');
    await AuthorizationService.requireDeleteRelease(existing.organizationId, actorId);
  }
  return deleteDraft(releaseId, actorId);
}

export async function fetchReleasesNeedingAttention(orgId: string, userId?: string) {
  return toReleaseCardModels(orgId, await getReleasesNeedingAttention(orgId, userId));
}

export async function fetchContinueWorking(orgId: string, userId: string) {
  return toReleaseCardModels(orgId, await getContinueWorkingReleases(orgId, userId));
}

export async function fetchUpcomingReleases(orgId: string, withinDays = 30) {
  return toReleaseCardModels(orgId, await getUpcomingReleases(orgId, withinDays));
}

export async function fetchRecentlyUpdated(orgId: string, limit = 10) {
  return toReleaseCardModels(orgId, await getRecentlyUpdatedReleases(orgId, limit));
}
