/**
 * BUILD-014 — Task service.
 *
 * Business validation, assignment orchestration, filtering, sorting.
 * No Firestore code — repository only.
 */
import { Timestamp } from '@firebase/firestore';
import {
  createTask as repoCreate,
  getTask as repoGet,
  updateTask as repoUpdate,
  deleteTask as repoDelete,
  getTasks as repoGetTasks,
  getTasksByRelease as repoGetByRelease,
  getTasksByStatus as repoGetByStatus,
  getTasksByPriority as repoGetByPriority,
  getTasksByIds,
  toJsDate,
  OPEN_STATUSES,
  type TaskRecord,
  type CreateTaskFields,
  type UpdateTaskFields,
  type TaskStatus,
  type TaskPriority,
  type TaskQueryOptions,
} from './task-repository';
import {
  createNewAssignment,
  fetchAssignments,
  fetchAssignmentsByEntity,
} from './assignment-service';
import type { AssignmentRecord } from './assignment-service';
import { updateAssignment } from './assignment-repository';
import { getRelease } from './release-repository';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import {
  resolveActorIdentityKeys,
  assignmentMatchesIdentity,
  actorIsAssignee,
} from './assignment-identity';
import { recordActivity } from './activity-service';

export type {
  TaskRecord,
  CreateTaskFields,
  UpdateTaskFields,
  TaskStatus,
  TaskPriority,
  TaskQueryOptions,
};
export { OPEN_STATUSES, toJsDate } from './task-repository';

/** Contribution role used when linking Task → Assignment. */
export const TASK_ASSIGNMENT_ROLE = 'assignee';

export type TaskListFilter =
  | 'assigned_to_me'
  | 'created_by_me'
  | 'all_open'
  | 'completed'
  | 'overdue'
  | 'due_today'
  | 'this_week';

export interface TaskWithAssignment {
  task: TaskRecord;
  assignment: AssignmentRecord | null;
  assigneeName?: string | null;
  releaseTitle?: string | null;
}

export interface CreateTaskWithAssignmentInput {
  organisationId: string;
  title: string;
  description?: string | null;
  /** Person.id — required; ownership is stored only on Assignment. */
  assigneeId: string;
  assigneeUserId?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
  reminderAt?: Date | null;
  releaseId?: string | null;
  /** Auth uid of creator. */
  createdBy: string;
  assignerUserId?: string | null;
}

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  not_started: ['in_progress', 'blocked', 'cancelled'],
  in_progress: ['blocked', 'review', 'completed', 'cancelled'],
  blocked: ['in_progress', 'cancelled'],
  review: ['in_progress', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function endOfWeek(d = new Date()): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function canTransitionTaskStatus(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  if (to === 'cancelled' && from !== 'completed') return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

async function userCanManageAssignments(orgId: string, userId: string): Promise<boolean> {
  try {
    await AuthorizationService.requireManageAssignments(orgId, userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create Task then Assignment. Rolls back Task if Assignment fails.
 */
export async function createTaskWithAssignment(
  input: CreateTaskWithAssignmentInput,
): Promise<TaskWithAssignment> {
  if (!input.title?.trim()) throw new Error('Title is required');
  if (!input.organisationId) throw new Error('Organisation is required');
  if (!input.assigneeId) throw new Error('Assign To is required');
  if (!input.createdBy) throw new Error('Creator is required');

  const actorUid = input.assignerUserId ?? input.createdBy;
  await AuthorizationService.requireManageAssignments(input.organisationId, actorUid);

  if (input.releaseId) {
    const release = await getRelease(input.releaseId);
    if (!release) throw new Error('Linked release not found');
    const releaseOrg =
      (release as { organizationId?: string; organisationId?: string }).organizationId
      ?? (release as { organisationId?: string }).organisationId;
    if (releaseOrg && releaseOrg !== input.organisationId) {
      throw new Error('Release belongs to a different organisation');
    }
  }

  const dueTs = input.dueDate ? Timestamp.fromDate(input.dueDate) : null;
  const reminderTs = input.reminderAt ? Timestamp.fromDate(input.reminderAt) : null;

  const task = await repoCreate({
    organisationId: input.organisationId,
    releaseId: input.releaseId ?? null,
    title: input.title.trim(),
    description: input.description ?? null,
    priority: input.priority ?? 'medium',
    dueDate: dueTs,
    reminderAt: reminderTs,
    createdBy: input.createdBy,
  });

  let assignment: AssignmentRecord;
  try {
    assignment = await createNewAssignment({
      organizationId: input.organisationId,
      title: task.title,
      description: task.description ?? null,
      entityType: 'task',
      entityId: task.id,
      releaseId: task.releaseId ?? null,
      assigneeId: input.assigneeId,
      assigneeUserId: input.assigneeUserId ?? null,
      assignerId: actorUid,
      assignerUserId: actorUid,
      role: TASK_ASSIGNMENT_ROLE,
      priority: (input.priority ?? 'medium') as AssignmentRecord['priority'],
      dueDate: dueTs,
    });
  } catch (err) {
    try {
      await repoDelete(task.id);
    } catch (rollbackErr) {
      console.error('[task-service] failed to roll back task after assignment error', rollbackErr);
    }
    throw err;
  }

  await recordActivity({
    entityType: 'task',
    entityId: task.id,
    organizationId: input.organisationId,
    actorId: actorUid,
    action: 'task.created',
    metadata: {
      title: task.title,
      assignmentId: assignment.id,
      releaseId: task.releaseId ?? null,
    },
  });

  if (task.releaseId) {
    await recordActivity({
      entityType: 'release',
      entityId: task.releaseId,
      organizationId: input.organisationId,
      actorId: actorUid,
      action: 'task.created',
      metadata: {
        taskId: task.id,
        title: task.title,
        assignmentId: assignment.id,
      },
    });
  }

  return { task, assignment };
}

export async function fetchTask(taskId: string): Promise<TaskRecord | null> {
  return repoGet(taskId);
}

export async function fetchTaskWithAssignment(
  taskId: string,
  organisationId?: string,
): Promise<TaskWithAssignment | null> {
  const task = await repoGet(taskId);
  if (!task) return null;
  if (organisationId && task.organisationId !== organisationId) {
    throw new Error('Task belongs to a different organisation');
  }
  const assignments = await fetchAssignmentsByEntity('task', task.id, {
    organizationId: task.organisationId,
    includeTerminal: true,
  }).catch(() => [] as AssignmentRecord[]);
  const assignment = pickPrimaryAssignment(assignments);
  return { task, assignment };
}

export async function updateTaskDetails(
  taskId: string,
  fields: UpdateTaskFields,
  actorUid: string,
): Promise<TaskRecord> {
  const existing = await repoGet(taskId);
  if (!existing) throw new Error('Task not found');
  await AuthorizationService.requireManageAssignments(existing.organisationId, actorUid);

  if (fields.status && fields.status !== existing.status) {
    if (!canTransitionTaskStatus(existing.status, fields.status)) {
      throw new Error(
        `Invalid status transition: ${existing.status} → ${fields.status}`,
      );
    }
  }

  await repoUpdate(taskId, fields);
  const updated = await repoGet(taskId);
  if (!updated) throw new Error('Task not found after update');

  await recordActivity({
    entityType: 'task',
    entityId: taskId,
    organizationId: existing.organisationId,
    actorId: actorUid,
    action: 'task.updated',
    metadata: { fields: Object.keys(fields) },
  });

  return updated;
}

export async function completeTask(
  taskId: string,
  actorUid: string,
): Promise<TaskRecord> {
  const existing = await repoGet(taskId);
  if (!existing) throw new Error('Task not found');
  if (existing.status === 'completed') return existing;
  if (existing.status === 'cancelled') {
    throw new Error('Cannot complete a cancelled task');
  }

  const canManage = await userCanManageAssignments(existing.organisationId, actorUid);
  if (!canManage) {
    const bundle = await fetchTaskWithAssignment(taskId);
    const assignment = bundle?.assignment;
    if (!assignment) throw new Error('Permission denied');
    const isAssignee = await actorIsAssignee(assignment, actorUid);
    if (!isAssignee) throw new Error('Permission denied');
  }

  // From blocked, move through in_progress then complete is not required —
  // allow complete from any open status except we already blocked cancelled.
  await repoUpdate(taskId, {
    status: 'completed',
    completedAt: Timestamp.now(),
  });

  const updated = await repoGet(taskId);
  if (!updated) throw new Error('Task not found after complete');

  await recordActivity({
    entityType: 'task',
    entityId: taskId,
    organizationId: existing.organisationId,
    actorId: actorUid,
    action: 'task.completed',
    metadata: { title: existing.title },
  });

  return updated;
}

export async function setTaskStatus(
  taskId: string,
  status: TaskStatus,
  actorUid: string,
): Promise<TaskRecord> {
  return updateTaskDetails(taskId, { status }, actorUid);
}

export async function deleteTaskEntity(
  taskId: string,
  actorUid: string,
): Promise<void> {
  const existing = await repoGet(taskId);
  if (!existing) throw new Error('Task not found');
  await AuthorizationService.requireManageAssignments(existing.organisationId, actorUid);

  try {
    const assignments = await fetchAssignmentsByEntity('task', taskId, {
      organizationId: existing.organisationId,
      includeTerminal: true,
    });
    for (const a of assignments) {
      if (!['cancelled', 'archived', 'completed'].includes(a.status)) {
        await updateAssignment(a.id, { status: 'cancelled' });
      }
    }
  } catch (err) {
    console.warn('[task-service] could not cancel linked assignments', err);
  }

  await repoDelete(taskId);

  await recordActivity({
    entityType: 'task',
    entityId: taskId,
    organizationId: existing.organisationId,
    actorId: actorUid,
    action: 'task.deleted',
    metadata: { title: existing.title },
  });
}

export async function reassignTask(
  taskId: string,
  newAssigneeId: string,
  actorUid: string,
): Promise<TaskWithAssignment> {
  const existing = await repoGet(taskId);
  if (!existing) throw new Error('Task not found');
  await AuthorizationService.requireManageAssignments(existing.organisationId, actorUid);

  const prior = await fetchAssignmentsByEntity('task', taskId, {
    organizationId: existing.organisationId,
    includeTerminal: true,
  });
  for (const a of prior) {
    if (!['cancelled', 'archived', 'completed', 'declined'].includes(a.status)) {
      await updateAssignment(a.id, { status: 'cancelled' });
    }
  }

  const assignment = await createNewAssignment({
    organizationId: existing.organisationId,
    title: existing.title,
    description: existing.description ?? null,
    entityType: 'task',
    entityId: existing.id,
    releaseId: existing.releaseId ?? null,
    assigneeId: newAssigneeId,
    assignerId: actorUid,
    assignerUserId: actorUid,
    role: TASK_ASSIGNMENT_ROLE,
    priority: existing.priority as AssignmentRecord['priority'],
    dueDate: existing.dueDate ?? null,
  });

  return { task: existing, assignment };
}

/**
 * Default list sort: Overdue → Due Today → High Priority → Upcoming → Recently Updated
 */
export function sortTasksDefault(rows: TaskWithAssignment[]): TaskWithAssignment[] {
  const now = startOfDay();
  const todayEnd = endOfDay();

  function bucket(row: TaskWithAssignment): number {
    const due = toJsDate(row.task.dueDate);
    const open = OPEN_STATUSES.includes(row.task.status);
    if (open && due && due < now) return 0;
    if (open && due && due >= now && due <= todayEnd) return 1;
    if (open && (row.task.priority === 'urgent' || row.task.priority === 'high')) return 2;
    if (open && due && due > todayEnd) return 3;
    return 4;
  }

  return [...rows].sort((a, b) => {
    const ba = bucket(a);
    const bb = bucket(b);
    if (ba !== bb) return ba - bb;
    if (ba === 2 || ba === 0 || ba === 1) {
      const pr = PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority];
      if (pr !== 0) return pr;
    }
    const da = toJsDate(a.task.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const db = toJsDate(b.task.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (da !== db) return da - db;
    const ua = toJsDate(a.task.updatedAt)?.getTime() ?? 0;
    const ub = toJsDate(b.task.updatedAt)?.getTime() ?? 0;
    return ub - ua;
  });
}

export interface ListTasksParams {
  organisationId: string;
  actorUid: string;
  filter?: TaskListFilter;
  search?: string;
  /** Managers see all; collaborators restricted to assigned. */
  isManager?: boolean;
}

async function loadTaskAssignmentsForOrg(
  organisationId: string,
  includeArchived = false,
): Promise<AssignmentRecord[]> {
  const all = await fetchAssignments(organisationId, { includeArchived });
  return all.filter((a) => a.entityType === 'task');
}

export async function listTasks(
  params: ListTasksParams,
): Promise<TaskWithAssignment[]> {
  const { organisationId, actorUid, filter = 'all_open', search } = params;

  const canManage =
    params.isManager
    ?? (await userCanManageAssignments(organisationId, actorUid));

  const identityKeys = await resolveActorIdentityKeys(organisationId, actorUid);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const weekEnd = endOfWeek();

  let tasks: TaskRecord[];

  if (filter === 'created_by_me') {
    tasks = await repoGetTasks({
      organisationId,
      createdBy: actorUid,
      openOnly: true,
      search,
    });
  } else if (filter === 'assigned_to_me' || !canManage) {
    const taskAssignments = await loadTaskAssignmentsForOrg(
      organisationId,
      filter === 'completed',
    );
    const mine = taskAssignments.filter((a) => assignmentMatchesIdentity(a, identityKeys));
    const taskIds = mine.map((a) => a.entityId).filter(Boolean);
    const loaded = (await getTasksByIds(taskIds)).filter(
      (t) => t.organisationId === organisationId,
    );

    if (filter === 'all_open' || filter === 'assigned_to_me') {
      tasks = loaded.filter((t) => OPEN_STATUSES.includes(t.status));
    } else if (filter === 'completed') {
      tasks = loaded.filter((t) => t.status === 'completed');
    } else if (filter === 'overdue') {
      tasks = loaded.filter((t) => {
        const d = toJsDate(t.dueDate);
        return OPEN_STATUSES.includes(t.status) && d !== null && d < todayStart;
      });
    } else if (filter === 'due_today') {
      tasks = loaded.filter((t) => {
        const d = toJsDate(t.dueDate);
        return OPEN_STATUSES.includes(t.status) && d !== null && d >= todayStart && d <= todayEnd;
      });
    } else if (filter === 'this_week') {
      tasks = loaded.filter((t) => {
        const d = toJsDate(t.dueDate);
        return OPEN_STATUSES.includes(t.status) && d !== null && d >= todayStart && d <= weekEnd;
      });
    } else {
      tasks = loaded.filter((t) => OPEN_STATUSES.includes(t.status));
    }
  } else {
    switch (filter) {
      case 'completed':
        tasks = await repoGetTasks({
          organisationId,
          status: 'completed',
          search,
        });
        break;
      case 'overdue':
        tasks = await repoGetTasks({
          organisationId,
          openOnly: true,
          dueBefore: todayStart,
          search,
        });
        break;
      case 'due_today':
        tasks = await repoGetTasks({
          organisationId,
          openOnly: true,
          dueAfter: todayStart,
          dueBefore: new Date(todayEnd.getTime() + 1),
          search,
        });
        break;
      case 'this_week':
        tasks = await repoGetTasks({
          organisationId,
          openOnly: true,
          dueAfter: todayStart,
          dueBefore: new Date(weekEnd.getTime() + 1),
          search,
        });
        break;
      case 'all_open':
      default:
        tasks = await repoGetTasks({
          organisationId,
          openOnly: true,
          search,
        });
        break;
    }
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q)
        || (t.description ?? '').toLowerCase().includes(q),
    );
  }

  const rows = await enrichWithAssignments(tasks, organisationId);
  return sortTasksDefault(rows);
}

export async function listTasksByRelease(
  organisationId: string,
  releaseId: string,
): Promise<TaskWithAssignment[]> {
  const tasks = await repoGetByRelease(organisationId, releaseId);
  const rows = await enrichWithAssignments(tasks, organisationId);
  return sortTasksDefault(rows);
}

export interface TaskDashboardSummary {
  assignedToMe: number;
  createdByMe: number;
  overdue: number;
  dueToday: number;
  upcoming: number;
}

export async function getTaskDashboardSummary(
  organisationId: string,
  actorUid: string,
): Promise<TaskDashboardSummary> {
  const identityKeys = await resolveActorIdentityKeys(organisationId, actorUid);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const weekEnd = endOfWeek();

  const [taskAssignments, created] = await Promise.all([
    loadTaskAssignmentsForOrg(organisationId, false),
    repoGetTasks({ organisationId, createdBy: actorUid, openOnly: true }),
  ]);

  const mine = taskAssignments.filter((a) => assignmentMatchesIdentity(a, identityKeys));
  const taskIds = mine.map((a) => a.entityId);
  const myTasks = (await getTasksByIds(taskIds)).filter(
    (t) => t.organisationId === organisationId && OPEN_STATUSES.includes(t.status),
  );

  let overdue = 0;
  let dueToday = 0;
  let upcoming = 0;
  for (const t of myTasks) {
    const d = toJsDate(t.dueDate);
    if (!d) continue;
    if (d < todayStart) overdue += 1;
    else if (d <= todayEnd) dueToday += 1;
    else if (d <= weekEnd) upcoming += 1;
  }

  return {
    assignedToMe: myTasks.length,
    createdByMe: created.length,
    overdue,
    dueToday,
    upcoming,
  };
}

export async function fetchTasksByStatus(
  organisationId: string,
  status: TaskStatus | TaskStatus[],
): Promise<TaskRecord[]> {
  return repoGetByStatus(organisationId, status);
}

export async function fetchTasksByPriority(
  organisationId: string,
  priority: TaskPriority | TaskPriority[],
): Promise<TaskRecord[]> {
  return repoGetByPriority(organisationId, priority);
}

/**
 * BUILD-017 — List tasks as canonical TaskCardModel[].
 * Call sites must not assemble presentation labels themselves.
 */
export async function listTaskCardModels(
  params: ListTasksParams,
): Promise<import('./task-card-model').TaskCardModel[]> {
  const rows = await listTasks(params);
  const { toTaskCardModels } = await import('./task-card-model');
  return toTaskCardModels(params.organisationId, rows);
}

export async function listTaskCardModelsByRelease(
  organisationId: string,
  releaseId: string,
): Promise<import('./task-card-model').TaskCardModel[]> {
  const rows = await listTasksByRelease(organisationId, releaseId);
  const { toTaskCardModels } = await import('./task-card-model');
  return toTaskCardModels(organisationId, rows);
}

export { toTaskCardModel, toTaskCardModels } from './task-card-model';
export type {
  TaskCardModel,
  TaskCardMenuAction,
  TaskCardAssignee,
  TaskCardRelease,
} from './task-card-model';

// ── helpers ──────────────────────────────────────────────────────────

function pickPrimaryAssignment(list: AssignmentRecord[]): AssignmentRecord | null {
  if (list.length === 0) return null;
  const active = list.filter(
    (a) => !['cancelled', 'archived', 'declined'].includes(a.status),
  );
  return active[0] ?? list[0] ?? null;
}

async function enrichWithAssignments(
  tasks: TaskRecord[],
  organisationId: string,
): Promise<TaskWithAssignment[]> {
  if (tasks.length === 0) return [];

  return Promise.all(
    tasks.map(async (task) => {
      const assignments = await fetchAssignmentsByEntity('task', task.id, {
        organizationId: organisationId,
        includeTerminal: true,
      }).catch(() => [] as AssignmentRecord[]);
      return {
        task,
        assignment: pickPrimaryAssignment(assignments),
      } satisfies TaskWithAssignment;
    }),
  );
}
