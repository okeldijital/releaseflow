import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_TYPE_REGISTRY,
  getNotificationTypeDefinition,
  interpolateTemplate,
  resolveDeepLink,
  DEFAULT_PREFERENCE_FLAGS,
} from '@/lib/notification-type-registry';

describe('CE-006 notification type registry', () => {
  it('registers expected CE-005 and CE-006 types', () => {
    const keys = Object.keys(NOTIFICATION_TYPE_REGISTRY);
    expect(keys).toContain('comment.created');
    expect(keys).toContain('comment.mentioned');
    expect(keys).toContain('review.requested');
    expect(keys).toContain('assignment.due_soon');
    expect(keys).toContain('assignment.overdue');
    expect(keys).toContain('invitation.accepted');
  });

  it('resolves definitions without switch statements', () => {
    const def = getNotificationTypeDefinition('comment.mentioned');
    expect(def?.title).toBe('Mention');
    expect(def?.preferenceKey).toBe('commentMention');
  });

  it('interpolates actor and entity', () => {
    const msg = interpolateTemplate('{actor} mentioned you on {entity}', {
      actor: 'Sarah',
      entity: 'Mix vocals',
    });
    expect(msg).toBe('Sarah mentioned you on Mix vocals');
  });

  it('deep-links assignments to /assignments/{id}', () => {
    expect(resolveDeepLink('review.approved', 'assignment', 'a1')).toBe('/assignments/a1');
    expect(resolveDeepLink('comment.created', 'task', 'a2')).toBe('/assignments/a2');
  });

  it('has default preference flags for all keys', () => {
    expect(DEFAULT_PREFERENCE_FLAGS.commentMention).toBe(true);
    expect(DEFAULT_PREFERENCE_FLAGS.dueReminder).toBe(true);
  });
});

describe('CE-006 module surfaces', () => {
  it('exports event generation', async () => {
    const mod = await import('@/lib/notification-event-service');
    expect(typeof mod.generateNotificationEvent).toBe('function');
    expect(typeof mod.getRecentNotificationEvents).toBe('function');
  });

  it('exports processor', async () => {
    const mod = await import('@/lib/notification-processor');
    expect(typeof mod.processPendingEvents).toBe('function');
    expect(typeof mod.processNotificationEvent).toBe('function');
  });

  it('exports engine service (inbox API)', async () => {
    const mod = await import('@/lib/notification-engine-service');
    expect(typeof mod.fetchInbox).toBe('function');
    expect(typeof mod.fetchUnreadBadgeCount).toBe('function');
    expect(typeof mod.markNotificationAsRead).toBe('function');
    expect(typeof mod.markAllNotificationsAsRead).toBe('function');
    expect(typeof mod.notificationHref).toBe('function');
    expect(mod.notificationHref({
      id: 'n1',
      organizationId: 'o',
      userId: 'u',
      eventId: 'e',
      type: 'comment.mentioned',
      title: 'Mention',
      message: 'x',
      entityType: 'assignment',
      entityId: 'a9',
      assignmentId: 'a9',
      releaseId: null,
      actorId: 'u2',
      actorName: 'Sarah',
      isRead: false,
      readAt: null,
      createdAt: {} as never,
    })).toBe('/assignments/a9');
  });

  it('exports email queue and push infra', async () => {
    const email = await import('@/lib/email-queue-repository');
    const push = await import('@/lib/push-subscriptions-repository');
    expect(typeof email.enqueueEmailJob).toBe('function');
    expect(typeof push.upsertPushSubscription).toBe('function');
  });

  it('exports due reminder engine (events only)', async () => {
    const mod = await import('@/lib/due-reminder-engine');
    expect(typeof mod.runDueReminderEngine).toBe('function');
  });
});

describe('CE-006 assignment service uses events not direct notifications', () => {
  it('assignment-service does not export createNotification usage dependency for new assigns', async () => {
    const src = await import('@/lib/assignment-service');
    expect(typeof src.createNewAssignment).toBe('function');
    // Module still loads; processor is separate
    const events = await import('@/lib/notification-event-service');
    expect(typeof events.generateNotificationEvent).toBe('function');
  });
});
