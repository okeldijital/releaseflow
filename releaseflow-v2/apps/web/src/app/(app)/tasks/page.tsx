'use client';

/**
 * BUILD-014 — Tasks catalogue.
 * Page title: "Tasks" (never "My Tasks" / "Task List").
 */

import { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { usePermissions } from '@/hooks/usePermissions';
import { useTasks } from '@/hooks/useTask';
import type { TaskListFilter } from '@/lib/task-service';
import { toJsDate } from '@/lib/task-service';
import { resolvePersonNames } from '@/lib/resolve-person-names';
import { getReleasesByOrganization } from '@/lib/release-repository';
import {
  Button,
  Container,
  EmptyState,
  LoadingState,
  Badge,
  StatusBadge,
  Input,
} from '@releaseflow/ui';

const FILTERS: { id: TaskListFilter; label: string }[] = [
  { id: 'assigned_to_me', label: 'Assigned To Me' },
  { id: 'created_by_me', label: 'Created By Me' },
  { id: 'all_open', label: 'All Open' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due_today', label: 'Due Today' },
  { id: 'this_week', label: 'This Week' },
];

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-content-secondary',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

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

const FILTER_IDS = new Set(FILTERS.map((f) => f.id));

function TasksPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const perms = usePermissions();
  const initialFilter = (() => {
    const q = searchParams.get('filter');
    if (q && FILTER_IDS.has(q as TaskListFilter)) return q as TaskListFilter;
    return perms.canManageAssignments ? 'all_open' : 'assigned_to_me';
  })();
  const [filter, setFilter] = useState<TaskListFilter>(initialFilter);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const { rows, loading, error } = useTasks(filter, searchDebounced);
  const [assigneeNames, setAssigneeNames] = useState<Map<string, string>>(new Map());
  const [releaseTitles, setReleaseTitles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const ids = rows
      .map((r) => r.assignment?.assigneeId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) {
      setAssigneeNames(new Map());
      return;
    }
    void resolvePersonNames(ids).then(setAssigneeNames);
  }, [rows]);

  useEffect(() => {
    if (!activeOrgId) return;
    void getReleasesByOrganization(activeOrgId)
      .then((releases) => {
        const map = new Map<string, string>();
        for (const r of releases) {
          map.set(r.id, r.displayTitle || r.title || r.id);
        }
        setReleaseTitles(map);
      })
      .catch(() => setReleaseTitles(new Map()));
  }, [activeOrgId]);

  const canCreate = perms.canManageAssignments;

  const emptyDescription = useMemo(() => {
    if (filter === 'assigned_to_me') return 'No tasks are assigned to you.';
    if (filter === 'overdue') return 'Nothing overdue.';
    if (filter === 'completed') return 'No completed tasks yet.';
    return 'Create a task to track work.';
  }, [filter]);

  return (
    <Container className="py-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content-primary">Tasks</h1>
          <p className="text-sm text-content-secondary mt-1">
            Units of work assigned through the Assignment domain.
          </p>
        </div>
        {canCreate ? (
          <Button
            variant="primary"
            onClick={() => router.push('/tasks/new')}
          >
            New Task
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border min-h-[36px] transition-colors ${
                filter === f.id
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-surface-200 text-content-secondary hover:border-primary-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or description…"
          />
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? (
        <p className="text-sm text-danger-500 mb-4">{error}</p>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <EmptyState title="No tasks" description={emptyDescription} />
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-layer-2 shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-surface-200 bg-layer-1 text-xs uppercase tracking-wide text-content-label">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ task, assignment }) => {
                const assigneeId = assignment?.assigneeId;
                const assignee =
                  assigneeId
                    ? (assigneeNames.get(assigneeId) ?? '…')
                    : '—';
                const releaseLabel = task.releaseId
                  ? (releaseTitles.get(task.releaseId) ?? task.releaseId)
                  : '—';
                return (
                  <tr
                    key={task.id}
                    className="border-b border-surface-100 last:border-0 hover:bg-layer-1/60"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={statusLabel(task.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-medium text-primary-400 hover:underline"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-content-secondary">{assignee}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={task.priority}
                        color={priorityColors[task.priority] ?? ''}
                      />
                    </td>
                    <td className="px-4 py-3 text-content-secondary">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-content-secondary">
                      {task.releaseId ? (
                        <Link
                          href={`/releases/${task.releaseId}`}
                          className="hover:text-primary-400"
                        >
                          {releaseLabel}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-content-label">
                      {formatDate(task.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!user || !activeOrgId ? (
        <p className="text-sm text-content-label mt-4">Select an organisation to view tasks.</p>
      ) : null}
    </Container>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="py-16"><LoadingState /></div>}>
      <TasksPageInner />
    </Suspense>
  );
}
