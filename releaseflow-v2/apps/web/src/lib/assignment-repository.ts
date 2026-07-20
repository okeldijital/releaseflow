import {
  doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
  onSnapshot,
  type Unsubscribe,
  type QueryConstraint,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type AssignmentStatus =
  | 'draft'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'declined'
  | 'blocked'
  | 'cancelled'
  | 'archived';

export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AssignmentEntityType =
  | 'release'
  | 'track'
  | 'media_asset'
  | 'artist'
  | 'label'
  | 'person';

export interface AssignmentRecord {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  entityType: AssignmentEntityType;
  entityId: string;
  /** Denormalized when entityType is release or track's parent is known. */
  releaseId?: string | null;
  workflowId?: string | null;
  stageId?: string | null;
  /** Canonical Person.id (DOM-001 / AW-001). */
  assigneeId: string;
  /** Auth uid linked to assignee Person at write time (ARS-003). */
  assigneeUserId?: string | null;
  /** Creator Auth uid (historical) or Person.id — prefer assignerUserId for auth. */
  assignerId: string;
  assignerUserId?: string | null;
  role: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  startDate?: unknown | null;
  dueDate?: unknown | null;
  completedAt?: unknown | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  createdAt: unknown;
  updatedAt: unknown;
  declineReason?: string | null;
  deletedAt?: unknown | null;
  deletedBy?: string | null;
  reviewRequestedBy?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: unknown | null;
  reviewOutcome?: 'approved' | 'changes_requested' | 'rejected' | null;
}

export interface CreateAssignmentFields {
  organizationId: string;
  title: string;
  description?: string | null;
  entityType: AssignmentEntityType;
  entityId: string;
  releaseId?: string | null;
  workflowId?: string | null;
  stageId?: string | null;
  /** Person.id */
  assigneeId: string;
  /** Auth uid for assignee when known */
  assigneeUserId?: string | null;
  assignerId: string;
  assignerUserId?: string | null;
  role: string;
  priority?: AssignmentPriority;
  status?: AssignmentStatus;
  startDate?: unknown | null;
  dueDate?: unknown | null;
  estimatedHours?: number | null;
}

export interface UpdateAssignmentFields {
  title?: string;
  description?: string | null;
  role?: string;
  priority?: AssignmentPriority;
  status?: AssignmentStatus;
  startDate?: unknown | null;
  dueDate?: unknown | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  assigneeId?: string;
  reviewedBy?: string | null;
  reviewedAt?: unknown | null;
  reviewOutcome?: 'approved' | 'changes_requested' | 'rejected' | null;
  reviewRequestedBy?: string | null;
}

function toRecord(id: string, data: Record<string, unknown>): AssignmentRecord {
  const entityType = (data.entityType as AssignmentEntityType) || 'release';
  const entityId = (data.entityId as string) || '';
  const releaseId =
    (data.releaseId as string | null | undefined)
    ?? (entityType === 'release' ? entityId : null);

  return {
    id,
    organizationId: data.organizationId as string || '',
    title: data.title as string || '',
    description: data.description as string | null | undefined,
    entityType,
    entityId,
    releaseId,
    workflowId: data.workflowId as string | null | undefined,
    stageId: data.stageId as string | null | undefined,
    assigneeId: data.assigneeId as string || '',
    assigneeUserId: (data.assigneeUserId as string | null | undefined) ?? null,
    assignerId: data.assignerId as string || '',
    assignerUserId: (data.assignerUserId as string | null | undefined) ?? null,
    role: data.role as string || '',
    priority: (data.priority as AssignmentPriority) || 'medium',
    status: (data.status as AssignmentStatus) || 'draft',
    startDate: data.startDate as unknown | null | undefined,
    dueDate: data.dueDate as unknown | null | undefined,
    completedAt: data.completedAt as unknown | null | undefined,
    estimatedHours: data.estimatedHours as number | null | undefined,
    actualHours: data.actualHours as number | null | undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    declineReason: data.declineReason as string | null | undefined,
    deletedAt: data.deletedAt as unknown | null | undefined,
    deletedBy: data.deletedBy as string | null | undefined,
    reviewRequestedBy: data.reviewRequestedBy as string | null | undefined,
    reviewedBy: data.reviewedBy as string | null | undefined,
    reviewedAt: data.reviewedAt as unknown | null | undefined,
    reviewOutcome: data.reviewOutcome as 'approved' | 'changes_requested' | 'rejected' | null | undefined,
  };
}

/** Shared status filter for list surfaces (ARS-003). */
export const TERMINAL_ASSIGNMENT_STATUSES: AssignmentStatus[] = [
  'archived',
  'cancelled',
  'declined',
];

export function isActiveAssignmentStatus(status: AssignmentStatus): boolean {
  return !TERMINAL_ASSIGNMENT_STATUSES.includes(status);
}

export async function createAssignment(fields: CreateAssignmentFields): Promise<AssignmentRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const status = fields.status ?? 'assigned';
  const priority = fields.priority ?? 'medium';
  const releaseId =
    fields.releaseId
    ?? (fields.entityType === 'release' ? fields.entityId : null);

  const payload = {
    organizationId: fields.organizationId,
    title: fields.title,
    description: fields.description ?? null,
    entityType: fields.entityType,
    entityId: fields.entityId,
    releaseId: releaseId ?? null,
    workflowId: fields.workflowId ?? null,
    stageId: fields.stageId ?? null,
    assigneeId: fields.assigneeId,
    assigneeUserId: fields.assigneeUserId ?? null,
    assignerId: fields.assignerId,
    assignerUserId: fields.assignerUserId ?? fields.assignerId,
    role: fields.role,
    priority,
    status,
    startDate: fields.startDate ?? null,
    dueDate: fields.dueDate ?? null,
    estimatedHours: fields.estimatedHours ?? null,
    actualHours: null,
    completedAt: null,
    reviewRequestedBy: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewOutcome: null,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, 'assignments'), payload);
  return toRecord(ref.id, { ...payload, id: ref.id });
}

export async function findDuplicateAssignment(
  organizationId: string,
  entityType: AssignmentEntityType,
  entityId: string,
  assigneeId: string,
  role: string,
): Promise<AssignmentRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, 'assignments'),
      where('organizationId', '==', organizationId),
    ),
  );
  const match = snap.docs.find((d) => {
    const data = d.data();
    return (
      data.entityType === entityType &&
      data.entityId === entityId &&
      data.assigneeId === assigneeId &&
      data.role === role &&
      data.status !== 'archived'
    );
  });
  return match ? toRecord(match.id, match.data() as Record<string, unknown>) : null;
}

/**
 * BUG-002 — Canonical single-document lookup.
 * Returns null only when the document does not exist.
 * Throws when Firestore is unavailable or the ID is invalid.
 */
export async function getAssignment(assignmentId: string): Promise<AssignmentRecord | null> {
  if (!assignmentId || typeof assignmentId !== 'string' || !assignmentId.trim()) {
    throw new Error('INVALID_ASSIGNMENT_ID');
  }
  const id = assignmentId.trim();
  const db = getDb();
  if (!db) {
    throw new Error('FIRESTORE_UNAVAILABLE');
  }
  const snap = await getDoc(doc(db, 'assignments', id));
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as Record<string, unknown>);
}

export async function updateAssignment(assignmentId: string, fields: UpdateAssignmentFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { ...fields, updatedAt: Timestamp.now() };
  if (fields.status === 'completed') updateData.completedAt = Timestamp.now();
  await updateDoc(doc(db, 'assignments', assignmentId), updateData);
}

export async function listAssignments(orgId: string, opts?: { includeArchived?: boolean }): Promise<AssignmentRecord[]> {
  return getAssignments({
    organizationId: orgId,
    includeArchived: opts?.includeArchived,
  });
}

/**
 * BUILD-001 — Composable assignment query API.
 * Returns Assignment records only. No Needs Attention / Work Score / UI filters.
 * Implicit filtering is forbidden beyond explicit options.
 */
export interface AssignmentQueryOptions {
  organizationId: string;
  assigneeId?: string;
  assignerId?: string;
  releaseId?: string;
  trackId?: string;
  entityType?: AssignmentEntityType;
  entityId?: string;
  status?: AssignmentStatus | AssignmentStatus[];
  stageId?: string;
  priority?: AssignmentPriority | AssignmentPriority[];
  blocked?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
  review?: boolean;
  search?: string;
  /** When true, include archived/cancelled/declined. Default false (active only). */
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'oldest' | 'dueAsc' | 'dueDesc' | 'priority' | 'updated';
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

export async function getAssignments(options: AssignmentQueryOptions): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const orgId = options.organizationId;
  if (!orgId) return [];

  let docs: AssignmentRecord[];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'assignments'),
        where('organizationId', '==', orgId),
        orderBy('createdAt', 'desc'),
      ),
    );
    docs = snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.error('[assignments] getAssignments ordered query failed; falling back', err);
    const snap = await getDocs(
      query(collection(db, 'assignments'), where('organizationId', '==', orgId)),
    );
    docs = snap.docs
      .map((d) => toRecord(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => getDateMs(b.createdAt) - getDateMs(a.createdAt));
  }

  let results = docs;

  if (!options.includeArchived) {
    results = results.filter((a) => isActiveAssignmentStatus(a.status));
  }

  if (options.assigneeId) {
    results = results.filter(
      (a) => a.assigneeId === options.assigneeId || a.assigneeUserId === options.assigneeId,
    );
  }
  if (options.assignerId) {
    results = results.filter(
      (a) => a.assignerId === options.assignerId || a.assignerUserId === options.assignerId,
    );
  }
  if (options.releaseId) {
    results = results.filter(
      (a) =>
        a.releaseId === options.releaseId
        || (a.entityType === 'release' && a.entityId === options.releaseId),
    );
  }
  if (options.trackId) {
    results = results.filter(
      (a) => a.entityType === 'track' && a.entityId === options.trackId,
    );
  }
  if (options.entityType) {
    results = results.filter((a) => a.entityType === options.entityType);
  }
  if (options.entityId) {
    results = results.filter((a) => a.entityId === options.entityId);
  }
  if (options.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    results = results.filter((a) => statuses.includes(a.status));
  }
  if (options.stageId) {
    results = results.filter((a) => a.stageId === options.stageId);
  }
  if (options.priority) {
    const prios = Array.isArray(options.priority) ? options.priority : [options.priority];
    results = results.filter((a) => prios.includes(a.priority));
  }
  if (options.blocked === true) {
    results = results.filter((a) => a.status === 'blocked');
  } else if (options.blocked === false) {
    results = results.filter((a) => a.status !== 'blocked');
  }
  if (options.review === true) {
    results = results.filter((a) => a.status === 'review');
  } else if (options.review === false) {
    results = results.filter((a) => a.status !== 'review');
  }
  if (options.dueBefore) {
    const cutoff = options.dueBefore.getTime();
    results = results.filter((a) => {
      const ms = getDateMs(a.dueDate);
      return ms > 0 && ms < cutoff;
    });
  }
  if (options.dueAfter) {
    const cutoff = options.dueAfter.getTime();
    results = results.filter((a) => {
      const ms = getDateMs(a.dueDate);
      return ms > 0 && ms >= cutoff;
    });
  }
  if (options.search?.trim()) {
    const term = options.search.trim().toLowerCase();
    results = results.filter((a) => (a.title ?? '').toLowerCase().includes(term));
  }

  switch (options.sort) {
    case 'oldest':
      results = [...results].sort((a, b) => getDateMs(a.createdAt) - getDateMs(b.createdAt));
      break;
    case 'dueAsc':
      results = [...results].sort((a, b) => getDateMs(a.dueDate) - getDateMs(b.dueDate));
      break;
    case 'dueDesc':
      results = [...results].sort((a, b) => getDateMs(b.dueDate) - getDateMs(a.dueDate));
      break;
    case 'priority':
      results = [...results].sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
      );
      break;
    case 'updated':
      results = [...results].sort((a, b) => getDateMs(b.updatedAt) - getDateMs(a.updatedAt));
      break;
    case 'newest':
    default:
      results = [...results].sort((a, b) => getDateMs(b.createdAt) - getDateMs(a.createdAt));
      break;
  }

  if (options.page != null && options.pageSize != null && options.pageSize > 0) {
    const page = Math.max(0, options.page);
    const start = page * options.pageSize;
    results = results.slice(start, start + options.pageSize);
  }

  return results;
}

export async function getAssignmentsByAssignee(personId: string, orgId?: string): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const constraints = [where('assigneeId', '==', personId), orderBy('createdAt', 'desc')];
  const snap = await getDocs(query(collection(db, 'assignments'), ...constraints));
  let results = snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  if (orgId) results = results.filter((a) => a.organizationId === orgId);
  return results;
}

/**
 * ARS-004.3 — Real-time org assignment stream.
 * Pages must not call onSnapshot; only the repository owns listeners.
 */
export function subscribeOrgAssignments(
  organizationId: string,
  onData: (assignments: AssignmentRecord[]) => void,
  onError?: (error: Error) => void,
  opts?: { includeArchived?: boolean },
): Unsubscribe {
  const db = getDb();
  if (!db || !organizationId) {
    onData([]);
    return () => {};
  }

  const constraints: QueryConstraint[] = [
    where('organizationId', '==', organizationId),
    orderBy('createdAt', 'desc'),
  ];

  const mapAndFilter = (docs: AssignmentRecord[]) => {
    if (opts?.includeArchived) return docs;
    return docs.filter((a) => isActiveAssignmentStatus(a.status));
  };

  let fallbackUnsub: Unsubscribe | null = null;
  const primaryUnsub = onSnapshot(
    query(collection(db, 'assignments'), ...constraints),
    (snap) => {
      const docs = snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
      onData(mapAndFilter(docs));
    },
    (err) => {
      console.error('[assignments] subscribeOrgAssignments ordered failed; falling back', err);
      fallbackUnsub = onSnapshot(
        query(collection(db, 'assignments'), where('organizationId', '==', organizationId)),
        (snap) => {
          const docs = snap.docs
            .map((d) => toRecord(d.id, d.data() as Record<string, unknown>))
            .sort((a, b) => {
              const at = (a.createdAt as { seconds?: number })?.seconds ?? 0;
              const bt = (b.createdAt as { seconds?: number })?.seconds ?? 0;
              return bt - at;
            });
          onData(mapAndFilter(docs));
        },
        (err2) => {
          onError?.(err2 instanceof Error ? err2 : new Error(String(err2)));
          onData([]);
        },
      );
    },
  );

  return () => {
    primaryUnsub();
    fallbackUnsub?.();
  };
}

/**
 * ARS-004.3 — Real-time entity assignment stream (e.g. release workspace).
 */
export function subscribeEntityAssignments(
  entityType: AssignmentEntityType,
  entityId: string,
  onData: (assignments: AssignmentRecord[]) => void,
  onError?: (error: Error) => void,
  opts?: { organizationId?: string; includeTerminal?: boolean },
): Unsubscribe {
  const db = getDb();
  if (!db || !entityId) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(
      collection(db, 'assignments'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
    ),
    (snap) => {
      let docs = snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
      if (opts?.organizationId) {
        docs = docs.filter((a) => a.organizationId === opts.organizationId);
      }
      if (!opts?.includeTerminal) {
        docs = docs.filter((a) => isActiveAssignmentStatus(a.status));
      }
      onData(docs);
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      onData([]);
    },
  );
}

export async function getAssignmentsByAssigner(assignerId: string, orgId?: string): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const constraints = [where('assignerId', '==', assignerId), orderBy('createdAt', 'desc')];
  const snap = await getDocs(query(collection(db, 'assignments'), ...constraints));
  let results = snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  if (orgId) results = results.filter((a) => a.organizationId === orgId);
  return results;
}

export async function getAssignmentsByEntity(
  entityType: AssignmentEntityType,
  entityId: string,
  opts?: { organizationId?: string; includeTerminal?: boolean },
): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'assignments'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
    ),
  );
  let docs = snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  if (opts?.organizationId) {
    docs = docs.filter((a) => a.organizationId === opts.organizationId);
  }
  if (!opts?.includeTerminal) {
    docs = docs.filter((a) => isActiveAssignmentStatus(a.status));
  }
  return docs;
}

export async function assignUser(assignmentId: string, assigneeId: string): Promise<void> {
  await updateDoc(doc(getDb()!, 'assignments', assignmentId), {
    assigneeId, status: 'assigned', updatedAt: Timestamp.now(),
  });
}

export async function acceptAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'accepted', updatedAt: Timestamp.now(),
  });
}

export async function declineAssignment(assignmentId: string, reason?: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { status: 'declined', updatedAt: Timestamp.now() };
  if (reason) update.declineReason = reason;
  await updateDoc(doc(db, 'assignments', assignmentId), update);
}

export async function markStarted(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'in_progress', startDate: Timestamp.now(), updatedAt: Timestamp.now(),
  });
}

export async function blockAssignment(assignmentId: string, reason?: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { status: 'blocked', updatedAt: Timestamp.now() };
  if (reason) update.blockReason = reason;
  await updateDoc(doc(db, 'assignments', assignmentId), update);
}

export async function unblockAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'in_progress', updatedAt: Timestamp.now(),
  });
}

export async function submitForReview(assignmentId: string, requestedBy: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'review',
    reviewRequestedBy: requestedBy,
    reviewedBy: null,
    reviewedAt: null,
    reviewOutcome: null,
    updatedAt: Timestamp.now(),
  });
}

export async function approveAssignment(assignmentId: string, reviewerId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'completed',
    completedAt: now,
    reviewedBy: reviewerId,
    reviewedAt: now,
    reviewOutcome: 'approved',
    updatedAt: now,
  });
}

export async function requestChangesAssignment(
  assignmentId: string,
  reviewerId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'in_progress',
    reviewedBy: reviewerId,
    reviewedAt: now,
    reviewOutcome: 'changes_requested',
    updatedAt: now,
  });
}

export async function rejectAssignmentReview(
  assignmentId: string,
  reviewerId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'cancelled',
    reviewedBy: reviewerId,
    reviewedAt: now,
    reviewOutcome: 'rejected',
    updatedAt: now,
  });
}

export async function completeAssignment(assignmentId: string, actualHours?: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = {
    status: 'completed', completedAt: Timestamp.now(), updatedAt: Timestamp.now(),
  };
  if (actualHours !== undefined) updateData.actualHours = actualHours;
  await updateDoc(doc(db, 'assignments', assignmentId), updateData);
}

export async function reopenAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'in_progress', completedAt: null, updatedAt: Timestamp.now(),
  });
}

export async function archiveAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'archived', updatedAt: Timestamp.now(),
  });
}

export async function restoreAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'draft', updatedAt: Timestamp.now(),
  });
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'assignments', assignmentId));
}

export async function searchAssignments(orgId: string, queryStr: string): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const q = queryStr.toLowerCase();
  const snap = await getDocs(
    query(collection(db, 'assignments'), where('organizationId', '==', orgId)),
  );
  return snap.docs
    .map((d) => toRecord(d.id, d.data() as Record<string, unknown>))
    .filter((a) => a.title.toLowerCase().includes(q));
}

export async function getAssignmentStats(assigneeId: string, orgId: string): Promise<{
  total: number;
  active: number;
  overdue: number;
  completed: number;
  completionRate: number;
  estimatedHours: number;
  actualHours: number;
}> {
  const assignments = await getAssignmentsByAssignee(assigneeId, orgId);
  const active = assignments.filter((a) => !['completed', 'archived', 'cancelled', 'declined'].includes(a.status));
  const completed = assignments.filter((a) => a.status === 'completed');
  const now = Date.now();
  const overdue = active.filter((a) => a.dueDate && (a.dueDate as Timestamp).toDate().getTime() < now);
  return {
    total: assignments.length,
    active: active.length,
    overdue: overdue.length,
    completed: completed.length,
    completionRate: assignments.length > 0 ? Math.round((completed.length / assignments.length) * 100) : 0,
    estimatedHours: active.reduce((s, a) => s + (a.estimatedHours ?? 0), 0),
    actualHours: completed.reduce((s, a) => s + (a.actualHours ?? 0), 0),
  };
}
