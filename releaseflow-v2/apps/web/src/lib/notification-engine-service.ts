/**
 * CE-006 — Public API for the in-app notification experience.
 * UI and badges use this layer; it never creates business events.
 */

import {
  listUserNotifications,
  getUnreadUserNotificationCount,
  markUserNotificationRead,
  markAllUserNotificationsRead,
  getUserNotification,
  type UserNotificationRecord,
} from './user-notifications-repository';
import { processPendingEvents } from './notification-processor';
import { runDueReminderEngine } from './due-reminder-engine';
import { resolveDeepLink } from './notification-type-registry';
import type { QueryDocumentSnapshot, DocumentData } from '@firebase/firestore';

export type { UserNotificationRecord };

export async function refreshNotificationPipeline(
  organizationId: string,
  actorId: string,
): Promise<void> {
  try {
    await runDueReminderEngine(organizationId, actorId);
  } catch {
    // reminders best-effort
  }
  try {
    await processPendingEvents(organizationId, 50);
  } catch {
    // processor best-effort
  }
}

export async function fetchInbox(
  userId: string,
  opts?: {
    organizationId?: string;
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData>;
  },
) {
  return listUserNotifications(userId, opts);
}

export async function fetchUnreadBadgeCount(
  userId: string,
  organizationId?: string,
): Promise<number> {
  return getUnreadUserNotificationCount(userId, organizationId);
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  const n = await getUserNotification(notificationId);
  if (!n) throw new Error('Notification not found');
  if (n.userId !== userId) throw new Error('Not your notification');
  await markUserNotificationRead(notificationId, userId);
}

export async function markAllNotificationsAsRead(
  userId: string,
  organizationId?: string,
): Promise<number> {
  return markAllUserNotificationsRead(userId, organizationId);
}

export function notificationHref(n: UserNotificationRecord): string {
  // MUX-002.6 — open context, not a generic dead-end
  if (n.assignmentId) {
    const isComment =
      typeof n.type === 'string'
      && (n.type.includes('comment') || n.type.includes('mention'));
    return isComment
      ? `/assignments/${n.assignmentId}?tab=comments`
      : `/assignments/${n.assignmentId}`;
  }
  if (n.entityType === 'assignment' && n.entityId) {
    return `/assignments/${n.entityId}`;
  }
  if (n.entityType === 'release' && n.entityId) {
    return `/releases/${n.entityId}`;
  }
  return resolveDeepLink(n.type, n.entityType, n.entityId);
}
