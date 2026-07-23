/**
 * BUILD-017 — Canonical TaskCard view model + mapper.
 *
 * Firestore → Task Service → toTaskCardModels() → TaskCardModel → TaskCard
 * Pages do not compute task presentation labels.
 */
import { getRelease } from './release-repository';
import { getArtworksByReleaseIds } from './artwork/artwork-repository';
import type { Artwork } from './artwork/artwork-types';
import { getPeopleByOrg, getPerson, type PersonRecord } from './people-repository';
import {
  resolvePersonIdentity,
  type Identity,
} from './identity-service';
import {
  toJsDate,
  type TaskRecord,
  type TaskStatus,
  type TaskPriority,
} from './task-repository';
import type { TaskWithAssignment } from './task-service';

/** Overflow menu actions prepared by the mapper (card never invents them). */
export type TaskCardMenuAction =
  | 'open'
  | 'complete'
  | 'edit'
  | 'reassign'
  | 'delete';

export interface TaskCardAssignee {
  personId: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface TaskCardRelease {
  id: string;
  title: string;
  artworkUrl: string | null;
}

export interface TaskCardModel {
  id: string;
  organisationId: string;
  title: string;
  /** Display priority label, e.g. "High" */
  priority: string;
  priorityKey: TaskPriority;
  /** Display status label, e.g. "In Progress" */
  status: string;
  statusKey: TaskStatus;
  /** Status token for StatusBadge colour map */
  statusToken: string;
  assignee: TaskCardAssignee | null;
  release: TaskCardRelease | null;
  /** Human due label; null when no due date */
  dueLabel: string | null;
  /** True when open and past due */
  isOverdue: boolean;
  /** Human reminder label; null when absent */
  reminderLabel: string | null;
  /** 0–100 when progression applies; null to hide */
  progress: number | null;
  menuActions: TaskCardMenuAction[];
  href: string;
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  review: 'Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-surface-800 text-content-secondary',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

export function priorityBadgeColor(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.medium;
}

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayDiff(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/**
 * Human-readable due label. No raw timestamps.
 * Examples: Today · Tomorrow · In 3 days · Overdue by 2 days
 */
export function formatTaskDueLabel(
  due: unknown,
  now: Date = new Date(),
  status?: TaskStatus,
): { label: string | null; isOverdue: boolean } {
  const date = toJsDate(due);
  if (!date) return { label: null, isOverdue: false };

  const open =
    !status
    || (status !== 'completed' && status !== 'cancelled');
  const diff = dayDiff(now, date); // positive = due in future

  if (open && diff < 0) {
    const days = Math.abs(diff);
    return {
      label: days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`,
      isOverdue: true,
    };
  }
  if (diff === 0) return { label: 'Today', isOverdue: false };
  if (diff === 1) return { label: 'Tomorrow', isOverdue: false };
  if (diff > 1 && diff <= 7) return { label: `In ${diff} days`, isOverdue: false };

  // Beyond a week: still human, not a raw ISO stamp
  const formatted = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  return { label: formatted, isOverdue: false };
}

/**
 * Human-readable reminder label when present.
 * Example: "Today 14:00" / "Tomorrow 09:30"
 */
export function formatTaskReminderLabel(
  reminder: unknown,
  now: Date = new Date(),
): string | null {
  const date = toJsDate(reminder);
  if (!date) return null;

  const time = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const diff = dayDiff(now, date);
  if (diff === 0) return `Today ${time}`;
  if (diff === 1) return `Tomorrow ${time}`;
  if (diff === -1) return `Yesterday ${time}`;
  const day = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  return `${day} ${time}`;
}

/**
 * Progress only when status supports a linear progression.
 * Blocked / cancelled hide gracefully (null).
 */
export function computeTaskProgress(status: TaskStatus): number | null {
  switch (status) {
    case 'not_started':
      return 0;
    case 'in_progress':
      return 50;
    case 'review':
      return 80;
    case 'completed':
      return 100;
    case 'blocked':
    case 'cancelled':
    default:
      return null;
  }
}

export function resolveTaskMenuActions(task: TaskRecord): TaskCardMenuAction[] {
  const actions: TaskCardMenuAction[] = ['open'];
  if (task.status !== 'completed' && task.status !== 'cancelled') {
    actions.push('complete');
  }
  actions.push('edit', 'reassign', 'delete');
  return actions;
}

/**
 * Map a single task + resolved context into the card model (no I/O).
 */
export function toTaskCardModel(
  task: TaskRecord,
  opts?: {
    assignee?: TaskCardAssignee | null;
    release?: TaskCardRelease | null;
    now?: Date;
  },
): TaskCardModel {
  const now = opts?.now ?? new Date();
  const due = formatTaskDueLabel(task.dueDate, now, task.status);
  return {
    id: task.id,
    organisationId: task.organisationId,
    title: task.title,
    priority: PRIORITY_LABELS[task.priority] ?? task.priority,
    priorityKey: task.priority,
    status: STATUS_LABELS[task.status] ?? task.status,
    statusKey: task.status,
    statusToken: task.status,
    assignee: opts?.assignee ?? null,
    release: opts?.release ?? null,
    dueLabel: due.label,
    isOverdue: due.isOverdue,
    reminderLabel: formatTaskReminderLabel(task.reminderAt, now),
    progress: computeTaskProgress(task.status),
    menuActions: resolveTaskMenuActions(task),
    href: `/tasks/${task.id}`,
  };
}

function identityToAssignee(
  personId: string,
  identity: Identity,
  userId: string | null,
): TaskCardAssignee {
  return {
    personId,
    userId,
    displayName: identity.displayName,
    avatarUrl: identity.avatarUrl,
  };
}

async function resolveAssigneesBatch(
  organisationId: string,
  personIds: string[],
): Promise<Map<string, TaskCardAssignee>> {
  const unique = [...new Set(personIds.filter(Boolean))];
  const map = new Map<string, TaskCardAssignee>();
  if (unique.length === 0) return map;

  let peopleById = new Map<string, PersonRecord>();
  try {
    const people = await getPeopleByOrg(organisationId);
    peopleById = new Map(people.map((p) => [p.id, p]));
  } catch {
    peopleById = new Map();
  }

  await Promise.all(
    unique.map(async (personId) => {
      try {
        let person = peopleById.get(personId) ?? null;
        if (!person) {
          person = await getPerson(personId);
        }
        if (person) {
          const identity = await resolvePersonIdentity(person);
          map.set(
            personId,
            identityToAssignee(personId, identity, person.userId ?? null),
          );
          return;
        }
      } catch {
        /* fall through */
      }
      map.set(personId, {
        personId,
        userId: null,
        displayName: 'Unknown',
        avatarUrl: null,
      });
    }),
  );

  return map;
}

async function resolveReleasesBatch(
  organisationId: string,
  releaseIds: string[],
): Promise<Map<string, TaskCardRelease>> {
  const unique = [...new Set(releaseIds.filter(Boolean))];
  const map = new Map<string, TaskCardRelease>();
  if (unique.length === 0) return map;

  const releases = await Promise.all(
    unique.map(async (id) => {
      try {
        return await getRelease(id);
      } catch {
        return null;
      }
    }),
  );

  const artworkByRelease = new Map<string, Artwork>();
  for (let i = 0; i < unique.length; i += 10) {
    const chunk = unique.slice(i, i + 10);
    try {
      const artworks = await getArtworksByReleaseIds(organisationId, chunk);
      for (const a of artworks) {
        if (!artworkByRelease.has(a.releaseId)) {
          artworkByRelease.set(a.releaseId, a);
        }
      }
    } catch {
      /* best-effort artwork */
    }
  }

  for (const release of releases) {
    if (!release) continue;
    // Tenant guard
    if (release.organizationId && release.organizationId !== organisationId) {
      continue;
    }
    const title =
      release.displayTitle?.trim()
      || release.title?.trim()
      || release.id;
    const art =
      artworkByRelease.get(release.id)
      ?? release.artwork
      ?? null;
    map.set(release.id, {
      id: release.id,
      title,
      artworkUrl: art?.secureUrl ?? null,
    });
  }

  return map;
}

/**
 * Batch enrichment: resolve assignees, releases, and artwork once.
 * No N+1 presentation logic in pages.
 */
export async function toTaskCardModels(
  organisationId: string,
  rows: TaskWithAssignment[],
  opts?: { now?: Date },
): Promise<TaskCardModel[]> {
  if (rows.length === 0) return [];

  const personIds = rows
    .map((r) => r.assignment?.assigneeId)
    .filter((id): id is string => Boolean(id));
  const releaseIds = rows
    .map((r) => r.task.releaseId)
    .filter((id): id is string => Boolean(id));

  const [assignees, releases] = await Promise.all([
    resolveAssigneesBatch(organisationId, personIds),
    resolveReleasesBatch(organisationId, releaseIds),
  ]);

  const now = opts?.now ?? new Date();

  return rows.map((row) => {
    const assigneeId = row.assignment?.assigneeId;
    const assignee = assigneeId ? (assignees.get(assigneeId) ?? null) : null;
    const releaseId = row.task.releaseId;
    const release = releaseId ? (releases.get(releaseId) ?? null) : null;
    return toTaskCardModel(row.task, { assignee, release, now });
  });
}
