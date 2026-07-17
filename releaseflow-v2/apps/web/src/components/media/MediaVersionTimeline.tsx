'use client';

import { Button } from '@releaseflow/ui';
import type { MediaVersion } from '@/lib/media/media-types';

interface MediaVersionTimelineProps {
  versions: MediaVersion[];
  currentVersionId?: string;
  onRestore?: (versionId: string) => void;
  onCompare?: (versionIdA: string, versionIdB: string) => void;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: unknown): string {
  if (!ts) return '';
  let d: Date;
  if (ts instanceof Date) d = ts;
  else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) d = new Date((ts as { seconds: number }).seconds * 1000);
  else if (typeof ts === 'string') d = new Date(ts);
  else return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function MediaVersionTimeline({
  versions,
  currentVersionId,
  onRestore,
  onCompare,
  className = '',
}: MediaVersionTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
        <svg className="h-10 w-10 text-text-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <p className="text-sm font-medium text-text-700">No versions yet</p>
        <p className="text-xs text-text-500 mt-1">Upload a file to create the first version.</p>
      </div>
    );
  }

  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-surface-200" aria-hidden="true" />

      <div className="space-y-6">
        {sorted.map((version, idx) => {
          const isCurrent = version.id === currentVersionId;
          const canCompare = versions.length >= 2 && !isCurrent && onCompare;

          return (
            <div key={version.id} className="relative flex gap-4">
              <div className="relative flex flex-col items-center">
                <div
                  className={[
                    'relative z-10 h-[34px] w-[34px] rounded-full flex items-center justify-center',
                    'text-xs font-bold ring-2 shrink-0',
                    isCurrent
                      ? 'bg-primary-500 text-surface-50 ring-surface-0'
                      : 'bg-surface-200 text-text-500 ring-surface-0',
                  ].join(' ')}
                >
                  {getInitials(version.uploadedBy) || `V${version.versionNumber}`}
                </div>
              </div>

              <div
                className={[
                  'flex-1 min-w-0 rounded-xl border p-4 transition-colors',
                  isCurrent
                    ? 'border-primary-500/30 bg-primary-500/5'
                    : 'border-surface-200 bg-layer-2',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-text-700">
                        Version {version.versionNumber}
                      </h3>
                      {isCurrent && (
                        <span className="inline-flex items-center rounded-full bg-primary-500/15 text-primary-500 px-2 py-0.5 text-caption font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-500 mt-0.5">
                      Uploaded {formatDate(version.createdAt)} by {version.uploadedBy}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isCurrent && onRestore && (
                      <Button size="sm" variant="outline" onClick={() => onRestore(version.id)}>
                        Restore
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-500">
                  <span><span className="text-text-400 font-medium">Size:</span> {formatSize(version.fileSize)}</span>
                  {version.dimensions && (
                    <span><span className="text-text-400 font-medium">Dimensions:</span> {version.dimensions.width} × {version.dimensions.height}</span>
                  )}
                  <span><span className="text-text-400 font-medium">Type:</span> {version.mimeType}</span>
                </div>

                {version.notes && (
                  <p className="mt-2 text-sm text-text-600 bg-surface-50 rounded-lg px-3 py-2">
                    {version.notes}
                  </p>
                )}

                {canCompare && idx < sorted.length - 1 && (
                  <button
                    onClick={() => onCompare(version.id, sorted[idx + 1]!.id)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Compare with v{version.versionNumber - 1}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
