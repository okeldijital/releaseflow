'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@releaseflow/ui';

interface ReleaseArtworkProps {
  title: string;
  artworkUrl?: string;
  status?: 'approved' | 'pending' | 'missing';
  onReplace?: () => void;
  onRemove?: () => void;
  onUpload?: (file: File) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ARTWORK_COLORS = [
  'bg-primary-600',
  'bg-purple-600',
  'bg-teal-600',
  'bg-pink-600',
  'bg-amber-600',
];

function pickColor(title: string): string {
  return ARTWORK_COLORS[title.charCodeAt(0) % ARTWORK_COLORS.length] ?? 'bg-primary-600';
}

const SIZE_CFG = {
  sm: { box: 'w-12 h-12', text: 'text-xl', badge: 'w-3 h-3', badgeIcon: 'w-2 h-2' },
  md: { box: 'w-30 h-30', text: 'text-5xl', badge: 'w-5 h-5', badgeIcon: 'w-3 h-3' },
  lg: { box: 'w-full aspect-square', text: 'text-6xl', badge: 'w-5 h-5', badgeIcon: 'w-3 h-3' },
} as const;

export function ReleaseArtwork({
  title,
  artworkUrl,
  status,
  onReplace,
  onRemove,
  onUpload,
  className = '',
  size = 'md',
}: ReleaseArtworkProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const color = pickColor(title);
  const hasArtwork = !!artworkUrl && !imgError;
  const cfg = SIZE_CFG[size];

  function handleUploadClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  }, [onUpload]);

  return (
    <div className={className}>
      <div
        className={[
          'relative overflow-hidden rounded-2xl flex items-center justify-center',
          'shadow-lg ring-1 ring-surface-0/10 transition-all duration-normal ease-standard',
          cfg.box,
          hasArtwork ? 'bg-surface-950' : color,
          isDragOver ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-layer-1' : '',
        ].join(' ')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasArtwork ? (
          <img
            src={artworkUrl}
            alt={`${title} artwork`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={`text-surface-50 ${cfg.text} font-bold select-none`}>
            {title.charAt(0).toUpperCase()}
          </span>
        )}

        {status === 'approved' && (
          <span
            className={`absolute top-1.5 right-1.5 ${cfg.badge} flex items-center justify-center rounded-full bg-success-500 shadow-md`}
          >
            <svg className={cfg.badgeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
        {status === 'pending' && (
          <span
            className={`absolute top-1.5 right-1.5 ${cfg.badge} flex items-center justify-center rounded-full bg-warning-500 shadow-md`}
          >
            <svg className={cfg.badgeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
          </span>
        )}
        {status === 'missing' && (
          <span
            className={`absolute top-1.5 right-1.5 ${cfg.badge} flex items-center justify-center rounded-full bg-surface-500 shadow-md`}
          >
            <svg className={cfg.badgeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </span>
        )}

        {isDragOver && (
          <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-xs font-medium text-primary-500 bg-surface-0 px-2 py-1 rounded-md shadow-sm">
              Drop artwork
            </span>
          </div>
        )}
      </div>

      {(onUpload || onReplace) && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      )}

      {hasArtwork && (onReplace || onRemove) && (
        <div className="flex gap-2 mt-3">
          {onReplace && (
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleUploadClick}>
              Replace
            </Button>
          )}
          {onRemove && (
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
      )}
      {!hasArtwork && onUpload && (
        <div className="mt-3">
          <Button size="sm" variant="primary" className="w-full text-xs" onClick={handleUploadClick}>
            Upload Artwork
          </Button>
        </div>
      )}
    </div>
  );
}

export function ReleaseArtworkSkeleton({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const cfg = SIZE_CFG[size];
  return (
    <div className={className}>
      <div className={`${cfg.box} rounded-2xl bg-layer-3 animate-shimmer`} />
      <div className="mt-3">
        <div className="h-8 rounded-md bg-layer-3 animate-shimmer w-full" />
      </div>
    </div>
  );
}
