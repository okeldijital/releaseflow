/**
 * BUILD-301A — Storage Provider Architecture tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStorageProvider,
  getDefaultStorageProvider,
  listRegisteredStorageProviderIds,
  CLOUDINARY_PROVIDER_ID,
  CloudinaryStorageProvider,
  getCloudinaryStorageProvider,
  buildCloudinaryFolder,
  defaultOrganizationStorageConfig,
  resolveDefaultProviderId,
  storageReferenceFromObject,
  StorageError,
  unsupportedOperation,
  isStorageError,
} from '@/lib/storage';

describe('BUILD-301A StorageProvider contract', () => {
  it('resolves cloudinary to CloudinaryStorageProvider', () => {
    const provider = getStorageProvider(CLOUDINARY_PROVIDER_ID);
    expect(provider.providerId).toBe('cloudinary');
    expect(provider).toBeInstanceOf(CloudinaryStorageProvider);
    expect(getCloudinaryStorageProvider()).toBe(provider);
  });

  it('default provider is cloudinary', () => {
    expect(getDefaultStorageProvider().providerId).toBe('cloudinary');
    expect(listRegisteredStorageProviderIds()).toContain('cloudinary');
  });

  it('unknown provider throws STORAGE_PROVIDER_UNAVAILABLE', () => {
    // cloudinary/dropbox/onedrive are registered; use a still-unregistered id
    expect(() => getStorageProvider('googledrive')).toThrow(StorageError);
    try {
      getStorageProvider('googledrive');
    } catch (e) {
      expect(isStorageError(e)).toBe(true);
      expect((e as StorageError).code).toBe('STORAGE_PROVIDER_UNAVAILABLE');
    }
  });
});

describe('BUILD-301A capabilities', () => {
  const provider = getStorageProvider(CLOUDINARY_PROVIDER_ID);

  it('reports supported operations', () => {
    expect(provider.capabilities.upload).toBe(true);
    expect(provider.capabilities.delete).toBe(true);
    expect(provider.capabilities.getDownloadUrl).toBe(true);
  });

  it('reports unsupported operations', () => {
    expect(provider.capabilities.move).toBe(false);
    expect(provider.capabilities.list).toBe(false);
    expect(provider.capabilities.exists).toBe(false);
    expect(provider.capabilities.getMetadata).toBe(false);
  });
});

describe('BUILD-301A unsupported operations fail explicitly', () => {
  const provider = getStorageProvider(CLOUDINARY_PROVIDER_ID);

  it('move throws UNSUPPORTED_OPERATION', async () => {
    await expect(
      provider.move({
        providerFileId: 'x',
        destinationPath: 'y',
        organizationId: 'org-1',
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_OPERATION' });
  });

  it('list throws UNSUPPORTED_OPERATION', async () => {
    await expect(
      provider.list({ organizationId: 'org-1' }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_OPERATION' });
  });

  it('exists throws UNSUPPORTED_OPERATION', async () => {
    await expect(
      provider.exists({ providerFileId: 'x' }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_OPERATION' });
  });

  it('getMetadata throws UNSUPPORTED_OPERATION', async () => {
    await expect(
      provider.getMetadata({ providerFileId: 'x' }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_OPERATION' });
  });

  it('unsupportedOperation helper builds typed error', () => {
    const err = unsupportedOperation('cloudinary', 'list');
    expect(err.code).toBe('UNSUPPORTED_OPERATION');
    expect(err.providerId).toBe('cloudinary');
  });
});

describe('BUILD-301A identity mapping', () => {
  it('StorageObject treats providerFileId as external id, not domainAssetId', () => {
    const obj = {
      domainAssetId: 'rf-asset-123',
      providerId: CLOUDINARY_PROVIDER_ID,
      providerFileId: 'releaseflow/org/releases/cover_abc',
      downloadUrl: 'https://res.cloudinary.com/demo/image/upload/releaseflow/org/releases/cover_abc',
    };
    expect(obj.domainAssetId).not.toBe(obj.providerFileId);
    expect(obj.providerFileId).not.toMatch(/^rf-/);
  });

  it('storageReferenceFromObject maps fields without inventing RF id', () => {
    const ref = storageReferenceFromObject({
      providerId: 'cloudinary',
      providerFileId: 'folder/public_id',
      downloadUrl: 'https://example.com/x',
      filename: 'cover.png',
    });
    expect(ref.providerFileId).toBe('folder/public_id');
    expect(ref.providerId).toBe('cloudinary');
    expect(ref).not.toHaveProperty('domainAssetId');
  });
});

describe('BUILD-301A Cloudinary folder isolation', () => {
  it('builds org-scoped folders without exposing them on the interface', () => {
    expect(buildCloudinaryFolder('org-1', 'artwork')).toBe(
      'releaseflow/org-1/releases',
    );
    expect(buildCloudinaryFolder('org-1', 'avatar')).toBe(
      'releaseflow/org-1/avatars',
    );
    expect(buildCloudinaryFolder('org-1', 'unknown')).toBe(
      'releaseflow/org-1/assets',
    );
  });
});

describe('BUILD-301A organization storage config', () => {
  it('defaults to cloudinary only', () => {
    const cfg = defaultOrganizationStorageConfig('org-9');
    expect(cfg.enabledProviders).toEqual(['cloudinary']);
    expect(cfg.defaultProviderId).toBe('cloudinary');
    expect(resolveDefaultProviderId(cfg)).toBe('cloudinary');
    expect(resolveDefaultProviderId(null)).toBe('cloudinary');
  });
});

describe('BUILD-301A upload mapping (mocked transport)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/media/upload-signature')) {
          return new Response(
            JSON.stringify({
              cloudName: 'demo',
              apiKey: 'key',
              timestamp: 1,
              signature: 'sig',
              folder: 'releaseflow/org-1/releases',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('api.cloudinary.com')) {
          return new Response(
            JSON.stringify({
              public_id: 'releaseflow/org-1/releases/file_xyz',
              secure_url:
                'https://res.cloudinary.com/demo/image/upload/releaseflow/org-1/releases/file_xyz',
              url: 'http://res.cloudinary.com/demo/image/upload/releaseflow/org-1/releases/file_xyz',
              format: 'png',
              bytes: 42,
              created_at: '2026-01-01T00:00:00Z',
              width: 100,
              height: 100,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/api/media/destroy')) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return originalFetch(input, init);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps Cloudinary public_id to providerFileId (not domainAssetId)', async () => {
    const provider = getStorageProvider(CLOUDINARY_PROVIDER_ID);
    const file = new File([new Uint8Array([1, 2, 3])], 'cover.png', {
      type: 'image/png',
    });
    const result = await provider.upload({
      payload: file,
      filename: 'cover.png',
      contentType: 'image/png',
      domainAssetId: 'rf-domain-1',
      context: {
        organizationId: 'org-1',
        entityType: 'artwork',
        entityId: 'rel-1',
        accessToken: 'token',
      },
    });

    expect(result.providerId).toBe('cloudinary');
    expect(result.providerFileId).toBe('releaseflow/org-1/releases/file_xyz');
    expect(result.domainAssetId).toBe('rf-domain-1');
    expect(result.domainAssetId).not.toBe(result.providerFileId);
    expect(result.downloadUrl).toContain('cloudinary.com');
    expect(result.sizeBytes).toBe(42);
  });

  it('delete delegates to destroy with providerFileId as publicId', async () => {
    const provider = getStorageProvider(CLOUDINARY_PROVIDER_ID);
    await provider.delete({
      providerFileId: 'releaseflow/org-1/releases/file_xyz',
      organizationId: 'org-1',
      entityType: 'artwork',
      accessToken: 'token',
    });
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const destroyCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes('/api/media/destroy'),
    );
    expect(destroyCall).toBeTruthy();
    const body = JSON.parse(String(destroyCall![1]?.body));
    expect(body.publicId).toBe('releaseflow/org-1/releases/file_xyz');
    expect(body.organizationId).toBe('org-1');
  });
});

describe('BUILD-301A download URL', () => {
  it('resolves via MediaUrlService without treating URL as identity', async () => {
    // May throw if cloud name env missing in test env — use try or mock.
    const prev = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    try {
      const provider = getStorageProvider(CLOUDINARY_PROVIDER_ID);
      const url = await provider.getDownloadUrl({
        providerFileId: 'folder/id',
      });
      expect(url).toContain('demo-cloud');
      expect(url).toContain('folder/id');
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      else process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = prev;
    }
  });
});

describe('BUILD-301A interface has no Cloudinary terminology', () => {
  it('StorageProvider source is provider-neutral', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const src = readFileSync(
      join(__dirname, '../lib/storage/storage-provider.ts'),
      'utf8',
    );
    expect(src.toLowerCase()).not.toContain('publicid');
    expect(src.toLowerCase()).not.toContain('cloudinary');
    expect(src).not.toContain('secure_url');
  });
});
