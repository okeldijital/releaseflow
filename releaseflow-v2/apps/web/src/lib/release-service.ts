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
  createReleaseDraft,
  updateReleaseDraft,
  completeDraft,
  createWorkflowForRelease,
  markExpiredDrafts as markExpiredDraftsRepo,
} from './release-repository';
import { getArtworksByReleaseIds } from './artwork/artwork-repository';
import { getDb } from './firebase';
import type {
  ReleaseStatus,
  Release,
} from '@/app/(app)/types';
import type { Artwork } from './artwork/artwork-types';
import type { CreateReleaseFields, UpdateReleaseFields } from './release-repository';

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
  const artworks = await getArtworksByReleaseIds(release.organizationId, [releaseId]);
  return { ...release, artwork: artworks[0] ?? null };
}

export async function fetchReleasesByOrg(orgId: string) {
  const releases = await getReleasesByOrganization(orgId);
  if (releases.length === 0) return releases;
  const ids = releases.map((r) => r.id);
  const artworks = await getArtworksByReleaseIds(orgId, ids);
  const map = new Map<string, Artwork>();
  for (const a of artworks) {
    if (!map.has(a.releaseId)) map.set(a.releaseId, a);
  }
  return releases.map((r) => ({ ...r, artwork: map.get(r.id) ?? null }));
}

export async function fetchReleasesByArtist(orgId: string, artistId: string): Promise<Release[]> {
  const db = getDb();
  if (!db) return [];
  const relSnap = await getDocs(
    query(collection(db, 'release_artists'), where('artistId', '==', artistId)),
  );
  const releaseIds = relSnap.docs.map((d) => (d.data() as { releaseId: string }).releaseId);
  if (releaseIds.length === 0) return [];
  const releases = await getReleasesByOrganization(orgId);
  const matched = releases.filter((r) => releaseIds.includes(r.id));
  if (matched.length === 0) return matched;
  const ids = matched.map((r) => r.id);
  const artworks = await getArtworksByReleaseIds(orgId, ids);
  const map = new Map<string, Artwork>();
  for (const a of artworks) {
    if (!map.has(a.releaseId)) map.set(a.releaseId, a);
  }
  return matched.map((r) => ({ ...r, artwork: map.get(r.id) ?? null }));
}

export async function fetchDraftByUser(orgId: string, userId: string) {
  const release = await getDraftByUser(orgId, userId);
  if (!release) return null;
  return release;
}

export async function fetchDraftsByUser(orgId: string, userId: string) {
  return getDraftsByUser(orgId, userId);
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
