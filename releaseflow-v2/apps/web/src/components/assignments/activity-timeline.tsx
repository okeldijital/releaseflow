'use client';

import type { ActivityEventRecord } from '@/lib/activity-service';

function formatDateTime(d: unknown): string {
  if (!d) return '';
  if (d && typeof d === 'object' && 'toDate' in d) {
    const date = (d as { toDate: () => Date }).toDate();
    return date.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
  return String(d);
}

const actionLabels: Record<string, string> = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  started: 'Started',
  reopened: 'Reopened',
  restored: 'Restored',
  completed: 'Completed',
  declined: 'Declined',
  archived: 'Archived',
  deleted: 'Deleted',
  updated: 'Updated',
  blocked: 'Blocked',
  unblocked: 'Unblocked',
  submitted_for_review: 'Submitted for Review',
  approved: 'Approved',
  'deliverable.added': 'Deliverable Link Added',
  'deliverable.removed': 'Deliverable Link Removed',
  // CE-005 collaboration
  'comment.added': 'Comment Added',
  'comment.edited': 'Comment Edited',
  'comment.deleted': 'Comment Deleted',
  'reply.added': 'Reply Added',
  'comment.mentioned': 'Mentioned Collaborators',
  'review.requested': 'Review Requested',
  'review.approved': 'Review Approved',
  'review.rejected': 'Review Rejected',
  'review.changes_requested': 'Changes Requested',
  'watcher.added': 'Started Watching',
  'watcher.removed': 'Stopped Watching',
};

const actionIcons: Record<string, string> = {
  assigned: '📋',
  accepted: '✅',
  started: '▶️',
  reopened: '🔄',
  completed: '🎉',
  declined: '❌',
  blocked: '🚫',
  unblocked: '🔓',
  submitted_for_review: '👁️',
  approved: '👍',
  'comment.added': '💬',
  'comment.edited': '✏️',
  'comment.deleted': '🗑️',
  'reply.added': '↩️',
  'comment.mentioned': '@',
  'review.requested': '👁️',
  'review.approved': '👍',
  'review.rejected': '⛔',
  'review.changes_requested': '📝',
  'watcher.added': '⭐',
  'watcher.removed': '☆',
};

interface ActivityTimelineProps {
  activities: ActivityEventRecord[];
  actorNames: Map<string, string>;
}

export function ActivityTimeline({ activities, actorNames }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-text-500">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((act, i) => {
        const label = actionLabels[act.action] ?? act.action.replace(/[._]/g, ' ');
        const icon = actionIcons[act.action] ?? '•';
        const isLast = i === activities.length - 1;
        const actorLabel = actorNames.get(act.actorId);
        const details = (act.metadata?.details as string | undefined)
          ?? (typeof (act as { details?: string }).details === 'string'
            ? (act as { details?: string }).details
            : undefined);

        return (
          <div key={act.id} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div className="h-7 w-7 rounded-full bg-surface-800 flex items-center justify-center text-xs shrink-0">
                {icon}
              </div>
              {!isLast ? <div className="w-px flex-1 bg-surface-700/60 mt-1" /> : null}
            </div>
            <div className={`pb-6 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <p className="text-sm font-medium text-surface-100">
                {actorLabel ? `${actorLabel} — ${label}` : label}
              </p>
              {details ? (
                <p className="text-xs text-text-500 mt-0.5">{details}</p>
              ) : null}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-text-400">{formatDateTime(act.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
