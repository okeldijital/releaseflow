'use client';

import { Badge, WorkspaceCard } from '@releaseflow/ui';
import type { AssignmentRecord } from '@/lib/assignment-repository';

function fmtDate(d: unknown): string {
  if (!d) return '—';
  if (d && typeof d === 'object' && 'toDate' in d) {
    return (d as { toDate: () => Date }).toDate().toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(d);
}

const outcomeLabel: Record<string, string> = {
  approved: 'Approved',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
};

const outcomeColor: Record<string, string> = {
  approved: 'bg-success-500/10 text-success-600',
  changes_requested: 'bg-warning-500/10 text-warning-600',
  rejected: 'bg-danger-500/10 text-danger-600',
};

interface ReviewPanelProps {
  assignment: AssignmentRecord & {
    reviewerName?: string | null;
    requesterName?: string | null;
  };
}

/**
 * Visible when review has been requested or an outcome exists.
 */
export function ReviewPanel({ assignment }: ReviewPanelProps) {
  const relevant =
    assignment.status === 'review' ||
    !!assignment.reviewRequestedBy ||
    !!assignment.reviewOutcome;

  if (!relevant) return null;

  const statusLabel =
    assignment.status === 'review'
      ? 'Review Requested'
      : assignment.reviewOutcome
        ? outcomeLabel[assignment.reviewOutcome] ?? assignment.reviewOutcome
        : '—';

  return (
    <WorkspaceCard title="Review">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-2">
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Status</p>
          <Badge
            label={statusLabel}
            size="sm"
            color={
              assignment.status === 'review'
                ? 'bg-info-500/10 text-info-400'
                : assignment.reviewOutcome
                  ? outcomeColor[assignment.reviewOutcome] ?? 'bg-surface-800 text-text-500'
                  : 'bg-surface-800 text-text-500'
            }
          />
        </div>
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Reviewer</p>
          <p className="text-surface-100">
            {assignment.reviewerName
              ?? (assignment.reviewedBy ? assignment.reviewedBy : '—')}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Requested</p>
          <p className="text-surface-100">
            {assignment.requesterName
              ?? (assignment.reviewRequestedBy ? assignment.reviewRequestedBy : '—')}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Reviewed</p>
          <p className="text-surface-100">{fmtDate(assignment.reviewedAt)}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Outcome</p>
          {assignment.reviewOutcome ? (
            <Badge
              label={outcomeLabel[assignment.reviewOutcome] ?? assignment.reviewOutcome}
              size="sm"
              color={outcomeColor[assignment.reviewOutcome] ?? 'bg-surface-800 text-text-500'}
            />
          ) : (
            <p className="text-surface-100">Pending</p>
          )}
        </div>
      </div>
    </WorkspaceCard>
  );
}
