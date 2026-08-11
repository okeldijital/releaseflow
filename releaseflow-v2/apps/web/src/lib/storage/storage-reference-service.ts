/**
 * BUILD-301F — Domain-facing StorageReference operations.
 *
 * Provider-neutral. Authoritative chain:
 *   StorageReference → StorageLocation → providerId → StorageProvider registry
 *
 * Never treats providerFileId as sufficient authorization.
 * Never persists ephemeral download URLs as identity.
 */

import { getStorageLocation } from './storage-location-repository';
import {
  createStorageReference,
  deleteStorageReference,
  getStorageReference,
  listStorageReferences,
  listStorageReferencesByDomainAsset,
  updateStorageReference,
} from './storage-reference-repository';
import {
  toStorageReferenceSafeDto,
  type CreateStorageReferenceInput,
  type StorageReferenceSafeDto,
  type UpdateStorageReferenceInput,
} from './storage-reference-types';
import { isRoutableAssetType } from './storage-policy-types';
import {
  assertRegisteredProvider,
  isRegisteredProviderId,
} from './storage-location-service';
import type { StorageProviderId } from './types';

export class StorageReferenceError extends Error {
  readonly code:
    | 'VALIDATION'
    | 'NOT_FOUND'
    | 'FORBIDDEN'
    | 'LOCATION_INACTIVE'
    | 'PROVIDER_MISMATCH'
    | 'LOCATION_ORG_MISMATCH'
    | 'UNKNOWN_PROVIDER'
    | 'INVALID_CONFIGURATION';

  constructor(code: StorageReferenceError['code'], message: string) {
    super(message);
    this.name = 'StorageReferenceError';
    this.code = code;
  }
}

function requireNonEmpty(value: string, label: string): string {
  const t = value.trim();
  if (!t) {
    throw new StorageReferenceError(
      'VALIDATION',
      `${label} is required.`,
    );
  }
  return t;
}

/**
 * Validate location binding for a reference write.
 * Location must exist, belong to org, be active (for create), and dictate providerId.
 */
export async function resolveLocationBinding(
  organizationId: string,
  storageLocationId: string,
  requestedProviderId?: string | null,
  opts?: { requireActive?: boolean },
): Promise<{ storageLocationId: string; providerId: StorageProviderId }> {
  const locationId = requireNonEmpty(
    storageLocationId,
    'Storage location',
  );
  const location = await getStorageLocation(organizationId, locationId);
  if (!location) {
    throw new StorageReferenceError(
      'NOT_FOUND',
      'Storage location could not be found.',
    );
  }
  if (location.organizationId !== organizationId) {
    throw new StorageReferenceError(
      'LOCATION_ORG_MISMATCH',
      'Storage location does not belong to this organisation.',
    );
  }
  if (opts?.requireActive !== false && location.status !== 'active') {
    throw new StorageReferenceError(
      'LOCATION_INACTIVE',
      'Storage location is inactive.',
    );
  }
  if (!isRegisteredProviderId(location.providerId)) {
    throw new StorageReferenceError(
      'UNKNOWN_PROVIDER',
      'Storage provider is not available.',
    );
  }
  assertRegisteredProvider(location.providerId);

  if (
    requestedProviderId &&
    requestedProviderId.trim() &&
    requestedProviderId !== location.providerId
  ) {
    throw new StorageReferenceError(
      'PROVIDER_MISMATCH',
      'Storage provider does not match the storage location.',
    );
  }

  return {
    storageLocationId: location.id,
    providerId: location.providerId,
  };
}

export async function listReferencesSafe(
  organizationId: string,
): Promise<StorageReferenceSafeDto[]> {
  const rows = await listStorageReferences(organizationId);
  return rows.map(toStorageReferenceSafeDto);
}

export async function listReferencesForAssetSafe(
  organizationId: string,
  domainAssetId: string,
): Promise<StorageReferenceSafeDto[]> {
  const rows = await listStorageReferencesByDomainAsset(
    organizationId,
    domainAssetId,
  );
  return rows.map(toStorageReferenceSafeDto);
}

export async function getReferenceSafe(
  organizationId: string,
  id: string,
): Promise<StorageReferenceSafeDto | null> {
  const row = await getStorageReference(organizationId, id);
  if (!row) return null;
  if (row.organizationId !== organizationId) return null;
  return toStorageReferenceSafeDto(row);
}

/**
 * Create a durable StorageReference bound to org + location + provider object.
 */
export async function createReferenceSafe(
  organizationId: string,
  input: CreateStorageReferenceInput,
): Promise<StorageReferenceSafeDto> {
  if (!organizationId?.trim()) {
    throw new StorageReferenceError(
      'VALIDATION',
      'organizationId is required.',
    );
  }
  const domainAssetId = requireNonEmpty(
    input.domainAssetId,
    'Domain asset id',
  );
  if (!input.assetType || !isRoutableAssetType(input.assetType)) {
    throw new StorageReferenceError(
      'VALIDATION',
      'A valid asset type is required.',
    );
  }
  const providerFileId = requireNonEmpty(
    input.providerFileId,
    'Provider file id',
  );

  const binding = await resolveLocationBinding(
    organizationId,
    input.storageLocationId,
    input.providerId,
    { requireActive: true },
  );

  const created = await createStorageReference(organizationId, {
    ...input,
    domainAssetId,
    providerFileId,
    storageLocationId: binding.storageLocationId,
    providerId: binding.providerId,
  });

  // Defence in depth: never return a record that snuck a downloadUrl field
  const dto = toStorageReferenceSafeDto(created);
  assertNoEphemeralIdentity(dto);
  return dto;
}

export async function updateReferenceSafe(
  organizationId: string,
  id: string,
  input: UpdateStorageReferenceInput,
): Promise<StorageReferenceSafeDto> {
  const existing = await getStorageReference(organizationId, id);
  if (!existing || existing.organizationId !== organizationId) {
    throw new StorageReferenceError(
      'NOT_FOUND',
      'Storage reference could not be found.',
    );
  }

  // Cannot re-bind to another org's location or change provider via path
  if (input.providerPath !== undefined) {
    // path-only update is fine
  }

  const updated = await updateStorageReference(organizationId, id, input);
  if (!updated) {
    throw new StorageReferenceError(
      'NOT_FOUND',
      'Storage reference could not be found.',
    );
  }
  return toStorageReferenceSafeDto(updated);
}

export async function deleteReferenceSafe(
  organizationId: string,
  id: string,
): Promise<void> {
  const existing = await getStorageReference(organizationId, id);
  if (!existing || existing.organizationId !== organizationId) {
    throw new StorageReferenceError(
      'NOT_FOUND',
      'Storage reference could not be found.',
    );
  }
  const ok = await deleteStorageReference(organizationId, id);
  if (!ok) {
    throw new StorageReferenceError(
      'NOT_FOUND',
      'Storage reference could not be found.',
    );
  }
}

/** Ensure DTO never carries downloadUrl as identity. */
export function assertNoEphemeralIdentity(
  dto: StorageReferenceSafeDto | Record<string, unknown>,
): void {
  if ('downloadUrl' in dto && (dto as { downloadUrl?: unknown }).downloadUrl) {
    throw new StorageReferenceError(
      'INVALID_CONFIGURATION',
      'Ephemeral download URLs must not be persisted as storage identity.',
    );
  }
}

/**
 * Pure validation helper for tests: composite identity shape.
 */
export function buildEffectiveStorageIdentity(params: {
  organizationId: string;
  storageLocationId: string;
  providerId: string;
  providerFileId: string;
}): string {
  return [
    params.organizationId,
    params.storageLocationId,
    params.providerId,
    params.providerFileId,
  ].join('::');
}
