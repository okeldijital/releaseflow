'use client';

/**
 * MUX-001 — Primary mobile assignment card.
 * Large touch target, contribution role, due date, status, Continue CTA.
 */

import Link from 'next/link';
import { StatusBadge } from '@releaseflow/ui';
import { ArtworkPlaceholder } from '@/components/release/artwork-display';

export interface AssignmentCardModel {
  id: string;
  title: string;
  role?: string | null;
  priority?: string | null;
  status: string;
  dueDate?: unknown;
  releaseTitle?: string | null;
  releaseArtwork?: { secureUrl?: string | null } | null;
  entityType?: string | null;
  /** MUX-002 — unread comment count for this assignment */
  unreadComments?: number;
  updatedAt?: unknown;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof value === 'object') {
    if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    if ('seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
      return new Date((value as { seconds: number }).seconds * 1000);
    }
  }
  return null;
}

function priorityClass(priority: string): string {
  switch (priority) {
    case 'urgent':
    case 'critical':
      return 'bg-danger-500/15 text-danger-400';
    case 'high':
      return 'bg-warning-500/15 text-warning-400';
    case 'medium':
      return 'bg-primary-500/10 text-primary-400';
    default:
      return 'bg-surface-800 text-text-400';
  }
}

function formatDue(due: Date | null): string {
  if (!due) return '';
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((startDue.getTime() - startToday.getTime()) / 86400000);
  if (diffDays < 0) return `Overdue ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

interface AssignmentCardProps {
  assignment: AssignmentCardModel;
  /** Compact list style vs featured home card */
  variant?: 'default' | 'featured';
  ctaLabel?: string;
}

export function AssignmentCard({
  assignment,
  variant = 'default',
  ctaLabel = 'Continue Assignment',
}: AssignmentCardProps) {
  const due = toDate(assignment.dueDate);
  const isFeatured = variant === 'featured';
  const releaseName = assignment.releaseTitle
    || (assignment.entityType === 'release' ? 'Release' : assignment.entityType)
    || 'Work';

  return (
    <Link
      href={`/assignments/${assignment.id}`}
      className={`
        group block rounded-2xl border border-surface-700/60 bg-surface-900
        hover:border-primary-500/40 active:scale-[0.99] transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
        ${isFeatured ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4'}
      `}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {assignment.releaseArtwork?.secureUrl ? (
          <div className={`shrink-0 rounded-xl overflow-hidden bg-surface-800 ${isFeatured ? 'h-14 w-14' : 'h-12 w-12'}`}>
            <img
              src={assignment.releaseArtwork.secureUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : assignment.releaseTitle ? (
          <ArtworkPlaceholder title={assignment.releaseTitle} size="sm" />
        ) : (
          <div className={`shrink-0 rounded-xl bg-surface-800 flex items-center justify-center ${isFeatured ? 'h-14 w-14' : 'h-12 w-12'}`}>
            <svg className="h-5 w-5 text-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-surface-50 truncate ${isFeatured ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
            {assignment.title}
          </p>
          <p className="text-xs sm:text-sm text-text-400 mt-0.5 truncate">{releaseName}</p>
          {assignment.role ? (
            <p className="text-xs text-text-500 mt-1 truncate">
              {assignment.role}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {assignment.priority ? (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${priorityClass(assignment.priority)}`}>
                {assignment.priority}
              </span>
            ) : null}
            <StatusBadge status={assignment.status} />
            {due ? (
              <span className={`text-[11px] ${due.getTime() < Date.now() ? 'text-danger-400' : 'text-text-500'}`}>
                {formatDue(due)}
              </span>
            ) : null}
            {assignment.unreadComments && assignment.unreadComments > 0 ? (
              <span className="text-[11px] font-medium text-primary-400">
                {assignment.unreadComments} unread
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`
          mt-3 flex items-center justify-center gap-2 rounded-xl
          bg-primary-500/10 text-primary-400 font-semibold
          group-hover:bg-primary-500/15 transition-colors
          min-h-[48px] text-sm
        `}
      >
        {ctaLabel}
        <span aria-hidden>→</span>
      </div>
    </Link>
  );
}

export function SectionHeader({
  title,
  href,
  count,
}: {
  title: string;
  href?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-text-500 uppercase tracking-widest">
        {title}
        {typeof count === 'number' && count > 0 ? (
          <span className="ml-2 text-primary-400 normal-case tracking-normal">({count})</span>
        ) : null}
      </h2>
      {href ? (
        <Link href={href} className="text-xs font-medium text-primary-400 min-h-[44px] inline-flex items-center px-1">
          View all
        </Link>
      ) : null}
    </div>
  );
}
