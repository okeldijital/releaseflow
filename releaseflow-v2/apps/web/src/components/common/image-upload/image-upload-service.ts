import { uploadFile, transformImage } from '@/lib/media/media-upload';

export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const AVATAR_MAX_SIZE = 5 * 1024 * 1024;

export interface UploadOptions {
  entityType: string;
  entityId: string;
  organizationId: string;
  tags?: string[];
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
}

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return `Unsupported file type. Allowed: JPG, PNG, WEBP`;
  }
  if (file.size > AVATAR_MAX_SIZE) {
    return `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum: 5 MB`;
  }
  return null;
}

export async function uploadImageFile(
  file: File,
  options: UploadOptions,
): Promise<UploadResult> {
  const result = await uploadFile(file, {
    entityType: options.entityType,
    entityId: options.entityId,
    organizationId: options.organizationId,
    tags: options.tags ?? [],
  });

  return {
    publicId: result.publicId,
    secureUrl: result.secureUrl,
    format: result.format,
    bytes: result.bytes,
  };
}

export function getAvatarThumbnailUrl(publicId: string, size: number = 80): string {
  return transformImage(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}