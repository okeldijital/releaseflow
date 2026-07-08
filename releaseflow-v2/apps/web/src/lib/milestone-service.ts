import {
  createMilestone as repoCreate,
  getMilestone as repoGet,
  updateMilestone as repoUpdate,
  getMilestonesByRelease,
  getMilestonesByOrg,
  completeMilestone as repoComplete,
  reopenMilestone as repoReopen,
  bulkCreateMilestones,
} from './milestone-repository';
import type { MilestoneRecord, CreateMilestoneFields, UpdateMilestoneFields } from './milestone-repository';
import { recordActivity } from './activity-service';

export type { MilestoneRecord, CreateMilestoneFields, UpdateMilestoneFields };
export { MILESTONE_TEMPLATES } from './milestone-repository';

export async function createNewMilestone(fields: CreateMilestoneFields): Promise<MilestoneRecord> {
  if (!fields.title.trim()) throw new Error('Milestone title is required');
  const milestone = await repoCreate(fields);
  await recordActivity({
    entityType: 'release',
    entityId: fields.releaseId,
    organizationId: fields.organizationId,
    actorId: fields.owner ?? '',
    action: 'milestone.created',
    details: `Milestone "${fields.title}" created`,
  });
  return milestone;
}

export async function editMilestone(milestoneId: string, fields: UpdateMilestoneFields): Promise<void> {
  const existing = await repoGet(milestoneId);
  if (!existing) throw new Error('Milestone not found');
  await repoUpdate(milestoneId, fields);
}

export async function fetchMilestonesByRelease(releaseId: string): Promise<MilestoneRecord[]> {
  return getMilestonesByRelease(releaseId);
}

export async function fetchMilestonesByOrg(orgId: string): Promise<MilestoneRecord[]> {
  return getMilestonesByOrg(orgId);
}

export async function completeUserMilestone(milestoneId: string, actorId: string): Promise<void> {
  const existing = await repoGet(milestoneId);
  if (!existing) throw new Error('Milestone not found');
  await repoComplete(milestoneId);
  await recordActivity({
    entityType: 'release',
    entityId: existing.releaseId,
    organizationId: existing.organizationId,
    actorId,
    action: 'milestone.completed',
    details: `Milestone "${existing.title}" completed`,
  });
}

export async function reopenUserMilestone(milestoneId: string, actorId: string): Promise<void> {
  const existing = await repoGet(milestoneId);
  if (!existing) throw new Error('Milestone not found');
  await repoReopen(milestoneId);
  await recordActivity({
    entityType: 'release',
    entityId: existing.releaseId,
    organizationId: existing.organizationId,
    actorId,
    action: 'milestone.reopened',
    details: `Milestone "${existing.title}" reopened`,
  });
}

export async function seedReleaseMilestones(releaseId: string, orgId: string): Promise<MilestoneRecord[]> {
  const existing = await getMilestonesByRelease(releaseId);
  if (existing.length > 0) return existing;
  const { MILESTONE_TEMPLATES } = await import('./milestone-repository');
  return bulkCreateMilestones(releaseId, orgId, MILESTONE_TEMPLATES);
}
