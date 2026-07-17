'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@releaseflow/ui';

type UploadStatus = 'idle' | 'validating' | 'ready' | 'uploading' | 'done' | 'error';

interface ValidationError {
  type: 'type' | 'size' | 'dimensions';
  message: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getImageDimensions(f: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  onCancel?: () => void;
  accept?: string;
  maxSizeMB?: number;
  minWidth?: number;
  minHeight?: number;
  label?: string;
  className?: string;
  validateFile?: (file: File) => string | null;
}

export function ImageUploader({
  onUpload,
  onCancel,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  maxSizeMB = 5,
  minWidth,
  minHeight,
  label = 'Upload image',
  className = '',
  validateFile: customValidate,
}: ImageUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<ValidationError | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function reset() {
    setStatus('idle');
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setProgress(0);
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }

  function simulateProgress() {
    setProgress(0);
    let p = 0;
    progressTimer.current = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        if (progressTimer.current) clearInterval(progressTimer.current);
        progressTimer.current = null;
        setStatus('done');
        if (file) onUpload(file);
      }
      setProgress(Math.min(p, 100));
    }, 300);
  }

  async function validateFile(f: File): Promise<ValidationError | null> {
    if (customValidate) {
      const msg = customValidate(f);
      if (msg) return { type: 'type', message: msg };
      return null;
    }

    const allowedTypes = accept.split(',').map((t) => t.trim());
    const matchesType = allowedTypes.some((t) => {
      if (t.endsWith('/*')) {
        const category = t.replace('/*', '/');
        return f.type.startsWith(category);
      }
      return f.type === t || f.name.endsWith(t.replace('*', ''));
    });
    if (!matchesType) {
      return { type: 'type', message: `Invalid file type. Accepted: ${accept}` };
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (f.size > maxBytes) {
      return { type: 'size', message: `File too large (${formatSize(f.size)}). Maximum: ${maxSizeMB} MB` };
    }

    if (minWidth || minHeight) {
      try {
        const dims = await getImageDimensions(f);
        if (minWidth && dims.width < minWidth) {
          return { type: 'dimensions', message: `Image too narrow (${dims.width}px). Minimum width: ${minWidth}px` };
        }
        if (minHeight && dims.height < minHeight) {
          return { type: 'dimensions', message: `Image too short (${dims.height}px). Minimum height: ${minHeight}px` };
        }
      } catch {
        return { type: 'dimensions', message: 'Could not read image dimensions.' };
      }
    }

    return null;
  }

  async function handleFile(f: File) {
    setStatus('validating');
    setFile(f);
    setError(null);

    const err = await validateFile(f);
    if (err) {
      setError(err);
      setStatus('error');
      return;
    }

    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setStatus('ready');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  }

  function handleUpload() {
    setStatus('uploading');
    simulateProgress();
  }

  function handleCancel() {
    reset();
    onCancel?.();
  }

  function handleRetry() {
    reset();
  }

  const isUploading = status === 'uploading';
  const isDone = status === 'done';
  const hasError = status === 'error';
  const hasPreview = previewUrl && (status === 'ready' || isUploading || isDone);

  return (
    <div className={className}>
      <div
        className={[
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed',
          'p-8 transition-all duration-normal ease-standard min-h-[200px]',
          isDragOver
            ? 'border-primary-500 bg-primary-500/5'
            : hasError
              ? 'border-danger-500 bg-danger-500/5'
              : isDone
                ? 'border-success-500 bg-success-500/5'
                : 'border-surface-300 bg-layer-2 hover:border-surface-400',
          isUploading ? 'pointer-events-none' : 'cursor-pointer',
        ].join(' ')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => { if (!isUploading && !isDone) inputRef.current?.click(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isUploading && !isDone) { e.preventDefault(); inputRef.current?.click(); } }}
        aria-label={label}
      >
        {isDragOver && (
          <div className="flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4m-4 12H5a2 2 0 01-2-2v-4" />
            </svg>
            <p className="text-sm font-medium text-primary-500">Drop file here</p>
          </div>
        )}

        {!isDragOver && status === 'idle' && (
          <div className="flex flex-col items-center gap-3">
            <svg className="h-8 w-8 text-text-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4m-4 12H5a2 2 0 01-2-2v-4" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-text-700">{label}</p>
              <p className="text-xs text-text-500 mt-1">Drag & drop or click to browse</p>
            </div>
          </div>
        )}

        {!isDragOver && status === 'validating' && (
          <div className="flex flex-col items-center gap-3">
            <svg className="h-8 w-8 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-text-500">Validating file…</p>
          </div>
        )}

        {hasPreview && (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="relative w-32 h-32 rounded-xl overflow-hidden ring-1 ring-surface-0/10 bg-surface-950">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
              {isDone && (
                <div className="absolute inset-0 bg-surface-950/40 flex items-center justify-center">
                  <svg className="h-8 w-8 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-700 truncate max-w-[200px]">{file?.name}</p>
              <p className="text-xs text-text-500">{file ? formatSize(file.size) : ''}</p>
            </div>
            {isUploading && (
              <div className="w-full max-w-xs">
                <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-text-500 mt-1 text-center">{Math.round(progress)}%</p>
              </div>
            )}
          </div>
        )}

        {hasError && !isDragOver && (
          <div className="flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <p className="text-sm font-medium text-danger-500 text-center">{error?.message}</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleInputChange}
        aria-hidden="true"
      />

      <div className="flex gap-2 mt-3">
        {status === 'ready' && (
          <>
            <Button size="sm" variant="primary" className="flex-1" onClick={handleUpload}>
              Upload
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}
        {isUploading && (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            Uploading…
          </Button>
        )}
        {isDone && (
          <Button size="sm" variant="outline" className="flex-1" onClick={handleCancel}>
            Done
          </Button>
        )}
        {hasError && (
          <Button size="sm" variant="primary" className="flex-1" onClick={handleRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
