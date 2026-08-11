/**
 * BUILD-301E — Provider-neutral routing context and result.
 *
 * Answers: given org + asset type + release context, where should this asset be stored?
 * Does not upload. Does not call providers.
 */

import type { AssetType } from '@/lib/asset-entity-repository';
import type { StorageProviderId } from './types';

/**
 * Provider-neutral routing context.
 * Uses existing domain concepts; does not embed full Release/Artist/Track records.
 */
export interface AssetRoutingContext {
  organizationId: string;
  /** Display name for {Organization}; required when template uses that variable. */
  organizationName?: string;
  assetType: AssetType;
  releaseId?: string;
  releaseName?: string;
  artistId?: string;
  artistName?: string;
  trackId?: string;
  trackName?: string;
  filename?: string;
  version?: string;
  year?: string | number;
  month?: string | number;
}

/**
 * Provider-neutral routing decision.
 * Consumable later by StorageProvider — not a provider operation result.
 * Never includes tokens, SDK clients, or provider-specific response types.
 */
export interface StorageRoute {
  organizationId: string;
  storagePolicyId: string;
  storageLocationId: string;
  providerId: StorageProviderId;
  rootPath: string;
  /** Final destination: rootPath + resolved template path. */
  resolvedPath: string;
  folderTemplateId: string;
  autoCreateFolders: boolean;
  versioningEnabled: boolean;
  /** Echo of routing inputs useful for preview/UI. */
  assetType: AssetType;
  storagePolicyName?: string;
  storageLocationName?: string;
}

export type AssetRoutingErrorCode =
  | 'VALIDATION'
  | 'MISSING_POLICY'
  | 'DUPLICATE_POLICY'
  | 'POLICY_INACTIVE'
  | 'LOCATION_NOT_FOUND'
  | 'LOCATION_DISABLED'
  | 'LOCATION_ORG_MISMATCH'
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_INACTIVE'
  | 'TEMPLATE_ORG_MISMATCH'
  | 'POLICY_ORG_MISMATCH'
  | 'UNKNOWN_PROVIDER'
  | 'TEMPLATE_RESOLUTION'
  | 'PATH_SECURITY'
  | 'INVALID_CONFIGURATION';

export class AssetRoutingError extends Error {
  readonly code: AssetRoutingErrorCode;

  constructor(code: AssetRoutingErrorCode, message: string) {
    super(message);
    this.name = 'AssetRoutingError';
    this.code = code;
  }
}

/** Preview DTO for UI (no secrets, no upload). */
export interface AssetRoutingPreviewDto {
  assetType: AssetType;
  policy: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    name: string;
  };
  providerId: StorageProviderId;
  folderTemplateId: string;
  rootPath: string;
  resolvedPath: string;
  autoCreateFolders: boolean;
  versioningEnabled: boolean;
}

export function toRoutingPreviewDto(route: StorageRoute): AssetRoutingPreviewDto {
  return {
    assetType: route.assetType,
    policy: {
      id: route.storagePolicyId,
      name: route.storagePolicyName ?? route.storagePolicyId,
    },
    location: {
      id: route.storageLocationId,
      name: route.storageLocationName ?? route.storageLocationId,
    },
    providerId: route.providerId,
    folderTemplateId: route.folderTemplateId,
    rootPath: route.rootPath,
    resolvedPath: route.resolvedPath,
    autoCreateFolders: route.autoCreateFolders,
    versioningEnabled: route.versioningEnabled,
  };
}
