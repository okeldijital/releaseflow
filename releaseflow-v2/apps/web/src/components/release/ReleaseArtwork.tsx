'use client';

import { useRef } from 'react';
import { Button } from '@releaseflow/ui';
import { ArtworkDisplay } from './artwork-display';
import type { Artwork } from '@/lib/artwork/artwork-types';

export type UploadState = 'idle' | 'selecting' | 'uploading' | 'complete';

interface ReleaseArtworkProps {
  artwork?: Artwork | null;
  releaseTitle: string;
  uploadState: UploadState;
  onUpload: (file: File) => void;
  onUploadStateChange: (state: UploadState) => void;
  className?: string;
}

export function ReleaseArtwork({
  artwork,
  releaseTitle,
  uploadState,
  onUpload,
  onUploadStateChange,
  className = '',
}: ReleaseArtworkProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    onUploadStateChange('selecting');
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      onUpload(file);
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
      {artwork ? (
        <>
          <ArtworkDisplay artwork={artwork} releaseTitle={releaseTitle} size="lg" />
          <div className="mt-3 text-center">
            <span className="text-xs text-success-600 font-medium">Artwork ✓ Uploaded</span>
          </div>
          <Button size="sm" variant="outline" className="w-full text-xs mt-2" onClick={handleClick}>
            Replace Artwork
          </Button>
        </>
      ) : (
        <>
          {uploadState === 'idle' && (
            <Button size="sm" variant="primary" className="w-full text-xs" onClick={handleClick}>
              Upload Artwork
            </Button>
          )}
          {uploadState === 'selecting' && (
            <Button size="sm" variant="primary" className="w-full text-xs" disabled>
              Selecting…
            </Button>
          )}
          {uploadState === 'uploading' && (
            <Button size="sm" variant="primary" className="w-full text-xs" disabled>
              Uploading…
            </Button>
          )}
          {uploadState === 'complete' && (
            <Button size="sm" variant="primary" className="w-full text-xs" disabled>
              Uploaded
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export function ReleaseArtworkSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="w-full aspect-square rounded-2xl bg-layer-3 animate-shimmer" />
      <div className="mt-3">
        <div className="h-8 rounded-md bg-layer-3 animate-shimmer w-full" />
      </div>
    </div>
  );
}
