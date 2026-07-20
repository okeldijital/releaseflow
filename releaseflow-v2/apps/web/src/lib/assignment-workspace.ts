/**
 * BUILD-003 — Assignment Workspace Builder (pure)
 *
 * Organization only: group / sort / filter / prioritize.
 * Never decides presentation (AssignmentCard owns that).
 *
 * Integrity (ADR-0009):
 *   catalogue length === All Assignments section length
 * Projection sections may overlap; excluded from integrity sum.
 */

import type { AssignmentWorkspaceRecord } from './assignment-workspace-service';

export type AssignmentSectionId =
  | 'needs_attention'
  | 'due_today'
  | 'awaiting_review'
  | 'recently_updated'
  | 'all';

export interface AssignmentWorkspaceSection {
  id: AssignmentSectionId;
  title: string;
  items: AssignmentWorkspaceRecord[];
  role: 'canonical' | 'projection';
  rendersCards: true;
  defaultOpen?: boolean;
  maxVisible?: number;
}

export interface AssignmentWorkspace {
  sections: AssignmentWorkspaceSection[];
  catalogue: AssignmentWorkspaceRecord[];
}

export interface WorkspaceIntegrityResult {
  ok: boolean;
  incoming: number;
  outgoing: number;
  missing: Array<{ id: string; title: string }>;
  extras: Array<{ id: string; title: string }>;
  duplicates: string[];
}

const NEEDS_ATTENTION_MAX = 10;
const RECENTLY_UPDATED_MAX = 10;

function isCompleted(status: string): boolean {
  return status === 'completed' || status === 'cancelled' || status === 'archived' || status === 'declined';
}

function getDateMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'object' && value !== null) {
    const d = value as { seconds?: number; toDate?: () => Date };
    if (typeof d.toDate === 'function') return d.toDate().getTime();
    if (typeof d.seconds === 'number') return d.seconds * 1000;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** BUILD-006 — Needs Attention */
export function selectNeedsAttention(
  catalogue: AssignmentWorkspaceRecord[],
): AssignmentWorkspaceRecord[] {
  return catalogue
    .filter(
      (r) =>
        r.isBlocked
        || r.isOverdue
        || r.requiresReview
        || r.workScore >= 60
        || r.isHighPriority,
    )
    .sort((a, b) => b.workScore - a.workScore)
    .slice(0, NEEDS_ATTENTION_MAX);
}

/** BUILD-007 — Due Today */
export function selectDueToday(
  catalogue: AssignmentWorkspaceRecord[],
): AssignmentWorkspaceRecord[] {
  return catalogue
    .filter((r) => r.isDueToday && !isCompleted(r.assignment.status))
    .sort((a, b) => {
      const p =
        (PRIORITY_ORDER[a.assignment.priority] ?? 9)
        - (PRIORITY_ORDER[b.assignment.priority] ?? 9);
      if (p !== 0) return p;
      return getDateMs(a.assignment.dueDate) - getDateMs(b.assignment.dueDate);
    });
}

/** BUILD-008 — Awaiting Review */
export function selectAwaitingReview(
  catalogue: AssignmentWorkspaceRecord[],
): AssignmentWorkspaceRecord[] {
  return catalogue
    .filter((r) => r.requiresReview)
    .sort((a, b) => getDateMs(b.assignment.updatedAt) - getDateMs(a.assignment.updatedAt));
}

/**
 * BUILD-009 — Recently Updated
 * Prefer activity-driven ordering; falls back to updatedAt when activity not supplied.
 */
export function selectRecentlyUpdated(
  catalogue: AssignmentWorkspaceRecord[],
  activityUpdatedIds?: string[],
): AssignmentWorkspaceRecord[] {
  if (activityUpdatedIds && activityUpdatedIds.length > 0) {
    const byId = new Map(catalogue.map((r) => [r.assignment.id, r]));
    const ordered: AssignmentWorkspaceRecord[] = [];
    for (const id of activityUpdatedIds) {
      const rec = byId.get(id);
      if (rec) ordered.push(rec);
      if (ordered.length >= RECENTLY_UPDATED_MAX) break;
    }
    return ordered;
  }
  return [...catalogue]
    .sort(
      (a, b) =>
        getDateMs(b.assignment.updatedAt) - getDateMs(a.assignment.updatedAt),
    )
    .slice(0, RECENTLY_UPDATED_MAX);
}

export function buildAssignmentWorkspace(input: {
  catalogue: AssignmentWorkspaceRecord[];
  activityUpdatedIds?: string[];
}): AssignmentWorkspace {
  const catalogue = input.catalogue;
  const sections: AssignmentWorkspaceSection[] = [
    {
      id: 'needs_attention',
      title: 'Needs Attention',
      items: selectNeedsAttention(catalogue),
      role: 'projection',
      rendersCards: true,
      defaultOpen: true,
      maxVisible: NEEDS_ATTENTION_MAX,
    },
    {
      id: 'due_today',
      title: 'Due Today',
      items: selectDueToday(catalogue),
      role: 'projection',
      rendersCards: true,
      defaultOpen: true,
    },
    {
      id: 'awaiting_review',
      title: 'Awaiting Review',
      items: selectAwaitingReview(catalogue),
      role: 'projection',
      rendersCards: true,
      defaultOpen: true,
    },
    {
      id: 'recently_updated',
      title: 'Recently Updated',
      items: selectRecentlyUpdated(catalogue, input.activityUpdatedIds),
      role: 'projection',
      rendersCards: true,
      defaultOpen: true,
      maxVisible: RECENTLY_UPDATED_MAX,
    },
    {
      id: 'all',
      title: 'All Assignments',
      items: catalogue,
      role: 'canonical',
      rendersCards: true,
      defaultOpen: true,
    },
  ];

  assertAssignmentWorkspaceIntegrity(catalogue, sections);
  return { sections, catalogue };
}

export function checkAssignmentWorkspaceIntegrity(
  catalogue: AssignmentWorkspaceRecord[],
  sections: AssignmentWorkspaceSection[],
): WorkspaceIntegrityResult {
  const canonicalItems = sections
    .filter((s) => s.role === 'canonical')
    .flatMap((s) => s.items);

  const incoming = catalogue.length;
  const outgoing = canonicalItems.length;
  const catalogueIds = new Set(catalogue.map((r) => r.assignment.id));
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const item of canonicalItems) {
    if (seen.has(item.assignment.id)) duplicates.push(item.assignment.id);
    seen.add(item.assignment.id);
  }

  const missing = catalogue
    .filter((r) => !seen.has(r.assignment.id))
    .map((r) => ({ id: r.assignment.id, title: r.assignment.title }));

  const extras = canonicalItems
    .filter((r) => !catalogueIds.has(r.assignment.id))
    .map((r) => ({ id: r.assignment.id, title: r.assignment.title }));

  return {
    ok:
      incoming === outgoing
      && missing.length === 0
      && extras.length === 0
      && duplicates.length === 0,
    incoming,
    outgoing,
    missing,
    extras,
    duplicates,
  };
}

export function formatAssignmentIntegrityError(result: WorkspaceIntegrityResult): string {
  const lines = [
    'Assignment Workspace Integrity Error',
    `Incoming Assignments: ${result.incoming}`,
    `Rendered Assignments: ${result.outgoing}`,
  ];
  if (result.missing.length > 0) {
    lines.push('Missing Assignments:');
    for (const m of result.missing) {
      lines.push(`- ${m.id}`);
      lines.push(`  ${m.title}`);
    }
  }
  return lines.join('\n');
}

/** Dev/test only — does not run in production. */
export function assertAssignmentWorkspaceIntegrity(
  catalogue: AssignmentWorkspaceRecord[],
  sections: AssignmentWorkspaceSection[],
): void {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return;
  }
  const result = checkAssignmentWorkspaceIntegrity(catalogue, sections);
  if (!result.ok) {
    throw new Error(formatAssignmentIntegrityError(result));
  }
}

export function countCanonicalAssignmentCards(
  sections: AssignmentWorkspaceSection[],
): number {
  return sections
    .filter((s) => s.role === 'canonical')
    .reduce((sum, s) => sum + s.items.length, 0);
}
