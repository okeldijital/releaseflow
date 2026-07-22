/**
 * BUILD-014G — Draft deletion workflow structure checks
 * (Updated for BUILD-015 single-layout card.)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cardPath = join(__dirname, '../components/release/cards/ReleaseCard.tsx');
const dashPath = join(__dirname, '../app/(app)/dashboard/page.tsx');

describe('BUILD-014G ReleaseCard draft delete', () => {
  const src = readFileSync(cardPath, 'utf8');

  it('imports and uses deleteReleaseDraft for drafts', () => {
    expect(src).toContain('deleteReleaseDraft');
    expect(src).toMatch(/if\s*\(\s*isDraft\s*\)[\s\S]*deleteReleaseDraft/);
  });

  it('does not call removeRelease for draft path', () => {
    expect(src).toMatch(
      /if\s*\(\s*isDraft\s*\)\s*\{[\s\S]*?await deleteReleaseDraft\([\s\S]*?\}\s*else\s*\{[\s\S]*?await removeRelease/,
    );
    const m = src.match(
      /if\s*\(\s*isDraft\s*\)\s*\{([\s\S]*?)\}\s*else\s*\{([\s\S]*?)await removeRelease/,
    );
    expect(m?.[1]).toBeTruthy();
    expect(m?.[1]).not.toMatch(/await\s+removeRelease/);
    expect(m?.[1]).toMatch(/await\s+deleteReleaseDraft/);
  });

  it('mounts ConfirmationDialog in the single card layout', () => {
    expect(src).toContain('ConfirmationDialog');
    expect(src).toContain('openDeleteDialog');
    // Single layout — dialog always present (not per-mode early return)
    expect(src).not.toContain('renderCompactCard');
    expect(src).not.toContain('renderTableRow');
  });

  it('opens dialog via openDeleteDialog and logs failures', () => {
    expect(src).toContain('function openDeleteDialog');
    expect(src).toContain("console.error('[ReleaseCard] delete failed'");
  });

  it('uses BUILD-014G dialog copy for drafts', () => {
    expect(src).toContain('Delete Draft?');
    expect(src).toContain('This draft release will be permanently deleted');
    expect(src).toContain('This action cannot be undone');
  });
});

describe('BUILD-014G Dashboard draft list', () => {
  const src = readFileSync(dashPath, 'utf8');

  it('passes onDeleted that filters local drafts state', () => {
    expect(src).toContain('onDeleted=');
    expect(src).toContain('setDrafts');
    expect(src).toMatch(/prev\.filter/);
  });
});
