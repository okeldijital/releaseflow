'use client';

/**
 * BUILD-014 — Release Details TASKS section.
 */

import Link from 'next/link';
import { useReleaseTasks } from '@/hooks/useTask';
import { toJsDate } from '@/lib/task-service';
import { resolvePersonNames } from '@/lib/resolve-person-names';
import { useEffect, useState } from 'react';
import { EmptyState, LoadingState, Badge, StatusBadge } from '@releaseflow/ui';

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-content-secondary',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

function formatDate(d: unknown): string {
  const date = toJsDate(d);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TasksSectionProps {
  releaseId: string;
}

export function TasksSection({ releaseId }: TasksSectionProps) {
  const { rows, loading } = useReleaseTasks(releaseId);
  const [names, setNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const ids = rows
      .map((r) => r.assignment?.assigneeId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) {
      setNames(new Map());
      return;
    }
    void resolvePersonNames(ids).then(setNames);
  }, [rows]);

  if (loading) return <LoadingState />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No tasks"
        description="No tasks linked to this release yet."
      />
    );
  }

  return (
    <div className="space-y-2">
      {rows.map(({ task, assignment }) => {
        const assigneeId = assignment?.assigneeId;
        const assigneeName = assigneeId
          ? (names.get(assigneeId) ?? '…')
          : 'Unassigned';
        return (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="flex flex-col gap-1 rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary-400 truncate">{task.title}</p>
              <p className="text-xs text-content-label">
                Assigned To {assigneeName}
                {task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge label={task.priority} color={priorityColors[task.priority] ?? ''} />
              <StatusBadge status={statusLabel(task.status)} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
