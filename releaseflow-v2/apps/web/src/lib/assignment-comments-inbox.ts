/**
 * MUX-002 / BUG-003 — Comments workspace inbox (conversations grouped by assignment).
 * Not a chat system: each thread is an Assignment.
 *
 * Access rule: if you can see the assignment, you can see its comments.
 * Collaborators: own assignments (Person.id / assigneeUserId).
 * Managers: all org assignments.
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

const OPEN_STATUSES = new Set([
  'assigned',
  'accepted',
  'in_progress',
  'review',
  'blocked',
]);

/**
 * Load assignment-scoped conversations visible to the user.
 * Never throws for partial per-assignment failures (BUG-003).
 */
export async function loadCommentThreads(opts: {
  organizationId: string;
  userId: string;
  collaboratorOnly: boolean;
}): Promise<AssignmentCommentThread[]> {
  const { organizationId, userId, collaboratorOnly } = opts;
  const db = getDb();
  if (!db) return [];

  let assignments: AssignmentRecord[];
  try {
    assignments = await fetchAssignments(organizationId, { includeArchived: true });
  } catch (err) {
    console.error('[comments-inbox] fetchAssignments failed', err);
    return [];
  }

  if (collaboratorOnly) {
    const keys = await resolveActorIdentityKeys(organizationId, userId);
    // Always include auth uid (resolveActorIdentityKeys already does).
    // If person link is missing, still match assigneeUserId === uid.
    assignments = assignments.filter((a) => assignmentMatchesIdentity(a, keys));
  }

  // Exclude terminal statuses that have never had discussion
  assignments = assignments.filter(
    (a) => !['cancelled', 'declined'].includes(a.status),
  );

  const threads: AssignmentCommentThread[] = [];

  await Promise.all(
    assignments.map(async (assignment) => {
      try {
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
          const doc0 = snap.docs[0];
          if (doc0) {
            const data = doc0.data();
            lastMessage = (data.message as string) ?? null;
            lastAuthorName = (data.authorName as string) ?? null;
            const ca = data.createdAt as Timestamp | undefined;
            lastAt = ca && typeof ca.toDate === 'function' ? ca.toDate() : null;
            // Presence: at least one comment — count capped for list UI
            const countSnap = await getDocs(
              query(
                collection(db, 'assignment_comments'),
                where('assignmentId', '==', assignment.id),
                limit(50),
              ),
            );
            commentCount = countSnap.size;
          }
        } catch (err) {
          // Missing index or permission — keep thread if assignment is open
          console.warn('[comments-inbox] comment meta query failed', assignment.id, err);
        }

        let unreadCount = 0;
        try {
          unreadCount = await getUnreadCommentCount(assignment.id, userId);
        } catch {
          unreadCount = 0;
        }

        const hasDiscussion = commentCount > 0 || unreadCount > 0;
        const isOpenWork = OPEN_STATUSES.has(assignment.status);

        // Include: any assignment with comments, or open work (start discussion)
        // Exclude: archived/completed with zero comments
        if (!hasDiscussion && !isOpenWork) {
          return;
        }
        if (assignment.status === 'archived' && !hasDiscussion) {
          return;
        }

        threads.push({
          assignment,
          lastMessage,
          lastAuthorName,
          lastAt,
          unreadCount,
          commentCount,
        });
      } catch (err) {
        // Never fail the whole inbox for one assignment (BUG-003)
        console.warn('[comments-inbox] thread build failed', assignment.id, err);
      }
    }),
  );

  threads.sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    const at = a.lastAt?.getTime() ?? 0;
    const bt = b.lastAt?.getTime() ?? 0;
    if (at !== bt) return bt - at;
    return a.assignment.title.localeCompare(b.assignment.title);
  });

  return threads;
}
