/**
 * BUILD-301D — Organization Storage Location model.
 *
 * Configuration only. Does not route uploads or bind provider files.
 * Credentials never appear on this record.
 */

import type { StorageProviderId } from './types';

/** Lifecycle for a configured destination. */
export type StorageLocationStatus = 'active' | 'disabled' | 'error';

/**
 * Safe connection status for catalog display.
 * Env-backed providers: connected when server env is present.
 * Never implies multi-tenant credential ownership.
 */
export type ProviderConnectionStatus = 'connected' | 'disconnected' | 'error';

/**
 * Organization-owned storage destination configuration.
 * Points at a providerId from the registry — never at provider classes.
 */
export interface StorageLocationRecord {
  id: string;
  organizationId: string;
  name: string;
  providerId: StorageProviderId;
  status: StorageLocationStatus;
  /** Configured root path (e.g. /ReleaseFlow). Not a folder template. */
  rootPath: string;
  /** Safe non-secret flags (e.g. { rootConfigured: true }). */
  configuration: {
    rootConfigured: boolean;
  };
  isDefault: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  /** Optional opaque notes for admins — never secrets. */
  metadata?: Record<string, unknown> | null;
}

/** Safe DTO returned to the browser (no secrets). */
export interface StorageLocationSafeDto {
  id: string;
  organizationId: string;
  name: string;
  providerId: StorageProviderId;
  status: StorageLocationStatus;
  rootPath: string;
  rootConfigured: boolean;
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateStorageLocationInput {
  name: string;
  providerId: StorageProviderId;
  rootPath?: string;
  isDefault?: boolean;
  status?: StorageLocationStatus;
}

export interface UpdateStorageLocationInput {
  name?: string;
  rootPath?: string;
  status?: StorageLocationStatus;
  isDefault?: boolean;
}

/** Catalog entry for registered providers (no secrets). */
export interface StorageProviderCatalogEntry {
  providerId: StorageProviderId;
  displayName: string;
  /** Whether server-side env credentials exist (not org-specific OAuth). */
  envConfigured: boolean;
  connectionStatus: ProviderConnectionStatus;
  capabilities: {
    upload: boolean;
    delete: boolean;
    getDownloadUrl: boolean;
    move: boolean;
    list: boolean;
    exists: boolean;
    getMetadata: boolean;
  };
}

export function toStorageLocationSafeDto(
  record: StorageLocationRecord,
): StorageLocationSafeDto {
  const created =
    record.createdAt && typeof (record.createdAt as { toDate?: () => Date }).toDate === 'function'
      ? (record.createdAt as { toDate: () => Date }).toDate().toISOString()
      : record.createdAt
        ? String(record.createdAt)
        : null;
  const updated =
    record.updatedAt && typeof (record.updatedAt as { toDate?: () => Date }).toDate === 'function'
      ? (record.updatedAt as { toDate: () => Date }).toDate().toISOString()
      : record.updatedAt
        ? String(record.updatedAt)
        : null;

  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    providerId: record.providerId,
    status: record.status,
    rootPath: record.rootPath,
    rootConfigured: record.configuration?.rootConfigured ?? Boolean(record.rootPath),
    isDefault: record.isDefault,
    createdAt: created,
    updatedAt: updated,
  };
}
