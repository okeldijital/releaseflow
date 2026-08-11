/**
 * BUILD-301A / 301F — Lightweight storage reference snapshot (from upload/ops).
 *
 * Durable org-scoped identity lives in StorageReferenceRecord
 * (storage-reference-types.ts → organizations/.../storage_references/...).
 *
 * This snapshot is NOT the durable document model. downloadUrl here is
 * delivery-only and must never be treated as permanent identity.
 */

import type { StorageProviderId } from './types';

/**
 * Provider-neutral snapshot of an externally stored binary (ephemeral / response shape).
 * For durable persistence use StorageReferenceRecord + storage-reference-service.
 */
export interface StorageReference {
  /** Stable provider id, e.g. "cloudinary". */
  providerId: StorageProviderId;
  /**
   * Provider's external file identity.
   * For Cloudinary this maps from historical `publicId` / `storageKey`.
   */
  providerFileId: string;
  /** Optional path within the provider (folder/key). */
  providerPath?: string | null;
  /** Cached delivery URL — never permanent identity. */
  downloadUrl?: string | null;
  filename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
}

/**
 * Helper to build a StorageReference from a StorageObject.
 */
export function storageReferenceFromObject(obj: {
  providerId: StorageProviderId;
  providerFileId: string;
  providerPath?: string | null;
  downloadUrl?: string | null;
  filename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
}): StorageReference {
  return {
    providerId: obj.providerId,
    providerFileId: obj.providerFileId,
    providerPath: obj.providerPath ?? null,
    downloadUrl: obj.downloadUrl ?? null,
    filename: obj.filename ?? null,
    contentType: obj.contentType ?? null,
    sizeBytes: obj.sizeBytes ?? null,
  };
}
