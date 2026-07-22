/**
 * BUILD-014G — Draft deletion workflow structure checks
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
    // handleDelete: draft branch awaits deleteReleaseDraft; non-draft awaits removeRelease
    expect(src).toMatch(
      /if\s*\(\s*isDraft\s*\)\s*\{[\s\S]*?await deleteReleaseDraft\([\s\S]*?\}\s*else\s*\{[\s\S]*?await removeRelease/,
    );
    // No await removeRelease inside the draft branch body before else
    const m = src.match(
      /if\s*\(\s*isDraft\s*\)\s*\{([\s\S]*?)\}\s*else\s*\{([\s\S]*?)await removeRelease/,
    );
    expect(m?.[1]).toBeTruthy();
    expect(m?.[1]).not.toMatch(/await\s+removeRelease/);
    expect(m?.[1]).toMatch(/await\s+deleteReleaseDraft/);
  });

  it('mounts ConfirmationDialog at component root for all modes', () => {
    expect(src).toContain('const deleteDialog = (');
    expect(src).toContain('{deleteDialog}');
    // compact path still returns renderCompactCard but root wraps dialog
    expect(src).toContain('if (isCompact) return renderCompactCard()');
    // both return branches include dialog
    const returns = src.match(/\{deleteDialog\}/g) ?? [];
    expect(returns.length).toBeGreaterThanOrEqual(2);
  });

  it('opens dialog via openDeleteDialog and keeps dialog open on failure', () => {
    expect(src).toContain('function openDeleteDialog');
    expect(src).toContain('// Keep dialog open on failure');
    expect(src).toContain('console.error(\'[ReleaseCard] delete failed\'');
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
