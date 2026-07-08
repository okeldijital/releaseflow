import {
  createNotification as repoCreate,
  getNotification as repoGet,
  getUserNotifications,
  markNotificationRead as repoMarkRead,
  archiveNotification as repoArchive,
  getUnreadNotificationCount,
  getNotificationsByOrg,
} from './notification-repository';
import { recordActivity } from './activity-service';
import type { NotificationType, NotificationStatus } from '@/app/(app)/types';
import type { NotificationRecord } from './notification-repository';

export type { NotificationRecord };
export { markNotificationsSent, deleteNotification } from './notification-repository';

export async function createNotification(fields: {
  organizationId?: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId?: string;
  recipientEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string;
  referenceId?: string;
  referenceType?: string;
  releaseId?: string;
}): Promise<NotificationRecord> {
  const recipientId = fields.recipientId || fields.userId || '';
  const orgId = fields.organizationId || '';

  if (!recipientId) throw new Error('Notification recipientId is required');
  if (!fields.title.trim()) throw new Error('Notification title is required');

  const notification = await repoCreate({
    organizationId: orgId,
    type: fields.type,
    title: fields.title,
    message: fields.message,
    recipientId,
    recipientEmail: fields.recipientEmail ?? null,
    entityType: fields.entityType ?? fields.referenceType ?? null,
    entityId: fields.entityId ?? fields.referenceId ?? null,
  });

  if (orgId) {
    await recordActivity({
      entityType: 'comment',
      entityId: notification.id,
      organizationId: orgId,
      actorId: recipientId,
      action: 'notification.created',
      details: `Notification "${fields.title}" created for user ${recipientId}`,
    });
  }

  return notification;
}

export async function markAsRead(notificationId: string, actorId: string): Promise<void> {
  const existing = await repoGet(notificationId);
  if (!existing) throw new Error('Notification not found');
  if (existing.status === 'archived') throw new Error('Cannot mark archived notification as read');

  await repoMarkRead(notificationId);

  await recordActivity({
    entityType: 'comment',
    entityId: notificationId,
    organizationId: existing.organizationId,
    actorId,
    action: 'notification.read',
  });
}

export async function archiveUserNotification(notificationId: string, actorId: string): Promise<void> {
  const existing = await repoGet(notificationId);
  if (!existing) throw new Error('Notification not found');

  await repoArchive(notificationId);

  await recordActivity({
    entityType: 'comment',
    entityId: notificationId,
    organizationId: existing.organizationId,
    actorId,
    action: 'notification.archived',
  });
}

export async function fetchUserNotifications(
  recipientId: string,
  opts?: { maxCount?: number; status?: NotificationStatus },
): Promise<NotificationRecord[]> {
  return getUserNotifications(recipientId, opts);
}

export async function fetchOrgNotifications(orgId: string, maxCount = 50): Promise<NotificationRecord[]> {
  return getNotificationsByOrg(orgId, maxCount);
}

export async function fetchUnreadCount(recipientId: string): Promise<number> {
  return getUnreadNotificationCount(recipientId);
}
