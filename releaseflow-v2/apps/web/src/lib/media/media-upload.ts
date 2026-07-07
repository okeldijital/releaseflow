import {
  uploadFile as cloudinaryUploadFile,
  transformImage as cloudinaryTransformImage,
  getAssetUrl as cloudinaryGetAssetUrl,
} from '@releaseflow/firebase/cloudinary';
import type { UploadResult } from '@releaseflow/firebase/cloudinary';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
  'image/tiff',
  'image/psd',
  'image/vnd.adobe.photoshop',
];

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
const MAX_OTHER_SIZE = 200 * 1024 * 1024;

function isCloudinaryConfigured(): boolean {
  return !!(
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );
}

export async function uploadFile(
  file: File,
  options?: { folder?: string; publicId?: string; tags?: string[] },
): Promise<UploadResult | null> {
  if (!isCloudinaryConfigured()) return null;
  return cloudinaryUploadFile(file, options);
}

export function transformImage(
  publicId: string,
  options: { width?: number; height?: number; crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'limit'; quality?: number | 'auto'; format?: 'auto' | 'webp' | 'png' | 'jpg' },
): string {
  return cloudinaryTransformImage(publicId, options);
}

export function getAssetUrl(publicId: string): string {
  return cloudinaryGetAssetUrl(publicId);
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateMediaFile(
  file: File,
  _options?: { requireSquare?: boolean },
): ValidationError[] {
  const errors: ValidationError[] = [];

  const isImage = file.type.startsWith('image/');
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_OTHER_SIZE;
  if (file.size > maxSize) {
    errors.push({
      field: 'fileSize',
      message: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push({
      field: 'mimeType',
      message: `Unsupported file type: ${file.type}. Allowed: PNG, JPG, JPEG, WEBP, TIFF, PSD`,
    });
  }

  return errors;
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function generateThumbnailUrl(publicId: string, size: number = 300): string {
  return transformImage(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}
