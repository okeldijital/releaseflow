import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, limit, startAfter, Timestamp,
  type QueryDocumentSnapshot, type DocumentData,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface AssignmentCommentRecord {
  id: string;
  assignmentId: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  message: string;
  parentCommentId: string | null;
  mentionedUserIds: string[];
  isDeleted: boolean;
  createdAt: Timestamp;
  editedAt: Timestamp | null;
  deletedAt: Timestamp | null;
}

export interface CreateAssignmentCommentFields {
  assignmentId: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  message: string;
  parentCommentId?: string | null;
  mentionedUserIds?: string[];
}

function toRecord(id: string, data: Record<string, unknown>): AssignmentCommentRecord {
  return {
    id,
    assignmentId: data.assignmentId as string,
    organizationId: data.organizationId as string,
    authorId: data.authorId as string,
    authorName: data.authorName as string,
    message: data.message as string,
    parentCommentId: (data.parentCommentId as string | null) ?? null,
    mentionedUserIds: (data.mentionedUserIds as string[]) ?? [],
    isDeleted: (data.isDeleted as boolean) ?? false,
    createdAt: data.createdAt as Timestamp,
    editedAt: (data.editedAt as Timestamp | null) ?? null,
    deletedAt: (data.deletedAt as Timestamp | null) ?? null,
  };
}

export async function createAssignmentComment(
  fields: CreateAssignmentCommentFields,
): Promise<AssignmentCommentRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const data = {
    assignmentId: fields.assignmentId,
    organizationId: fields.organizationId,
    authorId: fields.authorId,
    authorName: fields.authorName,
    message: fields.message,
    parentCommentId: fields.parentCommentId ?? null,
    mentionedUserIds: fields.mentionedUserIds ?? [],
    isDeleted: false,
    createdAt: now,
    editedAt: null,
    deletedAt: null,
  };
  const ref = await addDoc(collection(db, 'assignment_comments'), data);
  return toRecord(ref.id, { ...data, id: ref.id });
}

export async function getAssignmentComment(
  commentId: string,
): Promise<AssignmentCommentRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'assignment_comments', commentId));
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as Record<string, unknown>);
}

export async function updateAssignmentComment(
  commentId: string,
  fields: { message: string; mentionedUserIds?: string[] },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = {
    message: fields.message,
    editedAt: Timestamp.now(),
  };
  if (fields.mentionedUserIds !== undefined) {
    updateData.mentionedUserIds = fields.mentionedUserIds;
  }
  await updateDoc(doc(db, 'assignment_comments', commentId), updateData);
}

export async function softDeleteAssignmentComment(commentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignment_comments', commentId), {
    isDeleted: true,
    deletedAt: Timestamp.now(),
  });
}

/**
 * Loads the most recent page of comments (default 50), returned oldest→newest
 * for display with newest at the bottom. Pass `cursor` (oldest doc of current
 * page) to load an older page.
 */
export async function getAssignmentComments(
  assignmentId: string,
  opts?: {
    pageSize?: number;
    /** Firestore doc snapshot of the oldest comment currently loaded — loads older. */
    cursor?: QueryDocumentSnapshot<DocumentData>;
  },
): Promise<{
  comments: AssignmentCommentRecord[];
  hasMore: boolean;
  oldestDoc: QueryDocumentSnapshot<DocumentData> | null;
}> {
  const db = getDb();
  if (!db) return { comments: [], hasMore: false, oldestDoc: null };
  const pageSize = opts?.pageSize ?? 50;

  const constraints = [
    collection(db, 'assignment_comments'),
    where('assignmentId', '==', assignmentId),
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1),
  ] as const;

  const q = opts?.cursor
    ? query(...constraints, startAfter(opts.cursor))
    : query(...constraints);

  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const pageDocs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

  // Reverse to oldest→newest for chat layout (newest at bottom).
  const ordered = [...pageDocs].reverse();
  const comments = ordered.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  // Cursor for next "load older" is the oldest among the raw desc page (= last of pageDocs).
  const oldestDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] ?? null : null;

  return { comments, hasMore, oldestDoc };
}
