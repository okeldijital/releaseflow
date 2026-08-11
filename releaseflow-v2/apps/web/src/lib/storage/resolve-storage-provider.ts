/**
 * BUILD-301A — Provider resolver / factory.
 *
 * Resolves stable provider ids to StorageProvider implementations.
 * Future: dropbox, onedrive register here without changing consumers.
 */

import type { StorageProvider } from './storage-provider';
import {
  CLOUDINARY_PROVIDER_ID,
  DROPBOX_PROVIDER_ID,
  ONEDRIVE_PROVIDER_ID,
  type StorageProviderId,
} from './types';
import { StorageError } from './errors';
import { getCloudinaryStorageProvider } from './providers/cloudinary-storage-provider';
import { getDropboxStorageProvider } from './providers/dropbox-storage-provider';
import { getOneDriveStorageProvider } from './providers/onedrive-storage-provider';
import {
  defaultOrganizationStorageConfig,
  resolveDefaultProviderId,
  type OrganizationStorageConfig,
} from './organization-storage-config';

const registry = new Map<StorageProviderId, () => StorageProvider>([
  [CLOUDINARY_PROVIDER_ID, () => getCloudinaryStorageProvider()],
  [DROPBOX_PROVIDER_ID, () => getDropboxStorageProvider()],
  [ONEDRIVE_PROVIDER_ID, () => getOneDriveStorageProvider()],
]);

/**
 * Register a provider factory (used by tests and future providers).
 */
export function registerStorageProvider(
  providerId: StorageProviderId,
  factory: () => StorageProvider,
): void {
  registry.set(providerId, factory);
}

/**
 * Resolve a provider by stable id.
 */
export function getStorageProvider(
  providerId: StorageProviderId = CLOUDINARY_PROVIDER_ID,
): StorageProvider {
  const factory = registry.get(providerId);
  if (!factory) {
    throw new StorageError(
      'STORAGE_PROVIDER_UNAVAILABLE',
      `Unknown storage provider: ${providerId}`,
      { providerId },
    );
  }
  return factory();
}

/**
 * Resolve the default provider for an organization config (or cloudinary).
 */
export function getDefaultStorageProvider(
  config?: OrganizationStorageConfig | null,
  organizationId?: string,
): StorageProvider {
  const cfg =
    config ??
    (organizationId
      ? defaultOrganizationStorageConfig(organizationId)
      : null);
  return getStorageProvider(resolveDefaultProviderId(cfg));
}

/** Ids currently registered (for diagnostics/tests). */
export function listRegisteredStorageProviderIds(): StorageProviderId[] {
  return [...registry.keys()];
}
