/**
 * BUILD-301E — Domain-facing storage policy operations.
 * Provider-neutral. Validates location + template org ownership server-side.
 */

import {
  createStoragePolicy,
  deleteStoragePolicy,
  getStoragePolicy,
  listActiveStoragePoliciesForAssetType,
  listStoragePolicies,
  updateStoragePolicy,
} from './storage-policy-repository';
import { getStorageLocation } from './storage-location-repository';
import { getFolderTemplate } from './folder-template-repository';
import {
  isRoutableAssetType,
  toStoragePolicySafeDto,
  type CreateStoragePolicyInput,
  type StoragePolicySafeDto,
  type UpdateStoragePolicyInput,
} from './storage-policy-types';
import type { AssetType } from '@/lib/asset-entity-repository';

export class StoragePolicyConfigError extends Error {
  readonly code:
    | 'VALIDATION'
    | 'NOT_FOUND'
    | 'FORBIDDEN'
    | 'DUPLICATE_POLICY'
    | 'INVALID_CONFIGURATION';

  constructor(code: StoragePolicyConfigError['code'], message: string) {
    super(message);
    this.name = 'StoragePolicyConfigError';
    this.code = code;
  }
}

export function validatePolicyName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    throw new StoragePolicyConfigError(
      'VALIDATION',
      'Storage policy name is required.',
    );
  }
  if (trimmed.length > 120) {
    throw new StoragePolicyConfigError(
      'VALIDATION',
      'Storage policy name is too long.',
    );
  }
  return trimmed;
}

async function assertLocationUsable(
  organizationId: string,
  storageLocationId: string,
  requireActive: boolean,
): Promise<void> {
  if (!storageLocationId?.trim()) {
    throw new StoragePolicyConfigError(
      'VALIDATION',
      'Storage location is required.',
    );
  }
  const location = await getStorageLocation(organizationId, storageLocationId);
  if (!location || location.organizationId !== organizationId) {
    throw new StoragePolicyConfigError(
      'INVALID_CONFIGURATION',
      'Storage location must belong to the current organisation.',
    );
  }
  if (requireActive && location.status !== 'active') {
    throw new StoragePolicyConfigError(
      'INVALID_CONFIGURATION',
      'Referenced storage location is disabled or unavailable.',
    );
  }
}

async function assertTemplateUsable(
  organizationId: string,
  folderTemplateId: string,
  requireActive: boolean,
): Promise<void> {
  if (!folderTemplateId?.trim()) {
    throw new StoragePolicyConfigError(
      'VALIDATION',
      'Folder template is required.',
    );
  }
  const template = await getFolderTemplate(organizationId, folderTemplateId);
  if (!template || template.organizationId !== organizationId) {
    throw new StoragePolicyConfigError(
      'INVALID_CONFIGURATION',
      'Folder template must belong to the current organisation.',
    );
  }
  if (requireActive && !template.active) {
    throw new StoragePolicyConfigError(
      'INVALID_CONFIGURATION',
      'Referenced folder template is not active.',
    );
  }
}

/**
 * When activating a policy, ensure no other active policy covers same asset type.
 */
async function assertNoDuplicateActivePolicy(
  organizationId: string,
  assetType: AssetType,
  exceptPolicyId?: string,
): Promise<void> {
  const active = await listActiveStoragePoliciesForAssetType(
    organizationId,
    assetType,
  );
  const conflicts = active.filter((p) => p.id !== exceptPolicyId);
  if (conflicts.length > 0) {
    throw new StoragePolicyConfigError(
      'DUPLICATE_POLICY',
      'An active storage policy already exists for this asset type.',
    );
  }
}

export async function listPoliciesSafe(
  organizationId: string,
): Promise<StoragePolicySafeDto[]> {
  const rows = await listStoragePolicies(organizationId);
  return rows.map(toStoragePolicySafeDto);
}

export async function getPolicySafe(
  organizationId: string,
  id: string,
): Promise<StoragePolicySafeDto | null> {
  const row = await getStoragePolicy(organizationId, id);
  return row ? toStoragePolicySafeDto(row) : null;
}

export async function createPolicySafe(
  organizationId: string,
  input: CreateStoragePolicyInput,
): Promise<StoragePolicySafeDto> {
  const name = validatePolicyName(input.name);
  if (!input.assetType || !isRoutableAssetType(input.assetType)) {
    throw new StoragePolicyConfigError(
      'VALIDATION',
      'A valid asset type is required.',
    );
  }

  const active = input.active !== false;
  await assertLocationUsable(organizationId, input.storageLocationId, active);
  await assertTemplateUsable(organizationId, input.folderTemplateId, active);

  if (active) {
    await assertNoDuplicateActivePolicy(organizationId, input.assetType);
  }

  const created = await createStoragePolicy(organizationId, {
    ...input,
    name,
    active,
  });
  return toStoragePolicySafeDto(created);
}

export async function updatePolicySafe(
  organizationId: string,
  id: string,
  input: UpdateStoragePolicyInput,
): Promise<StoragePolicySafeDto> {
  const existing = await getStoragePolicy(organizationId, id);
  if (!existing) {
    throw new StoragePolicyConfigError(
      'NOT_FOUND',
      'Storage policy could not be found.',
    );
  }

  let next = { ...input };
  if (next.name !== undefined) {
    next = { ...next, name: validatePolicyName(next.name) };
  }
  if (next.assetType !== undefined && !isRoutableAssetType(next.assetType)) {
    throw new StoragePolicyConfigError(
      'VALIDATION',
      'A valid asset type is required.',
    );
  }

  const effectiveAssetType = next.assetType ?? existing.assetType;
  const effectiveLocationId =
    next.storageLocationId ?? existing.storageLocationId;
  const effectiveTemplateId =
    next.folderTemplateId ?? existing.folderTemplateId;
  const effectiveActive =
    next.active !== undefined ? next.active : existing.active;

  await assertLocationUsable(
    organizationId,
    effectiveLocationId,
    effectiveActive,
  );
  await assertTemplateUsable(
    organizationId,
    effectiveTemplateId,
    effectiveActive,
  );

  if (effectiveActive) {
    await assertNoDuplicateActivePolicy(
      organizationId,
      effectiveAssetType,
      id,
    );
  }

  const updated = await updateStoragePolicy(organizationId, id, next);
  if (!updated) {
    throw new StoragePolicyConfigError(
      'NOT_FOUND',
      'Storage policy could not be found.',
    );
  }
  return toStoragePolicySafeDto(updated);
}

export async function deletePolicySafe(
  organizationId: string,
  id: string,
): Promise<void> {
  const ok = await deleteStoragePolicy(organizationId, id);
  if (!ok) {
    throw new StoragePolicyConfigError(
      'NOT_FOUND',
      'Storage policy could not be found.',
    );
  }
}
