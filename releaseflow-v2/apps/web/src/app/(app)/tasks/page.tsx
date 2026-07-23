'use client';

/**
 * BUILD-014 / BUILD-017 — Tasks catalogue.
 * Page title: "Tasks" (never "My Tasks" / "Task List").
 * All task rows render through the canonical TaskCard.
 */

import { useMemo, useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { usePermissions } from '@/hooks/usePermissions';
import { useTasks } from '@/hooks/useTask';
import type { TaskListFilter } from '@/lib/task-service';
import { completeTask, deleteTaskEntity } from '@/lib/task-service';
import { toast } from '@/stores/toast-store';
import { TaskCard } from '@/components/tasks/TaskCard';
import {
  Button,
  Container,
  EmptyState,
  LoadingState,
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
  const { taskCards, loading, error, refresh } = useTasks(filter, searchDebounced);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const canCreate = perms.canManageAssignments;
  const canManage = perms.canManageAssignments;
  const isSearch = searchDebounced.length > 0;
  const cardSize = isSearch ? 'compact' : 'standard';

  const emptyDescription = useMemo(() => {
    if (isSearch) return 'No tasks match your search.';
    if (filter === 'assigned_to_me') return 'No tasks are assigned to you.';
    if (filter === 'overdue') return 'Nothing overdue.';
    if (filter === 'completed') return 'No completed tasks yet.';
    return 'Create a task to track work.';
  }, [filter, isSearch]);

  const handleComplete = useCallback(
    async (taskId: string) => {
      if (!user?.uid) return;
      try {
        await completeTask(taskId, user.uid);
        toast.success('Task completed');
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to complete task');
      }
    },
    [user?.uid, refresh],
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      if (!user?.uid) return;
      try {
        await deleteTaskEntity(taskId, user.uid);
        toast.success('Task deleted');
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete task');
      }
    },
    [user?.uid, refresh],
  );

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

      {!loading && !error && taskCards.length === 0 ? (
        <EmptyState title="No tasks" description={emptyDescription} />
      ) : null}

      {!loading && taskCards.length > 0 ? (
        <div
          data-task-card-grid
          data-task-search-results={isSearch ? 'true' : undefined}
          className={
            isSearch
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
          }
        >
          {taskCards.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              size={cardSize}
              onComplete={canManage ? handleComplete : undefined}
              onEdit={
                canManage
                  ? (id) => router.push(`/tasks/${id}?edit=1`)
                  : undefined
              }
              onReassign={
                canManage
                  ? (id) => router.push(`/tasks/${id}?reassign=1`)
                  : undefined
              }
              onDeleteRequest={canManage ? handleDelete : undefined}
            />
          ))}
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
