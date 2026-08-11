/**
 * EPIC-301 — Production StorageReference lifecycle integration.
 *
 * This module is intentionally Cloudinary-first. It binds a successful
 * production upload to an RF StorageReference without changing the existing
 * upload transport or delivery contracts.
 *
 * Out of scope: routing enforcement, Dropbox/OneDrive production uploads,
 * historical backfill, delivery migration, discovery, reconciliation, and
 * OAuth/account redesign.
 */

import { ensureCloudinaryStorageLocation } from './storage-location-service';
import { createReferenceSafe } from './storage-reference-service';
import type { StorageReferenceSafeDto } from './storage-reference-types';

export interface CreateProductionStorageReferenceInput {
  organizationId: string;
  domainAssetId: string;
  /** Current RF asset category, not the provider's object type. */
  assetType: 'audio' | 'artwork' | 'video' | 'document' | 'other';
  providerFileId: string;
  providerPath?: string | null;
}

/**
 * Create the durable RF → Cloudinary binding for a newly persisted asset.
 *
 * The location is resolved from the organization's active Cloudinary storage
 * locations. If none exists, an explicit platform-default Cloudinary location
 * is created so the reference always points at a real StorageLocation.
 */
export async function createProductionStorageReference(
  input: CreateProductionStorageReferenceInput,
): Promise<StorageReferenceSafeDto> {
  const location = await ensureCloudinaryStorageLocation(input.organizationId);

  return createReferenceSafe(input.organizationId, {
    domainAssetId: input.domainAssetId,
    assetType: input.assetType,
    storageLocationId: location.id,
    providerId: location.providerId,
    providerFileId: input.providerFileId,
    providerPath: input.providerPath ?? input.providerFileId,
    status: 'active',
    versioningEnabled: false,
    currentVersion: 1,
  });
}
