'use client';

import { EmptyState } from '@releaseflow/ui';

export default function WorkPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-2">Work</h1>
      <p className="text-sm text-text-500 mb-8">
        Your personal workspace — tasks, reviews, approvals, and mentions.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="No tasks assigned"
          description="Tasks assigned to you will appear here."
        />
        <EmptyState
          title="No pending reviews"
          description="Items awaiting your review will appear here."
        />
      </div>
    </div>
  );
}
