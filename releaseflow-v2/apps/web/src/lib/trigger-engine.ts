import { createNotification } from './notification-service';
import { recordActivity } from './activity-service';
import { sendEmail, buildEmailParams } from './email/email-service';
import { renderAssignmentEmail } from './email/templates/AssignmentEmail';

export interface TriggerEvent {
  type: 'invitation' | 'assignment' | 'comment' | 'approval'
      | 'review_request' | 'release_due' | 'release_published'
      | 'password_reset' | 'verification';
  organizationId: string;
  actorId: string;
  recipientId: string;
  recipientEmail?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, string>;
}

export async function processTriggerEvent(event: TriggerEvent): Promise<void> {
  switch (event.type) {
    case 'assignment':
      await handleAssignment(event);
      break;
    case 'review_request':
      await handleReviewRequest(event);
      break;
    case 'approval':
      await handleApproval(event);
      break;
    case 'comment':
      await handleComment(event);
      break;
    case 'release_due':
      await handleReleaseDue(event);
      break;
    case 'release_published':
      await handleReleasePublished(event);
      break;
    case 'password_reset':
    case 'verification':
      break;
    default:
      break;
  }
}

async function handleAssignment(event: TriggerEvent) {
  const entityLabel = event.metadata?.entityTitle || event.entityId || '';
  const role = event.metadata?.role || 'member';

  const notification = await createNotification({
    organizationId: event.organizationId,
    type: 'assignment',
    title: 'New Assignment',
    message: `You were assigned as ${role} on ${entityLabel}`,
    recipientId: event.recipientId,
    recipientEmail: event.recipientEmail,
    entityType: event.entityType,
    entityId: event.entityId,
  });

  await recordActivity({
    entityType: 'comment',
    entityId: notification.id,
    organizationId: event.organizationId,
    actorId: event.actorId,
    action: 'notification.created',
    details: `Assignment notification sent to ${event.recipientId}`,
  });

  if (event.recipientEmail) {
    try {
      sendEmail(buildEmailParams(
        event.recipientEmail,
        'New Assignment on ReleaseFlow',
        renderAssignmentEmail({
          assignedByName: event.metadata?.actorName || 'A user',
          entityType: event.entityType || 'item',
          entityTitle: entityLabel,
          role,
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${event.entityType || 'dashboard'}/${event.entityId || ''}`,
        }),
      ));
    } catch (err) {
      console.error('[TriggerEngine] Failed to send assignment email:', err);
    }
  }
}

async function handleReviewRequest(event: TriggerEvent) {
  const entityLabel = event.metadata?.entityTitle || event.entityId || '';

  const notification = await createNotification({
    organizationId: event.organizationId,
    type: 'review_request',
    title: 'Review Requested',
    message: `Your review is requested on ${entityLabel}`,
    recipientId: event.recipientId,
    recipientEmail: event.recipientEmail,
    entityType: event.entityType,
    entityId: event.entityId,
  });

  await recordActivity({
    entityType: 'comment',
    entityId: notification.id,
    organizationId: event.organizationId,
    actorId: event.actorId,
    action: 'notification.created',
    details: `Review request notification sent to ${event.recipientId}`,
  });

  if (event.recipientEmail) {
    try {
      sendEmail(buildEmailParams(
        event.recipientEmail,
        'Review Requested on ReleaseFlow',
        `<div style="max-width:560px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;font-family:sans-serif">
<div style="text-align:center;padding:12px 0"><img src="${process.env.NEXT_PUBLIC_APP_URL || ''}/icons/ReleaseFlow-Logo.svg" width="96" height="96" alt="ReleaseFlow" style="display:inline-block;width:96px;height:auto;border:0"/></div>
<div style="padding:32px 0 16px;text-align:center"><h1 style="font-size:24px;font-weight:700;color:#1a1a2e;margin:0 0 8px">Review Requested</h1></div>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px">${event.metadata?.actorName || 'A user'} is requesting your review on <strong>${entityLabel}</strong> (${event.entityType || 'item'}).</p>
<div style="text-align:center;margin:0 0 24px"><a href="${`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${event.entityType || 'dashboard'}/${event.entityId || ''}`}" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Review Now</a></div>
<div style="padding:24px 0;text-align:center;border-top:1px solid #e5e7eb;margin-top:24px"><p style="font-size:12px;color:#9ca3af;margin:0">&mdash; ReleaseFlow</p></div>
</div>`,
      ));
    } catch (err) {
      console.error('[TriggerEngine] Failed to send review request email:', err);
    }
  }
}

async function handleApproval(event: TriggerEvent) {
  const entityLabel = event.metadata?.entityTitle || event.entityId || '';

  await createNotification({
    organizationId: event.organizationId,
    type: 'approval',
    title: 'Approval Requested',
    message: `Your approval is needed on ${entityLabel}`,
    recipientId: event.recipientId,
    recipientEmail: event.recipientEmail,
    entityType: event.entityType,
    entityId: event.entityId,
  });
}

async function handleComment(event: TriggerEvent) {
  const entityLabel = event.metadata?.entityTitle || event.entityId || '';

  await createNotification({
    organizationId: event.organizationId,
    type: 'comment',
    title: 'New Comment',
    message: `${event.metadata?.authorName || 'Someone'} commented on ${entityLabel}`,
    recipientId: event.recipientId,
    recipientEmail: event.recipientEmail,
    entityType: event.entityType,
    entityId: event.entityId,
  });
}

async function handleReleaseDue(event: TriggerEvent) {
  const title = event.metadata?.releaseTitle || 'A release';

  await createNotification({
    organizationId: event.organizationId,
    type: 'release_reminder',
    title: 'Release Due Soon',
    message: `"${title}" is due soon`,
    recipientId: event.recipientId,
    recipientEmail: event.recipientEmail,
    entityType: 'release',
    entityId: event.entityId,
  });
}

async function handleReleasePublished(event: TriggerEvent) {
  const title = event.metadata?.releaseTitle || 'A release';

  await createNotification({
    organizationId: event.organizationId,
    type: 'release_reminder',
    title: 'Release Published',
    message: `"${title}" has been published`,
    recipientId: event.recipientId,
    recipientEmail: event.recipientEmail,
    entityType: 'release',
    entityId: event.entityId,
  });
}
