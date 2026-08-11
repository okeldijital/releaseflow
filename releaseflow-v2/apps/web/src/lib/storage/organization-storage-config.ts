/**
 * BUILD-301A — Minimal organization storage configuration (architecture only).
 *
 * Code-only model for BUILD-301D. Does not alter production behaviour,
 * create UI, or write Firestore. Existing Cloudinary remains the default.
 */

import { CLOUDINARY_PROVIDER_ID, type StorageProviderId } from './types';

export interface OrganizationStorageConfig {
  organizationId: string;
  enabledProviders: StorageProviderId[];
  defaultProviderId: StorageProviderId;
}

/**
 * Default config when no org storage settings document exists yet.
 * Cloudinary is the only enabled provider in BUILD-301A.
 */
export function defaultOrganizationStorageConfig(
  organizationId: string,
): OrganizationStorageConfig {
  return {
    organizationId,
    enabledProviders: [CLOUDINARY_PROVIDER_ID],
    defaultProviderId: CLOUDINARY_PROVIDER_ID,
  };
}

/**
 * Resolve which provider id an organization should use.
 * Always falls back to cloudinary if misconfigured.
 */
export function resolveDefaultProviderId(
  config: OrganizationStorageConfig | null | undefined,
): StorageProviderId {
  if (!config) return CLOUDINARY_PROVIDER_ID;
  if (
    config.defaultProviderId &&
    config.enabledProviders.includes(config.defaultProviderId)
  ) {
    return config.defaultProviderId;
  }
  return config.enabledProviders[0] ?? CLOUDINARY_PROVIDER_ID;
}
