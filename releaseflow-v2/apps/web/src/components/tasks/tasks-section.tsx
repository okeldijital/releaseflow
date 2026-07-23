'use client';

/**
 * BUILD-014 / BUILD-017 — Release Details TASKS section.
 * Uses canonical TaskCard only — no release-specific layout.
 */

import { useReleaseTasks } from '@/hooks/useTask';
import { EmptyState, LoadingState } from '@releaseflow/ui';
import { TaskCard } from '@/components/tasks/TaskCard';

interface TasksSectionProps {
  releaseId: string;
}

export function TasksSection({ releaseId }: TasksSectionProps) {
  const { taskCards, loading } = useReleaseTasks(releaseId);

  if (loading) return <LoadingState />;
  if (taskCards.length === 0) {
    return (
      <EmptyState
        title="No tasks"
        description="No tasks linked to this release yet."
      />
    );
  }

  return (
    <div
      data-task-card-grid
      data-release-tasks
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {taskCards.map((task) => (
        <TaskCard key={task.id} task={task} size="standard" />
      ))}
    </div>
  );
}
