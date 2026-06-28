'use client';

import { EmptyState } from '@releaseflow/ui';

export default function PeoplePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-2">People</h1>
      <p className="text-sm text-text-500 mb-8">
        Manage contributors, collaborators, and creative partners across your releases.
      </p>
      <EmptyState
        title="No people yet"
        description="Invite producers, engineers, designers, publishers, and other collaborators to your organization."
        action={{ label: 'Invite People', onClick: () => {} }}
      />
    </div>
  );
}
