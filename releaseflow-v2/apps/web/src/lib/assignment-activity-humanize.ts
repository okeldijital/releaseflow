/**
 * UX-001 — Human-readable assignment activity sentences.
 * Never renders Firebase UIDs, Person IDs, or raw storage details.
 */

import type { ActivityEventRecord } from '@/lib/activity-service';

/** Detect leaked internal ids in free-text activity details. */
export function looksLikeInternalId(text: string): boolean {
  if (/^[A-Za-z0-9]{15,}$/.test(text.trim())) return true;
  if (/\bfor [A-Za-z0-9]{15,}\b/.test(text)) return true;
  if (/\b[A-Za-z0-9]{20,}\b/.test(text)) return true;
  return false;
}

function actorLabel(actorId: string, names: Map<string, string>): string {
  const n = names.get(actorId);
  if (n && !looksLikeInternalId(n)) return n;
  return 'Someone';
}

/**
 * UX-001 rendering rules — sentence form only.
 */
export function humanizeAssignmentActivity(
  act: ActivityEventRecord,
  actorNames: Map<string, string>,
  subjectNames?: Map<string, string>,
): string {
  const actor = actorLabel(act.actorId, actorNames);
  const meta = (act.metadata ?? {}) as Record<string, unknown>;
  const subjectId = typeof meta.assigneeId === 'string' ? meta.assigneeId : undefined;
  const subject =
    (subjectId && subjectNames?.get(subjectId))
    || (typeof meta.assigneeName === 'string' ? meta.assigneeName : undefined)
    || (typeof meta.targetName === 'string' ? meta.targetName : undefined);

  switch (act.action) {
    case 'assigned':
    case 'assignment.created':
      if (subject) return `${actor} assigned this work to ${subject}.`;
      return `${actor} created this assignment.`;
    case 'accepted':
      return `${actor} accepted this assignment.`;
    case 'started':
      return `${actor} started work on this assignment.`;
    case 'completed':
    case 'review.approved':
      return `${actor} marked this assignment as completed.`;
    case 'declined':
      return `${actor} declined this assignment.`;
    case 'reopened':
      return `${actor} reopened this assignment.`;
    case 'restored':
      return `${actor} restored this assignment.`;
    case 'archived':
      return `${actor} archived this assignment.`;
    case 'deleted':
      return `${actor} deleted this assignment.`;
    case 'blocked':
      return `${actor} marked this assignment as blocked.`;
    case 'unblocked':
      return `${actor} unblocked this assignment.`;
    case 'reassigned':
      if (subject) return `${actor} reassigned this work to ${subject}.`;
      return `${actor} reassigned this assignment.`;
    case 'updated':
    case 'due_date.changed':
      return `${actor} updated this assignment.`;
    case 'review.requested':
    case 'submitted_for_review':
      return `${actor} submitted this assignment for review.`;
    case 'review.changes_requested':
      return `${actor} requested changes on this assignment.`;
    case 'review.rejected':
      return `${actor} rejected this assignment.`;
    case 'comment.added':
      return `${actor} added a comment.`;
    case 'comment.edited':
      return `${actor} edited a comment.`;
    case 'comment.deleted':
      return `${actor} deleted a comment.`;
    case 'reply.added':
      return `${actor} replied to a comment.`;
    case 'comment.mentioned':
      return `${actor} mentioned collaborators.`;
    case 'watcher.added':
      return `${actor} started watching this assignment.`;
    case 'watcher.removed':
      return `${actor} stopped watching this assignment.`;
    case 'deliverable.added':
      return `${actor} added a deliverable link.`;
    case 'deliverable.removed':
      return `${actor} removed a deliverable link.`;
    default: {
      const raw = typeof meta.details === 'string' ? meta.details : '';
      if (raw && !looksLikeInternalId(raw)) return `${actor}: ${raw}`;
      return `${actor} updated this assignment.`;
    }
  }
}
