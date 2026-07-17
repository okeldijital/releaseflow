/**
 * BUG-003 — Comments subscription must not wipe UI with empty error/cache results.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('BUG-003 comments subscription regression', () => {
  it('subscribe uses same orderBy desc as list query', () => {
    const src = read('lib/assignment-comments-repository.ts');
    expect(src).toContain("orderBy('createdAt', 'desc')");
    // Live subscribe should not use asc-only path as primary
    const subscribeBlock = src.slice(src.indexOf('subscribeAssignmentComments'));
    expect(subscribeBlock).toContain("orderBy('createdAt', 'desc')");
    expect(subscribeBlock).toContain('fromCache');
    expect(subscribeBlock).toContain('Do NOT call onData([])');
  });

  it('panel merges optimistic pending and never blanks on load error', () => {
    const src = read('components/assignments/assignment-comments-panel.tsx');
    expect(src).toContain('pendingRef');
    expect(src).toContain('mergeWithPending');
    expect(src).toContain('never blank existing conversation');
  });

  it('comments inbox does not setThreads([]) on catch', () => {
    const src = read('app/(app)/comments/page.tsx');
    expect(src).not.toContain('.catch(() => setThreads([]))');
    expect(src).toContain('setThreads((prev) => prev)');
  });

  it('inbox access is assignment identity not author-only', () => {
    const src = read('lib/assignment-comments-inbox.ts');
    expect(src).toContain('assignmentMatchesIdentity');
    expect(src).not.toContain('authorId === userId');
  });
});
