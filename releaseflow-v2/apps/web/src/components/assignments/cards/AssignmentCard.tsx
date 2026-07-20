'use client';

/**
 * BUILD-005 / ADR-0009 — Canonical Assignment summary presentation.
 *
 * Every Assignment summary in ReleaseFlow must render through this component.
 * Modes change layout only; never return null.
 *
 * Pipeline: Repository → Service → Workspace Builder → Section → AssignmentCard → DOM
 */

import Link from 'next/link';
import { StatusBadge, Badge } from '@releaseflow/ui';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import type { AssignmentWorkspaceRecord } from '@/lib/assignment-workspace-service';

export type AssignmentCardMode =
  | 'workspace'
  | 'compact'
  | 'table'
  | 'table-row'
  | 'detailed'
  | 'search';

export interface AssignmentCardProps {
  record: AssignmentWorkspaceRecord;
  mode?: AssignmentCardMode;
  /** Optional quick-action handlers (optimistic UI lives in parent) */
  onStart?: () => void;
  onComplete?: () => void;
  onComment?: () => void;
}

function formatDue(due: unknown): string {
  if (!due) return '';
  let d: Date | null = null;
  if (due instanceof Date) d = due;
  else if (typeof due === 'object' && due !== null) {
    const o = due as { toDate?: () => Date; seconds?: number };
    if (typeof o.toDate === 'function') d = o.toDate();
    else if (typeof o.seconds === 'number') d = new Date(o.seconds * 1000);
  } else if (typeof due === 'string' || typeof due === 'number') {
    d = new Date(due);
    if (Number.isNaN(d.getTime())) d = null;
  }
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-danger-500/15 text-danger-500';
    case 'high':
      return 'bg-warning-500/15 text-warning-600';
    case 'medium':
      return 'bg-info-50 text-info-600';
    default:
      return 'bg-surface-100 text-text-500';
  }
}

function Badges({ record }: { record: AssignmentWorkspaceRecord }) {
  const badges: { label: string; color: string }[] = [];
  if (record.isBlocked) badges.push({ label: 'Blocked', color: 'bg-danger-500/15 text-danger-500' });
  if (record.isOverdue) badges.push({ label: 'Overdue', color: 'bg-danger-500/15 text-danger-500' });
  if (record.isDueToday) badges.push({ label: 'Due Today', color: 'bg-warning-500/15 text-warning-600' });
  if (record.requiresReview) badges.push({ label: 'Review', color: 'bg-info-50 text-info-600' });
  if (record.assignment.status === 'completed') {
    badges.push({ label: 'Completed', color: 'bg-success-50 text-success-600' });
  }
  if (record.release?.lifecycle === 'draft') {
    badges.push({ label: 'Draft Release', color: 'bg-surface-100 text-text-500' });
  }
  if (record.release?.status === 'released') {
    badges.push({ label: 'Released', color: 'bg-success-50 text-success-600' });
  }
  if (record.release?.removed) {
    badges.push({ label: 'Release Removed', color: 'bg-surface-100 text-text-500' });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((b) => (
        <Badge key={b.label} label={b.label} color={b.color} size="sm" />
      ))}
    </div>
  );
}

export function AssignmentCard({
  record,
  mode = 'workspace',
  onStart,
  onComplete,
  onComment,
}: AssignmentCardProps) {
  const a = record.assignment;
  const layoutMode: 'workspace' | 'compact' | 'table' | 'detailed' =
    mode === 'table-row' || mode === 'table'
      ? 'table'
      : mode === 'search' || mode === 'compact'
        ? 'compact'
        : mode === 'detailed'
          ? 'detailed'
          : 'workspace';
  const releaseTitle = record.release?.title ?? (record.release?.removed ? 'Release Removed' : null);
  const href = `/assignments/${a.id}`;

  const metaLine = [
    releaseTitle,
    record.trackTitle,
    record.artistName,
    record.ownerName,
  ]
    .filter(Boolean)
    .join(' · ');

  if (layoutMode === 'table') {
    return (
      <div
        data-assignment-card
        data-assignment-id={a.id}
        data-mode="table"
        className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 last:border-b-0 hover:bg-surface-50/80 transition-colors group"
      >
        <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
          <ArtworkDisplay
            artwork={record.artwork as never}
            releaseTitle={releaseTitle ?? a.title}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary-400 truncate">{a.title}</p>
            <p className="text-xs text-text-500 truncate mt-0.5">{metaLine || a.role}</p>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${priorityColor(a.priority)}`}>
            {a.priority}
          </span>
          <StatusBadge status={a.status} />
          <span className="text-xs text-text-500 w-16 text-right shrink-0">{formatDue(a.dueDate) || '—'}</span>
        </Link>
        <Badges record={record} />
      </div>
    );
  }

  if (layoutMode === 'compact') {
    return (
      <div data-assignment-card data-assignment-id={a.id} data-mode={mode === 'search' ? 'search' : 'compact'}>
        <Link
          href={href}
          className="flex items-center gap-3 rounded-xl border border-surface-200 bg-layer-2 p-3 hover:border-primary-500/40 transition-colors"
        >
          <ArtworkDisplay
            artwork={record.artwork as never}
            releaseTitle={releaseTitle ?? a.title}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary-400 truncate">{a.title}</p>
            <p className="text-xs text-text-500 truncate mt-0.5">{metaLine || a.role}</p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <StatusBadge status={a.status} />
              {formatDue(a.dueDate) ? (
                <span className={`text-[11px] ${record.isOverdue ? 'text-danger-500' : 'text-text-500'}`}>
                  {formatDue(a.dueDate)}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // workspace + detailed
  return (
    <div
      data-assignment-card
      data-assignment-id={a.id}
      data-mode={layoutMode}
      className="group relative rounded-xl border border-surface-200 bg-layer-2 shadow-card hover:shadow-card-hover transition-all overflow-hidden"
    >
      <Link href={href} className="block p-4 space-y-3">
        <div className="flex items-start gap-3">
          <ArtworkDisplay
            artwork={record.artwork as never}
            releaseTitle={releaseTitle ?? a.title}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-primary-400 truncate leading-snug">{a.title}</h3>
            <p className="text-xs text-text-500 mt-0.5 truncate">
              {releaseTitle ?? 'No release linked'}
              {record.trackTitle ? ` · ${record.trackTitle}` : ''}
            </p>
            {record.ownerName ? (
              <p className="text-xs text-text-400 mt-1">Owner: {record.ownerName}</p>
            ) : null}
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${priorityColor(a.priority)}`}>
            {a.priority}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={a.status} />
          {a.stageId ? (
            <span className="text-[11px] text-text-500">Stage linked</span>
          ) : null}
          {formatDue(a.dueDate) ? (
            <span className={`text-[11px] ${record.isOverdue ? 'text-danger-500 font-medium' : 'text-text-500'}`}>
              Due {formatDue(a.dueDate)}
            </span>
          ) : null}
        </div>

        <Badges record={record} />

        {layoutMode === 'detailed' ? (
          <div className="pt-2 border-t border-surface-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-500">Work Score</span>
              <p className="font-medium text-text-600">{record.workScore}</p>
            </div>
            <div>
              <span className="text-text-500">Urgency</span>
              <p className="font-medium text-text-600 capitalize">{record.urgency}</p>
            </div>
            <div>
              <span className="text-text-500">Role</span>
              <p className="font-medium text-text-600">{a.role}</p>
            </div>
            <div>
              <span className="text-text-500">Entity</span>
              <p className="font-medium text-text-600 capitalize">{a.entityType.replace(/_/g, ' ')}</p>
            </div>
          </div>
        ) : null}
      </Link>

      {(onStart || onComplete || onComment || record.release) && (
        <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-surface-100 pt-2">
          {onStart ? (
            <button type="button" onClick={onStart} className="text-xs font-medium text-primary-500 hover:text-primary-400">
              Start
            </button>
          ) : null}
          {onComplete ? (
            <button type="button" onClick={onComplete} className="text-xs font-medium text-primary-500 hover:text-primary-400">
              Complete
            </button>
          ) : null}
          {onComment ? (
            <button type="button" onClick={onComment} className="text-xs font-medium text-primary-500 hover:text-primary-400">
              Comment
            </button>
          ) : null}
          {record.release && !record.release.removed ? (
            <Link href={`/releases/${record.release.id}`} className="text-xs font-medium text-text-500 hover:text-primary-400">
              Open Release
            </Link>
          ) : null}
          {a.entityType === 'track' ? (
            <Link href={`/tracks/${a.entityId}`} className="text-xs font-medium text-text-500 hover:text-primary-400">
              Open Track
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
