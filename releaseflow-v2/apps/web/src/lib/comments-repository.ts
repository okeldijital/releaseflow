import {
  doc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface EntityCommentRecord {
  id: string;
  entityType: 'release' | 'track' | 'task' | 'specification' | 'asset' | 'distribution_package';
  entityId: string;
  organizationId: string;
  authorId: string;
  content: string;
  parentCommentId?: string | null;
  isResolved: boolean;
  attachments?: string[] | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateCommentFields {
  entityType: EntityCommentRecord['entityType'];
  entityId: string;
  organizationId: string;
  authorId: string;
  content: string;
  parentCommentId?: string | null;
  attachments?: string[] | null;
}

export interface UpdateCommentFields {
  content?: string;
  attachments?: string[] | null;
}

export async function createComment(fields: CreateCommentFields): Promise<EntityCommentRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const data = {
    entityType: fields.entityType,
    entityId: fields.entityId,
    organizationId: fields.organizationId,
    authorId: fields.authorId,
    content: fields.content,
    parentCommentId: fields.parentCommentId ?? null,
    isResolved: false,
    attachments: fields.attachments ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, 'entity_comments'), data);
  return {
    id: ref.id,
    entityType: data.entityType,
    entityId: data.entityId,
    organizationId: data.organizationId,
    authorId: data.authorId,
    content: data.content,
    parentCommentId: data.parentCommentId,
    isResolved: data.isResolved,
    attachments: data.attachments,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateComment(commentId: string, fields: UpdateCommentFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'entity_comments', commentId), {
    ...fields,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'entity_comments', commentId));
}

export async function getCommentsByEntity(
  entityType: EntityCommentRecord['entityType'],
  entityId: string,
): Promise<EntityCommentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'entity_comments'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EntityCommentRecord);
}

export async function getReplies(parentCommentId: string): Promise<EntityCommentRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'entity_comments'),
      where('parentCommentId', '==', parentCommentId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EntityCommentRecord);
}

export async function resolveComment(commentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'entity_comments', commentId), {
    isResolved: true,
    updatedAt: Timestamp.now(),
  });
}

export async function reopenComment(commentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'entity_comments', commentId), {
    isResolved: false,
    updatedAt: Timestamp.now(),
  });
}
