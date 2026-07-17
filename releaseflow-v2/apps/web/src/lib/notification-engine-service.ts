/**
 * NOT-001 / CE-006 — Public API for the Notification Center (user Inbox).
 * UI and badges use this layer; it never creates business events.
 *
 * Business Event → notification_events → processor → user_notifications
 */

import {
  listUserNotifications,
  getUnreadUserNotificationCount,
  markUserNotificationRead,
  markAllUserNotificationsRead,
  getUserNotification,
  subscribeUnreadCount,
  type UserNotificationRecord,
} from './user-notifications-repository';
import { processPendingEvents } from './notification-processor';
import { runDueReminderEngine } from './due-reminder-engine';
import {
  getNotificationCategory,
  resolveDeepLink,
  type NotificationCategory,
} from './notification-type-registry';
import type { QueryDocumentSnapshot, DocumentData, Unsubscribe } from '@firebase/firestore';

export type { UserNotificationRecord, NotificationCategory };

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
    /** NOT-001 — client-side category filter after fetch */
    category?: NotificationCategory | 'all';
  },
) {
  const page = await listUserNotifications(userId, opts);
  if (!opts?.category || opts.category === 'all') return page;
  const filtered = page.notifications.filter(
    (n) => getNotificationCategory(n.type) === opts.category,
  );
  return {
    ...page,
    notifications: filtered,
  };
}

export async function fetchUnreadBadgeCount(
  userId: string,
  organizationId?: string,
): Promise<number> {
  return getUnreadUserNotificationCount(userId, organizationId);
}

/** Live badge — prefer over poll when Firestore is available. */
export function subscribeInboxUnread(
  userId: string,
  onCount: (count: number) => void,
  organizationId?: string,
): Unsubscribe {
  return subscribeUnreadCount(userId, onCount, organizationId);
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

/**
 * NOT-001 deep link — contextual destination (assignment tab / release / track).
 */
export function notificationHref(n: UserNotificationRecord): string {
  if (n.assignmentId) {
    const isComment =
      typeof n.type === 'string'
      && (n.type.includes('comment') || n.type.includes('mention'));
    const isReview =
      typeof n.type === 'string' && n.type.startsWith('review.');
    if (isComment) return `/assignments/${n.assignmentId}?tab=comments`;
    if (isReview && (n.type.includes('requested') || n.type.includes('rejected') || n.type.includes('changes'))) {
      return `/assignments/${n.assignmentId}?tab=review`;
    }
    return `/assignments/${n.assignmentId}`;
  }
  if (n.entityType === 'assignment' && n.entityId) {
    return resolveDeepLink(n.type, n.entityType, n.entityId);
  }
  if (n.entityType === 'release' && n.entityId) {
    return `/releases/${n.entityId}`;
  }
  if (n.entityType === 'track' && n.entityId) {
    return `/tracks/${n.entityId}`;
  }
  return resolveDeepLink(n.type, n.entityType, n.entityId);
}

export function filterNotificationsByCategory(
  items: UserNotificationRecord[],
  category: NotificationCategory | 'all',
): UserNotificationRecord[] {
  if (category === 'all') return items;
  return items.filter((n) => getNotificationCategory(n.type) === category);
}
