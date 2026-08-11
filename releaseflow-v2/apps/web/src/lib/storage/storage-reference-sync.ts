/**
 * BUILD-301F — Provider → RF metadata synchronization for a known StorageReference.
 *
 * Not a general sync engine. Not discovery. Not list/crawl.
 *
 * Pipeline:
 *   auth (caller) → org → permission (caller) → reference → location
 *   → provider registry → known providerFileId → getMetadata → update RF fields
 *
 * Synchronization direction:
 *   Provider → RF: providerModifiedAt, providerVersionId, providerETag (shared/derived)
 *   RF-owned: organizationId, domainAssetId, storageLocationId, versioningEnabled, status
 *
 * Never uploads. Never lists provider drives.
 */

import type { StorageMetadata, StorageProviderId } from './types';
import { StorageError, isStorageError } from './errors';
import {
  getStorageProvider,
  listRegisteredStorageProviderIds,
} from './resolve-storage-provider';
import { getStorageLocation } from './storage-location-repository';
import {
  getStorageReference,
  updateStorageReference,
  MAX_VERSION_HISTORY,
} from './storage-reference-repository';
import {
  toStorageReferenceSafeDto,
  type StorageReferenceRecord,
  type StorageReferenceSafeDto,
  type StorageVersionInfo,
} from './storage-reference-types';
import { StorageReferenceError } from './storage-reference-service';

export interface SyncStorageReferenceInput {
  organizationId: string;
  referenceId: string;
  /** Firebase ID token for provider transport when adapters require it. */
  accessToken?: string;
}

/**
 * Injectable deps for unit tests (mock provider metadata; no live network).
 */
export interface StorageReferenceSyncDeps {
  getReference: (
    organizationId: string,
    id: string,
  ) => Promise<StorageReferenceRecord | null>;
  getLocation: typeof getStorageLocation;
  isProviderRegistered: (providerId: string) => boolean;
  getMetadata: (params: {
    providerId: StorageProviderId;
    providerFileId: string;
    organizationId: string;
    accessToken?: string;
  }) => Promise<StorageMetadata>;
  updateReference: typeof updateStorageReference;
}

const defaultDeps: StorageReferenceSyncDeps = {
  getReference: getStorageReference,
  getLocation: getStorageLocation,
  isProviderRegistered: (providerId) =>
    listRegisteredStorageProviderIds().includes(
      providerId as StorageProviderId,
    ),
  getMetadata: async ({ providerId, providerFileId, organizationId, accessToken }) => {
    const provider = getStorageProvider(providerId);
    if (!provider.capabilities.getMetadata) {
      throw new StorageError(
        'UNSUPPORTED_OPERATION',
        `Storage provider "${providerId}" does not support operation: getMetadata`,
        { providerId },
      );
    }
    return provider.getMetadata({
      providerFileId,
      organizationId,
      accessToken,
    });
  },
  updateReference: updateStorageReference,
};

/**
 * Extract provider-owned version fields from neutral StorageMetadata.
 * Does not invent provider version ids.
 */
export function extractProviderVersionFields(
  meta: StorageMetadata,
): {
  providerVersionId: string | null;
  providerETag: string | null;
  providerModifiedAt: string | null;
  providerPath: string | null;
} {
  const opaque = meta.metadata ?? {};
  const providerVersionId =
    (typeof opaque.providerVersionId === 'string' && opaque.providerVersionId) ||
    (typeof opaque.versionId === 'string' && opaque.versionId) ||
    null;
  const providerETag =
    (typeof opaque.providerETag === 'string' && opaque.providerETag) ||
    (typeof opaque.etag === 'string' && opaque.etag) ||
    (typeof opaque.contentHash === 'string' && opaque.contentHash) ||
    null;
  const providerModifiedAt =
    (typeof opaque.providerModifiedAt === 'string' &&
      opaque.providerModifiedAt) ||
    meta.updatedAt ||
    null;

  return {
    providerVersionId,
    providerETag,
    providerModifiedAt,
    providerPath: meta.providerPath ?? null,
  };
}

/**
 * Sync metadata for one known StorageReference.
 * Provider is called only after org + location + ownership validation.
 */
export async function syncStorageReference(
  input: SyncStorageReferenceInput,
  deps: StorageReferenceSyncDeps = defaultDeps,
): Promise<StorageReferenceSafeDto> {
  const organizationId = input.organizationId?.trim();
  if (!organizationId) {
    throw new StorageReferenceError(
      'VALIDATION',
      'organizationId is required.',
    );
  }
  if (!input.referenceId?.trim()) {
    throw new StorageReferenceError(
      'VALIDATION',
      'Storage reference id is required.',
    );
  }

  // 1. Load reference — org-scoped
  const reference = await deps.getReference(
    organizationId,
    input.referenceId,
  );
  if (!reference || reference.organizationId !== organizationId) {
    throw new StorageReferenceError(
      'NOT_FOUND',
      'Storage reference could not be found.',
    );
  }

  if (reference.status === 'detached') {
    throw new StorageReferenceError(
      'INVALID_CONFIGURATION',
      'Detached storage reference cannot be synchronized.',
    );
  }

  // 2. Validate location — same org, active for provider access
  const location = await deps.getLocation(
    organizationId,
    reference.storageLocationId,
  );
  if (!location || location.organizationId !== organizationId) {
    throw new StorageReferenceError(
      'LOCATION_ORG_MISMATCH',
      'Storage location does not belong to this organisation.',
    );
  }
  if (location.status !== 'active') {
    throw new StorageReferenceError(
      'LOCATION_INACTIVE',
      'Storage location is inactive.',
    );
  }

  // 3. Provider must match location (reference cannot override)
  if (reference.providerId !== location.providerId) {
    throw new StorageReferenceError(
      'PROVIDER_MISMATCH',
      'Storage provider does not match the storage location.',
    );
  }

  // 4. Registry only
  if (!deps.isProviderRegistered(reference.providerId)) {
    throw new StorageReferenceError(
      'UNKNOWN_PROVIDER',
      'Storage provider is not available.',
    );
  }

  if (!reference.providerFileId?.trim()) {
    throw new StorageReferenceError(
      'VALIDATION',
      'Provider file id is required for synchronization.',
    );
  }

  // 5. Known-object metadata only (Provider → RF)
  let meta: StorageMetadata;
  try {
    meta = await deps.getMetadata({
      providerId: reference.providerId,
      providerFileId: reference.providerFileId,
      organizationId,
      accessToken: input.accessToken,
    });
  } catch (err) {
    if (isStorageError(err) && err.code === 'UNSUPPORTED_OPERATION') {
      const updated = await deps.updateReference(organizationId, reference.id, {
        syncStatus: 'unsupported',
        lastSyncError: 'Storage operation is not supported.',
        lastSyncedAt: new Date().toISOString(),
      });
      if (!updated) {
        throw new StorageReferenceError(
          'NOT_FOUND',
          'Storage reference could not be found.',
        );
      }
      throw new StorageError(
        'UNSUPPORTED_OPERATION',
        'Storage operation is not supported.',
        { providerId: reference.providerId },
      );
    }

    const message =
      err instanceof Error
        ? 'Storage metadata synchronization failed.'
        : 'Storage metadata synchronization failed.';
    await deps.updateReference(organizationId, reference.id, {
      syncStatus: 'failed',
      lastSyncError: message,
      status: 'error',
      lastSyncedAt: new Date().toISOString(),
    });
    throw new StorageReferenceError(
      'INVALID_CONFIGURATION',
      'Storage metadata synchronization failed.',
    );
  }

  // Never treat downloadUrl as identity / never persist it
  const fields = extractProviderVersionFields(meta);
  const now = new Date().toISOString();

  let currentVersion = reference.currentVersion;
  let versions = [...(reference.versions ?? [])];

  const providerChanged =
    fields.providerVersionId !== (reference.providerVersionId ?? null) ||
    fields.providerETag !== (reference.providerETag ?? null) ||
    fields.providerModifiedAt !== (reference.providerModifiedAt ?? null);

  // RF versioning policy gates version number bump — does not create provider versions
  if (reference.versioningEnabled && providerChanged) {
    currentVersion = reference.currentVersion + 1;
    const snap: StorageVersionInfo = {
      versionNumber: currentVersion,
      providerVersionId: fields.providerVersionId,
      providerETag: fields.providerETag,
      providerModifiedAt: fields.providerModifiedAt,
      createdAt: now,
    };
    versions = [snap, ...versions].slice(0, MAX_VERSION_HISTORY);
  } else if (versions.length === 0) {
    versions = [
      {
        versionNumber: currentVersion,
        providerVersionId: fields.providerVersionId,
        providerETag: fields.providerETag,
        providerModifiedAt: fields.providerModifiedAt,
        createdAt: now,
      },
    ];
  }

  const updated = await deps.updateReference(organizationId, reference.id, {
    providerPath: fields.providerPath ?? reference.providerPath,
    providerVersionId: fields.providerVersionId,
    providerETag: fields.providerETag,
    providerModifiedAt: fields.providerModifiedAt,
    lastSyncedAt: now,
    syncStatus: 'ok',
    lastSyncError: null,
    currentVersion,
    versions,
    status: 'active',
  });

  if (!updated) {
    throw new StorageReferenceError(
      'NOT_FOUND',
      'Storage reference could not be found.',
    );
  }

  return toStorageReferenceSafeDto(updated);
}
