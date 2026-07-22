/**
 * BUILD-015 — Canonical Release Card structure
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveReleaseCardSize } from '@/lib/release-workspace';

const cardPath = join(__dirname, '../components/release/cards/ReleaseCard.tsx');

describe('BUILD-015 single layout', () => {
  const src = readFileSync(cardPath, 'utf8');

  it('exposes size compact | standard | large only', () => {
    expect(src).toContain("export type ReleaseCardSize = 'compact' | 'standard' | 'large'");
    expect(src).toContain('SIZE_STYLES');
  });

  it('does not implement separate horizontal table/list card layouts', () => {
    expect(src).not.toContain('renderTableRow');
    expect(src).not.toContain('renderCompactCard');
    expect(src).not.toContain('renderDetailedCard');
    expect(src).not.toContain('renderWorkspaceCard');
  });

  it('always renders artwork, badge, title, metadata, progress, menu', () => {
    expect(src).toContain('ArtworkDisplay');
    expect(src).toContain('statusBadgeLabel');
    expect(src).toContain('ProgressBar');
    expect(src).toContain('EntityOverflowMenu');
    expect(src).toContain('line-clamp-2');
  });

  it('maps size resolver correctly', () => {
    expect(resolveReleaseCardSize('compact')).toBe('compact');
    expect(resolveReleaseCardSize('search')).toBe('compact');
    expect(resolveReleaseCardSize('workspace')).toBe('standard');
    expect(resolveReleaseCardSize('table')).toBe('standard');
    expect(resolveReleaseCardSize('large')).toBe('large');
  });
});

describe('BUILD-015 call sites use size not layout forks', () => {
  it('dashboard draft cards use size compact', () => {
    const dash = readFileSync(
      join(__dirname, '../app/(app)/dashboard/page.tsx'),
      'utf8',
    );
    expect(dash).toContain('size="compact"');
    expect(dash).toContain('ReleaseCard');
  });

  it('releases page grid uses size prop', () => {
    const page = readFileSync(
      join(__dirname, '../app/(app)/releases/page.tsx'),
      'utf8',
    );
    expect(page).toContain('size="compact"');
    expect(page).toContain('size="standard"');
    expect(page).not.toContain('mode="table"');
  });
});
