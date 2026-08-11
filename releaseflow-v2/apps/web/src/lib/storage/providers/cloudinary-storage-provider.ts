/**
 * BUILD-301A — CloudinaryStorageProvider.
 *
 * Sole concrete StorageProvider in this build.
 * Maps Cloudinary publicId → providerFileId (never RF asset identity).
 * Folder construction stays inside this adapter.
 * Delegates to existing signed upload / destroy / MediaUrlService behaviour.
 */

import {
  MediaUrlService,
  getAssetUrl as cloudinaryGetAssetUrl,
} from '@releaseflow/firebase/cloudinary';
import type { StorageProvider } from '../storage-provider';
import {
  CLOUDINARY_PROVIDER_ID,
  type StorageDeleteInput,
  type StorageDownloadUrlInput,
  type StorageExistsInput,
  type StorageListInput,
  type StorageMetadata,
  type StorageMetadataInput,
  type StorageMoveInput,
  type StorageObject,
  type StorageProviderCapabilities,
  type StorageUploadInput,
} from '../types';
import { StorageError, unsupportedOperation } from '../errors';

/**
 * Cloudinary folder roots (organization-aware). Kept internal to the adapter.
 * BUILD-301E will replace hard-coding with policy/templates.
 */
export const CLOUDINARY_ROOT_FOLDER = 'releaseflow';

export const CLOUDINARY_ENTITY_SUBFOLDER: Record<string, string> = {
  release: 'releases',
  artist: 'artists',
  person: 'people',
  marketing: 'marketing',
  artwork: 'releases',
  avatar: 'avatars',
};

export function buildCloudinaryFolder(
  organizationId: string,
  entityType: string,
): string {
  const sub = CLOUDINARY_ENTITY_SUBFOLDER[entityType] ?? 'assets';
  return `${CLOUDINARY_ROOT_FOLDER}/${organizationId}/${sub}`;
}

const CAPABILITIES: StorageProviderCapabilities = {
  upload: true,
  delete: true,
  getDownloadUrl: true,
  move: false,
  list: false,
  exists: false,
  getMetadata: false,
};

interface SignedUploadResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/**
 * Client-side Cloudinary provider using existing /api/media/* transport.
 * Secrets never enter the browser; signature + destroy stay server-side.
 */
export class CloudinaryStorageProvider implements StorageProvider {
  readonly providerId = CLOUDINARY_PROVIDER_ID;
  readonly capabilities = CAPABILITIES;

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const { context, payload, filename, contentType, domainAssetId } = input;

    if (!context.accessToken) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'Access token required for Cloudinary upload.',
        { providerId: this.providerId },
      );
    }

    let signatureRes: Response;
    try {
      signatureRes = await fetch('/api/media/upload-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({
          entityType: context.entityType,
          entityId: context.entityId,
          organizationId: context.organizationId,
          tags: context.tags ?? [],
        }),
      });
    } catch (cause) {
      throw new StorageError(
        'STORAGE_PROVIDER_UNAVAILABLE',
        'Failed to reach upload signature service.',
        { providerId: this.providerId, cause },
      );
    }

    if (!signatureRes.ok) {
      let message = 'Failed to request upload signature';
      try {
        const data = (await signatureRes.json()) as { error?: string };
        message = data?.error ?? message;
      } catch {
        /* keep default */
      }
      const code =
        signatureRes.status === 401 || signatureRes.status === 403
          ? 'STORAGE_ACCESS_DENIED'
          : 'STORAGE_UPLOAD_FAILED';
      throw new StorageError(code, message, { providerId: this.providerId });
    }

    const sig = (await signatureRes.json()) as SignedUploadResponse;

    const formData = new FormData();
    formData.append('file', payload, filename);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', String(sig.timestamp));
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);

    let uploadRes: Response;
    try {
      uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
        { method: 'POST', body: formData },
      );
    } catch (cause) {
      throw new StorageError(
        'STORAGE_PROVIDER_UNAVAILABLE',
        'Failed to reach Cloudinary upload endpoint.',
        { providerId: this.providerId, cause },
      );
    }

    const data = (await uploadRes.json()) as {
      error?: { message?: string };
      public_id?: string;
      url?: string;
      secure_url?: string;
      format?: string;
      bytes?: number;
      created_at?: string;
      width?: number;
      height?: number;
    };

    if (data.error || !data.public_id) {
      throw new StorageError(
        'STORAGE_UPLOAD_FAILED',
        data.error?.message ?? 'Cloudinary upload failed',
        { providerId: this.providerId },
      );
    }

    const providerFileId = data.public_id;
    const downloadUrl =
      data.secure_url ?? data.url ?? cloudinaryGetAssetUrl(providerFileId);

    return {
      domainAssetId: domainAssetId ?? null,
      providerId: this.providerId,
      providerFileId,
      providerPath: sig.folder ?? null,
      filename,
      contentType: contentType ?? null,
      sizeBytes: typeof data.bytes === 'number' ? data.bytes : null,
      downloadUrl,
      metadata: {
        format: data.format,
        width: data.width,
        height: data.height,
        // Legacy callers still expect publicId on the transport result surface;
        // it is mapped to providerFileId here and must not be used as RF id.
        cloudinaryPublicId: providerFileId,
      },
      createdAt: data.created_at ?? null,
      updatedAt: null,
    };
  }

  async delete(input: StorageDeleteInput): Promise<void> {
    if (!input.accessToken) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'Access token required for Cloudinary delete.',
        { providerId: this.providerId },
      );
    }

    let res: Response;
    try {
      res = await fetch('/api/media/destroy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.accessToken}`,
        },
        body: JSON.stringify({
          // Existing destroy API still uses publicId; adapter owns the mapping.
          publicId: input.providerFileId,
          organizationId: input.organizationId,
          entityType: input.entityType,
        }),
      });
    } catch (cause) {
      throw new StorageError(
        'STORAGE_PROVIDER_UNAVAILABLE',
        'Failed to reach media destroy service.',
        { providerId: this.providerId, cause },
      );
    }

    if (!res.ok) {
      let message = 'Failed to delete media';
      try {
        const data = (await res.json()) as { error?: string };
        message = data?.error ?? message;
      } catch {
        /* keep default */
      }
      const code =
        res.status === 401 || res.status === 403
          ? 'STORAGE_ACCESS_DENIED'
          : res.status === 404
            ? 'STORAGE_NOT_FOUND'
            : 'STORAGE_DELETE_FAILED';
      throw new StorageError(code, message, { providerId: this.providerId });
    }
  }

  async getDownloadUrl(input: StorageDownloadUrlInput): Promise<string> {
    if (!input.providerFileId) {
      throw new StorageError(
        'STORAGE_NOT_FOUND',
        'providerFileId is required to resolve a download URL.',
        { providerId: this.providerId },
      );
    }
    // Uses existing public cloud-name URL construction only.
    return MediaUrlService.original(input.providerFileId);
  }

  async move(_input: StorageMoveInput): Promise<StorageObject> {
    throw unsupportedOperation(this.providerId, 'move');
  }

  async list(_input: StorageListInput): Promise<StorageObject[]> {
    throw unsupportedOperation(this.providerId, 'list');
  }

  async exists(_input: StorageExistsInput): Promise<boolean> {
    throw unsupportedOperation(this.providerId, 'exists');
  }

  async getMetadata(_input: StorageMetadataInput): Promise<StorageMetadata> {
    throw unsupportedOperation(this.providerId, 'getMetadata');
  }
}

let singleton: CloudinaryStorageProvider | null = null;

export function getCloudinaryStorageProvider(): CloudinaryStorageProvider {
  if (!singleton) singleton = new CloudinaryStorageProvider();
  return singleton;
}
