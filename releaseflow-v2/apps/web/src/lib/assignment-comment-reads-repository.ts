import {
  getDocs, addDoc,
  collection, query, where, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface AssignmentCommentReadRecord {
  id: string;
  assignmentId: string;
  commentId: string;
  userId: string;
  readAt: Timestamp;
}

export async function markCommentRead(
  assignmentId: string,
  commentId: string,
  userId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDocs(
    query(
      collection(db, 'assignment_comment_reads'),
      where('commentId', '==', commentId),
      where('userId', '==', userId),
    ),
  );
  if (snap.docs.length > 0) return;
  await addDoc(collection(db, 'assignment_comment_reads'), {
    assignmentId,
    commentId,
    userId,
    readAt: Timestamp.now(),
  });
}

export async function getUnreadCommentCount(
  assignmentId: string,
  userId: string,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const readsSnap = await getDocs(
    query(
      collection(db, 'assignment_comment_reads'),
      where('assignmentId', '==', assignmentId),
      where('userId', '==', userId),
    ),
  );
  const readCommentIds = new Set(readsSnap.docs.map((d) => 
    (d.data() as Record<string, unknown>).commentId as string,
  ));
  const commentsSnap = await getDocs(
    query(
      collection(db, 'assignment_comments'),
      where('assignmentId', '==', assignmentId),
    ),
  );
  let unread = 0;
  commentsSnap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    if (!readCommentIds.has(d.id) && (data.authorId as string) !== userId) {
      unread++;
    }
  });
  return unread;
}
