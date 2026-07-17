/**
 * MUX-002 — Comments workspace inbox (conversations grouped by assignment).
 * Not a chat system: each thread is an Assignment.
 */

import { collection, query, where, orderBy, limit, getDocs, Timestamp } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { fetchAssignments } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import {
  assignmentMatchesIdentity,
  resolveActorIdentityKeys,
} from '@/lib/assignment-identity';
import { getUnreadCommentCount } from '@/lib/assignment-comment-reads-repository';

export interface AssignmentCommentThread {
  assignment: AssignmentRecord;
  lastMessage: string | null;
  lastAuthorName: string | null;
  lastAt: Date | null;
  unreadCount: number;
  commentCount: number;
}

/**
 * Load assignment-scoped conversations visible to the collaborator
 * (or all org assignments for managers).
 */
export async function loadCommentThreads(opts: {
  organizationId: string;
  userId: string;
  collaboratorOnly: boolean;
}): Promise<AssignmentCommentThread[]> {
  const { organizationId, userId, collaboratorOnly } = opts;
  const db = getDb();
  if (!db) return [];

  let assignments = await fetchAssignments(organizationId, { includeArchived: true });
  if (collaboratorOnly) {
    const keys = await resolveActorIdentityKeys(organizationId, userId);
    assignments = assignments.filter((a) => assignmentMatchesIdentity(a, keys));
  }

  // Active work first for comments UX
  assignments = assignments.filter(
    (a) => !['archived', 'cancelled', 'declined'].includes(a.status),
  );

  const threads: AssignmentCommentThread[] = [];

  await Promise.all(
    assignments.map(async (assignment) => {
      let lastMessage: string | null = null;
      let lastAuthorName: string | null = null;
      let lastAt: Date | null = null;
      let commentCount = 0;

      try {
        const snap = await getDocs(
          query(
            collection(db, 'assignment_comments'),
            where('assignmentId', '==', assignment.id),
            orderBy('createdAt', 'desc'),
            limit(1),
          ),
        );
        commentCount = snap.size; // only page size; fine for presence
        const doc0 = snap.docs[0];
        if (doc0) {
          const data = doc0.data();
          lastMessage = (data.message as string) ?? null;
          lastAuthorName = (data.authorName as string) ?? null;
          const ca = data.createdAt as Timestamp | undefined;
          lastAt = ca?.toDate?.() ?? null;
          // Approximate count with a separate light query
          const countSnap = await getDocs(
            query(
              collection(db, 'assignment_comments'),
              where('assignmentId', '==', assignment.id),
              limit(50),
            ),
          );
          commentCount = countSnap.size;
        }
      } catch {
        /* index missing or empty */
      }

      let unreadCount: number;
      try {
        unreadCount = await getUnreadCommentCount(assignment.id, userId);
      } catch {
        unreadCount = 0;
      }

      // Only include threads with comments OR open assignments with unread
      if (commentCount === 0 && unreadCount === 0) {
        // Still list open assignments so user can start discussion
        if (!['assigned', 'accepted', 'in_progress', 'review', 'blocked'].includes(assignment.status)) {
          return;
        }
      }

      threads.push({
        assignment,
        lastMessage,
        lastAuthorName,
        lastAt,
        unreadCount,
        commentCount,
      });
    }),
  );

  threads.sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    const at = a.lastAt?.getTime() ?? 0;
    const bt = b.lastAt?.getTime() ?? 0;
    return bt - at;
  });

  return threads;
}
