/**
 * BUILD-301C — OneDriveStorageProvider.
 *
 * Implements StorageProvider. Microsoft credentials never enter this module;
 * all Graph traffic goes through /api/storage/onedrive/*.
 *
 * providerId = "onedrive"
 * Graph item id → providerFileId
 * path → providerPath
 * @microsoft.graph.downloadUrl → downloadUrl (ephemeral, not identity)
 */

import type { StorageProvider } from '../storage-provider';
import {
  ONEDRIVE_PROVIDER_ID,
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
import {
  buildProvisionalOneDrivePath,
  validateOrgBoundPath,
} from '@/lib/server/onedrive/path-safety';

const CAPABILITIES: StorageProviderCapabilities = {
  upload: true,
  delete: true,
  getDownloadUrl: true,
  move: false,
  list: false,
  exists: false,
  /** BUILD-301F — known-object metadata only (not list/discovery). */
  getMetadata: true,
};

/**
 * Resolve upload path: prefer metadata.providerPath when org-bound;
 * else provisional /ReleaseFlow/{orgId}/... (not FolderTemplate).
 */
export function resolveOneDriveUploadPath(input: StorageUploadInput): string {
  const metaPath = input.metadata?.providerPath;
  const { organizationId, entityType, entityId } = input.context;

  if (typeof metaPath === 'string' && metaPath.trim()) {
    const check = validateOrgBoundPath(metaPath.trim(), organizationId);
    if (!check.ok) {
      throw new StorageError('STORAGE_ACCESS_DENIED', check.error, {
        providerId: ONEDRIVE_PROVIDER_ID,
      });
    }
    return check.path;
  }

  return buildProvisionalOneDrivePath(
    organizationId,
    entityType,
    entityId,
    input.filename,
  );
}

export class OneDriveStorageProvider implements StorageProvider {
  readonly providerId = ONEDRIVE_PROVIDER_ID;
  readonly capabilities = CAPABILITIES;

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const { context, payload, filename, contentType, domainAssetId } = input;

    if (!context.accessToken) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'Access token required for storage upload.',
        { providerId: this.providerId },
      );
    }

    const path = resolveOneDriveUploadPath(input);
    // Double-check org binding before network call
    const pathCheck = validateOrgBoundPath(path, context.organizationId);
    if (!pathCheck.ok) {
      throw new StorageError('STORAGE_ACCESS_DENIED', pathCheck.error, {
        providerId: this.providerId,
      });
    }

    const formData = new FormData();
    formData.append('file', payload, filename);
    formData.append('organizationId', context.organizationId);
    formData.append('path', pathCheck.path);
    formData.append('filename', filename);
    if (contentType) formData.append('contentType', contentType);

    let res: Response;
    try {
      res = await fetch('/api/storage/onedrive/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${context.accessToken}` },
        body: formData,
      });
    } catch (cause) {
      throw new StorageError(
        'STORAGE_PROVIDER_UNAVAILABLE',
        'Storage operation failed.',
        { providerId: this.providerId, cause },
      );
    }

    if (!res.ok) {
      let message = 'Storage upload failed.';
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) message = data.error;
      } catch {
        /* keep default */
      }
      const code =
        res.status === 401 || res.status === 403
          ? 'STORAGE_ACCESS_DENIED'
          : res.status === 400
            ? 'STORAGE_UPLOAD_FAILED'
            : 'STORAGE_UPLOAD_FAILED';
      throw new StorageError(code, message, { providerId: this.providerId });
    }

    const data = (await res.json()) as {
      providerFileId: string;
      providerPath?: string | null;
      filename?: string;
      sizeBytes?: number | null;
      contentType?: string | null;
      downloadUrl?: string | null;
    };

    if (!data.providerFileId) {
      throw new StorageError(
        'STORAGE_UPLOAD_FAILED',
        'Storage upload failed.',
        { providerId: this.providerId },
      );
    }

    return {
      domainAssetId: domainAssetId ?? null,
      providerId: this.providerId,
      providerFileId: data.providerFileId,
      providerPath: data.providerPath ?? pathCheck.path,
      filename: data.filename ?? filename,
      contentType: data.contentType ?? contentType ?? null,
      sizeBytes: data.sizeBytes ?? null,
      // Ephemeral URLs are not returned from upload — use getDownloadUrl.
      downloadUrl: null,
      metadata: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  async delete(input: StorageDeleteInput): Promise<void> {
    if (!input.accessToken) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'Access token required for storage delete.',
        { providerId: this.providerId },
      );
    }

    let res: Response;
    try {
      res = await fetch('/api/storage/onedrive/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.accessToken}`,
        },
        body: JSON.stringify({
          organizationId: input.organizationId,
          providerFileId: input.providerFileId,
        }),
      });
    } catch (cause) {
      throw new StorageError(
        'STORAGE_PROVIDER_UNAVAILABLE',
        'Storage operation failed.',
        { providerId: this.providerId, cause },
      );
    }

    if (!res.ok) {
      let message = 'Storage delete failed.';
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) message = data.error;
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
    if (!input.accessToken || !input.organizationId) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'organizationId and accessToken are required for download URL resolution.',
        { providerId: this.providerId },
      );
    }

    let res: Response;
    try {
      res = await fetch('/api/storage/onedrive/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.accessToken}`,
        },
        body: JSON.stringify({
          organizationId: input.organizationId,
          providerFileId: input.providerFileId,
        }),
      });
    } catch (cause) {
      throw new StorageError(
        'STORAGE_PROVIDER_UNAVAILABLE',
        'Storage operation failed.',
        { providerId: this.providerId, cause },
      );
    }

    if (!res.ok) {
      let message = 'Storage download URL failed.';
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) message = data.error;
      } catch {
        /* keep default */
      }
      throw new StorageError('STORAGE_PROVIDER_UNAVAILABLE', message, {
        providerId: this.providerId,
      });
    }

    const data = (await res.json()) as { downloadUrl?: string };
    if (!data.downloadUrl) {
      throw new StorageError(
        'STORAGE_NOT_FOUND',
        'Storage download URL failed.',
        { providerId: this.providerId },
      );
    }
    return data.downloadUrl;
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

  /**
   * BUILD-301F — known providerFileId only. Not directory listing.
   * downloadUrl is never returned as identity.
   */
  async getMetadata(input: StorageMetadataInput): Promise<StorageMetadata> {
    if (!input.providerFileId) {
      throw new StorageError(
        'STORAGE_NOT_FOUND',
        'providerFileId is required for metadata.',
        { providerId: this.providerId },
      );
    }
    if (!input.accessToken || !input.organizationId) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'organizationId and accessToken are required for metadata.',
        { providerId: this.providerId },
      );
    }

    let res: Response;
    try {
      res = await fetch('/api/storage/onedrive/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.accessToken}`,
        },
        body: JSON.stringify({
          organizationId: input.organizationId,
          providerFileId: input.providerFileId,
        }),
      });
    } catch (cause) {
      throw new StorageError(
        'STORAGE_PROVIDER_UNAVAILABLE',
        'Storage metadata synchronization failed.',
        { providerId: this.providerId, cause },
      );
    }

    if (!res.ok) {
      let message = 'Storage metadata synchronization failed.';
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) message = data.error;
      } catch {
        /* keep default */
      }
      const code =
        res.status === 401 || res.status === 403
          ? 'STORAGE_ACCESS_DENIED'
          : res.status === 404
            ? 'STORAGE_NOT_FOUND'
            : 'STORAGE_PROVIDER_UNAVAILABLE';
      throw new StorageError(code, message, { providerId: this.providerId });
    }

    const data = (await res.json()) as {
      providerFileId?: string;
      providerPath?: string | null;
      filename?: string | null;
      sizeBytes?: number | null;
      contentType?: string | null;
      providerVersionId?: string | null;
      providerETag?: string | null;
      providerModifiedAt?: string | null;
    };

    if (!data.providerFileId) {
      throw new StorageError(
        'STORAGE_NOT_FOUND',
        'Storage metadata synchronization failed.',
        { providerId: this.providerId },
      );
    }

    return {
      providerId: this.providerId,
      providerFileId: data.providerFileId,
      providerPath: data.providerPath ?? null,
      filename: data.filename ?? null,
      sizeBytes: data.sizeBytes ?? null,
      contentType: data.contentType ?? null,
      downloadUrl: null,
      updatedAt: data.providerModifiedAt ?? null,
      metadata: {
        providerVersionId: data.providerVersionId ?? null,
        providerETag: data.providerETag ?? null,
        providerModifiedAt: data.providerModifiedAt ?? null,
        etag: data.providerETag ?? null,
      },
    };
  }
}

let singleton: OneDriveStorageProvider | null = null;

export function getOneDriveStorageProvider(): OneDriveStorageProvider {
  if (!singleton) singleton = new OneDriveStorageProvider();
  return singleton;
}
