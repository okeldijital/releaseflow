import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Vitest hoists vi.mock() factories to the top of the file. Mock fns must be
 * created via vi.hoisted() so they exist before those factories evaluate.
 */
const { ensureCloudinaryStorageLocation, createReferenceSafe } = vi.hoisted(() => ({
  ensureCloudinaryStorageLocation: vi.fn(),
  createReferenceSafe: vi.fn(),
}));

vi.mock('@/lib/storage/storage-location-service', () => ({
  ensureCloudinaryStorageLocation,
}));

vi.mock('@/lib/storage/storage-reference-service', () => ({
  createReferenceSafe,
}));

import { createProductionStorageReference } from '@/lib/storage/storage-reference-lifecycle-service';

describe('EPIC-301 production StorageReference lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureCloudinaryStorageLocation.mockResolvedValue({
      id: 'cloudinary-location-1',
      organizationId: 'org-a',
      name: 'Cloudinary (Platform Default)',
      providerId: 'cloudinary',
      status: 'active',
      rootPath: '/ReleaseFlow',
      configuration: { rootConfigured: true },
      isDefault: true,
      metadata: null,
      createdAt: null,
      updatedAt: null,
    });
    createReferenceSafe.mockResolvedValue({
      id: 'reference-1',
      organizationId: 'org-a',
      domainAssetId: 'asset-1',
      assetType: 'artwork',
      storageLocationId: 'cloudinary-location-1',
      providerId: 'cloudinary',
      providerFileId: 'release/artwork-1',
      providerPath: 'release/artwork-1',
      status: 'active',
      versioningEnabled: false,
      currentVersion: 1,
      providerVersionId: null,
      providerETag: null,
      providerModifiedAt: null,
      lastSyncedAt: null,
      syncStatus: 'never',
      lastSyncError: null,
      versions: [],
      createdAt: null,
      updatedAt: null,
    });
  });

  it('creates a Cloudinary-first reference bound to the organization and RF asset', async () => {
    const result = await createProductionStorageReference({
      organizationId: 'org-a',
      domainAssetId: 'asset-1',
      assetType: 'artwork',
      providerFileId: 'release/artwork-1',
    });

    expect(ensureCloudinaryStorageLocation).toHaveBeenCalledWith('org-a');
    expect(createReferenceSafe).toHaveBeenCalledWith('org-a', {
      domainAssetId: 'asset-1',
      assetType: 'artwork',
      storageLocationId: 'cloudinary-location-1',
      providerId: 'cloudinary',
      providerFileId: 'release/artwork-1',
      providerPath: 'release/artwork-1',
      status: 'active',
      versioningEnabled: false,
      currentVersion: 1,
    });
    expect(result.organizationId).toBe('org-a');
    expect(result.domainAssetId).toBe('asset-1');
    expect(result.providerId).toBe('cloudinary');
  });

  it('does not persist a download URL as the provider identity', async () => {
    await createProductionStorageReference({
      organizationId: 'org-a',
      domainAssetId: 'asset-1',
      assetType: 'artwork',
      providerFileId: 'release/artwork-1',
      providerPath: 'release/artwork-1',
    });

    const input = createReferenceSafe.mock.calls[0]?.[1];
    expect(input.providerFileId).toBe('release/artwork-1');
    expect(input.providerFileId).not.toContain('https://');
    expect(input).not.toHaveProperty('downloadUrl');
  });

  it('keeps organization identity explicit when resolving a location', async () => {
    await createProductionStorageReference({
      organizationId: 'org-b',
      domainAssetId: 'asset-b',
      assetType: 'artwork',
      providerFileId: 'release/artwork-b',
    });

    expect(ensureCloudinaryStorageLocation).toHaveBeenCalledWith('org-b');
    expect(createReferenceSafe).toHaveBeenCalledWith(
      'org-b',
      expect.objectContaining({ domainAssetId: 'asset-b' }),
    );
  });
});
