'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getTasksByAssignee } from '@/lib/task-service';
import { fetchTrack } from '@/lib/track-service';
import { fetchRelease } from '@/lib/release-service';
import { EmptyState, LoadingState, Badge } from '@releaseflow/ui';
import type { Task } from '@/app/(app)/types';

interface TaskWithEntity extends Task {
  entityName?: string;
  dueDateObj?: Date;
}

function groupTasks(tasks: TaskWithEntity[]): { overdue: TaskWithEntity[]; today: TaskWithEntity[]; upcoming: TaskWithEntity[] } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

  const overdue: TaskWithEntity[] = [];
  const today: TaskWithEntity[] = [];
  const upcoming: TaskWithEntity[] = [];

  for (const t of tasks) {
    if (!t.dueDateObj) {
      upcoming.push(t);
    } else if (t.dueDateObj < startOfToday) {
      overdue.push(t);
    } else if (t.dueDateObj <= endOfToday) {
      today.push(t);
    } else {
      upcoming.push(t);
    }
  }

  return { overdue, today, upcoming };
}

export default function WorkPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const uid = user.uid;

    async function load() {
      try {
        const data = await getTasksByAssignee(uid);

        const enriched = await Promise.all(
          data.map(async (t) => {
            let entityName: string | undefined;

            if (t.entityType === 'track' && t.entityId) {
              const track = await fetchTrack(t.entityId);
              entityName = track ? `Track: ${track.title}` : undefined;
            } else if ((t.entityType === 'release' || !t.entityType) && t.releaseId) {
              const entityId = t.entityType === 'release' ? t.entityId : t.releaseId;
              if (entityId) {
                const release = await fetchRelease(entityId);
                entityName = release ? `Release: ${release.title}` : undefined;
              }
            }

            const dueDateObj = t.dueDate
              ? (t.dueDate as unknown as { toDate: () => Date }).toDate()
              : undefined;

            return { ...t, entityName, dueDateObj };
          }),
        );

        setTasks(enriched);
      } catch {
        setError('failed');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  if (error) return <div className="mx-auto max-w-4xl px-6 py-8"><EmptyState title="Unable to load tasks" description="Something went wrong while loading your tasks. Please try again." /></div>;

  const { overdue, today, upcoming } = groupTasks(tasks);

  const priorityStyles: Record<string, string> = {
    low: 'bg-surface-100 text-text-500',
    medium: 'bg-info-50 text-info-600',
    high: 'bg-warning-50 text-warning-600',
    critical: 'bg-danger-50 text-danger-600',
  };

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">My Work</p>
        <p className="mt-1 text-sm text-text-400">Everything assigned to you.</p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks assigned" description="Tasks assigned to you will appear here. Tasks originate from releases and tracks — check those workspaces." />
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <section>
              <p className="text-sm font-semibold text-danger-600 mb-3">Overdue ({overdue.length})</p>
              <div className="space-y-1.5">
                {overdue.map((t) => <TaskCard key={t.id} task={t} priorityStyles={priorityStyles} overdue />)}
              </div>
            </section>
          )}

          {today.length > 0 && (
            <section>
              <p className="text-sm font-semibold text-warning-600 mb-3">Due Today ({today.length})</p>
              <div className="space-y-1.5">
                {today.map((t) => <TaskCard key={t.id} task={t} priorityStyles={priorityStyles} />)}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <p className="text-sm font-semibold text-text-500 mb-3">Upcoming ({upcoming.length})</p>
              <div className="space-y-1.5">
                {upcoming.map((t) => <TaskCard key={t.id} task={t} priorityStyles={priorityStyles} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, priorityStyles, overdue }: { task: TaskWithEntity; priorityStyles: Record<string, string>; overdue?: boolean }) {
  return (
    <div className="block rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3.5 hover:border-surface-300 transition-all duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-content-primary truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge label={task.priority} color={priorityStyles[task.priority] ?? 'bg-surface-100 text-text-500'} size="sm" />
            <span className="text-xs text-text-400 capitalize">{task.status.replace(/_/g, ' ')}</span>
            {task.entityName ? <span className="text-xs text-text-400">&middot; {task.entityName}</span> : null}
          </div>
        </div>
        {task.dueDateObj ? (
          <span className={`text-xs shrink-0 font-medium ${overdue ? 'text-danger-500' : 'text-text-400'}`}>
            {task.dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-xs shrink-0 text-text-300">No date</span>
        )}
      </div>
    </div>
  );
}
