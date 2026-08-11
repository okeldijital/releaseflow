/**
 * BUILD-014D / BUILD-301A — Canonical client media transport.
 *
 * Public contracts for uploadFile / destroyFile are unchanged.
 * Internally they resolve through StorageProvider → CloudinaryStorageProvider.
 *
 * Browser never reads Cloudinary API secrets or server config modules.
 */
import {
  MediaUrlService,
  transformImage as cloudinaryTransformImage,
  getAssetUrl as cloudinaryGetAssetUrl,
} from '@releaseflow/firebase/cloudinary';
import type { UploadResult } from '@releaseflow/firebase/cloudinary';
import { getAuthInstance } from '@/lib/firebase';
import {
  getDefaultStorageProvider,
  isStorageError,
  CLOUDINARY_PROVIDER_ID,
} from '@/lib/storage';

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

export interface SignedUploadOptions {
  entityType: string;
  entityId: string;
  organizationId: string;
  tags?: string[];
}

export interface MediaUploadResult {
  success: true;
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  createdAt?: string;
}

/**
 * Uploads a file via the storage provider abstraction (default: cloudinary).
 * Return shape remains the historical UploadResult (publicId, secureUrl, …)
 * so artwork/media/avatar callers need no changes.
 *
 * Note: `publicId` in the return value is the Cloudinary provider file id for
 * backward compatibility. Prefer StorageObject.providerFileId for new code.
 */
export async function uploadFile(
  file: File,
  options: SignedUploadOptions,
): Promise<UploadResult & { width?: number; height?: number }> {
  const currentUser = getAuthInstance()?.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to upload media.');
  }
  const idToken = await currentUser.getIdToken();

  const provider = getDefaultStorageProvider(null, options.organizationId);

  try {
    const stored = await provider.upload({
      payload: file,
      filename: file.name,
      contentType: file.type || undefined,
      context: {
        organizationId: options.organizationId,
        entityType: options.entityType,
        entityId: options.entityId,
        tags: options.tags,
        accessToken: idToken,
      },
    });

    const meta = (stored.metadata ?? {}) as {
      format?: string;
      width?: number;
      height?: number;
    };

    // Map StorageObject → historical UploadResult for callers.
    // providerFileId is the external id (Cloudinary publicId).
    return {
      publicId: stored.providerFileId,
      url: stored.downloadUrl ?? '',
      secureUrl: stored.downloadUrl ?? '',
      format: meta.format ?? '',
      bytes: stored.sizeBytes ?? 0,
      createdAt: stored.createdAt ?? '',
      width: typeof meta.width === 'number' ? meta.width : undefined,
      height: typeof meta.height === 'number' ? meta.height : undefined,
    };
  } catch (err) {
    if (isStorageError(err)) {
      throw new Error(err.message, { cause: err });
    }
    throw err;
  }
}

export interface DestroyFileOptions {
  publicId: string;
  organizationId: string;
  entityType: string;
}

/**
 * Canonical destroy via StorageProvider.delete (cloudinary adapter).
 * Options still accept `publicId` for backward compatibility; it is mapped
 * to providerFileId inside the provider.
 */
export async function destroyFile(options: DestroyFileOptions): Promise<{ success: true }> {
  const currentUser = getAuthInstance()?.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to delete media.');
  }
  const idToken = await currentUser.getIdToken();

  const provider = getDefaultStorageProvider(null, options.organizationId);

  try {
    await provider.delete({
      providerFileId: options.publicId,
      organizationId: options.organizationId,
      entityType: options.entityType,
      accessToken: idToken,
    });
    return { success: true };
  } catch (err) {
    if (isStorageError(err)) {
      throw new Error(err.message, { cause: err });
    }
    throw err;
  }
}

/** Best-effort destroy; never throws. */
export async function attemptDestroyFile(options: DestroyFileOptions): Promise<void> {
  try {
    await destroyFile(options);
  } catch {
    /* ignore */
  }
}

export function transformImage(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'limit';
    quality?: number | 'auto';
    format?: 'auto' | 'webp' | 'png' | 'jpg';
  },
): string {
  return cloudinaryTransformImage(publicId, options);
}

export function getAssetUrl(publicId: string): string {
  // Prefer provider when possible; MediaUrlService remains for pure sync URL builds.
  try {
    // Sync path: Cloudinary download URL does not need async.
    if (CLOUDINARY_PROVIDER_ID) {
      return cloudinaryGetAssetUrl(publicId);
    }
  } catch {
    /* fall through */
  }
  return cloudinaryGetAssetUrl(publicId);
}

export { MediaUrlService };

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
  return MediaUrlService.artworkThumbnail(publicId, size);
}
