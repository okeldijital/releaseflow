/**
 * BUG-008B — Canonical Release Workspace Builder
 *
 * Responsibilities:
 * - Repository owns Release retrieval (not here)
 * - Workspace Builder owns organization only (group / sort / filter / prioritize)
 * - ReleaseCard owns presentation (never bypassed)
 *
 * Integrity rule:
 *   catalogue (filtered input) === canonical section items (exactly once each)
 *
 * Projection sections (Needs Attention, Continue Working, …) may re-surface the
 * same release for productivity; they are excluded from the integrity sum.
 *
 * Pipeline:
 *   Firestore → Repository → Service → Workspace Builder → Section → ReleaseCard → DOM
 */

export type ReleaseCardVariant = 'draft' | 'active' | 'archived' | 'released';

/** Layout-only modes. Never fork presentation logic outside ReleaseCard. */
export type ReleaseCardMode =
  | 'workspace'
  | 'compact'
  | 'table'
  | 'table-row' // alias of table (back-compat)
  | 'detailed'
  | 'search';

export interface WorkspaceRelease {
  id: string;
  title: string;
  lifecycle: string;
  status: string;
}

/**
 * role:
 * - canonical — owns integrity; every filtered release appears exactly once across these
 * - projection — optional productivity pinboards; may duplicate; never replaces catalogue
 */
export interface WorkspaceSection {
  id: string;
  title: string;
  items: WorkspaceRelease[];
  role: 'canonical' | 'projection';
  /** Always true under BUG-008B — every section that lists releases uses ReleaseCard. */
  rendersCards: true;
  /**
   * UI collapse hides children only. Data remains in `items`.
   * Collapse must never remove items from the section.
   */
  defaultOpen?: boolean;
}

export interface BuildWorkspaceInput {
  /**
   * Filtered + sorted catalogue — the integrity source of truth.
   * User-applied filters intentionally shrink this set; silent discards are forbidden.
   */
  catalogue: WorkspaceRelease[];
  needsAttention?: WorkspaceRelease[];
  continueWorking?: WorkspaceRelease[];
  upcoming?: WorkspaceRelease[];
  recentlyUpdated?: WorkspaceRelease[];
}

export interface WorkspaceIntegrityResult {
  ok: boolean;
  incoming: number;
  outgoing: number;
  missing: Array<{ id: string; title: string }>;
  extras: Array<{ id: string; title: string }>;
  duplicates: string[];
}

/**
 * Map lifecycle/status → ReleaseCard variant.
 * Never returns null; every release gets a renderable variant.
 */
export function resolveReleaseCardVariant(release: {
  lifecycle: string;
  status: string;
}): ReleaseCardVariant {
  if (release.lifecycle === 'draft') return 'draft';
  if (release.lifecycle === 'archived' || release.lifecycle === 'expired') return 'archived';
  if (release.status === 'released') return 'released';
  return 'active';
}

/**
 * Normalize mode aliases so callers may use `table` or `table-row`.
 */
export function resolveReleaseCardMode(mode: ReleaseCardMode | undefined): Exclude<ReleaseCardMode, 'table-row'> {
  if (!mode || mode === 'table-row' || mode === 'table') return 'table';
  return mode;
}

/**
 * Build workspace sections from page data.
 *
 * Canonical section "all" always mirrors `catalogue` 1:1.
 * Projection sections are optional subsets for productivity UX.
 */
export function buildReleaseWorkspace(input: BuildWorkspaceInput): WorkspaceSection[] {
  const catalogue = input.catalogue;
  const sections: WorkspaceSection[] = [
    {
      id: 'needs_attention',
      title: 'Needs Attention',
      items: input.needsAttention ?? [],
      role: 'projection',
      rendersCards: true,
      defaultOpen: true,
    },
    {
      id: 'continue_working',
      title: 'Continue Working',
      items: input.continueWorking ?? [],
      role: 'projection',
      rendersCards: true,
      defaultOpen: true,
    },
    {
      id: 'upcoming',
      title: 'Upcoming Releases',
      items: input.upcoming ?? [],
      role: 'projection',
      rendersCards: true,
      defaultOpen: true,
    },
    {
      id: 'recently_updated',
      title: 'Recently Updated',
      items: input.recentlyUpdated ?? [],
      role: 'projection',
      rendersCards: true,
      defaultOpen: true,
    },
    {
      id: 'all',
      title: 'All Releases',
      items: catalogue,
      role: 'canonical',
      rendersCards: true,
      defaultOpen: true,
    },
  ];

  // BUG-008B — development-only integrity gate (no silent discards)
  assertWorkspaceIntegrity(catalogue, sections);

  return sections;
}

/**
 * Canonical integrity check:
 *   incoming catalogue === Σ(canonical section items)
 * and each catalogue id appears exactly once.
 */
export function checkWorkspaceIntegrity(
  catalogue: WorkspaceRelease[],
  sections: WorkspaceSection[],
): WorkspaceIntegrityResult {
  const canonicalItems = sections
    .filter((s) => s.role === 'canonical')
    .flatMap((s) => s.items);

  const incoming = catalogue.length;
  const outgoing = canonicalItems.length;

  const catalogueIds = new Set(catalogue.map((r) => r.id));
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const item of canonicalItems) {
    if (seen.has(item.id)) duplicates.push(item.id);
    seen.add(item.id);
  }

  const missing = catalogue
    .filter((r) => !seen.has(r.id))
    .map((r) => ({ id: r.id, title: r.title }));

  const extras = canonicalItems
    .filter((r) => !catalogueIds.has(r.id))
    .map((r) => ({ id: r.id, title: r.title }));

  const ok =
    incoming === outgoing &&
    missing.length === 0 &&
    extras.length === 0 &&
    duplicates.length === 0;

  return { ok, incoming, outgoing, missing, extras, duplicates };
}

export function formatWorkspaceIntegrityError(result: WorkspaceIntegrityResult): string {
  const lines = [
    'Release Workspace Integrity Error',
    `Incoming Releases: ${result.incoming}`,
    `Rendered Releases: ${result.outgoing}`,
  ];
  if (result.missing.length > 0) {
    lines.push('Missing Releases:');
    for (const m of result.missing) {
      lines.push(`- ${m.id}`);
      lines.push(`  ${m.title}`);
    }
  }
  if (result.extras.length > 0) {
    lines.push('Unexpected Releases:');
    for (const e of result.extras) {
      lines.push(`- ${e.id}`);
      lines.push(`  ${e.title}`);
    }
  }
  if (result.duplicates.length > 0) {
    lines.push(`Duplicate IDs: ${result.duplicates.join(', ')}`);
  }
  return lines.join('\n');
}

/**
 * Development-only assertion. Does not run in production builds.
 * Throws if the workspace silently dropped or duplicated catalogue releases.
 */
export function assertWorkspaceIntegrity(
  catalogue: WorkspaceRelease[],
  sections: WorkspaceSection[],
): void {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return;
  }
  const result = checkWorkspaceIntegrity(catalogue, sections);
  if (!result.ok) {
    throw new Error(formatWorkspaceIntegrityError(result));
  }
}

/**
 * Count of ReleaseCard slots across all sections (projections + catalogue).
 * Useful for UI audits; may exceed unique release count when projections overlap.
 */
export function countReleaseCardSlots(sections: WorkspaceSection[]): number {
  return sections.reduce((sum, s) => sum + s.items.length, 0);
}

/**
 * Canonical ReleaseCard count — must equal filtered catalogue length.
 */
export function countCanonicalReleaseCards(sections: WorkspaceSection[]): number {
  return sections
    .filter((s) => s.role === 'canonical')
    .reduce((sum, s) => sum + s.items.length, 0);
}

/**
 * Unique release ids that appear in at least one card-rendering section.
 */
export function uniqueCardReleaseIds(sections: WorkspaceSection[]): string[] {
  const ids = new Set<string>();
  for (const section of sections) {
    for (const item of section.items) {
      ids.add(item.id);
    }
  }
  return Array.from(ids);
}

/**
 * Guarantee: every release in `catalogue` is present in the All Releases section.
 */
export function assertCatalogueFullyRendered(
  catalogue: WorkspaceRelease[],
  sections: WorkspaceSection[],
): { ok: boolean; missingIds: string[] } {
  const allSection = sections.find((s) => s.id === 'all');
  if (!allSection) {
    return { ok: false, missingIds: catalogue.map((r) => r.id) };
  }
  const rendered = new Set(allSection.items.map((r) => r.id));
  const missingIds = catalogue.filter((r) => !rendered.has(r.id)).map((r) => r.id);
  return { ok: missingIds.length === 0, missingIds };
}

/**
 * Section collapse is a pure UI concern. This helper documents that collapsing
 * must never mutate section.items.
 */
export function getSectionItemsRegardlessOfCollapse(
  section: WorkspaceSection,
  _collapsed: boolean,
): WorkspaceRelease[] {
  return section.items;
}
