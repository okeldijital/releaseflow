/**
 * BUG-008B — Canonical Release Rendering Contract
 *
 * Locks the pipeline:
 *   filtered catalogue → workspace builder → canonical section → ReleaseCard count
 *
 * No silent discards. No bespoke catalogue rows. Collapse is UI-only.
 */
import { describe, it, expect } from 'vitest';
import {
  buildReleaseWorkspace,
  resolveReleaseCardVariant,
  resolveReleaseCardMode,
  countCanonicalReleaseCards,
  countReleaseCardSlots,
  checkWorkspaceIntegrity,
  assertWorkspaceIntegrity,
  assertCatalogueFullyRendered,
  getSectionItemsRegardlessOfCollapse,
  formatWorkspaceIntegrityError,
  type WorkspaceRelease,
  type WorkspaceSection,
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

function makeN(n: number): WorkspaceRelease[] {
  return Array.from({ length: n }, (_, i) =>
    makeRelease({ id: `r${i + 1}`, title: `Release ${i + 1}` }),
  );
}

describe('BUG-008B / BUILD-015 sizes', () => {
  it('maps legacy modes to size variants', () => {
    expect(resolveReleaseCardMode('table')).toBe('standard');
    expect(resolveReleaseCardMode('table-row')).toBe('standard');
    expect(resolveReleaseCardMode('search')).toBe('compact');
    expect(resolveReleaseCardMode('workspace')).toBe('standard');
    expect(resolveReleaseCardMode('compact')).toBe('compact');
    expect(resolveReleaseCardMode('large')).toBe('large');
  });

  it('variants cover all lifecycles without null', () => {
    const cases: WorkspaceRelease[] = [
      makeRelease({ id: '1', title: 'D', lifecycle: 'draft', status: 'planning' }),
      makeRelease({ id: '2', title: 'A', lifecycle: 'active', status: 'planning' }),
      makeRelease({ id: '3', title: 'Ar', lifecycle: 'archived', status: 'archived' }),
      makeRelease({ id: '4', title: 'R', lifecycle: 'active', status: 'released' }),
    ];
    for (const r of cases) {
      expect(resolveReleaseCardVariant(r)).toBeTruthy();
    }
  });
});

describe('BUG-008B Tests 1–6', () => {
  it('Test 1: One Release → One canonical ReleaseCard', () => {
    const catalogue = [makeRelease({ id: 'lefa', title: 'Lefa EP' })];
    const sections = buildReleaseWorkspace({ catalogue });

    expect(countCanonicalReleaseCards(sections)).toBe(1);
    expect(assertCatalogueFullyRendered(catalogue, sections).ok).toBe(true);
    expect(checkWorkspaceIntegrity(catalogue, sections).ok).toBe(true);
  });

  it('Test 2: Ten Releases → Ten canonical ReleaseCards', () => {
    const catalogue = makeN(10);
    const sections = buildReleaseWorkspace({
      catalogue,
      needsAttention: catalogue.slice(0, 3),
      continueWorking: catalogue.slice(0, 2),
      recentlyUpdated: catalogue.slice(0, 5),
    });

    expect(countCanonicalReleaseCards(sections)).toBe(10);
    expect(checkWorkspaceIntegrity(catalogue, sections).incoming).toBe(10);
    expect(checkWorkspaceIntegrity(catalogue, sections).outgoing).toBe(10);
    expect(assertCatalogueFullyRendered(catalogue, sections).missingIds).toEqual([]);
  });

  it('Test 3: Mixed lifecycles → every Release rendered exactly once in catalogue', () => {
    const catalogue = [
      makeRelease({ id: 'd1', title: 'Draft', lifecycle: 'draft', status: 'planning' }),
      makeRelease({ id: 'a1', title: 'Active', lifecycle: 'active', status: 'in_production' }),
      makeRelease({ id: 'ar1', title: 'Archived', lifecycle: 'archived', status: 'archived' }),
      makeRelease({ id: 'rel1', title: 'Released', lifecycle: 'active', status: 'released' }),
    ];

    const sections = buildReleaseWorkspace({
      catalogue,
      needsAttention: [catalogue[0]!],
      continueWorking: [catalogue[0]!, catalogue[1]!],
      recentlyUpdated: catalogue,
    });

    const all = sections.find((s) => s.id === 'all')!;
    const ids = all.items.map((r) => r.id);
    expect(ids).toEqual(['d1', 'a1', 'ar1', 'rel1']);
    expect(new Set(ids).size).toBe(4);
    expect(countCanonicalReleaseCards(sections)).toBe(4);
  });

  it('Test 4: Search filtering → only matching Releases in catalogue, no duplicates', () => {
    const all = makeN(5);
    // Simulate page filter: only titles matching "3" or "5"
    const filtered = all.filter((r) => r.title.includes('3') || r.title.includes('5'));

    const sections = buildReleaseWorkspace({
      catalogue: filtered,
      recentlyUpdated: all, // projection may be unfiltered; integrity uses catalogue only
    });

    expect(countCanonicalReleaseCards(sections)).toBe(2);
    expect(sections.find((s) => s.id === 'all')!.items.map((r) => r.id)).toEqual(['r3', 'r5']);
    expect(checkWorkspaceIntegrity(filtered, sections).ok).toBe(true);
    // No duplicates in canonical
    const integrity = checkWorkspaceIntegrity(filtered, sections);
    expect(integrity.duplicates).toEqual([]);
  });

  it('Test 5: Collapsed sections still hold Release data (UI-only hide)', () => {
    const catalogue = makeN(3);
    const sections = buildReleaseWorkspace({ catalogue, needsAttention: [catalogue[0]!] });
    const attention = sections.find((s) => s.id === 'needs_attention')!;

    const collapsed = true;
    const open = false;
    expect(getSectionItemsRegardlessOfCollapse(attention, collapsed)).toHaveLength(1);
    expect(getSectionItemsRegardlessOfCollapse(attention, open)).toHaveLength(1);
    // Collapse must not mutate
    expect(attention.items).toHaveLength(1);
    expect(countCanonicalReleaseCards(sections)).toBe(3);
  });

  it('Test 6: Workspace integrity — 15 in → 15 out; fails on 15 → 14', () => {
    const catalogue = makeN(15);
    const good = buildReleaseWorkspace({ catalogue });
    const result = checkWorkspaceIntegrity(catalogue, good);
    expect(result.ok).toBe(true);
    expect(result.incoming).toBe(15);
    expect(result.outgoing).toBe(15);

    // Simulate silent drop (buggy builder output)
    const broken: WorkspaceSection[] = [
      {
        id: 'all',
        title: 'All Releases',
        items: catalogue.slice(0, 14),
        role: 'canonical',
        rendersCards: true,
      },
    ];
    const bad = checkWorkspaceIntegrity(catalogue, broken);
    expect(bad.ok).toBe(false);
    expect(bad.incoming).toBe(15);
    expect(bad.outgoing).toBe(14);
    expect(bad.missing).toHaveLength(1);
    expect(bad.missing[0]!.id).toBe('r15');

    expect(() => assertWorkspaceIntegrity(catalogue, broken)).toThrow(
      /Release Workspace Integrity Error/,
    );
    expect(formatWorkspaceIntegrityError(bad)).toContain('Incoming Releases: 15');
    expect(formatWorkspaceIntegrityError(bad)).toContain('Rendered Releases: 14');
  });
});

describe('BUG-008B projection vs canonical', () => {
  it('projections may overlap without breaking integrity', () => {
    const catalogue = makeN(2);
    const sections = buildReleaseWorkspace({
      catalogue,
      needsAttention: catalogue,
      continueWorking: catalogue,
      recentlyUpdated: catalogue,
      upcoming: catalogue,
    });

    // Slot count includes projections (2 * 4 + 2 catalogue) = 10
    expect(countReleaseCardSlots(sections)).toBe(10);
    // Canonical integrity still 2 === 2
    expect(countCanonicalReleaseCards(sections)).toBe(2);
    expect(checkWorkspaceIntegrity(catalogue, sections).ok).toBe(true);
  });

  it('every section that lists releases declares rendersCards true', () => {
    const sections = buildReleaseWorkspace({ catalogue: makeN(1) });
    expect(sections.every((s) => s.rendersCards === true)).toBe(true);
  });
});

describe('BUG-008B source contracts', () => {
  it('ReleaseCard never returns null', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../components/release/cards/ReleaseCard.tsx'),
      'utf8',
    );
    expect(src.match(/return\s+null\s*;/g) ?? []).toHaveLength(0);
    expect(src).toContain('data-release-card');
    expect(src).toContain('data-size');
    expect(src).toContain("'compact'");
    expect(src).toContain("'standard'");
  });

  it('Releases page has no bespoke All Releases table cells', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../app/(app)/releases/page.tsx'),
      'utf8',
    );
    expect(src).toContain('ReleaseCardGrid');
    expect(src).toContain('buildReleaseWorkspace');
    expect(src).toContain('catalogue:');
    expect(src).not.toMatch(/All Releases[\s\S]{0,500}col-span-4">Release</);
    // Upcoming must use ReleaseCard path (BUILD-015 size API)
    expect(src).toMatch(/size="(compact|standard|large)"/);
    expect(src).not.toContain('UpcomingArtwork');
  });

  it('Dashboard and home upcoming lists use ReleaseCard', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dash = fs.readFileSync(
      path.resolve(__dirname, '../app/(app)/dashboard/page.tsx'),
      'utf8',
    );
    const home = fs.readFileSync(
      path.resolve(__dirname, '../app/(app)/home/page.tsx'),
      'utf8',
    );
    expect(dash).toContain('ReleaseCard');
    expect(dash).toContain('Upcoming Releases');
    // No bespoke artwork+title row for upcoming
    expect(dash).not.toMatch(/Upcoming Releases[\s\S]{0,400}ArtworkDisplay/);
    expect(home).toContain('ReleaseCard');
    expect(home).toContain('resolveReleaseCardVariant');
  });

  it('ADR documents the rendering contract', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const adr = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../../docs/ARCHITECTURE-DECISION-RECORDS/ADR-0008-canonical-release-rendering.md',
      ),
      'utf8',
    );
    expect(adr).toContain('ReleaseCard');
    expect(adr).toContain('Workspace Builder');
    expect(adr).toContain('Integrity');
    expect(adr).toContain('Prohibited');
  });
});
