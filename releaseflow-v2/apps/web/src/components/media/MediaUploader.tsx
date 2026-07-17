'use client';

import { ImageUploader } from '@/components/common/image-upload/ImageUploader';

interface MediaUploaderProps {
  onUpload: (file: File) => void;
  onCancel?: () => void;
  accept?: string;
  maxSizeMB?: number;
  minWidth?: number;
  minHeight?: number;
  label?: string;
  className?: string;
}

export function MediaUploader(props: MediaUploaderProps) {
  return <ImageUploader {...props} />;
}
