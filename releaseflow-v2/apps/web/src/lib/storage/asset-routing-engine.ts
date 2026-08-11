/**
 * BUILD-301E — Asset Routing Engine.
 *
 * ReleaseFlow owns the routing decision. External providers own the file.
 * This engine never uploads and never calls provider APIs.
 *
 * Authoritative chain:
 *   Organization → Asset Type → Storage Policy → Storage Location
 *     → Storage Provider (registry) → Folder Template → Resolved Destination
 */

import type { StorageProviderId } from './types';
import type { StorageLocationRecord } from './storage-location-types';
import type { FolderTemplateRecord } from './folder-template-types';
import type { StoragePolicyRecord } from './storage-policy-types';
import { isRoutableAssetType } from './storage-policy-types';
import {
  AssetRoutingError,
  type AssetRoutingContext,
  type StorageRoute,
} from './asset-routing-types';
import {
  buildTemplateVariableValues,
  combineRootAndTemplatePath,
  resolveFolderTemplate,
} from './folder-template-resolver';
import {
  listActiveStoragePoliciesForAssetType,
  getStoragePolicy,
} from './storage-policy-repository';
import { getStorageLocation } from './storage-location-repository';
import { getFolderTemplate } from './folder-template-repository';
import {
  getStorageProvider,
  listRegisteredStorageProviderIds,
} from './resolve-storage-provider';

/**
 * Injectable data access for tests and pure resolution.
 * Default implementation uses Firestore repositories + provider registry.
 */
export interface AssetRoutingDeps {
  listActivePoliciesForAssetType: (
    organizationId: string,
    assetType: StoragePolicyRecord['assetType'],
  ) => Promise<StoragePolicyRecord[]>;
  getPolicy: (
    organizationId: string,
    policyId: string,
  ) => Promise<StoragePolicyRecord | null>;
  getLocation: (
    organizationId: string,
    locationId: string,
  ) => Promise<StorageLocationRecord | null>;
  getTemplate: (
    organizationId: string,
    templateId: string,
  ) => Promise<FolderTemplateRecord | null>;
  /**
   * Resolve provider through registry only.
   * Must throw or return false for unknown ids — no provider-specific branches.
   */
  isProviderRegistered: (providerId: string) => boolean;
  /** Optional touch of registry factory (ensures provider exists). */
  assertProviderResolvable?: (providerId: StorageProviderId) => void;
}

const defaultDeps: AssetRoutingDeps = {
  listActivePoliciesForAssetType: listActiveStoragePoliciesForAssetType,
  getPolicy: getStoragePolicy,
  getLocation: getStorageLocation,
  getTemplate: getFolderTemplate,
  isProviderRegistered: (providerId) =>
    listRegisteredStorageProviderIds().includes(
      providerId as StorageProviderId,
    ),
  assertProviderResolvable: (providerId) => {
    getStorageProvider(providerId);
  },
};

/**
 * Pure configuration assembly into StorageRoute (no I/O).
 * Used after policies/locations/templates have been loaded and validated.
 */
export function buildStorageRoute(params: {
  context: AssetRoutingContext;
  policy: StoragePolicyRecord;
  location: StorageLocationRecord;
  template: FolderTemplateRecord;
}): StorageRoute {
  const { context, policy, location, template } = params;

  // Organisation isolation — all objects must match context.organizationId
  if (!context.organizationId) {
    throw new AssetRoutingError(
      'VALIDATION',
      'organizationId is required for asset routing.',
    );
  }
  if (policy.organizationId !== context.organizationId) {
    throw new AssetRoutingError(
      'POLICY_ORG_MISMATCH',
      'Storage policy does not belong to the routing organisation.',
    );
  }
  if (location.organizationId !== context.organizationId) {
    throw new AssetRoutingError(
      'LOCATION_ORG_MISMATCH',
      'Storage location does not belong to the routing organisation.',
    );
  }
  if (template.organizationId !== context.organizationId) {
    throw new AssetRoutingError(
      'TEMPLATE_ORG_MISMATCH',
      'Folder template does not belong to the routing organisation.',
    );
  }

  if (policy.storageLocationId !== location.id) {
    throw new AssetRoutingError(
      'INVALID_CONFIGURATION',
      'Storage policy location reference is inconsistent.',
    );
  }
  if (policy.folderTemplateId !== template.id) {
    throw new AssetRoutingError(
      'INVALID_CONFIGURATION',
      'Storage policy template reference is inconsistent.',
    );
  }

  if (!policy.active) {
    throw new AssetRoutingError(
      'POLICY_INACTIVE',
      'Storage policy is not active.',
    );
  }

  if (location.status !== 'active') {
    throw new AssetRoutingError(
      'LOCATION_DISABLED',
      'Storage location is not available for routing.',
    );
  }

  if (!template.active) {
    throw new AssetRoutingError(
      'TEMPLATE_INACTIVE',
      'Folder template is not active.',
    );
  }

  const values = buildTemplateVariableValues(context);
  const resolvedTemplatePath = resolveFolderTemplate(
    template.structure,
    values,
  );
  const resolvedPath = combineRootAndTemplatePath(
    location.rootPath,
    resolvedTemplatePath,
  );

  return {
    organizationId: context.organizationId,
    storagePolicyId: policy.id,
    storageLocationId: location.id,
    providerId: location.providerId,
    rootPath: location.rootPath,
    resolvedPath,
    folderTemplateId: template.id,
    autoCreateFolders: policy.autoCreateFolders,
    versioningEnabled: policy.versioningEnabled,
    assetType: context.assetType,
    storagePolicyName: policy.name,
    storageLocationName: location.name,
  };
}

/**
 * Authoritative routing algorithm.
 * Does not upload. Does not call Dropbox/OneDrive/Cloudinary APIs.
 * Does not use provisional 301C paths as canonical routing.
 * Does not fall back to default location or Cloudinary when policy is missing.
 */
export async function resolveAssetRoute(
  context: AssetRoutingContext,
  deps: AssetRoutingDeps = defaultDeps,
): Promise<StorageRoute> {
  // 1. validate organization
  if (!context.organizationId?.trim()) {
    throw new AssetRoutingError(
      'VALIDATION',
      'organizationId is required for asset routing.',
    );
  }
  const organizationId = context.organizationId.trim();

  // 2. resolve Asset Type
  if (!context.assetType || !isRoutableAssetType(context.assetType)) {
    throw new AssetRoutingError(
      'VALIDATION',
      'A valid asset type is required for routing.',
    );
  }

  // 3. find active Storage Policy (exactly one)
  const policies = await deps.listActivePoliciesForAssetType(
    organizationId,
    context.assetType,
  );

  if (policies.length === 0) {
    throw new AssetRoutingError(
      'MISSING_POLICY',
      'No active storage policy exists for this organisation and asset type.',
    );
  }
  if (policies.length > 1) {
    throw new AssetRoutingError(
      'DUPLICATE_POLICY',
      'Multiple active storage policies match this organisation and asset type.',
    );
  }

  const policy = policies[0]!;
  if (policy.organizationId !== organizationId) {
    throw new AssetRoutingError(
      'POLICY_ORG_MISMATCH',
      'Storage policy does not belong to the routing organisation.',
    );
  }

  // 4–5. resolve Storage Location + org check
  const location = await deps.getLocation(
    organizationId,
    policy.storageLocationId,
  );
  if (!location) {
    throw new AssetRoutingError(
      'LOCATION_NOT_FOUND',
      'Storage location referenced by policy could not be found.',
    );
  }
  if (location.organizationId !== organizationId) {
    throw new AssetRoutingError(
      'LOCATION_ORG_MISMATCH',
      'Storage location does not belong to the routing organisation.',
    );
  }

  // 6. resolve Storage Provider via registry only
  if (!deps.isProviderRegistered(location.providerId)) {
    throw new AssetRoutingError(
      'UNKNOWN_PROVIDER',
      'Storage provider is not available.',
    );
  }
  if (deps.assertProviderResolvable) {
    try {
      deps.assertProviderResolvable(location.providerId);
    } catch {
      throw new AssetRoutingError(
        'UNKNOWN_PROVIDER',
        'Storage provider is not available.',
      );
    }
  }

  // 7. resolve Folder Template
  const template = await deps.getTemplate(
    organizationId,
    policy.folderTemplateId,
  );
  if (!template) {
    throw new AssetRoutingError(
      'TEMPLATE_NOT_FOUND',
      'Folder template referenced by policy could not be found.',
    );
  }
  if (template.organizationId !== organizationId) {
    throw new AssetRoutingError(
      'TEMPLATE_ORG_MISMATCH',
      'Folder template does not belong to the routing organisation.',
    );
  }

  // 8–10. variables + combine + validate → StorageRoute
  return buildStorageRoute({
    context: { ...context, organizationId },
    policy,
    location,
    template,
  });
}

/**
 * Routing preview — same as resolveAssetRoute; no upload side effects.
 */
export async function previewAssetRoute(
  context: AssetRoutingContext,
  deps?: AssetRoutingDeps,
): Promise<StorageRoute> {
  return resolveAssetRoute(context, deps);
}
