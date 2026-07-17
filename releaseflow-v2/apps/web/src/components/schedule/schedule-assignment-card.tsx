'use client';

import Link from 'next/link';
import { Avatar, Badge } from '@releaseflow/ui';
import type { ScheduleAssignmentItem } from '@/lib/schedule-service';
import { formatTime } from '@/lib/schedule-date-utils';

const sColors: Record<string, string> = {
  assigned: 'bg-surface-800 text-text-500',
  accepted: 'bg-surface-800 text-text-500',
  in_progress: 'bg-warning-500/10 text-warning-600',
  review: 'bg-info-500/10 text-info-400',
  completed: 'bg-success-500/10 text-success-600',
  blocked: 'bg-danger-500/10 text-danger-600',
  declined: 'bg-surface-800 text-text-500',
  cancelled: 'bg-surface-800 text-text-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-text-500',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

interface ScheduleAssignmentCardProps {
  item: ScheduleAssignmentItem;
  compact?: boolean;
  showTime?: boolean;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
}

export function ScheduleAssignmentCard({
  item,
  compact,
  showTime,
  draggable,
  onDragStart,
}: ScheduleAssignmentCardProps) {
  const a = item.assignment;
  const artwork = item.context?.artwork?.secureUrl;
  const statusLabel = a.status.replace(/_/g, ' ');

  return (
    <Link
      href={`/assignments/${a.id}`}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData('text/assignment-id', a.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(a.id);
      }}
      className={`
        block rounded-xl border border-surface-700/60 bg-layer-2
        hover:border-primary-500/40 transition-colors text-left
        ${compact ? 'p-2' : 'p-3'}
        ${item.conflicts.length > 0 ? 'ring-1 ring-warning-500/40' : ''}
      `}
    >
      <div className={`flex gap-2 ${compact ? 'items-center' : 'items-start'}`}>
        {artwork ? (
          <img
            src={artwork}
            alt=""
            className={`rounded-md object-cover shrink-0 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}
          />
        ) : (
          <div className={`rounded-md bg-surface-800 shrink-0 flex items-center justify-center text-[10px] text-text-500 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
            RF
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`font-medium text-surface-100 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
              {a.title}
            </p>
            {item.conflicts.length > 0 ? (
              <Badge label="Conflict" size="sm" color="bg-warning-500/15 text-warning-600" />
            ) : null}
          </div>
          {!compact && item.context?.releaseTitle ? (
            <p className="text-xs text-text-500 truncate mt-0.5">
              {item.context.releaseTitle}
              {item.context.trackTitle ? ` · ${item.context.trackTitle}` : ''}
            </p>
          ) : null}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge label={a.priority} size="sm" color={priorityColors[a.priority] ?? 'bg-surface-800 text-text-500'} />
            <Badge label={statusLabel} size="sm" color={sColors[a.status] ?? 'bg-surface-800 text-text-500'} />
            {showTime ? (
              <span className="text-[10px] text-text-500">
                {item.hasTime && item.dueDate ? formatTime(item.dueDate) : 'All Day'}
              </span>
            ) : null}
            {item.isOverdue ? (
              <span className="text-[10px] text-danger-500 font-medium">Overdue</span>
            ) : null}
          </div>
        </div>
        {!compact ? (
          <Avatar name={item.assigneeName} size="xs" />
        ) : null}
      </div>
    </Link>
  );
}
