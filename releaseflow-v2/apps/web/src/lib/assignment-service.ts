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
  markStarted as repoMarkStarted,
  blockAssignment as repoBlock,
  unblockAssignment as repoUnblock,
  submitForReview as repoSubmitForReview,
  approveAssignment as repoApprove,
  requestChangesAssignment as repoRequestChanges,
  rejectAssignmentReview as repoRejectReview,
} from './assignment-repository';
import type {
  AssignmentRecord, CreateAssignmentFields, UpdateAssignmentFields, AssignmentStatus, AssignmentPriority, AssignmentEntityType,
} from './assignment-repository';
import { recordActivity } from './activity-service';
import { addWatcher, isWatching } from './assignment-watchers-repository';
import { generateNotificationEvent } from './notification-event-service';
import { getPeopleByOrg } from './people-repository';
import type { AppRole } from '@/stores/role-store';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import { roleGrantsPermission } from '@releaseflow/core/auth/authorization';
import { PERMISSIONS } from '@releaseflow/core/auth/permissions';

/**
 * AUTH-001 — review management via permission matrix / AuthorizationService.
 * Prefer session AuthorizationService; optional AppRole maps through matrix only.
 */
export function canManageReview(role?: AppRole): boolean {
  if (role) {
    const roleId =
      role === 'admin' ? 'administrator'
        : role === 'release_manager' ? 'project_manager'
          : role;
    return roleGrantsPermission(roleId, PERMISSIONS.AssignmentManage)
      || roleGrantsPermission(roleId, PERMISSIONS.MediaReview);
  }
  return AuthorizationService.canManageAssignments()
    || AuthorizationService.canReviewAssignment();
}

/** Resolve Firebase/user ids to auto-watch for a new assignment. */
async function autoWatchDefaults(
  assignmentId: string,
  organizationId: string,
  assigneeId: string,
  assignerId: string,
): Promise<void> {
  const watchIds = new Set<string>([assigneeId, assignerId].filter(Boolean));

  try {
    const people = await getPeopleByOrg(organizationId);
    for (const p of people) {
      if (p.id === assigneeId || p.id === assignerId) {
        if (p.userId) watchIds.add(p.userId);
      }
    }
  } catch {
    // Best-effort; assignment still succeeds without watchers.
  }

  for (const userId of watchIds) {
    try {
      const already = await isWatching(assignmentId, userId);
      if (!already) await addWatcher(assignmentId, userId);
    } catch {
      // ignore individual watcher failures
    }
  }
}

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
  in_progress: ['review', 'blocked', 'cancelled', 'archived'],
  review: ['in_progress', 'completed', 'blocked', 'cancelled', 'archived'],
  completed: ['in_progress', 'archived'],
  blocked: ['in_progress', 'cancelled', 'archived'],
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

  // CE-006 — business logic emits events only (processor creates notifications)
  await generateNotificationEvent({
    type: 'assignment.assigned',
    organizationId: fields.organizationId,
    actorId: fields.assignerId,
    recipientId: fields.assigneeId,
    entityId: assignment.id,
    entityType: 'assignment',
    metadata: { title: fields.title },
  });

  // CE-005 — auto-watch assignee + creator (release manager typically the assigner)
  await autoWatchDefaults(
    assignment.id,
    fields.organizationId,
    fields.assigneeId,
    fields.assignerId,
  );

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

/**
 * CE-007 — Reschedule assignment due date (managers only).
 * Creates activity + notification events. Assignments remain source of truth.
 */
export async function rescheduleAssignment(
  assignmentId: string,
  newDueDate: Date,
  actorId: string,
  role: AppRole,
  opts?: { actorName?: string },
): Promise<void> {
  if (!canManageReview(role)) {
    throw new Error('Only managers can reschedule assignments');
  }
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');

  const oldDue = existing.dueDate;
  await repoUpdate(assignmentId, { dueDate: newDueDate });

  const oldLabel = oldDue
    ? (typeof oldDue === 'object' && oldDue !== null && 'toDate' in oldDue
      ? (oldDue as { toDate: () => Date }).toDate().toLocaleDateString()
      : String(oldDue))
    : 'none';
  const newLabel = newDueDate.toLocaleDateString();
  const by = opts?.actorName ?? actorId;

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'due_date.changed',
    details: `Due date changed from ${oldLabel} to ${newLabel} by ${by}`,
    metadata: {
      details: `Due date changed\nOld: ${oldLabel}\nNew: ${newLabel}\nBy: ${by}`,
      oldDueDate: oldLabel,
      newDueDate: newLabel,
      history: true,
    },
  });

  await generateNotificationEvent({
    type: 'assignment.rescheduled',
    organizationId: existing.organizationId,
    actorId,
    recipientId: existing.assigneeId,
    entityId: assignmentId,
    entityType: 'assignment',
    metadata: {
      oldDueDate: oldLabel,
      newDueDate: newLabel,
      title: existing.title,
    },
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

  await generateNotificationEvent({
    type: 'assignment.accepted',
    organizationId: existing.organizationId,
    actorId,
    recipientId: existing.assignerId,
    entityId: assignmentId,
    entityType: 'assignment',
  });
}

export async function declineUserAssignment(assignmentId: string, actorId: string, reason?: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (existing.assigneeId !== actorId) throw new Error('Only the assignee can decline');
  await repoDecline(assignmentId, reason);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'declined',
    details: reason ? `Assignment declined: ${reason}` : 'Assignment declined',
    metadata: reason ? { reason } : undefined,
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

export async function markAsStarted(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (existing.assigneeId !== actorId) throw new Error('Only the assignee can mark as started');
  await repoMarkStarted(assignmentId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'started',
    details: 'Assignment started',
  });

  await generateNotificationEvent({
    type: 'assignment.started',
    organizationId: existing.organizationId,
    actorId,
    recipientId: existing.assignerId,
    entityId: assignmentId,
    entityType: 'assignment',
  });
}

export async function submitForReviewAssignment(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (existing.assigneeId !== actorId) throw new Error('Only the assignee can submit for review');
  if (existing.status !== 'in_progress') {
    throw new Error('Only in-progress assignments can be submitted for review');
  }
  await repoSubmitForReview(assignmentId, actorId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'review.requested',
    details: 'Assignment submitted for review',
    metadata: { details: 'Review requested' },
  });

  await generateNotificationEvent({
    type: 'review.requested',
    organizationId: existing.organizationId,
    actorId,
    entityId: assignmentId,
    entityType: 'assignment',
    recipientId: existing.assignerId,
  });
}

export async function approveUserAssignment(
  assignmentId: string,
  actorId: string,
  role?: AppRole,
): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (existing.status !== 'review') throw new Error('Assignment is not awaiting review');
  if (role && !canManageReview(role)) {
    throw new Error('Only managers can approve assignments');
  }
  await repoApprove(assignmentId, actorId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'review.approved',
    details: 'Assignment approved and completed',
    metadata: { details: 'Assignment approved', outcome: 'approved' },
  });

  await generateNotificationEvent({
    type: 'review.approved',
    organizationId: existing.organizationId,
    actorId,
    entityId: assignmentId,
    entityType: 'assignment',
    recipientId: existing.assigneeId,
  });
}

export async function requestChangesUserAssignment(
  assignmentId: string,
  actorId: string,
  role: AppRole,
  notes?: string,
): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (existing.status !== 'review') throw new Error('Assignment is not awaiting review');
  if (!canManageReview(role)) {
    throw new Error('Only managers can request changes');
  }
  await repoRequestChanges(assignmentId, actorId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'review.changes_requested',
    details: notes
      ? `Changes requested: ${notes}`
      : 'Changes requested on assignment',
    metadata: { details: 'Changes requested', outcome: 'changes_requested', notes: notes ?? null },
  });

  await generateNotificationEvent({
    type: 'review.changes_requested',
    organizationId: existing.organizationId,
    actorId,
    entityId: assignmentId,
    entityType: 'assignment',
    recipientId: existing.assigneeId,
    metadata: notes ? { notes } : undefined,
  });
}

export async function rejectUserAssignment(
  assignmentId: string,
  actorId: string,
  role: AppRole,
  notes?: string,
): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  if (existing.status !== 'review') throw new Error('Assignment is not awaiting review');
  if (!canManageReview(role)) {
    throw new Error('Only managers can reject assignments');
  }
  await repoRejectReview(assignmentId, actorId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'review.rejected',
    details: notes ? `Assignment rejected: ${notes}` : 'Assignment rejected',
    metadata: { details: 'Assignment rejected', outcome: 'rejected', notes: notes ?? null },
  });

  await generateNotificationEvent({
    type: 'review.rejected',
    organizationId: existing.organizationId,
    actorId,
    entityId: assignmentId,
    entityType: 'assignment',
    recipientId: existing.assigneeId,
    metadata: notes ? { notes } : undefined,
  });
}

export async function blockUserAssignment(assignmentId: string, actorId: string, reason?: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoBlock(assignmentId, reason);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'blocked',
    details: reason ? `Assignment blocked: ${reason}` : 'Assignment blocked',
    metadata: reason ? { reason } : undefined,
  });
}

export async function unblockUserAssignment(assignmentId: string, actorId: string): Promise<void> {
  const existing = await repoGet(assignmentId);
  if (!existing) throw new Error('Assignment not found');
  await repoUnblock(assignmentId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId: existing.organizationId,
    actorId,
    action: 'unblocked',
    details: 'Assignment unblocked',
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
