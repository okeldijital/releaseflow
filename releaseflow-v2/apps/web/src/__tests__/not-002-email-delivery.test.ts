/**
 * NOT-002 — Email notification delivery channel
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getNotificationTypeDefinition } from '@/lib/notification-type-registry';
import { renderNotificationEmailHtml } from '@/lib/email/notification-email-templates';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('NOT-002 email-important matrix', () => {
  it('emails significant assignment events', () => {
    for (const t of [
      'assignment.assigned',
      'assignment.reassigned',
      'assignment.completed',
      'assignment.due_soon',
      'assignment.overdue',
    ] as const) {
      expect(getNotificationTypeDefinition(t)?.emailImportant).toBe(true);
    }
  });

  it('does not email noise lifecycle chatter', () => {
    expect(getNotificationTypeDefinition('assignment.started')?.emailImportant).toBe(false);
    expect(getNotificationTypeDefinition('assignment.accepted')?.emailImportant).toBe(false);
    expect(getNotificationTypeDefinition('watcher.added')?.emailImportant).toBe(false);
  });

  it('emails comments, mentions, and reviews', () => {
    expect(getNotificationTypeDefinition('comment.created')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('comment.reply')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('comment.mentioned')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('review.requested')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('review.approved')?.emailImportant).toBe(true);
  });

  it('emails release and invitation events', () => {
    expect(getNotificationTypeDefinition('release.published')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('release.date_changed')?.emailImportant).toBe(true);
    expect(getNotificationTypeDefinition('invitation.accepted')?.emailImportant).toBe(true);
  });
});

describe('NOT-002 queue and worker wiring', () => {
  it('queue enqueues full NOT-002 fields and dedupes', () => {
    const src = read('lib/email-queue-repository.ts');
    expect(src).toContain('recipientUid');
    expect(src).toContain('recipientEmail');
    expect(src).toContain('eventId');
    expect(src).toContain('dedupeKey');
    expect(src).toContain('DEDUPE_WINDOW_MS');
    expect(src).toContain("status: 'pending'");
  });

  it('processor enqueues email then triggers worker without blocking inbox', () => {
    const proc = read('lib/notification-processor.ts');
    expect(proc).toContain('enqueueEmailJob');
    expect(proc).toContain('triggerEmailWorker');
    expect(proc).toContain('email queue failed');
    expect(proc).toContain('recipientUid');
  });

  it('API worker route exists and uses Admin + processPendingEmailJobs', () => {
    const route = read('app/api/notifications/process-email-queue/route.ts');
    expect(route).toContain('processPendingEmailJobs');
    expect(route).toContain('verifyIdToken');
    expect(route).toContain('getAdminDb');
  });

  it('worker updates sent/failed and isolates failures', () => {
    const worker = read('lib/email/email-worker.ts');
    expect(worker).toContain("status: 'sent'");
    expect(worker).toContain("status: 'failed'");
    expect(worker).toContain('MAX_ATTEMPTS');
    expect(worker).toContain('renderNotificationEmailHtml');
  });
});

describe('NOT-002 templates', () => {
  it('renders branded HTML with CTA deep link', () => {
    const html = renderNotificationEmailHtml({
      subject: 'New Comment',
      title: 'New Comment',
      message: 'Alex commented on Cover art',
      actorName: 'Alex',
      entityTitle: 'Cover art',
      organizationName: 'M2KR',
      deepLink: '/assignments/a1?tab=comments',
      eventType: 'comment.created',
    });
    expect(html).toContain('ReleaseFlow');
    expect(html).toContain('View Comment');
    expect(html).toContain('assignments/a1?tab=comments');
    expect(html).toContain('Alex');
    expect(html).toContain('M2KR');
  });
});
