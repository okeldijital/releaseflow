/**
 * CE-008 — Wire offline queue ops to real services when online.
 */

import { registerOfflineHandler } from './sync-engine';
import { addAssignmentComment } from '@/lib/assignment-comments-service';
import { markUserNotificationRead } from '@/lib/user-notifications-repository';
import {
  submitForReviewAssignment,
  rescheduleAssignment,
  updateAssignmentStatus,
} from '@/lib/assignment-service';
import { watchAssignment, unwatchAssignment } from '@/lib/assignment-watchers-service';
import type { AppRole } from '@/stores/role-store';
import type { AssignmentStatus } from '@/lib/assignment-repository';

let registered = false;

export function registerDefaultOfflineHandlers(): void {
  if (registered) return;
  registered = true;

  registerOfflineHandler('comment', async (item) => {
    const p = item.payload;
    await addAssignmentComment(
      {
        assignmentId: String(p.assignmentId),
        organizationId: String(p.organizationId),
        authorId: String(p.authorId),
        authorName: String(p.authorName ?? 'Collaborator'),
        message: String(p.message),
        parentCommentId: (p.parentCommentId as string | null) ?? null,
        mentionedUserIds: (p.mentionedUserIds as string[]) ?? [],
      },
      (p.role as AppRole) ?? 'contributor',
    );
    return { ok: true };
  });

  registerOfflineHandler('reply', async (item) => {
    const p = item.payload;
    await addAssignmentComment(
      {
        assignmentId: String(p.assignmentId),
        organizationId: String(p.organizationId),
        authorId: String(p.authorId),
        authorName: String(p.authorName ?? 'Collaborator'),
        message: String(p.message),
        parentCommentId: String(p.parentCommentId),
        mentionedUserIds: (p.mentionedUserIds as string[]) ?? [],
      },
      (p.role as AppRole) ?? 'contributor',
    );
    return { ok: true };
  });

  registerOfflineHandler('mark_read', async (item) => {
    const p = item.payload;
    await markUserNotificationRead(String(p.notificationId), String(p.userId));
    return { ok: true };
  });

  registerOfflineHandler('review_request', async (item) => {
    const p = item.payload;
    try {
      await submitForReviewAssignment(String(p.assignmentId), String(p.actorId));
      return { ok: true };
    } catch (e) {
      const msg = (e as Error).message;
      // Server wins if state already moved
      if (/not found|not awaiting|only in-progress|Only the assignee/i.test(msg)) {
        return { ok: false, conflict: true, message: msg };
      }
      throw e;
    }
  });

  registerOfflineHandler('watch', async (item) => {
    const p = item.payload;
    await watchAssignment(String(p.assignmentId), String(p.userId), String(p.organizationId));
    return { ok: true };
  });

  registerOfflineHandler('unwatch', async (item) => {
    const p = item.payload;
    await unwatchAssignment(String(p.assignmentId), String(p.userId), String(p.organizationId));
    return { ok: true };
  });

  registerOfflineHandler('reschedule', async (item) => {
    const p = item.payload;
    try {
      await rescheduleAssignment(
        String(p.assignmentId),
        new Date(String(p.newDueDate)),
        String(p.actorId),
        (p.role as AppRole) ?? 'release_manager',
        { actorName: p.actorName as string | undefined },
      );
      return { ok: true };
    } catch (e) {
      const msg = (e as Error).message;
      if (/Only managers|not found/i.test(msg)) {
        return { ok: false, conflict: true, message: msg };
      }
      throw e;
    }
  });

  registerOfflineHandler('status_update', async (item) => {
    const p = item.payload;
    try {
      await updateAssignmentStatus(
        String(p.assignmentId),
        p.status as AssignmentStatus,
        String(p.actorId),
      );
      return { ok: true };
    } catch (e) {
      return { ok: false, conflict: true, message: (e as Error).message };
    }
  });
}
