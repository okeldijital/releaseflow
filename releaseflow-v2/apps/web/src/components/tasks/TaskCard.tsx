'use client';

/**
 * BUILD-017 — Canonical Task Card
 *
 * One layout for all contexts. size = compact | standard | large only.
 *
 * Layout:
 *   Priority badge TL + overflow menu TR
 *   Title (max 2 lines)
 *   Status badge
 *   Assignee (avatar + display name)
 *   Related release (artwork + title) when present
 *   Due / Reminder labels
 *   Progress (when status supports progression)
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { Avatar, Badge, ConfirmationDialog, ProgressBar, StatusBadge } from '@releaseflow/ui';
import { EntityOverflowMenu, type EntityOverflowMenuItem } from '@/components/entity-overflow-menu';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import {
  priorityBadgeColor,
  type TaskCardMenuAction,
  type TaskCardModel,
} from '@/lib/task-card-model';

export type TaskCardSize = 'compact' | 'standard' | 'large';

const SIZE_STYLES: Record<
  TaskCardSize,
  {
    pad: string;
    title: string;
    meta: string;
    gap: string;
    avatar: 'xs' | 'sm' | 'md';
    art: 'sm' | 'md';
  }
> = {
  compact: {
    pad: 'p-3 space-y-2',
    title: 'text-sm font-semibold leading-snug line-clamp-2',
    meta: 'text-[11px] text-text-400',
    gap: 'gap-1.5',
    avatar: 'xs',
    art: 'sm',
  },
  standard: {
    pad: 'p-4 space-y-2.5',
    title: 'text-sm sm:text-base font-semibold leading-snug line-clamp-2',
    meta: 'text-xs text-text-400',
    gap: 'gap-2',
    avatar: 'sm',
    art: 'sm',
  },
  large: {
    pad: 'p-5 space-y-3',
    title: 'text-base sm:text-lg font-semibold leading-snug line-clamp-2',
    meta: 'text-sm text-text-400',
    gap: 'gap-2.5',
    avatar: 'md',
    art: 'md',
  },
};

function CardSurface({
  href,
  onSelect,
  children,
  className,
}: {
  href?: string;
  onSelect?: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${className ?? ''}`}
      >
        {children}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

export interface TaskCardProps {
  task: TaskCardModel;
  size?: TaskCardSize;
  showMenu?: boolean;
  /** Selection mode (pickers/search) — disables navigation on the shell */
  onSelect?: (taskId: string) => void;
  onComplete?: (taskId: string) => Promise<void> | void;
  onEdit?: (taskId: string) => void;
  onReassign?: (taskId: string) => void;
  onDeleteRequest?: (taskId: string, taskTitle: string) => Promise<void> | void;
  onCompleted?: (taskId: string) => void;
  onDeleted?: (taskId: string) => void;
}

export function TaskCard({
  task,
  size = 'standard',
  showMenu = true,
  onSelect,
  onComplete,
  onEdit,
  onReassign,
  onDeleteRequest,
  onCompleted,
  onDeleted,
}: TaskCardProps) {
  const router = useRouter();
  const styles = SIZE_STYLES[size];
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const selectable = typeof onSelect === 'function';
  const detailHref = selectable ? undefined : task.href;

  const actionEnabled = (id: TaskCardMenuAction): boolean => {
    if (id === 'open' || id === 'edit') return true;
    if (id === 'complete') return Boolean(onComplete);
    if (id === 'reassign') return Boolean(onReassign);
    if (id === 'delete') return Boolean(onDeleteRequest);
    return false;
  };

  const overflowItems: EntityOverflowMenuItem[] = (task.menuActions ?? [])
    .map((id): EntityOverflowMenuItem => {
      switch (id) {
        case 'open':
          return {
            id: 'open',
            label: 'Open',
            onClick: () => router.push(task.href),
            disabled: busy,
          };
        case 'complete':
          return {
            id: 'complete',
            label: 'Complete',
            onClick: () => setConfirmComplete(true),
            disabled: busy || !actionEnabled('complete'),
          };
        case 'edit':
          return {
            id: 'edit',
            label: 'Edit',
            onClick: () => {
              if (onEdit) onEdit(task.id);
              else router.push(`${task.href}?edit=1`);
            },
            disabled: busy,
          };
        case 'reassign':
          return {
            id: 'reassign',
            label: 'Reassign',
            onClick: () => onReassign?.(task.id),
            disabled: busy || !actionEnabled('reassign'),
          };
        case 'delete':
          return {
            id: 'delete',
            label: 'Delete',
            variant: 'danger',
            separatorBefore: true,
            onClick: () => setConfirmDelete(true),
            disabled: busy || !actionEnabled('delete'),
          };
        default:
          return {
            id: String(id),
            label: String(id),
            onClick: () => {},
            disabled: true,
          };
      }
    });

  const stopMenuBubble = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      data-task-card
      data-task-id={task.id}
      data-size={size}
      className="group relative rounded-xl border border-surface-200 bg-layer-2 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all duration-200 overflow-hidden h-full"
    >
      <div className={styles.pad}>
        {/* Header: priority + menu */}
        <div className="flex items-start justify-between gap-2">
          <Badge
            label={task.priority}
            color={priorityBadgeColor(task.priorityKey)}
            size="sm"
            dot
          />
          {showMenu && !selectable && overflowItems.length > 0 ? (
            <div className="shrink-0 -mr-1 -mt-1" onClick={stopMenuBubble}>
              <EntityOverflowMenu align="right" items={overflowItems} />
            </div>
          ) : null}
        </div>

        {/* Title */}
        <CardSurface
          href={detailHref}
          onSelect={selectable ? () => onSelect?.(task.id) : undefined}
          className="block min-w-0"
        >
          <h3 className={`${styles.title} text-primary-400`} title={task.title}>
            {task.title}
          </h3>
        </CardSurface>

        {/* Status */}
        <div>
          <StatusBadge status={task.statusToken} />
        </div>

        {/* Assignee */}
        {task.assignee ? (
          <div className={`flex items-center ${styles.gap} min-w-0`}>
            <Avatar
              name={task.assignee.displayName}
              src={task.assignee.avatarUrl}
              size={styles.avatar}
            />
            <p className={`${styles.meta} truncate`} title={task.assignee.displayName}>
              <span className="text-text-500">Assigned to: </span>
              <span className="text-content-secondary font-medium">
                {task.assignee.displayName}
              </span>
            </p>
          </div>
        ) : (
          <p className={styles.meta}>
            <span className="text-text-500">Assigned to: </span>
            Unassigned
          </p>
        )}

        {/* Related release */}
        {task.release ? (
          <Link
            href={`/releases/${task.release.id}`}
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center ${styles.gap} min-w-0 rounded-lg hover:bg-layer-1/60 -mx-1 px-1 py-0.5 transition-colors`}
          >
            <ArtworkDisplay
              src={task.release.artworkUrl ?? undefined}
              releaseTitle={task.release.title}
              size={styles.art}
            />
            <p className={`${styles.meta} truncate min-w-0`} title={task.release.title}>
              <span className="text-text-500">Release: </span>
              <span className="text-content-secondary font-medium">
                {task.release.title}
              </span>
            </p>
          </Link>
        ) : null}

        {/* Due */}
        {task.dueLabel ? (
          <p
            className={`${styles.meta} font-medium ${
              task.isOverdue ? 'text-danger-500' : 'text-content-secondary'
            }`}
          >
            {task.isOverdue ? task.dueLabel : `Due ${task.dueLabel}`}
          </p>
        ) : null}

        {/* Reminder */}
        {task.reminderLabel ? (
          <p className={styles.meta}>
            <span className="text-text-500">Reminder </span>
            <span className="text-content-secondary">{task.reminderLabel}</span>
          </p>
        ) : null}

        {/* Progress */}
        {task.progress !== null && task.progress !== undefined ? (
          <div className="pt-0.5">
            <ProgressBar value={task.progress} size="sm" showLabel={size !== 'compact'} />
          </div>
        ) : null}
      </div>

      <ConfirmationDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={() => {
          void (async () => {
            if (!onComplete) return;
            setBusy(true);
            setConfirmComplete(false);
            try {
              await onComplete(task.id);
              onCompleted?.(task.id);
            } finally {
              setBusy(false);
            }
          })();
        }}
        title="Complete Task?"
        message={`Mark "${task.title}" as completed?`}
        confirmLabel="Complete"
        variant="default"
        loading={busy}
      />

      <ConfirmationDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          void (async () => {
            if (!onDeleteRequest) return;
            setBusy(true);
            setConfirmDelete(false);
            try {
              await onDeleteRequest(task.id, task.title);
              onDeleted?.(task.id);
            } finally {
              setBusy(false);
            }
          })();
        }}
        title="Delete Task?"
        message={`Delete "${task.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
