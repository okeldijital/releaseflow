import { createNotification, getNotificationsByUser, getUnreadCount } from '@/lib/notification-service';
import type { NotificationType, Notification } from '@/app/(app)/types';

function truncate(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

export async function notifyMention(
  mentionedPersonId: string,
  authorName: string,
  entityType: string,
  entityId: string,
  contentPreview: string,
) {
  return createNotification({
    userId: mentionedPersonId,
    type: 'mention' as NotificationType,
    title: `${authorName} mentioned you`,
    message: truncate(contentPreview),
    referenceId: entityId,
    referenceType: entityType,
  });
}

export async function notifyApprovalRequest(
  approverId: string,
  requesterName: string,
  entityType: string,
  entityId: string,
) {
  return createNotification({
    userId: approverId,
    type: 'approval' as NotificationType,
    title: 'Approval Requested',
    message: `${requesterName} requests your approval on ${entityType} ${entityId.slice(0, 8)}`,
    referenceId: entityId,
    referenceType: entityType,
  });
}

export async function notifyCommentReply(
  parentAuthorId: string,
  replierName: string,
  entityType: string,
  entityId: string,
) {
  return createNotification({
    userId: parentAuthorId,
    type: 'comment' as NotificationType,
    title: 'New Reply',
    message: `${replierName} replied to your comment on ${entityType} ${entityId.slice(0, 8)}`,
    referenceId: entityId,
    referenceType: entityType,
  });
}

export async function notifyAssignment(
  personId: string,
  assignedByName: string,
  entityType: string,
  entityId: string,
  role: string,
) {
  return createNotification({
    userId: personId,
    type: 'assignment' as NotificationType,
    title: 'New Assignment',
    message: `${assignedByName} assigned you as ${role} on ${entityType} ${entityId.slice(0, 8)}`,
    referenceId: entityId,
    referenceType: entityType,
  });
}

export async function notifyDeadline(
  userId: string,
  entityType: string,
  entityId: string,
  deadline: string,
) {
  return createNotification({
    userId,
    type: 'deadline' as NotificationType,
    title: 'Upcoming Deadline',
    message: `Deadline approaching for ${entityType} ${entityId.slice(0, 8)}: ${deadline}`,
    referenceId: entityId,
    referenceType: entityType,
  });
}

export interface InboxResult {
  unreadMentions: number;
  unreadMentionItems: Notification[];
  pendingApprovals: number;
  pendingApprovalItems: Notification[];
  recentCommentReplies: number;
  recentCommentReplyItems: Notification[];
  assignedReviews: number;
  assignedReviewItems: Notification[];
  totalUnread: number;
}

export async function getUserInbox(userId: string): Promise<InboxResult> {
  const [notifications, totalUnread] = await Promise.all([
    getNotificationsByUser(userId, 50),
    getUnreadCount(userId),
  ]);

  const unreadMentionItems = notifications.filter((n) => n.type === 'mention' && !n.read);
  const pendingApprovalItems = notifications.filter((n) => n.type === 'approval' && !n.read);
  const recentCommentReplyItems = notifications.filter((n) => n.type === 'comment' && !n.read);
  const assignedReviewItems = notifications.filter((n) => n.type === 'assignment' && !n.read);

  return {
    unreadMentions: unreadMentionItems.length,
    unreadMentionItems,
    pendingApprovals: pendingApprovalItems.length,
    pendingApprovalItems,
    recentCommentReplies: recentCommentReplyItems.length,
    recentCommentReplyItems,
    assignedReviews: assignedReviewItems.length,
    assignedReviewItems,
    totalUnread,
  };
}

export async function snoozeNotification(notificationId: string, snoozeUntil: Date) {
  const { getDb } = await import('@/lib/firebase');
  const { doc, updateDoc, Timestamp } = await import('firebase/firestore');

  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  await updateDoc(doc(db, 'notifications', notificationId), {
    archived: true,
    snoozedUntil: Timestamp.fromDate(snoozeUntil),
  });
}
