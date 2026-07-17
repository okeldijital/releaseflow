'use client';

import Link from 'next/link';
import { WorkspaceCard } from '@releaseflow/ui';
import { ArtworkDisplay } from '@/components/release/artwork-display';

export interface ReleaseContextData {
  releaseId: string;
  releaseTitle: string;
  artistName: string;
  artwork?: { secureUrl?: string } | null;
  trackTitle?: string | null;
  trackPosition?: number | null;
}

interface ReleaseContextCardProps {
  context: ReleaseContextData | null;
  loading?: boolean;
}

export function ReleaseContextCard({ context, loading }: ReleaseContextCardProps) {
  if (loading) {
    return (
      <WorkspaceCard title="Release">
        <div className="flex gap-4 mt-3">
          <div className="w-16 h-16 rounded-lg bg-surface-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-surface-800 rounded animate-pulse" />
            <div className="h-3 w-32 bg-surface-800 rounded animate-pulse" />
          </div>
        </div>
      </WorkspaceCard>
    );
  }

  if (!context) return null;

  return (
    <WorkspaceCard title="Release Context">
      <div className="flex gap-4 mt-3">
        <Link href={`/releases/${context.releaseId}`} className="shrink-0">
          <ArtworkDisplay
            src={context.artwork?.secureUrl ?? undefined}
            releaseTitle={context.releaseTitle}
            size="sm"
            className="w-16 h-16"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/releases/${context.releaseId}`}
            className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors truncate block"
          >
            {context.releaseTitle}
          </Link>
          <p className="text-xs text-text-500 mt-0.5">{context.artistName}</p>
          {context.trackTitle ? (
            <p className="text-xs text-text-400 mt-0.5">
              Track {context.trackPosition ?? ''}: {context.trackTitle}
            </p>
          ) : null}
        </div>
      </div>
    </WorkspaceCard>
  );
}
