/**
 * BUILD-014 — Task domain repository.
 *
 * Task is a unit of work. Ownership lives exclusively on Assignment
 * (entityType: 'task', entityId: task.id). No assignee fields here.
 */
import {
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  type QueryConstraint,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'completed'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskRecord {
  id: string;
  organisationId: string;
  releaseId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: unknown | null;
  reminderAt?: unknown | null;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
  completedAt?: unknown | null;
}

export interface CreateTaskFields {
  organisationId: string;
  releaseId?: string | null;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: unknown | null;
  reminderAt?: unknown | null;
  createdBy: string;
  status?: TaskStatus;
}

export interface UpdateTaskFields {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: unknown | null;
  reminderAt?: unknown | null;
  releaseId?: string | null;
  completedAt?: unknown | null;
}

export interface TaskQueryOptions {
  organisationId: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  releaseId?: string | null;
  createdBy?: string;
  /** When true, only open (non-terminal) statuses. */
  openOnly?: boolean;
  /** ISO date range bounds on dueDate (inclusive start, exclusive end optional). */
  dueBefore?: Date;
  dueAfter?: Date;
  search?: string;
  limit?: number;
}

const OPEN_STATUSES: TaskStatus[] = [
  'not_started',
  'in_progress',
  'blocked',
  'review',
];

const TERMINAL_STATUSES: TaskStatus[] = ['completed', 'cancelled'];

export { OPEN_STATUSES, TERMINAL_STATUSES };

function toRecord(id: string, data: Record<string, unknown>): TaskRecord {
  return {
    id,
    organisationId:
      (data.organisationId as string)
      || (data.organizationId as string)
      || '',
    releaseId: (data.releaseId as string | null | undefined) ?? null,
    title: (data.title as string) || '',
    description: (data.description as string | null | undefined) ?? null,
    status: (data.status as TaskStatus) || 'not_started',
    priority: (data.priority as TaskPriority) || 'medium',
    dueDate: data.dueDate as unknown | null | undefined,
    reminderAt: data.reminderAt as unknown | null | undefined,
    createdBy: (data.createdBy as string) || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    completedAt: data.completedAt as unknown | null | undefined,
  };
}

/** Only BUILD-014 tasks have organisationId; skip legacy stage tasks. */
function isDomainTask(data: Record<string, unknown>): boolean {
  return Boolean(data.organisationId || data.organizationId);
}

export async function createTask(fields: CreateTaskFields): Promise<TaskRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');

  const now = Timestamp.now();
  const payload = {
    organisationId: fields.organisationId,
    releaseId: fields.releaseId ?? null,
    title: fields.title.trim(),
    description: fields.description?.trim() || null,
    status: fields.status ?? 'not_started',
    priority: fields.priority ?? 'medium',
    dueDate: fields.dueDate ?? null,
    reminderAt: fields.reminderAt ?? null,
    createdBy: fields.createdBy,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  const ref = await addDoc(collection(db, 'tasks'), payload);
  return toRecord(ref.id, { ...payload, id: ref.id });
}

export async function getTask(taskId: string): Promise<TaskRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'tasks', taskId));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (!isDomainTask(data)) return null;
  return toRecord(snap.id, data);
}

export async function updateTask(
  taskId: string,
  fields: UpdateTaskFields,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');

  const updateData: Record<string, unknown> = {
    ...fields,
    updatedAt: Timestamp.now(),
  };
  if (fields.title !== undefined) {
    updateData.title = fields.title.trim();
  }
  if (fields.description !== undefined) {
    updateData.description = fields.description?.trim() || null;
  }
  if (fields.status === 'completed' && fields.completedAt === undefined) {
    updateData.completedAt = Timestamp.now();
  }
  if (fields.status && fields.status !== 'completed' && fields.completedAt === undefined) {
    updateData.completedAt = null;
  }

  await updateDoc(doc(db, 'tasks', taskId), updateData);
}

export async function deleteTask(taskId: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  await deleteDoc(doc(db, 'tasks', taskId));
}

/**
 * Server-side filtered list. Always scopes by organisationId.
 * Additional filters use composite indexes where possible.
 */
export async function getTasks(options: TaskQueryOptions): Promise<TaskRecord[]> {
  const db = getDb();
  if (!db) return [];
  if (!options.organisationId) return [];

  const base: QueryConstraint[] = [
    where('organisationId', '==', options.organisationId),
  ];

  // Prefer a single equality filter that maps to an index; rest filtered after.
  if (options.releaseId) {
    base.push(where('releaseId', '==', options.releaseId));
  } else if (options.createdBy) {
    base.push(where('createdBy', '==', options.createdBy));
  } else if (typeof options.status === 'string') {
    base.push(where('status', '==', options.status));
  } else if (typeof options.priority === 'string') {
    base.push(where('priority', '==', options.priority));
  }

  let docs: TaskRecord[] = [];
  try {
    const snap = await getDocs(
      query(collection(db, 'tasks'), ...base, orderBy('updatedAt', 'desc')),
    );
    docs = snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        if (!isDomainTask(data)) return null;
        return toRecord(d.id, data);
      })
      .filter((r): r is TaskRecord => r !== null);
  } catch (err) {
    console.warn('[tasks] ordered query failed; falling back', err);
    const snap = await getDocs(query(collection(db, 'tasks'), ...base));
    docs = snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        if (!isDomainTask(data)) return null;
        return toRecord(d.id, data);
      })
      .filter((r): r is TaskRecord => r !== null)
      .sort((a, b) => {
        const ua = toJsDate(a.updatedAt)?.getTime() ?? 0;
        const ub = toJsDate(b.updatedAt)?.getTime() ?? 0;
        return ub - ua;
      });
  }

  let rows = docs;
  // Remaining filters (status array, openOnly, priority array, date, search)
  if (options.openOnly) {
    rows = rows.filter((t) => OPEN_STATUSES.includes(t.status));
  }
  if (Array.isArray(options.status)) {
    const set = new Set(options.status);
    rows = rows.filter((t) => set.has(t.status));
  } else if (typeof options.status === 'string' && !rows.every((t) => t.status === options.status)) {
    rows = rows.filter((t) => t.status === options.status);
  }
  if (Array.isArray(options.priority)) {
    const set = new Set(options.priority);
    rows = rows.filter((t) => set.has(t.priority));
  } else if (typeof options.priority === 'string') {
    rows = rows.filter((t) => t.priority === options.priority);
  }
  if (options.releaseId) {
    rows = rows.filter((t) => t.releaseId === options.releaseId);
  }
  if (options.createdBy) {
    rows = rows.filter((t) => t.createdBy === options.createdBy);
  }
  if (options.dueBefore || options.dueAfter) {
    rows = rows.filter((t) => {
      const d = toJsDate(t.dueDate);
      if (!d) return false;
      if (options.dueAfter && d < options.dueAfter) return false;
      if (options.dueBefore && d >= options.dueBefore) return false;
      return true;
    });
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    rows = rows.filter(
      (t) =>
        t.title.toLowerCase().includes(q)
        || (t.description ?? '').toLowerCase().includes(q),
    );
  }

  if (options.limit && options.limit > 0) {
    rows = rows.slice(0, options.limit);
  }

  return rows;
}

export async function getTasksByRelease(
  organisationId: string,
  releaseId: string,
): Promise<TaskRecord[]> {
  return getTasks({ organisationId, releaseId });
}

export async function getTasksByStatus(
  organisationId: string,
  status: TaskStatus | TaskStatus[],
): Promise<TaskRecord[]> {
  return getTasks({ organisationId, status });
}

export async function getTasksByPriority(
  organisationId: string,
  priority: TaskPriority | TaskPriority[],
): Promise<TaskRecord[]> {
  return getTasks({ organisationId, priority });
}

export async function getTasksByIds(taskIds: string[]): Promise<TaskRecord[]> {
  if (taskIds.length === 0) return [];
  const unique = [...new Set(taskIds.filter(Boolean))];
  const results = await Promise.all(unique.map((id) => getTask(id)));
  return results.filter((t): t is TaskRecord => t !== null);
}

export function toJsDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object') {
    if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    if ('seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
      return new Date((value as { seconds: number }).seconds * 1000);
    }
  }
  return null;
}
