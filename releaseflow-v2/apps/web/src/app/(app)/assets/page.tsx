'use client';

import { EmptyState, LoadingState } from '@releaseflow/ui';
import { useOrgStore } from '@/stores/org-store';

export default function AssetsPage() {
  const { activeOrgId } = useOrgStore();

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-2">Assets</h1>
        <EmptyState title="No organisation selected" description="Select an organisation to view its asset library." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-2">Assets</h1>
      <p className="text-sm text-text-500 mb-8">Global media library for audio, artwork, video, photography, and documents.</p>
      <EmptyState title="No assets yet" description="Upload audio, artwork, video, or documents to your organization's shared library." action={{ label: 'Upload Assets', onClick: () => {} }} />
    </div>
  );
}
