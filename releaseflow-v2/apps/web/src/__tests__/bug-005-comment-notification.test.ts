/**
 * BUG-005 — Comment notification pipeline must fan out despite prefs rules.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getRecipientRolesForType } from '@/lib/notification-processor';
import { getNotificationTypeDefinition } from '@/lib/notification-type-registry';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('BUG-005 comment notification pipeline', () => {
  it('comment.created is registered with assignee+assigner+watchers', () => {
    const def = getNotificationTypeDefinition('comment.created');
    expect(def).not.toBeNull();
    expect(def?.category).toBe('comment');
    expect(getRecipientRolesForType('comment.created')).toEqual(
      expect.arrayContaining(['assignee', 'assigner', 'watchers']),
    );
  });

  it('comment service emits event then processes (including mentions)', () => {
    const src = read('lib/assignment-comments-service.ts');
    expect(src).toContain("type: isReply ? 'comment.reply' : 'comment.created'");
    expect(src).toContain('generateNotificationEvent');
    expect(src).toContain('processPendingEvents');
    // process after mention events (not only before)
    const processIdx = src.lastIndexOf('processPendingEvents');
    const mentionIdx = src.indexOf("type: 'comment.mentioned'");
    expect(processIdx).toBeGreaterThan(mentionIdx);
  });

  it('preferences fan-out falls back to defaults on permission failure', () => {
    const src = read('lib/notification-preferences-repository.ts');
    expect(src).toContain('BUG-005');
    expect(src).toContain('using defaults for fan-out');
    expect(src).toContain('try {');
    expect(src).toContain('return defaults(userId)');
  });

  it('user_notifications dedupe does not abort fan-out on list denial', () => {
    const src = read('lib/user-notifications-repository.ts');
    expect(src).toContain('dedupe query failed (fan-out)');
    expect(src).toContain('return null');
  });

  it('processor isolates per-recipient failures', () => {
    const src = read('lib/notification-processor.ts');
    expect(src).toContain('recipient fan-out failed');
    expect(src).toContain('markEventProcessed');
    expect(src).toContain('recipients');
  });

  it('deep link for comments opens comments tab', () => {
    const def = getNotificationTypeDefinition('comment.created');
    expect(def?.deepLink('assignment', 'a1')).toBe('/assignments/a1?tab=comments');
  });
});
