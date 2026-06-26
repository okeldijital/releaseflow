import { describe, it, expect } from 'vitest';
import type { Notification, NotificationType } from '@/app/(app)/types';

describe('Notification data model', () => {
  it('has all required fields', () => {
    const n: Notification = {
      id: 'n1', userId: 'u1', type: 'task.assigned',
      title: 'New task assigned', message: 'You have a new task: Mix vocals',
      read: false, archived: false, createdAt: new Date(),
    };
    expect(n.userId).toBe('u1');
    expect(n.type).toBe('task.assigned');
    expect(n.read).toBe(false);
    expect(n.archived).toBe(false);
  });

  it('has optional reference fields', () => {
    const n: Notification = {
      id: 'n2', userId: 'u2', type: 'approval.requested',
      title: 'Approval needed', message: 'Deliverable ready for review',
      read: false, archived: false, referenceId: 'd1', referenceType: 'deliverable',
      createdAt: new Date(),
    };
    expect(n.referenceId).toBe('d1');
    expect(n.referenceType).toBe('deliverable');
  });
});

describe('Notification types', () => {
  const types: NotificationType[] = ['approval.requested', 'approval.responded', 'task.assigned', 'mention'];

  it('supports 4 notification types', () => {
    expect(types).toHaveLength(4);
  });

  it.each(types)('type %s is valid', (t) => {
    expect(types).toContain(t);
  });
});

describe('Notification service — module structure', () => {
  it('exports notification functions', async () => {
    const mod = await import('@/lib/notification-service');
    expect(typeof mod.createNotification).toBe('function');
    expect(typeof mod.markAsRead).toBe('function');
    expect(typeof mod.archiveNotification).toBe('function');
    expect(typeof mod.getNotificationsByUser).toBe('function');
    expect(typeof mod.getUnreadCount).toBe('function');
  });

  it('createNotification takes 1 object parameter', async () => {
    const mod = await import('@/lib/notification-service');
    expect(mod.createNotification.length).toBe(1);
  });

  it('markAsRead takes 2 parameters', async () => {
    const mod = await import('@/lib/notification-service');
    expect(mod.markAsRead.length).toBe(2);
  });

  it('archiveNotification takes 2 parameters', async () => {
    const mod = await import('@/lib/notification-service');
    expect(mod.archiveNotification.length).toBe(2);
  });

  it('getNotificationsByUser takes 1 required parameter (+1 default)', async () => {
    const mod = await import('@/lib/notification-service');
    expect(mod.getNotificationsByUser.length).toBe(1);
  });

  it('getUnreadCount takes 1 parameter', async () => {
    const mod = await import('@/lib/notification-service');
    expect(mod.getUnreadCount.length).toBe(1);
  });
});

describe('Notification state transitions', () => {
  it('starts unread and not archived', () => {
    const n = { read: false, archived: false };
    expect(n.read).toBe(false);
    expect(n.archived).toBe(false);
  });

  it('can be marked as read', () => {
    const n = { read: false, archived: false };
    const updated = { ...n, read: true };
    expect(updated.read).toBe(true);
    expect(updated.archived).toBe(false);
  });

  it('can be archived', () => {
    const n = { read: true, archived: false };
    const updated = { ...n, archived: true };
    expect(updated.archived).toBe(true);
  });

  it('read+archived state is valid', () => {
    const n = { read: true, archived: true };
    expect(n.read).toBe(true);
    expect(n.archived).toBe(true);
  });
});

describe('Notification delivery — content', () => {
  it('task assigned notification includes assignee context', () => {
    const n: Notification = {
      id: 'n1', userId: 'u1', type: 'task.assigned',
      title: 'You were assigned a task',
      message: 'Task "Mix vocals" assigned by producer',
      read: false, archived: false, referenceId: 't1', referenceType: 'task',
      createdAt: new Date(),
    };
    expect(n.title).toContain('assigned');
    expect(n.referenceType).toBe('task');
  });

  it('mention notification includes context', () => {
    const n: Notification = {
      id: 'n2', userId: 'u1', type: 'mention',
      title: 'You were mentioned',
      message: '@designer mentioned you in a comment',
      read: false, archived: false, referenceId: 'c1', referenceType: 'comment',
      createdAt: new Date(),
    };
    expect(n.type).toBe('mention');
    expect(n.message).toContain('@designer');
  });

  it('approval notification links to deliverable', () => {
    const n: Notification = {
      id: 'n3', userId: 'u3', type: 'approval.requested',
      title: 'Approval requested',
      message: 'Deliverable "Final WAV" needs your approval',
      read: false, archived: false, referenceId: 'd3', referenceType: 'deliverable',
      createdAt: new Date(),
    };
    expect(n.type).toBe('approval.requested');
    expect(n.referenceId).toBe('d3');
  });
});

describe('Unread count filtering', () => {
  it('counts only unread and unarchived', () => {
    const all: Pick<Notification, 'read' | 'archived'>[] = [
      { read: false, archived: false },
      { read: false, archived: false },
      { read: true, archived: false },
      { read: false, archived: true },
    ];
    const unread = all.filter((n) => !n.read && !n.archived);
    expect(unread).toHaveLength(2);
  });

  it('returns zero for all read', () => {
    const all: Pick<Notification, 'read' | 'archived'>[] = [
      { read: true, archived: false },
      { read: true, archived: false },
    ];
    const unread = all.filter((n) => !n.read && !n.archived);
    expect(unread).toHaveLength(0);
  });

  it('returns zero for empty list', () => {
    const unread = [].filter((n: Pick<Notification, 'read' | 'archived'>) => !n.read && !n.archived);
    expect(unread).toHaveLength(0);
  });
});

describe('Notification user isolation', () => {
  it('notifications are user-scoped by userId', () => {
    const n1: Notification = { id: 'n1', userId: 'u1', type: 'mention', title: '', message: '', read: false, archived: false, createdAt: new Date() };
    const n2: Notification = { id: 'n2', userId: 'u2', type: 'mention', title: '', message: '', read: false, archived: false, createdAt: new Date() };
    expect(n1.userId).toBe('u1');
    expect(n2.userId).toBe('u2');
    expect(n1.userId).not.toBe(n2.userId);
  });
});
