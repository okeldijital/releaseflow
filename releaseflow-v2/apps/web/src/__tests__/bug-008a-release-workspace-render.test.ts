/**
 * BUG-008A — Release Workspace Rendering Regression
 *
 * Proves: Repository Release[] → workspace builder → section items → ReleaseCard slots.
 * Every release returned by the repository must reach a ReleaseCard via All Releases.
 *
 * Superseded in spirit by BUG-008B; kept as focused regression for the EPIC-206 break.
 */
import { describe, it, expect } from 'vitest';
import {
  buildReleaseWorkspace,
  resolveReleaseCardVariant,
  countCanonicalReleaseCards,
  uniqueCardReleaseIds,
  assertCatalogueFullyRendered,
  type WorkspaceRelease,
} from '@/lib/release-workspace';

function makeRelease(
  overrides: Partial<WorkspaceRelease> & { id: string; title: string },
): WorkspaceRelease {
  return {
    lifecycle: 'active',
    status: 'planning',
    ...overrides,
  };
}

describe('BUG-008A resolveReleaseCardVariant', () => {
  it('maps draft / active / archived / released and never returns null', () => {
    expect(resolveReleaseCardVariant({ lifecycle: 'draft', status: 'planning' })).toBe('draft');
    expect(resolveReleaseCardVariant({ lifecycle: 'active', status: 'planning' })).toBe('active');
    expect(resolveReleaseCardVariant({ lifecycle: 'active', status: 'in_production' })).toBe('active');
    expect(resolveReleaseCardVariant({ lifecycle: 'archived', status: 'archived' })).toBe('archived');
    expect(resolveReleaseCardVariant({ lifecycle: 'expired', status: 'planning' })).toBe('archived');
    expect(resolveReleaseCardVariant({ lifecycle: 'active', status: 'released' })).toBe('released');
  });
});

describe('BUG-008A workspace pipeline', () => {
  it('Test 1: repository returns 1 Release → All Releases renders 1 ReleaseCard slot', () => {
    const catalogue = [makeRelease({ id: 'r1', title: 'Lefa EP', lifecycle: 'active', status: 'planning' })];

    const sections = buildReleaseWorkspace({
      catalogue,
      needsAttention: [],
      continueWorking: [],
      upcoming: [],
      recentlyUpdated: [],
    });

    const allSection = sections.find((s) => s.id === 'all')!;
    expect(allSection.items).toHaveLength(1);
    expect(allSection.items[0]!.title).toBe('Lefa EP');
    expect(allSection.rendersCards).toBe(true);

    const guarantee = assertCatalogueFullyRendered(catalogue, sections);
    expect(guarantee.ok).toBe(true);
    expect(guarantee.missingIds).toEqual([]);

    expect(countCanonicalReleaseCards(sections)).toBe(1);
    expect(uniqueCardReleaseIds(sections)).toEqual(['r1']);
  });

  it('Test 2: repository returns 5 Releases → workspace renders 5 unique ReleaseCards in All Releases', () => {
    const catalogue = Array.from({ length: 5 }, (_, i) =>
      makeRelease({ id: `r${i + 1}`, title: `Release ${i + 1}` }),
    );

    const sections = buildReleaseWorkspace({
      catalogue,
      needsAttention: catalogue.slice(0, 2),
      continueWorking: [catalogue[0]!],
      upcoming: [],
      recentlyUpdated: catalogue.slice(0, 3),
    });

    const allSection = sections.find((s) => s.id === 'all')!;
    expect(allSection.items).toHaveLength(5);

    const guarantee = assertCatalogueFullyRendered(catalogue, sections);
    expect(guarantee.ok).toBe(true);
    expect(uniqueCardReleaseIds(sections).sort()).toEqual(catalogue.map((r) => r.id).sort());
  });

  it('Test 3: mixed lifecycles — every release renders exactly once in All Releases (no omissions)', () => {
    const catalogue = [
      makeRelease({ id: 'd1', title: 'Draft One', lifecycle: 'draft', status: 'planning' }),
      makeRelease({ id: 'a1', title: 'Active One', lifecycle: 'active', status: 'planning' }),
      makeRelease({ id: 'ar1', title: 'Archived One', lifecycle: 'archived', status: 'archived' }),
      makeRelease({ id: 'rel1', title: 'Released One', lifecycle: 'active', status: 'released' }),
    ];

    const sections = buildReleaseWorkspace({
      catalogue,
      needsAttention: [catalogue[0]!],
      continueWorking: [catalogue[0]!, catalogue[1]!],
      upcoming: [],
      recentlyUpdated: catalogue,
    });

    const allSection = sections.find((s) => s.id === 'all')!;
    expect(allSection.items).toHaveLength(4);

    const ids = allSection.items.map((r) => r.id);
    expect(ids).toEqual(['d1', 'a1', 'ar1', 'rel1']);
    expect(new Set(ids).size).toBe(4);

    for (const r of catalogue) {
      expect(resolveReleaseCardVariant(r)).toBeTruthy();
    }
    expect(resolveReleaseCardVariant(catalogue[0]!)).toBe('draft');
    expect(resolveReleaseCardVariant(catalogue[1]!)).toBe('active');
    expect(resolveReleaseCardVariant(catalogue[2]!)).toBe('archived');
    expect(resolveReleaseCardVariant(catalogue[3]!)).toBe('released');

    const guarantee = assertCatalogueFullyRendered(catalogue, sections);
    expect(guarantee.ok).toBe(true);
    expect(guarantee.missingIds).toEqual([]);
  });

  it('Test 4: empty repository → empty workspace sections (empty state path)', () => {
    const sections = buildReleaseWorkspace({
      catalogue: [],
      needsAttention: [],
      continueWorking: [],
      upcoming: [],
      recentlyUpdated: [],
    });

    expect(sections.every((s) => s.items.length === 0)).toBe(true);
    expect(countCanonicalReleaseCards(sections)).toBe(0);
    expect(uniqueCardReleaseIds(sections)).toEqual([]);

    const guarantee = assertCatalogueFullyRendered([], sections);
    expect(guarantee.ok).toBe(true);
  });

  it('regression: productivity sections empty must not hide catalogue ReleaseCard', () => {
    const catalogue = [makeRelease({ id: 'lefa', title: 'Lefa EP', lifecycle: 'active', status: 'planning' })];

    const sections = buildReleaseWorkspace({
      catalogue,
      needsAttention: [],
      continueWorking: [],
      upcoming: [],
      recentlyUpdated: [],
    });

    const byId = Object.fromEntries(sections.map((s) => [s.id, s.items.length]));
    expect(byId).toEqual({
      needs_attention: 0,
      continue_working: 0,
      upcoming: 0,
      recently_updated: 0,
      all: 1,
    });

    expect(assertCatalogueFullyRendered(catalogue, sections).ok).toBe(true);
    expect(countCanonicalReleaseCards(sections)).toBe(1);
  });

  it('section inventory reports every section item count', () => {
    const catalogue = [
      makeRelease({ id: 'r1', title: 'A' }),
      makeRelease({ id: 'r2', title: 'B' }),
    ];
    const sections = buildReleaseWorkspace({
      catalogue,
      needsAttention: [catalogue[0]!],
      continueWorking: [catalogue[0]!],
      upcoming: [],
      recentlyUpdated: catalogue,
    });

    const inventory = sections.map((s) => ({
      name: s.title,
      count: s.items.length,
      cards: s.rendersCards,
      role: s.role,
    }));
    expect(inventory).toEqual([
      { name: 'Needs Attention', count: 1, cards: true, role: 'projection' },
      { name: 'Continue Working', count: 1, cards: true, role: 'projection' },
      { name: 'Upcoming Releases', count: 0, cards: true, role: 'projection' },
      { name: 'Recently Updated', count: 2, cards: true, role: 'projection' },
      { name: 'All Releases', count: 2, cards: true, role: 'canonical' },
    ]);
  });
});

describe('BUG-008A page render contract (source)', () => {
  it('All Releases path invokes ReleaseCard (not ad-hoc table rows only)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const pagePath = path.resolve(__dirname, '../app/(app)/releases/page.tsx');
    const src = fs.readFileSync(pagePath, 'utf8');

    expect(src).toContain('ReleaseCardGrid');
    expect(src).toContain('title="All Releases"');
    expect(src).toContain('filteredAll');
    expect(src).toContain('buildReleaseWorkspace');
    expect(src).toContain('resolveReleaseCardVariant');
    expect(src).not.toMatch(/All Releases[\s\S]{0,400}col-span-4">Release</);
  });

  it('CollapsibleSection is defined outside ReleasesPage (stable identity)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const pagePath = path.resolve(__dirname, '../app/(app)/releases/page.tsx');
    const src = fs.readFileSync(pagePath, 'utf8');

    const collapsibleIdx = src.indexOf('function CollapsibleSection');
    const pageIdx = src.indexOf('export default function ReleasesPage');
    expect(collapsibleIdx).toBeGreaterThan(-1);
    expect(pageIdx).toBeGreaterThan(-1);
    expect(collapsibleIdx).toBeLessThan(pageIdx);
  });

  it('ReleaseCard has no silent null return for variants', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cardPath = path.resolve(__dirname, '../components/release/cards/ReleaseCard.tsx');
    const src = fs.readFileSync(cardPath, 'utf8');

    const nullReturns = src.match(/return\s+null\s*;/g) ?? [];
    expect(nullReturns).toHaveLength(0);
  });
});
