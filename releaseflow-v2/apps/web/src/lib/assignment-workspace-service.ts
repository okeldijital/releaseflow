/**
 * BUILD-002 / BUILD-004 / BUILD-012 / BUILD-018 — Assignment Workspace Service
 *
 * Enrichment only: Release context, artwork, track, artist, Work Score, urgency flags.
 * No UI logic. No workspace section building.
 */

import {
  getAssignments,
  type AssignmentQueryOptions,
  type AssignmentRecord,
} from './assignment-repository';
import { fetchReleasesByOrg } from './release-service';
import { resolvePersonNames } from './resolve-person-names';
import {
  computeWorkScore,
  resolveUrgency,
  type AssignmentUrgency,
} from './assignment-work-score';

export interface AssignmentWorkspaceReleaseContext {
  id: string;
  title: string;
  lifecycle: string;
  status: string;
  removed: boolean;
}

export interface AssignmentWorkspaceRecord {
  assignment: AssignmentRecord;
  release: AssignmentWorkspaceReleaseContext | null;
  artwork: { secureUrl?: string } | null;
  trackTitle: string | null;
  artistName: string | null;
  ownerName: string | null;
  workScore: number;
  urgency: AssignmentUrgency;
  isBlocked: boolean;
  isDueToday: boolean;
  isOverdue: boolean;
  requiresReview: boolean;
  isAssignedToMe: boolean;
  updatedToday: boolean;
  isHighPriority: boolean;
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

function startOfDay(ms: number = Date.now()): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(ms: number = Date.now()): number {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function releaseIdOf(a: AssignmentRecord): string | null {
  if (a.releaseId) return a.releaseId;
  if (a.entityType === 'release') return a.entityId;
  return null;
}

function isCompleted(status: string): boolean {
  return status === 'completed' || status === 'cancelled' || status === 'archived' || status === 'declined';
}

/**
 * Batch-enrich assignment records into workspace records (avoids N+1).
 */
export async function enrichAssignmentsForWorkspace(
  records: AssignmentRecord[],
  options: {
    organizationId: string;
    /** Auth uid or Person.id keys that mean "me" */
    meIdentityKeys?: Set<string> | string[];
  },
): Promise<AssignmentWorkspaceRecord[]> {
  const orgId = options.organizationId;
  const me = options.meIdentityKeys
    ? options.meIdentityKeys instanceof Set
      ? options.meIdentityKeys
      : new Set(options.meIdentityKeys)
    : new Set<string>();

  if (records.length === 0) return [];

  // Batch people names
  const personIds: string[] = [];
  for (const a of records) {
    if (a.assigneeId) personIds.push(a.assigneeId);
    if (a.assignerId) personIds.push(a.assignerId);
  }
  let nameMap = new Map<string, string>();
  try {
    nameMap = await resolvePersonNames(personIds);
  } catch {
    nameMap = new Map();
  }

  // Batch releases + artwork once for org
  const neededReleaseIds = new Set(
    records.map(releaseIdOf).filter((id): id is string => Boolean(id)),
  );
  const releaseMap = new Map<
    string,
    { title: string; lifecycle: string; status: string; artwork: { secureUrl?: string } | null }
  >();
  try {
    if (neededReleaseIds.size > 0) {
      const all = await fetchReleasesByOrg(orgId);
      for (const r of all) {
        if (neededReleaseIds.has(r.id)) {
          releaseMap.set(r.id, {
            title: r.title,
            lifecycle: r.lifecycle,
            status: r.status,
            artwork: r.artwork ? { secureUrl: r.artwork.secureUrl } : null,
          });
        }
      }
    }
  } catch {
    // Context best-effort
  }

  // Batch track titles
  const trackIds = [
    ...new Set(
      records.filter((a) => a.entityType === 'track').map((a) => a.entityId),
    ),
  ];
  const trackTitleMap = new Map<string, string>();
  if (trackIds.length > 0) {
    try {
      const { getTrack } = await import('./track-repository');
      await Promise.all(
        trackIds.map(async (tid) => {
          try {
            const t = await getTrack(tid);
            if (t?.title) trackTitleMap.set(tid, t.title);
          } catch {
            /* ignore */
          }
        }),
      );
    } catch {
      /* ignore */
    }
  }

  const dayStart = startOfDay();
  const dayEnd = endOfDay();

  return records.map((assignment) => {
    const rid = releaseIdOf(assignment);
    const releaseData = rid ? releaseMap.get(rid) : undefined;

    const dueMs = getDateMs(assignment.dueDate);
    const updatedMs = getDateMs(assignment.updatedAt);
    const isBlocked = assignment.status === 'blocked';
    const isDueToday =
      dueMs > 0 && dueMs >= dayStart && dueMs <= dayEnd && !isCompleted(assignment.status);
    const isOverdue =
      dueMs > 0 && dueMs < dayStart && !isCompleted(assignment.status);
    const requiresReview = assignment.status === 'review';
    const isHighPriority =
      assignment.priority === 'high' || assignment.priority === 'urgent';
    const isAssignedToMe =
      me.has(assignment.assigneeId)
      || (assignment.assigneeUserId ? me.has(assignment.assigneeUserId) : false);
    const updatedToday = updatedMs >= dayStart && updatedMs <= dayEnd;

    const workScore = computeWorkScore({
      isOverdue,
      isBlocked,
      isDueToday,
      isHighPriority,
      requiresReview,
      isAssignedToMe,
      updatedToday,
    });

    return {
      assignment,
      release: rid
        ? releaseData
          ? {
              id: rid,
              title: releaseData.title,
              lifecycle: releaseData.lifecycle,
              status: releaseData.status,
              removed: false,
            }
          : {
              id: rid,
              title: 'Release Removed',
              lifecycle: 'unknown',
              status: 'unknown',
              removed: true,
            }
        : null,
      artwork: releaseData?.artwork ?? null,
      trackTitle:
        assignment.entityType === 'track'
          ? trackTitleMap.get(assignment.entityId) ?? null
          : null,
      artistName: null,
      ownerName: nameMap.get(assignment.assigneeId) ?? null,
      workScore,
      urgency: resolveUrgency(workScore, {
        isOverdue,
        isBlocked,
        isDueToday,
        isHighPriority,
        requiresReview,
        isAssignedToMe,
        updatedToday,
      }),
      isBlocked,
      isDueToday,
      isOverdue,
      requiresReview,
      isAssignedToMe,
      updatedToday,
      isHighPriority,
    };
  });
}

/**
 * Load + enrich assignments for the workspace (primary entry for page/dashboard).
 */
export async function loadAssignmentWorkspaceRecords(
  options: AssignmentQueryOptions & {
    meIdentityKeys?: Set<string> | string[];
  },
): Promise<AssignmentWorkspaceRecord[]> {
  const records = await getAssignments(options);
  return enrichAssignmentsForWorkspace(records, {
    organizationId: options.organizationId,
    meIdentityKeys: options.meIdentityKeys,
  });
}

/**
 * Client-side search across enriched fields (title, release, track, owner).
 */
export function filterWorkspaceRecords(
  records: AssignmentWorkspaceRecord[],
  filters: {
    search?: string;
    status?: string[];
    priority?: string[];
    blocked?: boolean;
    review?: boolean;
    due?: 'today' | 'overdue' | 'all';
    ownerId?: string;
    releaseId?: string;
  },
): AssignmentWorkspaceRecord[] {
  let out = records;
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    out = out.filter((r) => {
      const hay = [
        r.assignment.title,
        r.release?.title ?? '',
        r.trackTitle ?? '',
        r.artistName ?? '',
        r.ownerName ?? '',
        r.assignment.role ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }
  if (filters.status && filters.status.length > 0) {
    const statuses = filters.status;
    out = out.filter((r) => statuses.includes(r.assignment.status));
  }
  if (filters.priority && filters.priority.length > 0) {
    const priorities = filters.priority;
    out = out.filter((r) => priorities.includes(r.assignment.priority));
  }
  if (filters.blocked === true) out = out.filter((r) => r.isBlocked);
  if (filters.review === true) out = out.filter((r) => r.requiresReview);
  if (filters.due === 'today') out = out.filter((r) => r.isDueToday);
  if (filters.due === 'overdue') out = out.filter((r) => r.isOverdue);
  if (filters.ownerId) {
    out = out.filter(
      (r) =>
        r.assignment.assigneeId === filters.ownerId
        || r.assignment.assigneeUserId === filters.ownerId,
    );
  }
  if (filters.releaseId) {
    out = out.filter((r) => r.release?.id === filters.releaseId);
  }
  return out;
}
