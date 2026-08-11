/**
 * BUILD-301D — Domain-facing storage location operations.
 * Uses provider registry only — no Dropbox/OneDrive class imports.
 */

import {
  listRegisteredStorageProviderIds,
  getStorageProvider,
} from './resolve-storage-provider';
import {
  CLOUDINARY_PROVIDER_ID,
  DROPBOX_PROVIDER_ID,
  ONEDRIVE_PROVIDER_ID,
  type StorageProviderId,
} from './types';
import type {
  CreateStorageLocationInput,
  StorageLocationRecord,
  StorageLocationSafeDto,
  StorageProviderCatalogEntry,
  UpdateStorageLocationInput,
} from './storage-location-types';
import { toStorageLocationSafeDto } from './storage-location-types';
import {
  clearOtherDefaultLocations,
  createStorageLocation,
  deleteStorageLocation,
  getStorageLocation,
  listStorageLocations,
  updateStorageLocation,
} from './storage-location-repository';

export class StorageConfigError extends Error {
  readonly code: 'UNKNOWN_PROVIDER' | 'VALIDATION' | 'NOT_FOUND' | 'FORBIDDEN';

  constructor(
    code: StorageConfigError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'StorageConfigError';
    this.code = code;
  }
}

const DISPLAY_NAMES: Record<string, string> = {
  [CLOUDINARY_PROVIDER_ID]: 'Cloudinary',
  [DROPBOX_PROVIDER_ID]: 'Dropbox',
  [ONEDRIVE_PROVIDER_ID]: 'OneDrive',
};

export function isRegisteredProviderId(providerId: string): providerId is StorageProviderId {
  return listRegisteredStorageProviderIds().includes(providerId as StorageProviderId);
}

export function assertRegisteredProvider(providerId: string): StorageProviderId {
  if (!isRegisteredProviderId(providerId)) {
    throw new StorageConfigError(
      'UNKNOWN_PROVIDER',
      'Storage provider is not available.',
    );
  }
  return providerId;
}

export function validateLocationName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    throw new StorageConfigError(
      'VALIDATION',
      'Storage location name is required.',
    );
  }
  if (trimmed.length > 120) {
    throw new StorageConfigError(
      'VALIDATION',
      'Storage location name is too long.',
    );
  }
  return trimmed;
}

export async function listLocationsSafe(
  organizationId: string,
): Promise<StorageLocationSafeDto[]> {
  const rows = await listStorageLocations(organizationId);
  return rows.map(toStorageLocationSafeDto);
}

export async function getLocationSafe(
  organizationId: string,
  id: string,
): Promise<StorageLocationSafeDto | null> {
  const row = await getStorageLocation(organizationId, id);
  return row ? toStorageLocationSafeDto(row) : null;
}

export async function createLocationSafe(
  organizationId: string,
  input: CreateStorageLocationInput,
): Promise<StorageLocationSafeDto> {
  const providerId = assertRegisteredProvider(input.providerId);
  const name = validateLocationName(input.name);
  // Touch registry to ensure provider factory resolves
  getStorageProvider(providerId);

  const created = await createStorageLocation(organizationId, {
    ...input,
    name,
    providerId,
  });
  if (created.isDefault) {
    await clearOtherDefaultLocations(organizationId, created.id);
  }
  return toStorageLocationSafeDto(created);
}

/**
 * Resolve the Cloudinary location used by the legacy Cloudinary upload path.
 *
 * New organizations may not yet have a configured storage_locations record.
 * In that case we create one as the explicit platform-default Cloudinary
 * location. This does not change upload routing; it only supplies the durable
 * RF configuration node required by StorageReference.
 */
export async function ensureCloudinaryStorageLocation(
  organizationId: string,
): Promise<StorageLocationRecord> {
  const locations = await listStorageLocations(organizationId);
  const activeCloudinary = locations.filter(
    (location) =>
      location.providerId === CLOUDINARY_PROVIDER_ID &&
      location.status === 'active',
  );

  const preferred =
    activeCloudinary.find((location) => location.isDefault) ??
    activeCloudinary[0];

  if (preferred) return preferred;

  getStorageProvider(CLOUDINARY_PROVIDER_ID);
  const created = await createStorageLocation(organizationId, {
    name: 'Cloudinary (Platform Default)',
    providerId: CLOUDINARY_PROVIDER_ID,
    rootPath: '/ReleaseFlow',
    isDefault: true,
    status: 'active',
  });
  await clearOtherDefaultLocations(organizationId, created.id);
  return created;
}

export async function updateLocationSafe(
  organizationId: string,
  id: string,
  input: UpdateStorageLocationInput,
): Promise<StorageLocationSafeDto> {
  if (input.name !== undefined) {
    input = { ...input, name: validateLocationName(input.name) };
  }
  const updated = await updateStorageLocation(organizationId, id, input);
  if (!updated) {
    throw new StorageConfigError(
      'NOT_FOUND',
      'Storage location could not be found.',
    );
  }
  if (input.isDefault === true) {
    await clearOtherDefaultLocations(organizationId, id);
  }
  const again = await getStorageLocation(organizationId, id);
  if (!again) {
    throw new StorageConfigError(
      'NOT_FOUND',
      'Storage location could not be found.',
    );
  }
  return toStorageLocationSafeDto(again);
}

export async function deleteLocationSafe(
  organizationId: string,
  id: string,
): Promise<void> {
  const ok = await deleteStorageLocation(organizationId, id);
  if (!ok) {
    throw new StorageConfigError(
      'NOT_FOUND',
      'Storage location could not be found.',
    );
  }
}

/**
 * Build provider catalog from registry + env configuration flags.
 * envConfigured is supplied by server route (never read secrets in client).
 */
export function buildProviderCatalog(
  envFlags: Record<string, boolean>,
): StorageProviderCatalogEntry[] {
  return listRegisteredStorageProviderIds().map((providerId) => {
    const provider = getStorageProvider(providerId);
    const envConfigured =
      providerId === CLOUDINARY_PROVIDER_ID
        ? true
        : Boolean(envFlags[providerId]);
    return {
      providerId,
      displayName: DISPLAY_NAMES[providerId] ?? providerId,
      envConfigured,
      connectionStatus: envConfigured ? 'connected' : 'disconnected',
      capabilities: { ...provider.capabilities },
    };
  });
}

export type { StorageLocationRecord, StorageLocationSafeDto, StorageProviderCatalogEntry };
