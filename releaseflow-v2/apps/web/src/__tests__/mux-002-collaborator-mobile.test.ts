/**
 * MUX-002 — Collaborator mobile workspace contracts.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('MUX-002 collaborator mobile workspace', () => {
  it('bottom nav uses Comments instead of Notifications', () => {
    const src = read('app/(app)/layout.tsx');
    expect(src).toContain("href: '/comments'");
    // bottom nav block should not list Notifications as a primary tab item next to Comments
    expect(src).toMatch(/collaboratorBottomNavItems[\s\S]*href: '\/comments'/);
  });

  it('collaborators can open tracks (artist.read) and are not blocked on /tracks', () => {
    const src = read('app/(app)/layout.tsx');
    expect(src).toContain('artist.read');
    const blockStart = src.indexOf('COLLABORATOR_BLOCKED_PREFIXES');
    const blockEnd = src.indexOf('];', blockStart);
    const block = src.slice(blockStart, blockEnd);
    expect(block).not.toContain("'/tracks'");
    expect(block).toContain("'/artists'");
  });

  it('home includes summary, continue, updates, releases, quick access', () => {
    const src = read('app/(app)/home/page.tsx');
    expect(src).toContain("Today's summary");
    expect(src).toContain('Continue working');
    expect(src).toContain('Recent updates');
    expect(src).toContain('Upcoming releases');
    expect(src).toContain('Quick access');
    expect(src).toContain('/comments');
  });

  it('comments workspace groups by assignment', () => {
    const page = read('app/(app)/comments/page.tsx');
    expect(page).toContain('loadCommentThreads');
    expect(read('lib/assignment-comments-inbox.ts')).toContain('AssignmentCommentThread');
    expect(page).toContain('not a general chat');
    expect(page).toContain('?tab=comments');
  });

  it('schedule has Releases domain tab', () => {
    const src = read('app/(app)/schedule/page.tsx');
    expect(src).toContain("id: 'releases'");
    expect(src).toContain('domain');
  });

  it('notifications deep-link into assignment context', () => {
    const src = read('lib/notification-engine-service.ts');
    expect(src).toContain('tab=comments');
    expect(src).toContain('/assignments/');
  });
});
