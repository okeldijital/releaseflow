'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { useTask } from '@/hooks/useTask';
import {
  completeTask,
  setTaskStatus,
  deleteTaskEntity,
  toJsDate,
  type TaskStatus,
} from '@/lib/task-service';
import { resolvePersonNames } from '@/lib/resolve-person-names';
import { resolveIdentity } from '@/lib/identity-service';
import { IdentityAvatar } from '@/components/identity-avatar';
import { getRelease } from '@/lib/release-repository';
import {
  Button,
  Container,
  LoadingState,
  Badge,
  StatusBadge,
  Select,
} from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-content-secondary',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDateTime(d: unknown): string {
  const date = toJsDate(d);
  if (!date) return '—';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(d: unknown): string {
  const date = toJsDate(d);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = typeof params.id === 'string' ? params.id : undefined;
  const { user } = useAuth();
  const perms = usePermissions();
  const { data, loading, error, refresh } = useTask(taskId);
  const [assigneeName, setAssigneeName] = useState('—');
  const [createdByName, setCreatedByName] = useState('—');
  const [releaseTitle, setReleaseTitle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const task = data?.task;
  const assignment = data?.assignment;

  useEffect(() => {
    if (!assignment?.assigneeId) {
      setAssigneeName('—');
      return;
    }
    void resolvePersonNames([assignment.assigneeId]).then((m) => {
      setAssigneeName(m.get(assignment.assigneeId) ?? 'Unknown');
    });
  }, [assignment?.assigneeId]);

  useEffect(() => {
    if (!task?.createdBy) {
      setCreatedByName('—');
      return;
    }
    void resolveIdentity(task.createdBy).then((id) => {
      setCreatedByName(id.displayName);
    });
  }, [task?.createdBy]);

  useEffect(() => {
    if (!task?.releaseId) {
      setReleaseTitle(null);
      return;
    }
    const releaseId = task.releaseId;
    void getRelease(releaseId)
      .then((r) => {
        setReleaseTitle(r ? (r.displayTitle || r.title) : releaseId);
      })
      .catch(() => setReleaseTitle(releaseId));
  }, [task?.releaseId]);

  const canEdit = perms.canManageAssignments;
  const canComplete =
    canEdit
    || (assignment
      && user?.uid
      && (assignment.assigneeUserId === user.uid || assignment.assigneeId === user.uid));

  const openStatuses = useMemo(
    () => STATUS_OPTIONS.filter((s) => s.value !== 'completed' || task?.status === 'completed'),
    [task?.status],
  );

  async function handleStatusChange(next: string) {
    if (!taskId || !user?.uid || !task) return;
    setBusy(true);
    try {
      if (next === 'completed') {
        await completeTask(taskId, user.uid);
      } else {
        await setTaskStatus(taskId, next as TaskStatus, user.uid);
      }
      toast.success('Status updated');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!taskId || !user?.uid) return;
    setBusy(true);
    try {
      await completeTask(taskId, user.uid);
      toast.success('Task completed');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete task');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!taskId || !user?.uid) return;
    if (!window.confirm('Delete this task? Linked assignment will be cancelled.')) return;
    setBusy(true);
    try {
      await deleteTaskEntity(taskId, user.uid);
      toast.success('Task deleted');
      router.push('/tasks');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task');
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <LoadingState />
      </Container>
    );
  }

  if (error || !task) {
    return (
      <Container className="py-8">
        <p className="text-sm text-danger-500">{error ?? 'Task not found'}</p>
        <Link href="/tasks" className="text-sm text-primary-400 mt-4 inline-block">
          Back to Tasks
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/tasks" className="text-xs text-content-label hover:text-primary-400">
            ← Tasks
          </Link>
          <h1 className="text-2xl font-semibold text-content-primary mt-2 break-words">
            {task.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={statusLabel(task.status)} />
            <Badge label={task.priority} color={priorityColors[task.priority] ?? ''} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canComplete && task.status !== 'completed' && task.status !== 'cancelled' ? (
            <Button variant="primary" disabled={busy} onClick={() => void handleComplete()}>
              Mark Complete
            </Button>
          ) : null}
          {canEdit ? (
            <Button variant="ghost" disabled={busy} onClick={() => void handleDelete()}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5">
            <h2 className="text-sm font-semibold text-content-primary mb-2">Description</h2>
            <p className="text-sm text-content-secondary whitespace-pre-wrap">
              {task.description?.trim() || 'No description.'}
            </p>
          </section>

          {assignment ? (
            <section className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5">
              <h2 className="text-sm font-semibold text-content-primary mb-2">Assignment</h2>
              <p className="text-sm text-content-secondary">
                Ownership is managed by Assignment.{' '}
                <Link
                  href={`/assignments/${assignment.id}`}
                  className="text-primary-400 hover:underline"
                >
                  Open assignment
                </Link>
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 space-y-3 text-sm">
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Status</p>
              {canEdit && task.status !== 'completed' ? (
                <div className="mt-1">
                  <Select
                    options={openStatuses}
                    value={task.status}
                    onChange={(v) => void handleStatusChange(v)}
                    disabled={busy}
                  />
                </div>
              ) : (
                <p className="mt-1 text-content-primary">{statusLabel(task.status)}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Priority</p>
              <p className="mt-1 text-content-primary capitalize">{task.priority}</p>
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Assigned To</p>
              <div className="mt-1 flex items-center gap-2">
                {assignment ? (
                  <IdentityAvatar
                    userId={assignment.assigneeUserId ?? assignment.assigneeId}
                    fallbackName={assigneeName}
                    size="sm"
                  />
                ) : null}
                <p className="text-content-primary">{assigneeName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Created By</p>
              <div className="mt-1 flex items-center gap-2">
                <IdentityAvatar userId={task.createdBy} fallbackName={createdByName} size="sm" />
                <p className="text-content-primary">{createdByName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Due Date</p>
              <p className="mt-1 text-content-primary">{formatDate(task.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Reminder</p>
              <p className="mt-1 text-content-primary">{formatDateTime(task.reminderAt)}</p>
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Linked Release</p>
              <p className="mt-1 text-content-primary">
                {task.releaseId ? (
                  <Link
                    href={`/releases/${task.releaseId}`}
                    className="text-primary-400 hover:underline"
                  >
                    {releaseTitle ?? task.releaseId}
                  </Link>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Created</p>
              <p className="mt-1 text-content-primary">{formatDateTime(task.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Updated</p>
              <p className="mt-1 text-content-primary">{formatDateTime(task.updatedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-content-label uppercase tracking-wide">Completed</p>
              <p className="mt-1 text-content-primary">{formatDateTime(task.completedAt)}</p>
            </div>
          </section>
        </aside>
      </div>
    </Container>
  );
}
