'use client';

import { useParams } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useTrack } from '@/hooks/useTrack';
import { TrackWorkspace } from '@/components/track-workspace';
import { EmptyState, LoadingState } from '@releaseflow/ui';

export default function TrackDetailPage() {
  const params = useParams();
  const { activeOrgId } = useOrgStore();
  const id = typeof params.id === 'string' ? params.id : '';
  const { track, loading, refresh } = useTrack(id);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  if (!track) {
    return (
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8">
        <EmptyState title="Track not found" description="The requested track could not be found." />
      </div>
    );
  }

  return (
    <TrackWorkspace
      track={track}
      trackId={id}
      activeOrgId={activeOrgId}
      onRefresh={refresh}
    />
  );
}