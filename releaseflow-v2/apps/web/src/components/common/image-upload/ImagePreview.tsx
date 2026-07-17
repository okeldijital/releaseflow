'use client';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  size?: number;
  rounded?: boolean;
  className?: string;
}

export function ImagePreview({
  src,
  alt = 'Preview',
  size = 128,
  rounded = true,
  className = '',
}: ImagePreviewProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden ring-1 ring-surface-0/10 bg-surface-950 ${rounded ? 'rounded-xl' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
