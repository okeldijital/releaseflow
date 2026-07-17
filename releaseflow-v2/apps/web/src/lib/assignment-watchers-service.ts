import {
  addWatcher as repoAdd,
  removeWatcher as repoRemove,
  getWatchers as repoGetWatchers,
  isWatching as repoIsWatching,
  type AssignmentWatcherRecord,
} from './assignment-watchers-repository';
import { recordActivity } from './activity-service';
import { getAssignment } from './assignment-repository';
import { generateNotificationEvent } from './notification-event-service';

export type { AssignmentWatcherRecord };

export async function watchAssignment(
  assignmentId: string,
  userId: string,
  organizationId: string,
): Promise<void> {
  const assignment = await getAssignment(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  const already = await repoIsWatching(assignmentId, userId);
  if (already) return;

  await repoAdd(assignmentId, userId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId,
    actorId: userId,
    action: 'watcher.added',
    metadata: { details: 'Started watching assignment' },
  });

  await generateNotificationEvent({
    type: 'watcher.added',
    organizationId,
    actorId: userId,
    entityId: assignmentId,
    entityType: 'assignment',
  });
}

export async function unwatchAssignment(
  assignmentId: string,
  userId: string,
  organizationId: string,
): Promise<void> {
  const assignment = await getAssignment(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  const already = await repoIsWatching(assignmentId, userId);
  if (!already) return;

  await repoRemove(assignmentId, userId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId,
    actorId: userId,
    action: 'watcher.removed',
    metadata: { details: 'Stopped watching assignment' },
  });

  await generateNotificationEvent({
    type: 'watcher.removed',
    organizationId,
    actorId: userId,
    entityId: assignmentId,
    entityType: 'assignment',
  });
}

export async function getAssignmentWatchers(
  assignmentId: string,
): Promise<AssignmentWatcherRecord[]> {
  return repoGetWatchers(assignmentId);
}

export async function isWatchingAssignment(
  assignmentId: string,
  userId: string,
): Promise<boolean> {
  return repoIsWatching(assignmentId, userId);
}
