import {
  createNotification,
  fetchUserNotifications,
  fetchUnreadCount,
} from './notification-service';
import type { NotificationType } from '@/app/(app)/types';
import type { NotificationRecord } from './notification-repository';

function truncate(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

export async function notifyMention(
  orgId: string,
  mentionedPersonId: string,
  authorName: string,
  entityType: string,
  entityId: string,
  contentPreview: string,
) {
  return createNotification({
    organizationId: orgId,
    recipientId: mentionedPersonId,
    type: 'mention' as NotificationType,
    title: `${authorName} mentioned you`,
    message: truncate(contentPreview),
    entityType,
    entityId,
  });
}

export async function notifyApprovalRequest(
  orgId: string,
  approverId: string,
  requesterName: string,
  entityType: string,
  entityId: string,
) {
  return createNotification({
    organizationId: orgId,
    recipientId: approverId,
    type: 'approval' as NotificationType,
    title: 'Approval Requested',
    message: `${requesterName} requests your approval on ${entityType}`,
    entityType,
    entityId,
  });
}

export async function notifyCommentReply(
  orgId: string,
  parentAuthorId: string,
  replierName: string,
  entityType: string,
  entityId: string,
) {
  return createNotification({
    organizationId: orgId,
    recipientId: parentAuthorId,
    type: 'comment' as NotificationType,
    title: 'New Reply',
    message: `${replierName} replied to your comment on ${entityType}`,
    entityType,
    entityId,
  });
}

export async function notifyAssignment(
  orgId: string,
  personId: string,
  assignedByName: string,
  entityType: string,
  entityId: string,
  role: string,
) {
  return createNotification({
    organizationId: orgId,
    recipientId: personId,
    type: 'assignment' as NotificationType,
    title: 'New Assignment',
    message: `${assignedByName} assigned you as ${role} on ${entityType}`,
    entityType,
    entityId,
  });
}

export async function notifyDeadline(
  orgId: string,
  userId: string,
  entityType: string,
  entityId: string,
  deadline: string,
) {
  return createNotification({
    organizationId: orgId,
    recipientId: userId,
    type: 'deadline' as NotificationType,
    title: 'Upcoming Deadline',
    message: `Deadline approaching for ${entityType}: ${deadline}`,
    entityType,
    entityId,
  });
}

export async function notifyReleaseReminder(
  orgId: string,
  recipientId: string,
  releaseTitle: string,
  releaseId: string,
  daysUntil: number,
) {
  return createNotification({
    organizationId: orgId,
    recipientId,
    type: 'release_reminder' as NotificationType,
    title: 'Release Reminder',
    message: `"${releaseTitle}" releases in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
    entityType: 'release',
    entityId: releaseId,
  });
}

export async function notifyInvitation(
  orgId: string,
  recipientId: string,
  inviterName: string,
) {
  return createNotification({
    organizationId: orgId,
    recipientId,
    type: 'invitation' as NotificationType,
    title: 'Organization Invitation',
    message: `${inviterName} invited you to join the organization`,
  });
}

export async function notifySystem(
  orgId: string,
  recipientId: string,
  title: string,
  message: string,
) {
  return createNotification({
    organizationId: orgId,
    recipientId,
    type: 'system' as NotificationType,
    title,
    message,
  });
}

export interface InboxResult {
  unreadMentions: number;
  unreadMentionItems: NotificationRecord[];
  pendingApprovals: number;
  pendingApprovalItems: NotificationRecord[];
  recentCommentReplies: number;
  recentCommentReplyItems: NotificationRecord[];
  assignedReviews: number;
  assignedReviewItems: NotificationRecord[];
  invitations: number;
  invitationItems: NotificationRecord[];
  totalUnread: number;
}

export async function getUserInbox(userId: string): Promise<InboxResult> {
  const [notifications, totalUnread] = await Promise.all([
    fetchUserNotifications(userId, { maxCount: 50 }),
    fetchUnreadCount(userId),
  ]);

  const unreadItems = notifications.filter((n) => n.status === 'unread');
  const unreadMentionItems = unreadItems.filter((n) => n.type === 'mention');
  const pendingApprovalItems = unreadItems.filter((n) => n.type === 'approval');
  const recentCommentReplyItems = unreadItems.filter((n) => n.type === 'comment');
  const assignedReviewItems = unreadItems.filter((n) => n.type === 'assignment');
  const invitationItems = unreadItems.filter((n) => n.type === 'invitation');

  return {
    unreadMentions: unreadMentionItems.length,
    unreadMentionItems,
    pendingApprovals: pendingApprovalItems.length,
    pendingApprovalItems,
    recentCommentReplies: recentCommentReplyItems.length,
    recentCommentReplyItems,
    assignedReviews: assignedReviewItems.length,
    assignedReviewItems,
    invitations: invitationItems.length,
    invitationItems,
    totalUnread,
  };
}
