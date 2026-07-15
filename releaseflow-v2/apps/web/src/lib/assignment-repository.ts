import {
  doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
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
  workflowId?: string | null;
  stageId?: string | null;
  assigneeId: string;
  assignerId: string;
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
  deletedAt?: unknown | null;
  deletedBy?: string | null;
}

export interface CreateAssignmentFields {
  organizationId: string;
  title: string;
  description?: string | null;
  entityType: AssignmentEntityType;
  entityId: string;
  workflowId?: string | null;
  stageId?: string | null;
  assigneeId: string;
  assignerId: string;
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
}

function toRecord(id: string, data: Record<string, unknown>): AssignmentRecord {
  return {
    id,
    organizationId: data.organizationId as string || '',
    title: data.title as string || '',
    description: data.description as string | null | undefined,
    entityType: data.entityType as AssignmentEntityType || 'release',
    entityId: data.entityId as string || '',
    workflowId: data.workflowId as string | null | undefined,
    stageId: data.stageId as string | null | undefined,
    assigneeId: data.assigneeId as string || '',
    assignerId: data.assignerId as string || '',
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
    deletedAt: data.deletedAt as unknown | null | undefined,
    deletedBy: data.deletedBy as string | null | undefined,
  };
}

export async function createAssignment(fields: CreateAssignmentFields): Promise<AssignmentRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'assignments'), {
    organizationId: fields.organizationId,
    title: fields.title,
    description: fields.description ?? null,
    entityType: fields.entityType,
    entityId: fields.entityId,
    workflowId: fields.workflowId ?? null,
    stageId: fields.stageId ?? null,
    assigneeId: fields.assigneeId,
    assignerId: fields.assignerId,
    role: fields.role,
    priority: fields.priority ?? 'medium',
    status: fields.status ?? 'assigned',
    startDate: fields.startDate ?? null,
    dueDate: fields.dueDate ?? null,
    estimatedHours: fields.estimatedHours ?? null,
    actualHours: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  return toRecord(ref.id, { ...fields, id: ref.id, status: fields.status ?? 'assigned', priority: fields.priority ?? 'medium', createdAt: now, updatedAt: now });
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

export async function getAssignment(assignmentId: string): Promise<AssignmentRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'assignments', assignmentId));
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
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'assignments'), where('organizationId', '==', orgId), orderBy('createdAt', 'desc')),
  );
  return snap.docs
    .map((d) => toRecord(d.id, d.data() as Record<string, unknown>))
    .filter((a) => opts?.includeArchived ? true : a.status !== 'archived');
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

export async function getAssignmentsByAssigner(assignerId: string, orgId?: string): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const constraints = [where('assignerId', '==', assignerId), orderBy('createdAt', 'desc')];
  const snap = await getDocs(query(collection(db, 'assignments'), ...constraints));
  let results = snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  if (orgId) results = results.filter((a) => a.organizationId === orgId);
  return results;
}

export async function getAssignmentsByEntity(entityType: AssignmentEntityType, entityId: string): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'assignments'), where('entityType', '==', entityType), where('entityId', '==', entityId)),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
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

export async function declineAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'declined', updatedAt: Timestamp.now(),
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
