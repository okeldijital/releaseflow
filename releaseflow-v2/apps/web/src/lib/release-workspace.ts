/**
 * BUG-008A — Release Workspace section builder.
 *
 * Pure transforms from Release[] → workspace sections → ReleaseCard inputs.
 * Used by the Releases page so catalogue rendering never drops repository results.
 */

export type ReleaseCardVariant = 'draft' | 'active' | 'archived' | 'released';
export type ReleaseCardMode = 'workspace' | 'compact' | 'table-row' | 'detailed';

export interface WorkspaceRelease {
  id: string;
  title: string;
  lifecycle: string;
  status: string;
}

export interface WorkspaceSection {
  id: string;
  title: string;
  items: WorkspaceRelease[];
  /** When false, the section may still be listed with a zero count but no cards. */
  rendersCards: boolean;
}

export interface BuildWorkspaceInput {
  /** Filtered + sorted catalogue (source of truth for "All Releases"). */
  all: WorkspaceRelease[];
  needsAttention: WorkspaceRelease[];
  continueWorking: WorkspaceRelease[];
  upcoming: WorkspaceRelease[];
  recentlyUpdated: WorkspaceRelease[];
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
 * Build workspace sections from page data.
 *
 * Productivity sections may be empty subsets. "All Releases" always mirrors
 * the filtered catalogue so no repository release disappears from the workspace.
 */
export function buildReleaseWorkspace(input: BuildWorkspaceInput): WorkspaceSection[] {
  return [
    {
      id: 'needs_attention',
      title: 'Needs Attention',
      items: input.needsAttention,
      rendersCards: true,
    },
    {
      id: 'continue_working',
      title: 'Continue Working',
      items: input.continueWorking,
      rendersCards: true,
    },
    {
      id: 'upcoming',
      title: 'Upcoming Releases',
      items: input.upcoming,
      // Upcoming uses a custom row layout on the page (date countdown).
      rendersCards: false,
    },
    {
      id: 'recently_updated',
      title: 'Recently Updated',
      items: input.recentlyUpdated,
      rendersCards: true,
    },
    {
      id: 'all',
      title: 'All Releases',
      items: input.all,
      rendersCards: true,
    },
  ];
}

/**
 * Count of ReleaseCard invocations the workspace must produce for a given view.
 * Upcoming uses custom rows (not ReleaseCard). All other sections with items use cards.
 * Releases may appear in multiple sections — this counts card slots, not unique ids.
 */
export function countReleaseCardSlots(sections: WorkspaceSection[]): number {
  return sections
    .filter((s) => s.rendersCards)
    .reduce((sum, s) => sum + s.items.length, 0);
}

/**
 * Unique release ids that appear in at least one card-rendering section.
 * Used to prove no catalogue release is omitted from the workspace UI.
 */
export function uniqueCardReleaseIds(sections: WorkspaceSection[]): string[] {
  const ids = new Set<string>();
  for (const section of sections) {
    if (!section.rendersCards) continue;
    for (const item of section.items) {
      ids.add(item.id);
    }
  }
  return Array.from(ids);
}

/**
 * Guarantee: every release in `all` is present in the All Releases section
 * and therefore will reach ReleaseCard.
 */
export function assertCatalogueFullyRendered(
  all: WorkspaceRelease[],
  sections: WorkspaceSection[],
): { ok: boolean; missingIds: string[] } {
  const allSection = sections.find((s) => s.id === 'all');
  if (!allSection) {
    return { ok: false, missingIds: all.map((r) => r.id) };
  }
  const rendered = new Set(allSection.items.map((r) => r.id));
  const missingIds = all.filter((r) => !rendered.has(r.id)).map((r) => r.id);
  return { ok: missingIds.length === 0, missingIds };
}
