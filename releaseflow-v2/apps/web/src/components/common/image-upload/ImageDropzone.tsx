'use client';

import { useRef, useState } from 'react';

interface ImageDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
  hasError?: boolean;
  isDone?: boolean;
  className?: string;
}

export function ImageDropzone({
  onFileSelected,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  label = 'Upload image',
  disabled = false,
  hasError = false,
  isDone = false,
  className = '',
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    onFileSelected(f);
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
          disabled ? 'pointer-events-none' : 'cursor-pointer',
        ].join(' ')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => { if (!disabled) inputRef.current?.click(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); inputRef.current?.click(); } }}
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

        {!isDragOver && (
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
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleInputChange}
        aria-hidden="true"
      />
    </div>
  );
}
