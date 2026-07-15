import {
  createAssignment as repoCreate,
  getAssignment as repoGet,
  updateAssignment as repoUpdate,
  listAssignments as repoList,
  searchAssignments as repoSearch,
  getAssignmentsByEntity,
  getAssignmentsByAssignee as repoGetByAssignee,
  assignUser as repoAssignUser,
  acceptAssignment as repoAccept,
  declineAssignment as repoDecline,
  completeAssignment as repoComplete,
  reopenAssignment as repoReopen,
  archiveAssignment as repoArchive,
  restoreAssignment as repoRestore,
  deleteAssignment as repoDelete,
  getAssignmentStats as repoStats,
  findDuplicateAssignment,
} from './assignment-repository';
import type {
  AssignmentRecord, CreateAssignmentFields, UpdateAssignmentFields, AssignmentStatus, AssignmentPriority, AssignmentEntityType,
} from './assignment-repository';
import { recordActivity } from './activity-service';
import { createNotification } from './notification-service';

export type { AssignmentRecord, CreateAssignmentFields, UpdateAssignmentFields, AssignmentStatus, AssignmentPriority, AssignmentEntityType };

export class DuplicateAssignmentError extends Error {
  constructor(
    public readonly organizationId: string,
    public readonly entityType: AssignmentEntityType,
    public readonly entityId: string,
    public readonly assigneeId: string,
    public readonly role: string,
  ) {
    super(
      `Duplicate assignment: organization=${organizationId}, entityType=${entityType}, entityId=${entityId}, assignee=${assigneeId}, role=${role}`,
    );
    this.name = 'DuplicateAssignmentError';
  }
}

const VALID_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  draft: ['assigned', 'cancelled', 'archived'],
  assigned: ['accepted', 'declined', 'cancelled', 'archived'],
  accepted: ['in_progress', 'declined', 'cancelled', 'archived'],
  in_progress: ['review', 'cancelled', 'archived'],
  review: ['in_progress', 'cancelled', 'archived'],
  completed: ['in_progress', 'archived'],
  declined: ['assigned', 'archived'],
  cancelled: ['draft', 'archived'],
  archived: ['draft'],
};

function isValidTransition(from: AssignmentStatus, to: AssignmentStatus): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function createNewAssignment(fields: CreateAssignmentFields): Promise<AssignmentRecord> {
  if (!fields.title.trim()) throw new Error('Assignment title is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  if (!fields.assigneeId) throw new Error('Assignee is required');
  if (!fields.assignerId) throw new Error('Assigner is required');

  const existing = await findDuplicateAssignment(
    fields.organizationId,
    fields.entityType,
    fields.entityId,
    fields.assigneeId,
    fields.role,
  );
  if (existing) {
    throw new DuplicateAssignmentError(
      fields.organizationId,
      fields.entityType,
      fields.entityId,
      fields.assigneeId,
      fields.role,
    );
  }

  const assignment = await repoCreate(fields);

  await recordActivity({
    entityType: 'task',
    entityId: assignment.id,
    organizationId: fields.organizationId,
    actorId: fields.assignerId,
    action: 'assigned',
    details: `Assignment "${assignment.title}" created for ${fields.assigneeId}`,
  });

  await createNotification({
    userId: fields.assigneeId,
    type: 'assignment',
    title: 'New Assignment',
    message: `You have been assigned: ${fields.title}`,
    referenceId: assignment.id,
    referenceType: 'assignment',
  });

  return assignment;
}

export async function editAssignment(assignmentId: string, fields: UpdateAssignmentFields, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoUpdate(assignmentId, fields);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'updated',
    details: `Assignment "${existing.title}" updated`,
  });
}

export async function updateAssignmentStatus(
  assignmentId: string,
  newStatus: AssignmentStatus,
  actorId: string,
): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (newStatus === 'completed') {
    throw new Error('Assignment completion must use completeUserAssignment()');
  }
  if (!isValidTransition(existing.status, newStatus)) {
    throw new Error(`Cannot transition from "${existing.status}" to "${newStatus}"`);
  }
  await repoUpdate(assignmentId, { status: newStatus });

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: `status.${newStatus}`,
    details: `Assignment status changed from "${existing.status}" to "${newStatus}"`,
  });
}

export async function fetchAssignment(assignmentId: string): Promise<AssignmentRecord | null> {
  return repoGet(assignmentId);
}

export async function fetchAssignments(orgId: string, opts?: { includeArchived?: boolean }): Promise<AssignmentRecord[]> {
  return repoList(orgId, opts);
}

export async function fetchAssignmentSearch(orgId: string, q: string): Promise<AssignmentRecord[]> {
  return repoSearch(orgId, q);
}

export async function fetchAssignmentsByAssignee(personId: string, orgId?: string): Promise<AssignmentRecord[]> {
  return repoGetByAssignee(personId, orgId);
}

export async function assignUserToAssignment(assignmentId: string, assigneeId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoAssignUser(assignmentId, assigneeId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'reassigned',
    details: `Reassigned to ${assigneeId}`,
  });
}

export async function acceptUserAssignment(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (existing.assigneeId !== actorId) throw new Error('Only the assignee can accept');
  await repoAccept(assignmentId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'accepted',
    details: 'Assignment accepted',
  });
}

export async function declineUserAssignment(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (existing.assigneeId !== actorId) throw new Error('Only the assignee can decline');
  await repoDecline(assignmentId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'declined',
    details: 'Assignment declined',
  });
}

export async function completeUserAssignment(assignmentId: string, actorId: string, actualHours?: number): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoComplete(assignmentId, actualHours);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'completed',
    details: 'Assignment completed',
  });
}

export async function reopenUserAssignment(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoReopen(assignmentId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'reopened',
    details: 'Assignment reopened',
  });
}

export async function archiveUserAssignment(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoArchive(assignmentId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'archived',
    details: 'Assignment archived',
  });
}

export async function restoreUserAssignment(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoRestore(assignmentId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'restored',
    details: 'Assignment restored',
  });
}

export async function deleteUserAssignment(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoDelete(assignmentId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'deleted',
    details: 'Assignment deleted',
  });
}

export async function fetchAssignmentsByEntity(entityType: string, entityId: string): Promise<AssignmentRecord[]> {
  return getAssignmentsByEntity(entityType as AssignmentRecord['entityType'], entityId);
}

export async function fetchAssignmentStats(personId: string, orgId: string) {
  return repoStats(personId, orgId);
}
