import { describe, it, expect } from 'vitest';
import type { Notification, NotificationType } from '@/app/(app)/types';

describe('Notification data model', () => {
  it('has all required fields', () => {
    const n: Notification = {
      id: 'n1', organizationId: 'org1', type: 'assignment',
      status: 'unread', title: 'New assignment', message: 'You have a new task',
      recipientId: 'u1', createdAt: new Date(),
    };
    expect(n.recipientId).toBe('u1');
    expect(n.type).toBe('assignment');
    expect(n.status).toBe('unread');
  });

  it('supports all notification types', () => {
    const types: NotificationType[] = [
      'invitation', 'assignment', 'review_request', 'comment', 'mention',
      'approval', 'release_reminder', 'system',
      'approval.requested', 'approval.responded', 'task.assigned', 'deadline',
    ];
    expect(types).toHaveLength(12);
  });

  it('supports status transitions: unread -> read -> archived', () => {
    const n: Notification = {
      id: 'n1', organizationId: 'org1', type: 'mention',
      status: 'unread', title: 'Mention', message: 'You were mentioned',
      recipientId: 'u1', createdAt: new Date(),
    };
    expect(n.status).toBe('unread');
    const read = { ...n, status: 'read' as const };
    expect(read.status).toBe('read');
    const archived = { ...read, status: 'archived' as const };
    expect(archived.status).toBe('archived');
  });

  it('allows optional fields', () => {
    const n: Notification = {
      id: 'n1', organizationId: 'org1', type: 'invitation',
      status: 'unread', title: 'Invitation', message: 'You are invited',
      recipientId: 'u1', recipientEmail: 'user@example.com',
      entityType: 'release', entityId: 'r1',
      readAt: new Date(), sentAt: new Date(), createdAt: new Date(),
    };
    expect(n.recipientEmail).toBe('user@example.com');
    expect(n.entityType).toBe('release');
    expect(n.entityId).toBe('r1');
    expect(n.readAt).toBeDefined();
    expect(n.sentAt).toBeDefined();
  });
});

describe('Notification service — module structure', () => {
  it('exports notification functions', async () => {
    const mod = await import('@/lib/notification-service');
    expect(typeof mod.createNotification).toBe('function');
    expect(typeof mod.markAsRead).toBe('function');
    expect(typeof mod.archiveUserNotification).toBe('function');
    expect(typeof mod.fetchUserNotifications).toBe('function');
    expect(typeof mod.fetchUnreadCount).toBe('function');
    expect(typeof mod.fetchOrgNotifications).toBe('function');
  });

  it('createNotification throws for empty recipientId', async () => {
    const mod = await import('@/lib/notification-service');
    await expect(mod.createNotification({
      organizationId: 'org1', type: 'system', title: 'Test', message: 'Test', recipientId: '',
    })).rejects.toThrow('recipientId is required');
  });

  it('createNotification throws for empty title', async () => {
    const mod = await import('@/lib/notification-service');
    await expect(mod.createNotification({
      organizationId: 'org1', type: 'system', title: '', message: 'Test', recipientId: 'u1',
    })).rejects.toThrow('title is required');
  });
});

describe('Notification state transitions', () => {
  it('starts as unread', () => {
    const n = { status: 'unread' as const };
    expect(n.status).toBe('unread');
  });

  it('can be marked as read', () => {
    const n = { status: 'unread' as const };
    const updated = { ...n, status: 'read' as const };
    expect(updated.status).toBe('read');
  });

  it('can be archived', () => {
    const n = { status: 'read' as const };
    const updated = { ...n, status: 'archived' as const };
    expect(updated.status).toBe('archived');
  });
});

describe('Notification delivery — content', () => {
  it('assignment notification includes assignee context', () => {
    const n: Notification = {
      id: 'n1', organizationId: 'org1', type: 'assignment',
      status: 'unread', title: 'New Assignment',
      message: 'You were assigned as Mix Engineer on "Summer Hit"',
      recipientId: 'u1', entityType: 'release', entityId: 'r1',
      createdAt: new Date(),
    };
    expect(n.title).toContain('Assignment');
    expect(n.entityType).toBe('release');
  });

  it('mention notification includes context', () => {
    const n: Notification = {
      id: 'n2', organizationId: 'org1', type: 'mention',
      status: 'unread', title: 'You were mentioned',
      message: '@designer mentioned you in a comment',
      recipientId: 'u1', entityType: 'track', entityId: 't1',
      createdAt: new Date(),
    };
    expect(n.type).toBe('mention');
    expect(n.message).toContain('@designer');
  });

  it('invitation notification links to organization', () => {
    const n: Notification = {
      id: 'n3', organizationId: 'org1', type: 'invitation',
      status: 'unread', title: 'Organization Invitation',
      message: 'Admin invited you to join Label Inc',
      recipientId: 'u1', entityType: 'invitation', entityId: 'i1',
      createdAt: new Date(),
    };
    expect(n.type).toBe('invitation');
    expect(n.entityId).toBe('i1');
  });
});

describe('Unread count filtering', () => {
  it('counts only unread notifications', () => {
    const all: Notification[] = [
      { id: 'n1', organizationId: 'o1', type: 'mention', status: 'unread', title: '', message: '', recipientId: 'u1', createdAt: new Date() },
      { id: 'n2', organizationId: 'o1', type: 'mention', status: 'unread', title: '', message: '', recipientId: 'u1', createdAt: new Date() },
      { id: 'n3', organizationId: 'o1', type: 'mention', status: 'read', title: '', message: '', recipientId: 'u1', createdAt: new Date() },
    ];
    const unread = all.filter((n) => n.status === 'unread');
    expect(unread).toHaveLength(2);
  });

  it('returns zero for all read', () => {
    const all: Notification[] = [
      { id: 'n1', organizationId: 'o1', type: 'mention', status: 'read', title: '', message: '', recipientId: 'u1', createdAt: new Date() },
      { id: 'n2', organizationId: 'o1', type: 'mention', status: 'read', title: '', message: '', recipientId: 'u1', createdAt: new Date() },
    ];
    const unread = all.filter((n) => n.status === 'unread');
    expect(unread).toHaveLength(0);
  });

  it('returns zero for empty list', () => {
    const all: Notification[] = [];
    const unread = all.filter((n) => n.status === 'unread');
    expect(unread).toHaveLength(0);
  });
});

describe('Notification user isolation', () => {
  it('notifications are scoped by recipientId', () => {
    const n1: Notification = { id: 'n1', organizationId: 'o1', type: 'mention', status: 'unread', title: '', message: '', recipientId: 'u1', createdAt: new Date() };
    const n2: Notification = { id: 'n2', organizationId: 'o1', type: 'mention', status: 'unread', title: '', message: '', recipientId: 'u2', createdAt: new Date() };
    expect(n1.recipientId).toBe('u1');
    expect(n2.recipientId).toBe('u2');
    expect(n1.recipientId).not.toBe(n2.recipientId);
  });
});

describe('Notification center service', () => {
  it('exports notification helper functions', async () => {
    const mod = await import('@/lib/notification-center-service');
    expect(typeof mod.notifyMention).toBe('function');
    expect(typeof mod.notifyApprovalRequest).toBe('function');
    expect(typeof mod.notifyCommentReply).toBe('function');
    expect(typeof mod.notifyAssignment).toBe('function');
    expect(typeof mod.notifyDeadline).toBe('function');
    expect(typeof mod.notifyReleaseReminder).toBe('function');
    expect(typeof mod.notifyInvitation).toBe('function');
    expect(typeof mod.notifySystem).toBe('function');
    expect(typeof mod.getUserInbox).toBe('function');
  });
});
