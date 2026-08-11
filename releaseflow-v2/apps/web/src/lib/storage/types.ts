/**
 * BUILD-301A — Provider-neutral storage types.
 *
 * ReleaseFlow owns domain metadata and references.
 * External systems own the binary.
 * Provider identity ≠ ReleaseFlow asset identity.
 */

/** Stable provider identifiers suitable for persistence. */
export type StorageProviderId = 'cloudinary' | (string & {});

export const CLOUDINARY_PROVIDER_ID = 'cloudinary' as const;
export const DROPBOX_PROVIDER_ID = 'dropbox' as const;
export const ONEDRIVE_PROVIDER_ID = 'onedrive' as const;

/**
 * Which operations a concrete provider implements.
 * Callers must not assume all operations are available.
 */
export interface StorageProviderCapabilities {
  upload: boolean;
  delete: boolean;
  getDownloadUrl: boolean;
  move: boolean;
  list: boolean;
  exists: boolean;
  getMetadata: boolean;
}

/**
 * Provider-neutral object returned by storage operations.
 *
 * - `domainAssetId` (if set) is the ReleaseFlow domain identity — never the provider file id.
 * - `providerFileId` is the external system's stable id (e.g. Cloudinary publicId mapped here).
 * - `downloadUrl` is a cached/resolved delivery URL — never permanent asset identity.
 */
export interface StorageObject {
  /** Optional RF domain asset id when the caller already has one. Not provider identity. */
  domainAssetId?: string | null;
  providerId: StorageProviderId;
  providerFileId: string;
  providerPath?: string | null;
  filename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  downloadUrl?: string | null;
  /** Provider-returned extra metadata (format, dimensions, …) — opaque to domain. */
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * Provider-neutral metadata for a *known* external object.
 * BUILD-301F: optional version fields are Provider → RF only.
 * downloadUrl is delivery-only and must never be persisted as StorageReference identity.
 */
export interface StorageMetadata {
  providerId: StorageProviderId;
  providerFileId: string;
  providerPath?: string | null;
  filename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  /** Ephemeral delivery URL — never durable identity. */
  downloadUrl?: string | null;
  /**
   * Opaque provider extras. Prefer well-known keys when present:
   * providerVersionId, providerETag, providerModifiedAt, contentHash, etag.
   * Never store raw provider SDK responses in RF durable documents.
   */
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * Org-scoped upload context. Provider maps entityType → internal destination
 * (e.g. Cloudinary folder). Callers never pass provider folder paths.
 */
export interface StorageUploadContext {
  organizationId: string;
  entityType: string;
  entityId: string;
  tags?: string[];
  /**
   * Already-authorized access token (e.g. Firebase ID token).
   * Provider must not bypass application RBAC; token is for transport only.
   */
  accessToken: string;
}

export interface StorageUploadInput {
  payload: File | Blob;
  filename: string;
  contentType?: string;
  context: StorageUploadContext;
  metadata?: Record<string, unknown>;
  /** Optional RF domain asset id to attach to the returned StorageObject. */
  domainAssetId?: string | null;
}

export interface StorageDeleteInput {
  providerFileId: string;
  organizationId: string;
  entityType: string;
  accessToken: string;
}

export interface StorageDownloadUrlInput {
  providerFileId: string;
  /** Required by providers that resolve temporary links via authenticated APIs. */
  organizationId?: string;
  accessToken?: string;
}

export interface StorageMoveInput {
  providerFileId: string;
  destinationPath: string;
  organizationId: string;
  accessToken?: string;
}

export interface StorageListInput {
  organizationId: string;
  path?: string;
  accessToken?: string;
}

export interface StorageExistsInput {
  providerFileId: string;
  organizationId?: string;
  accessToken?: string;
}

export interface StorageMetadataInput {
  providerFileId: string;
  organizationId?: string;
  accessToken?: string;
}
