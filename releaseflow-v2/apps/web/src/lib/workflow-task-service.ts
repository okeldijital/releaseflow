import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, Timestamp } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { logActivity } from '@/lib/workflow-service';
import { createNotification } from '@/lib/notification-service';
import type { Task, TaskPriority } from '@/app/(app)/types';

export interface CreateTaskFields {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  entityType?: 'release' | 'track';
  entityId?: string;
}

export async function createTask(
  stageId: string,
  releaseId: string,
  actorId: string,
  fields: CreateTaskFields,
) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const taskRef = await addDoc(collection(db, 'tasks'), {
    stageId,
    releaseId,
    title: fields.title,
    description: fields.description ?? null,
    status: 'todo',
    priority: fields.priority ?? 'medium',
    assigneeId: fields.assigneeId ?? null,
    dueDate: fields.dueDate ? Timestamp.fromDate(fields.dueDate) : null,
    entityType: fields.entityType ?? null,
    entityId: fields.entityId ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await logActivity({
    type: 'task.created',
    releaseId,
    stageId,
    actorId,
    metadata: { taskId: taskRef.id, title: fields.title },
  });

  if (fields.assigneeId) {
    await logActivity({
      type: 'task.assigned',
      releaseId,
      stageId,
      actorId,
      metadata: { taskId: taskRef.id, assigneeId: fields.assigneeId },
    });
  }

  return taskRef.id;
}

export async function completeTask(taskId: string, releaseId: string, stageId: string, actorId: string) {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'tasks', taskId), { status: 'done', updatedAt: now });
  await logActivity({
    type: 'task.completed',
    releaseId,
    stageId,
    actorId,
    metadata: { taskId },
  });
}

export async function updateTask(taskId: string, fields: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status'>>) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'tasks', taskId), { ...fields, updatedAt: Timestamp.now() });
}

export async function deleteTask(taskId: string) {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'tasks', taskId));
}

export async function getTasksByStage(stageId: string): Promise<Task[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'tasks'), where('stageId', '==', stageId), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
}

export async function assignTask(taskId: string, assigneeId: string, releaseId: string, stageId: string, actorId: string) {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  const snap = await getDoc(doc(db, 'tasks', taskId));
  const prevAssignee: string | undefined = snap.data()?.assigneeId;

  await updateDoc(doc(db, 'tasks', taskId), { assigneeId, updatedAt: now });

  if (prevAssignee && prevAssignee !== assigneeId) {
    await logActivity({
      type: 'task.reassigned',
      releaseId,
      stageId,
      actorId,
      metadata: { taskId, from: prevAssignee, to: assigneeId },
    });
  } else {
    await logActivity({
      type: 'task.assigned',
      releaseId,
      stageId,
      actorId,
      metadata: { taskId, assigneeId },
    });
  }
}

export async function unassignTask(taskId: string, releaseId: string, stageId: string, actorId: string) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'tasks', taskId), { assigneeId: null, updatedAt: Timestamp.now() });
  await logActivity({
    type: 'task.unassigned',
    releaseId,
    stageId,
    actorId,
    metadata: { taskId },
  });
}

export async function addComment(taskId: string, authorId: string, content: string, releaseId: string, stageId: string) {
  const db = getDb();
  if (!db) return;
  await addDoc(collection(db, 'comments'), {
    taskId,
    authorId,
    content,
    createdAt: Timestamp.now(),
  });
  await logActivity({
    type: 'comment.added',
    releaseId,
    stageId,
    actorId: authorId,
    metadata: { taskId },
  });

  const mentions = parseMentions(content);
  for (const role of mentions) {
    await createNotification({
      userId: role,
      type: 'mention',
      title: `You were mentioned`,
      message: `@${role} in a comment on task`,
      releaseId,
      referenceId: taskId,
      referenceType: 'task',
    });
  }
}

export async function getCommentsByTask(taskId: string) {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'comments'), where('taskId', '==', taskId), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getTasksByAssignee(assigneeId: string): Promise<Task[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'tasks'),
      where('assigneeId', '==', assigneeId),
      where('status', '!=', 'done'),
      orderBy('status'),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
}

export async function markTaskDone(taskId: string) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'tasks', taskId), { status: 'done', updatedAt: Timestamp.now() });
}

export async function getTasksByEntity(entityType: string, entityId: string): Promise<Task[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'tasks'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
}

function parseMentions(content: string): string[] {
  const matches = content.match(/@(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
