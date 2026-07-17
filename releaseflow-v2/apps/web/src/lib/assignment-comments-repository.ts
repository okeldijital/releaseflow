import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, limit, startAfter, Timestamp,
  onSnapshot,
  type QueryDocumentSnapshot, type DocumentData, type Unsubscribe,
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

/**
 * UX-001 / BUG-003 — Real-time comments for an assignment (newest at bottom).
 *
 * Uses the **same** query shape as getAssignmentComments (assignmentId + createdAt desc)
 * so the deployed composite index is shared. Client reverses to oldest→newest.
 *
 * BUG-003: never emit an empty list on subscription error (that wiped optimistic UI).
 * Empty *cache* snapshots are also ignored so local optimistic rows are not cleared
 * before the server snapshot arrives.
 */
export function subscribeAssignmentComments(
  assignmentId: string,
  onData: (comments: AssignmentCommentRecord[]) => void,
  onError?: (error: Error) => void,
  opts?: { max?: number },
): Unsubscribe {
  const db = getDb();
  if (!db || !assignmentId) {
    return () => {};
  }
  const max = opts?.max ?? 100;
  let deliveredServerData = false;

  return onSnapshot(
    query(
      collection(db, 'assignment_comments'),
      where('assignmentId', '==', assignmentId),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
    { includeMetadataChanges: true },
    (snap) => {
      // BUG-003: ignore empty cache-only snapshots (they clear optimistic state).
      if (snap.metadata.fromCache && snap.empty && !deliveredServerData) {
        return;
      }
      if (!snap.metadata.fromCache) {
        deliveredServerData = true;
      }
      // Reverse desc page → oldest→newest for chat layout (same as getAssignmentComments).
      const ordered = [...snap.docs].reverse();
      onData(ordered.map((d) => toRecord(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => {
      console.error('[assignment_comments] subscribe failed', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
      // Fallback one-shot — only push empty if the one-shot truly has no docs.
      void getAssignmentComments(assignmentId, { pageSize: max })
        .then((page) => {
          onData(page.comments);
        })
        .catch((fallbackErr) => {
          console.error('[assignment_comments] fallback load failed', fallbackErr);
          // Do NOT call onData([]) — leave optimistic / previous UI intact.
        });
    },
  );
}
