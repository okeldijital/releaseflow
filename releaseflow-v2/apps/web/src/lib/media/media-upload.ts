import {
  transformImage as cloudinaryTransformImage,
  getAssetUrl as cloudinaryGetAssetUrl,
} from '@releaseflow/firebase/cloudinary';
import type { UploadResult } from '@releaseflow/firebase/cloudinary';
import { getAuthInstance } from '@/lib/firebase';

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

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/**
 * Uploads a file to Cloudinary using a server-generated signed upload.
 * The client never holds the API secret or an upload preset; it requests a
 * short-lived signature from /api/media/upload-signature and forwards it to
 * Cloudinary.
 */
export async function uploadFile(
  file: File,
  options: SignedUploadOptions,
): Promise<UploadResult> {
  const currentUser = getAuthInstance()?.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to upload media.');
  }
  const idToken = await currentUser.getIdToken();

  const signatureRes = await fetch('/api/media/upload-signature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      entityType: options.entityType,
      entityId: options.entityId,
      organizationId: options.organizationId,
      tags: options.tags ?? [],
    }),
  });

  if (!signatureRes.ok) {
    let message = 'Failed to request upload signature';
    try {
      const data = (await signatureRes.json()) as { error?: string };
      message = data?.error ?? message;
    } catch {
      /* ignore parse errors, keep default message */
    }
    throw new Error(message);
  }

  const sig = (await signatureRes.json()) as UploadSignature;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
    { method: 'POST', body: formData },
  );

  const data = await uploadRes.json();
  if (data.error) {
    throw new Error(data.error.message ?? 'Cloudinary upload failed');
  }

  return {
    publicId: data.public_id,
    url: data.url,
    secureUrl: data.secure_url,
    format: data.format,
    bytes: data.bytes,
    createdAt: data.created_at,
  };
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
