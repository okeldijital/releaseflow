/**
 * BUILD-301F — Durable, provider-neutral StorageReference.
 *
 * Path: organizations/{organizationId}/storage_references/{referenceId}
 *
 * Effective external identity (never providerFileId alone):
 *   organizationId + storageLocationId + providerId + providerFileId
 *
 * domainAssetId is the RF-side asset id — never the provider file id.
 * downloadUrl is never persisted as durable identity or version state.
 */

import type { AssetType } from '@/lib/asset-entity-repository';
import type { StorageProviderId } from './types';

/** Provider-neutral lifecycle for a durable storage reference. */
export type StorageReferenceStatus =
  | 'active'
  | 'missing'
  | 'error'
  | 'detached';

/**
 * Synchronization status for Provider → RF metadata.
 * Distinct from reference status.
 */
export type StorageSyncStatus =
  | 'never'
  | 'ok'
  | 'failed'
  | 'unsupported';

/**
 * RF version metadata with optional provider-owned version identifiers.
 * Does not fabricate provider versions when the provider does not expose them.
 */
export interface StorageVersionInfo {
  /** ReleaseFlow version number (monotonic on successful sync when versioningEnabled). */
  versionNumber: number;
  /** Provider-native version id when available — never invented. */
  providerVersionId?: string | null;
  /** Provider ETag / content hash when available. */
  providerETag?: string | null;
  /** Provider-reported modification time (ISO). */
  providerModifiedAt?: string | null;
  /** When RF recorded this version snapshot. */
  createdAt: string;
}

/**
 * Durable org-scoped reference binding RF asset ↔ configured location ↔ provider object.
 */
export interface StorageReferenceRecord {
  id: string;
  organizationId: string;

  /** RF domain asset id (not provider identity). */
  domainAssetId: string;
  assetType: AssetType;

  /** Configured destination — authoritative provider edge. */
  storageLocationId: string;
  /**
   * Denormalized from StorageLocation.providerId at write time.
   * Must always match the location's providerId.
   */
  providerId: StorageProviderId;

  /** External object id — not globally unique across providers/locations. */
  providerFileId: string;
  /** Path metadata only — never primary identity. */
  providerPath?: string | null;

  status: StorageReferenceStatus;

  versioningEnabled: boolean;
  currentVersion: number;

  providerVersionId?: string | null;
  providerETag?: string | null;
  providerModifiedAt?: string | null;
  lastSyncedAt?: string | null;
  syncStatus?: StorageSyncStatus;
  lastSyncError?: string | null;

  /** Optional recent version snapshots (bounded; not full provider history). */
  versions?: StorageVersionInfo[];

  createdAt: unknown;
  updatedAt: unknown;
}

/** Safe DTO for API/UI — no secrets, no ephemeral download URLs as identity. */
export interface StorageReferenceSafeDto {
  id: string;
  organizationId: string;
  domainAssetId: string;
  assetType: AssetType;
  storageLocationId: string;
  providerId: StorageProviderId;
  providerFileId: string;
  providerPath: string | null;
  status: StorageReferenceStatus;
  versioningEnabled: boolean;
  currentVersion: number;
  providerVersionId: string | null;
  providerETag: string | null;
  providerModifiedAt: string | null;
  lastSyncedAt: string | null;
  syncStatus: StorageSyncStatus;
  lastSyncError: string | null;
  versions: StorageVersionInfo[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateStorageReferenceInput {
  domainAssetId: string;
  assetType: AssetType;
  storageLocationId: string;
  providerFileId: string;
  providerPath?: string | null;
  /** Must match location.providerId when provided; otherwise taken from location. */
  providerId?: StorageProviderId;
  versioningEnabled?: boolean;
  status?: StorageReferenceStatus;
  /** Optional initial provider metadata (Provider → RF), never downloadUrl as identity. */
  providerVersionId?: string | null;
  providerETag?: string | null;
  providerModifiedAt?: string | null;
  currentVersion?: number;
}

export interface UpdateStorageReferenceInput {
  providerPath?: string | null;
  status?: StorageReferenceStatus;
  versioningEnabled?: boolean;
  providerVersionId?: string | null;
  providerETag?: string | null;
  providerModifiedAt?: string | null;
  /** Detach without deleting the RF record. */
  detach?: boolean;
}

function timestampToIso(value: unknown): string | null {
  if (
    value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string' && value) return value;
  if (value) return String(value);
  return null;
}

export function toStorageReferenceSafeDto(
  record: StorageReferenceRecord,
): StorageReferenceSafeDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    domainAssetId: record.domainAssetId,
    assetType: record.assetType,
    storageLocationId: record.storageLocationId,
    providerId: record.providerId,
    providerFileId: record.providerFileId,
    providerPath: record.providerPath ?? null,
    status: record.status,
    versioningEnabled: record.versioningEnabled,
    currentVersion: record.currentVersion,
    providerVersionId: record.providerVersionId ?? null,
    providerETag: record.providerETag ?? null,
    providerModifiedAt: record.providerModifiedAt ?? null,
    lastSyncedAt: record.lastSyncedAt ?? null,
    syncStatus: record.syncStatus ?? 'never',
    lastSyncError: record.lastSyncError ?? null,
    versions: record.versions ?? [],
    createdAt: timestampToIso(record.createdAt),
    updatedAt: timestampToIso(record.updatedAt),
  };
}
