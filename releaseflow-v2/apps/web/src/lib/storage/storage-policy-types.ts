/**
 * BUILD-301E — Storage Policy model.
 *
 * First-class routing object. Belongs to an organization.
 * Authoritative chain: Policy → StorageLocation → providerId; Policy → FolderTemplate.
 * No provider-specific fields. providerId is never the authoritative routing edge.
 *
 * Path: organizations/{organizationId}/storage_policies/{policyId}
 */

import type { AssetType } from '@/lib/asset-entity-repository';

/**
 * Re-export existing domain AssetType — do not invent a second type model.
 * Canonical: 'audio' | 'artwork' | 'video' | 'document' | 'other'
 */
export type { AssetType };

export const ROUTABLE_ASSET_TYPES: readonly AssetType[] = [
  'audio',
  'artwork',
  'video',
  'document',
  'other',
] as const;

export function isRoutableAssetType(value: string): value is AssetType {
  return (ROUTABLE_ASSET_TYPES as readonly string[]).includes(value);
}

/**
 * Organization-owned storage routing policy.
 * Does not store providerId — location owns the provider relationship.
 */
export interface StoragePolicyRecord {
  id: string;
  organizationId: string;
  name: string;
  assetType: AssetType;
  storageLocationId: string;
  folderTemplateId: string;
  versioningEnabled: boolean;
  autoCreateFolders: boolean;
  active: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface StoragePolicySafeDto {
  id: string;
  organizationId: string;
  name: string;
  assetType: AssetType;
  storageLocationId: string;
  folderTemplateId: string;
  versioningEnabled: boolean;
  autoCreateFolders: boolean;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateStoragePolicyInput {
  name: string;
  assetType: AssetType;
  storageLocationId: string;
  folderTemplateId: string;
  versioningEnabled?: boolean;
  autoCreateFolders?: boolean;
  active?: boolean;
}

export interface UpdateStoragePolicyInput {
  name?: string;
  assetType?: AssetType;
  storageLocationId?: string;
  folderTemplateId?: string;
  versioningEnabled?: boolean;
  autoCreateFolders?: boolean;
  active?: boolean;
}

function timestampToIso(value: unknown): string | null {
  if (
    value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value) return String(value);
  return null;
}

export function toStoragePolicySafeDto(
  record: StoragePolicyRecord,
): StoragePolicySafeDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    assetType: record.assetType,
    storageLocationId: record.storageLocationId,
    folderTemplateId: record.folderTemplateId,
    versioningEnabled: record.versioningEnabled,
    autoCreateFolders: record.autoCreateFolders,
    active: record.active,
    createdAt: timestampToIso(record.createdAt),
    updatedAt: timestampToIso(record.updatedAt),
  };
}
