/**
 * BUILD-301B — DropboxStorageProvider.
 *
 * Implements StorageProvider. Dropbox API credentials never enter this module;
 * all Dropbox traffic goes through server routes under /api/storage/dropbox/*.
 *
 * providerId = "dropbox"
 * Dropbox file id → providerFileId
 * Dropbox path → providerPath
 * Temporary link → downloadUrl (not identity)
 */

import type { StorageProvider } from '../storage-provider';
import {
  DROPBOX_PROVIDER_ID,
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
 * Resolve a Dropbox path from optional metadata.providerPath or a provisional
 * org-scoped path. Not a Storage Policy / Folder Template system (BUILD-301E).
 */
export function resolveDropboxUploadPath(input: StorageUploadInput): string {
  const metaPath = input.metadata?.providerPath;
  if (typeof metaPath === 'string' && metaPath.trim()) {
    const p = metaPath.trim();
    return p.startsWith('/') ? p : `/${p}`;
  }
  const { organizationId, entityType, entityId } = input.context;
  const safeName = input.filename.replace(/[/\\]/g, '_');
  return `/ReleaseFlow/${organizationId}/${entityType}/${entityId}/${safeName}`;
}

export class DropboxStorageProvider implements StorageProvider {
  readonly providerId = DROPBOX_PROVIDER_ID;
  readonly capabilities = CAPABILITIES;

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const { context, payload, filename, contentType, domainAssetId } = input;

    if (!context.accessToken) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'Access token required for Dropbox upload.',
        { providerId: this.providerId },
      );
    }

    const path = resolveDropboxUploadPath(input);
    const formData = new FormData();
    formData.append('file', payload, filename);
    formData.append('organizationId', context.organizationId);
    formData.append('path', path);
    formData.append('filename', filename);
    if (contentType) formData.append('contentType', contentType);

    let res: Response;
    try {
      res = await fetch('/api/storage/dropbox/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${context.accessToken}` },
        body: formData,
      });
    } catch (cause) {
      throw new StorageError(
        'STORAGE_PROVIDER_UNAVAILABLE',
        'Failed to reach Dropbox upload service.',
        { providerId: this.providerId, cause },
      );
    }

    if (!res.ok) {
      let message = 'Dropbox upload failed';
      try {
        const data = (await res.json()) as { error?: string };
        message = data?.error ?? message;
      } catch {
        /* keep default */
      }
      const code =
        res.status === 401 || res.status === 403
          ? 'STORAGE_ACCESS_DENIED'
          : 'STORAGE_UPLOAD_FAILED';
      throw new StorageError(code, message, { providerId: this.providerId });
    }

    const data = (await res.json()) as {
      providerFileId: string;
      providerPath?: string;
      filename?: string;
      sizeBytes?: number | null;
      contentHash?: string | null;
      serverModified?: string | null;
    };

    if (!data.providerFileId) {
      throw new StorageError(
        'STORAGE_UPLOAD_FAILED',
        'Dropbox upload failed: missing providerFileId.',
        { providerId: this.providerId },
      );
    }

    return {
      domainAssetId: domainAssetId ?? null,
      providerId: this.providerId,
      providerFileId: data.providerFileId,
      providerPath: data.providerPath ?? path,
      filename: data.filename ?? filename,
      contentType: contentType ?? null,
      sizeBytes: data.sizeBytes ?? null,
      downloadUrl: null,
      metadata: {
        contentHash: data.contentHash ?? null,
      },
      createdAt: data.serverModified ?? null,
      updatedAt: data.serverModified ?? null,
    };
  }

  async delete(input: StorageDeleteInput): Promise<void> {
    if (!input.accessToken) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'Access token required for Dropbox delete.',
        { providerId: this.providerId },
      );
    }

    let res: Response;
    try {
      res = await fetch('/api/storage/dropbox/delete', {
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
        'Failed to reach Dropbox delete service.',
        { providerId: this.providerId, cause },
      );
    }

    if (!res.ok) {
      let message = 'Dropbox delete failed';
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
        'providerFileId is required to resolve a Dropbox download URL.',
        { providerId: this.providerId },
      );
    }
    if (!input.accessToken || !input.organizationId) {
      throw new StorageError(
        'STORAGE_ACCESS_DENIED',
        'organizationId and accessToken are required for Dropbox download URL resolution.',
        { providerId: this.providerId },
      );
    }

    let res: Response;
    try {
      res = await fetch('/api/storage/dropbox/download-url', {
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
        'Failed to reach Dropbox download URL service.',
        { providerId: this.providerId, cause },
      );
    }

    if (!res.ok) {
      let message = 'Dropbox download URL failed';
      try {
        const data = (await res.json()) as { error?: string };
        message = data?.error ?? message;
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
        'Dropbox download URL failed: empty response.',
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
   * downloadUrl is never returned here (not durable identity).
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
      res = await fetch('/api/storage/dropbox/metadata', {
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
      downloadUrl: null,
      updatedAt: data.providerModifiedAt ?? null,
      metadata: {
        providerVersionId: data.providerVersionId ?? null,
        providerETag: data.providerETag ?? null,
        providerModifiedAt: data.providerModifiedAt ?? null,
        contentHash: data.providerETag ?? null,
      },
    };
  }
}

let singleton: DropboxStorageProvider | null = null;

export function getDropboxStorageProvider(): DropboxStorageProvider {
  if (!singleton) singleton = new DropboxStorageProvider();
  return singleton;
}
