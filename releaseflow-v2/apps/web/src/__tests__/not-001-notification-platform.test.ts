/**
 * NOT-001 — Unified Notification Platform
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  NOTIFICATION_TYPE_REGISTRY,
  getNotificationTypeDefinition,
  getNotificationCategory,
  resolveDeepLink,
  interpolateTemplate,
  DEFAULT_PREFERENCE_FLAGS,
  INBOX_FILTERS,
} from '@/lib/notification-type-registry';
import { getRecipientRolesForType } from '@/lib/notification-processor';
import { notificationHref, filterNotificationsByCategory } from '@/lib/notification-engine-service';
import type { UserNotificationRecord } from '@/lib/user-notifications-repository';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

function stubNotification(partial: Partial<UserNotificationRecord>): UserNotificationRecord {
  return {
    id: 'n1',
    organizationId: 'o',
    userId: 'u',
    eventId: 'e',
    type: 'comment.created',
    title: 'New Comment',
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
    deliveryStatus: 'delivered',
    channels: { inApp: true, emailQueued: false, pushQueued: false },
    ...partial,
  };
}

describe('NOT-001 type registry', () => {
  it('registers full assignment lifecycle', () => {
    for (const key of [
      'assignment.assigned',
      'assignment.accepted',
      'assignment.started',
      'assignment.completed',
      'assignment.reassigned',
      'assignment.archived',
    ] as const) {
      expect(NOTIFICATION_TYPE_REGISTRY[key]).toBeDefined();
    }
  });

  it('registers release events', () => {
    for (const key of [
      'release.created',
      'release.date_changed',
      'release.approved',
      'release.published',
      'release.delayed',
    ] as const) {
      expect(NOTIFICATION_TYPE_REGISTRY[key]).toBeDefined();
    }
  });

  it('maps categories for inbox filters', () => {
    expect(getNotificationCategory('assignment.completed')).toBe('assignment');
    expect(getNotificationCategory('comment.created')).toBe('comment');
    expect(getNotificationCategory('release.published')).toBe('release');
    expect(getNotificationCategory('assignment.due_today')).toBe('schedule');
    expect(INBOX_FILTERS.map((f) => f.id)).toContain('all');
    expect(INBOX_FILTERS.map((f) => f.id)).toContain('comment');
  });

  it('marks important types for email and not every status change', () => {
    expect(getNotificationTypeDefinition('assignment.assigned')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('assignment.completed')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('assignment.started')?.emailImportant).toBe(false);
    // NOT-002 — comments are email-eligible
    expect(getNotificationTypeDefinition('comment.created')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('assignment.overdue')?.emailImportant).toBe(true);
  });

  it('deep-links comments to comments tab', () => {
    expect(resolveDeepLink('comment.created', 'assignment', 'a1')).toBe(
      '/assignments/a1?tab=comments',
    );
    expect(resolveDeepLink('review.requested', 'assignment', 'a1')).toBe(
      '/assignments/a1?tab=review',
    );
  });

  it('has preference defaults including lifecycle + release', () => {
    expect(DEFAULT_PREFERENCE_FLAGS.assignmentLifecycle).toBe(true);
    expect(DEFAULT_PREFERENCE_FLAGS.releaseUpdates).toBe(true);
  });
});

describe('NOT-001 recipient matrix', () => {
  it('assignment created → assignee only roles', () => {
    expect(getRecipientRolesForType('assignment.assigned')).toEqual(
      expect.arrayContaining(['assignee', 'explicit']),
    );
  });

  it('accepted / started / completed → assigner + watchers', () => {
    for (const t of ['assignment.accepted', 'assignment.started', 'assignment.completed']) {
      const roles = getRecipientRolesForType(t);
      expect(roles).toContain('assigner');
      expect(roles).toContain('watchers');
    }
  });

  it('reassigned → old + new + assigner', () => {
    const roles = getRecipientRolesForType('assignment.reassigned');
    expect(roles).toEqual(
      expect.arrayContaining(['old_assignee', 'new_assignee', 'assigner']),
    );
  });

  it('archived → watchers', () => {
    expect(getRecipientRolesForType('assignment.archived')).toEqual(['watchers']);
  });

  it('comments → assignee + assigner + watchers (not author — processor excludes actor)', () => {
    const roles = getRecipientRolesForType('comment.created');
    expect(roles).toEqual(
      expect.arrayContaining(['assignee', 'assigner', 'watchers']),
    );
  });

  it('mentions → explicit only', () => {
    expect(getRecipientRolesForType('comment.mentioned')).toEqual(['explicit']);
  });
});

describe('NOT-001 engine API', () => {
  it('notificationHref opens comments tab for comment events', () => {
    expect(notificationHref(stubNotification({ type: 'comment.created' }))).toBe(
      '/assignments/a9?tab=comments',
    );
  });

  it('notificationHref opens assignment for lifecycle', () => {
    expect(
      notificationHref(stubNotification({ type: 'assignment.completed', title: 'Done' })),
    ).toBe('/assignments/a9');
  });

  it('filters by category', () => {
    const items = [
      stubNotification({ id: '1', type: 'comment.created' }),
      stubNotification({ id: '2', type: 'assignment.completed' }),
      stubNotification({ id: '3', type: 'release.published', entityType: 'release', entityId: 'r1', assignmentId: null }),
    ];
    expect(filterNotificationsByCategory(items, 'comment')).toHaveLength(1);
    expect(filterNotificationsByCategory(items, 'assignment')).toHaveLength(1);
    expect(filterNotificationsByCategory(items, 'release')).toHaveLength(1);
    expect(filterNotificationsByCategory(items, 'all')).toHaveLength(3);
  });

  it('exports push queue and processor surfaces', async () => {
    const push = await import('@/lib/push-queue-repository');
    const proc = await import('@/lib/notification-processor');
    expect(typeof push.enqueuePushJob).toBe('function');
    expect(typeof proc.processPendingEvents).toBe('function');
    expect(typeof proc.resolveRecipientUserIds).toBe('function');
  });
});

describe('NOT-001 domain wiring', () => {
  it('assignment-service emits completed / reassigned / archived events', () => {
    const src = read('lib/assignment-service.ts');
    expect(src).toContain("type: 'assignment.completed'");
    expect(src).toContain("type: 'assignment.reassigned'");
    expect(src).toContain("type: 'assignment.archived'");
    expect(src).toContain('oldAssigneeId');
  });

  it('inbox page uses category filters', () => {
    const page = read('app/(app)/notifications/page.tsx');
    expect(page).toContain('INBOX_FILTERS');
    expect(page).toContain('Inbox');
    expect(page).toContain('filterNotificationsByCategory');
  });

  it('badge uses live subscription', () => {
    const hook = read('hooks/useNotificationBadge.ts');
    expect(hook).toContain('subscribeInboxUnread');
  });

  it('interpolate still works', () => {
    expect(
      interpolateTemplate('{actor} completed: {entity}', {
        actor: 'Kinn',
        entity: 'Cover art',
      }),
    ).toBe('Kinn completed: Cover art');
  });
});
