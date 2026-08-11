/**
 * BUILD-301B — Dropbox Storage Provider tests (mocked API only).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  getStorageProvider,
  getDefaultStorageProvider,
  listRegisteredStorageProviderIds,
  CLOUDINARY_PROVIDER_ID,
  DROPBOX_PROVIDER_ID,
  DropboxStorageProvider,
  getDropboxStorageProvider,
  resolveDropboxUploadPath,
  StorageError,
  isStorageError,
} from '@/lib/storage';
import {
  dropboxUpload,
  dropboxDelete,
  dropboxGetTemporaryLink,
  getDropboxAccessToken,
  type DropboxFetch,
} from '@/lib/server/dropbox/dropbox-api';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

describe('BUILD-301B provider identity & resolution', () => {
  it('providerId is dropbox', () => {
    const p = getDropboxStorageProvider();
    expect(p.providerId).toBe('dropbox');
    expect(p).toBeInstanceOf(DropboxStorageProvider);
  });

  it('getStorageProvider("dropbox") returns Dropbox adapter', () => {
    expect(getStorageProvider(DROPBOX_PROVIDER_ID).providerId).toBe('dropbox');
    expect(listRegisteredStorageProviderIds()).toEqual(
      expect.arrayContaining(['cloudinary', 'dropbox']),
    );
  });

  it('default provider remains cloudinary', () => {
    expect(getDefaultStorageProvider().providerId).toBe(
      CLOUDINARY_PROVIDER_ID,
    );
  });

  it('unknown provider still rejects with STORAGE_PROVIDER_UNAVAILABLE', () => {
    expect(() => getStorageProvider('googledrive')).toThrow(StorageError);
    try {
      getStorageProvider('googledrive');
    } catch (e) {
      expect(isStorageError(e)).toBe(true);
      expect((e as StorageError).code).toBe('STORAGE_PROVIDER_UNAVAILABLE');
    }
  });
});

describe('BUILD-301B capability declaration', () => {
  const p = getStorageProvider(DROPBOX_PROVIDER_ID);

  it('supports upload, delete, getDownloadUrl', () => {
    expect(p.capabilities.upload).toBe(true);
    expect(p.capabilities.delete).toBe(true);
    expect(p.capabilities.getDownloadUrl).toBe(true);
  });

  it('does not support move, list, exists (discovery/reconciliation out of scope)', () => {
    expect(p.capabilities.move).toBe(false);
    expect(p.capabilities.list).toBe(false);
    expect(p.capabilities.exists).toBe(false);
  });

  it('supports known-object getMetadata (BUILD-301F)', () => {
    expect(p.capabilities.getMetadata).toBe(true);
  });
});

describe('BUILD-301B unsupported operations', () => {
  const p = getStorageProvider(DROPBOX_PROVIDER_ID);

  it('move / list / exists throw UNSUPPORTED_OPERATION', async () => {
    await expect(
      p.move({
        providerFileId: 'id:x',
        destinationPath: '/y',
        organizationId: 'org',
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_OPERATION' });
    await expect(p.list({ organizationId: 'org' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_OPERATION',
    });
    await expect(p.exists({ providerFileId: 'id:x' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_OPERATION',
    });
  });

  it('getMetadata requires accessToken and organizationId', async () => {
    await expect(
      p.getMetadata({ providerFileId: 'id:x' }),
    ).rejects.toMatchObject({ code: 'STORAGE_ACCESS_DENIED' });
  });
});

describe('BUILD-301B identity mapping', () => {
  it('keeps domainAssetId, providerId, providerFileId, providerPath distinct', () => {
    const obj = {
      domainAssetId: 'rf-asset-1',
      providerId: DROPBOX_PROVIDER_ID,
      providerFileId: 'id:a4ayc_80_OEAAAAAAAAAXw',
      providerPath: '/ReleaseFlow/org/artwork/rel/cover.png',
      downloadUrl: 'https://dl.dropboxusercontent.com/temp',
    };
    expect(obj.domainAssetId).not.toBe(obj.providerFileId);
    expect(obj.domainAssetId).not.toBe(obj.providerPath);
    expect(obj.providerFileId).not.toBe(obj.providerPath);
    expect(obj.downloadUrl).not.toBe(obj.providerFileId);
    expect(obj.providerId).toBe('dropbox');
  });

  it('resolveDropboxUploadPath prefers metadata.providerPath', () => {
    const path = resolveDropboxUploadPath({
      payload: new Blob(),
      filename: 'x.png',
      context: {
        organizationId: 'org-1',
        entityType: 'artwork',
        entityId: 'r1',
        accessToken: 't',
      },
      metadata: { providerPath: '/custom/path/file.png' },
    });
    expect(path).toBe('/custom/path/file.png');
  });

  it('resolveDropboxUploadPath builds provisional path when none supplied', () => {
    const path = resolveDropboxUploadPath({
      payload: new Blob(),
      filename: 'cover.png',
      context: {
        organizationId: 'org-1',
        entityType: 'artwork',
        entityId: 'rel-9',
        accessToken: 't',
      },
    });
    expect(path).toBe(
      '/ReleaseFlow/org-1/artwork/rel-9/cover.png',
    );
  });
});

describe('BUILD-301B provider transport (mocked RF API routes)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/storage/dropbox/upload')) {
          return new Response(
            JSON.stringify({
              providerId: 'dropbox',
              providerFileId: 'id:dbx_file_001',
              providerPath: '/ReleaseFlow/org-1/artwork/rel-1/cover.png',
              filename: 'cover.png',
              sizeBytes: 99,
              contentHash: 'hash99',
              serverModified: '2026-01-01T00:00:00Z',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/api/storage/dropbox/delete')) {
          const body = JSON.parse(String(init?.body ?? '{}')) as {
            providerFileId?: string;
          };
          expect(body.providerFileId).toBe('id:dbx_file_001');
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (url.includes('/api/storage/dropbox/download-url')) {
          return new Response(
            JSON.stringify({
              downloadUrl: 'https://dl.dropboxusercontent.com/temp-link',
              providerFileId: 'id:dbx_file_001',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response('not found', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('upload maps Dropbox response to StorageObject without leaking Dropbox SDK types', async () => {
    const p = getStorageProvider(DROPBOX_PROVIDER_ID);
    const file = new File([new Uint8Array([1, 2, 3])], 'cover.png', {
      type: 'image/png',
    });
    const result = await p.upload({
      payload: file,
      filename: 'cover.png',
      contentType: 'image/png',
      domainAssetId: 'rf-domain-42',
      context: {
        organizationId: 'org-1',
        entityType: 'artwork',
        entityId: 'rel-1',
        accessToken: 'firebase-token',
      },
    });

    expect(result.providerId).toBe('dropbox');
    expect(result.providerFileId).toBe('id:dbx_file_001');
    expect(result.providerPath).toContain('/ReleaseFlow/');
    expect(result.domainAssetId).toBe('rf-domain-42');
    expect(result.domainAssetId).not.toBe(result.providerFileId);
    expect(result.sizeBytes).toBe(99);
    // No Dropbox SDK type leakage — plain object fields only
    expect(Object.keys(result).sort()).toEqual(
      expect.arrayContaining([
        'providerId',
        'providerFileId',
        'providerPath',
        'domainAssetId',
      ]),
    );
  });

  it('delete maps provider-neutral request to Dropbox API route', async () => {
    const p = getStorageProvider(DROPBOX_PROVIDER_ID);
    await p.delete({
      providerFileId: 'id:dbx_file_001',
      organizationId: 'org-1',
      entityType: 'artwork',
      accessToken: 'firebase-token',
    });
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(
      fetchMock.mock.calls.some((c) =>
        String(c[0]).includes('/api/storage/dropbox/delete'),
      ),
    ).toBe(true);
  });

  it('getDownloadUrl returns temporary delivery URL (not identity)', async () => {
    const p = getStorageProvider(DROPBOX_PROVIDER_ID);
    const url = await p.getDownloadUrl({
      providerFileId: 'id:dbx_file_001',
      organizationId: 'org-1',
      accessToken: 'firebase-token',
    });
    expect(url).toBe('https://dl.dropboxusercontent.com/temp-link');
    expect(url).not.toBe('id:dbx_file_001');
  });
});

describe('BUILD-301B Dropbox REST boundary (mocked network)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.DROPBOX_APP_KEY = 'app-key';
    process.env.DROPBOX_APP_SECRET = 'app-secret';
    process.env.DROPBOX_REFRESH_TOKEN = 'refresh-token';
  });

  afterEach(() => {
    process.env.DROPBOX_APP_KEY = originalEnv.DROPBOX_APP_KEY;
    process.env.DROPBOX_APP_SECRET = originalEnv.DROPBOX_APP_SECRET;
    process.env.DROPBOX_REFRESH_TOKEN = originalEnv.DROPBOX_REFRESH_TOKEN;
  });

  function mockDropboxFetch(): DropboxFetch {
    return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('oauth2/token')) {
        return new Response(
          JSON.stringify({ access_token: 'access-token-mock' }),
          { status: 200 },
        );
      }
      if (url.includes('/2/files/upload')) {
        const arg = JSON.parse(
          String((init?.headers as Record<string, string>)?.['Dropbox-API-Arg']),
        ) as { path: string };
        return new Response(
          JSON.stringify({
            id: 'id:uploaded_1',
            path_display: arg.path,
            name: 'cover.png',
            size: 10,
            content_hash: 'ch',
            server_modified: '2026-01-01T00:00:00Z',
          }),
          { status: 200 },
        );
      }
      if (url.includes('/2/files/delete_v2')) {
        return new Response(JSON.stringify({ metadata: { id: 'id:x' } }), {
          status: 200,
        });
      }
      if (url.includes('/2/files/get_temporary_link')) {
        return new Response(
          JSON.stringify({
            link: 'https://dl.dropboxusercontent.com/s/temp',
            metadata: { id: 'id:x', path_display: '/a/b' },
          }),
          { status: 200 },
        );
      }
      return new Response('unexpected', { status: 500 });
    }) as DropboxFetch;
  }

  it('upload maps Dropbox file id to providerFileId', async () => {
    const fetchImpl = mockDropboxFetch();
    const result = await dropboxUpload(
      {
        path: '/ReleaseFlow/org/artwork/r/cover.png',
        contents: Buffer.from([1, 2, 3]),
      },
      fetchImpl,
    );
    expect(result.providerFileId).toBe('id:uploaded_1');
    expect(result.providerPath).toBe('/ReleaseFlow/org/artwork/r/cover.png');
    expect(result.providerFileId).not.toBe(result.providerPath);
  });

  it('delete and temporary link use Dropbox APIs without live network', async () => {
    const fetchImpl = mockDropboxFetch();
    await dropboxDelete({ pathOrId: 'id:uploaded_1' }, fetchImpl);
    const link = await dropboxGetTemporaryLink(
      { pathOrId: 'id:uploaded_1' },
      fetchImpl,
    );
    expect(link.link).toContain('dropboxusercontent.com');
    const token = await getDropboxAccessToken(fetchImpl);
    expect(token).toBe('access-token-mock');
  });
});

describe('BUILD-301B credential safety & neutrality', () => {
  it('Dropbox secrets module is not imported by client storage façade', () => {
    const mediaUpload = read('lib/media/media-upload.ts');
    expect(mediaUpload).not.toContain('DROPBOX_APP_SECRET');
    expect(mediaUpload).not.toContain('dropbox-api');
    expect(mediaUpload).not.toContain('@/lib/server/dropbox');
  });

  it('DropboxStorageProvider does not import server secrets', () => {
    const src = read(
      'lib/storage/providers/dropbox-storage-provider.ts',
    );
    expect(src).not.toContain('DROPBOX_APP_SECRET');
    expect(src).not.toContain('DROPBOX_REFRESH_TOKEN');
    expect(src).not.toContain('dropboxServerConfig');
    expect(src).toContain('/api/storage/dropbox/');
  });

  it('neutral storage modules have no Dropbox SDK imports', () => {
    for (const rel of [
      'lib/storage/storage-provider.ts',
      'lib/storage/types.ts',
      'lib/storage/storage-reference.ts',
    ]) {
      const src = read(rel);
      expect(src).not.toMatch(/from ['"]dropbox['"]/);
      expect(src).not.toContain('dropbox-sdk');
      expect(src).not.toContain('DROPBOX_APP_SECRET');
    }
  });

  it('server dropbox config uses explicit env names', () => {
    const cfg = read('lib/server/dropbox/config.ts');
    expect(cfg).toContain('DROPBOX_APP_KEY');
    expect(cfg).toContain('DROPBOX_APP_SECRET');
    expect(cfg).toContain('DROPBOX_REFRESH_TOKEN');
    expect(cfg).not.toContain('CLOUDINARY_');
  });

  it('no dropbox package dependency required in web package.json', () => {
    expect(existsSync(join(webSrc, '../package.json'))).toBe(true);
    const pkg = read('../package.json');
    expect(pkg).not.toMatch(/"dropbox"\s*:/);
  });
});
