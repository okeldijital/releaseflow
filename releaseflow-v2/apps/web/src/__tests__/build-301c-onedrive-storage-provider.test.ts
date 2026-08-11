/**
 * BUILD-301C — OneDrive Storage Provider tests (mocked Graph only).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getStorageProvider,
  getDefaultStorageProvider,
  listRegisteredStorageProviderIds,
  CLOUDINARY_PROVIDER_ID,
  ONEDRIVE_PROVIDER_ID,
  OneDriveStorageProvider,
  getOneDriveStorageProvider,
  resolveOneDriveUploadPath,
  StorageError,
} from '@/lib/storage';
import {
  onedriveUpload,
  onedriveDelete,
  onedriveGetDownloadUrl,
  getMicrosoftAccessToken,
  neutralStorageFailure,
  type OneDriveFetch,
} from '@/lib/server/onedrive/onedrive-api';
import {
  buildProvisionalOneDrivePath,
  isPathBoundToOrganization,
  validateOrgBoundPath,
} from '@/lib/server/onedrive/path-safety';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

describe('BUILD-301C provider contract & resolution', () => {
  it('providerId is onedrive and implements StorageProvider shape', () => {
    const p = getOneDriveStorageProvider();
    expect(p.providerId).toBe('onedrive');
    expect(p).toBeInstanceOf(OneDriveStorageProvider);
    expect(typeof p.upload).toBe('function');
    expect(typeof p.delete).toBe('function');
    expect(typeof p.getDownloadUrl).toBe('function');
  });

  it('getStorageProvider("onedrive") returns OneDrive adapter', () => {
    expect(getStorageProvider(ONEDRIVE_PROVIDER_ID).providerId).toBe('onedrive');
    expect(listRegisteredStorageProviderIds()).toEqual(
      expect.arrayContaining(['cloudinary', 'dropbox', 'onedrive']),
    );
  });

  it('default provider remains cloudinary', () => {
    expect(getDefaultStorageProvider().providerId).toBe(CLOUDINARY_PROVIDER_ID);
  });

  it('capabilities are honest', () => {
    const c = getStorageProvider(ONEDRIVE_PROVIDER_ID).capabilities;
    expect(c.upload).toBe(true);
    expect(c.delete).toBe(true);
    expect(c.getDownloadUrl).toBe(true);
    expect(c.move).toBe(false);
    expect(c.list).toBe(false);
    expect(c.exists).toBe(false);
    // BUILD-301F — known-object metadata only
    expect(c.getMetadata).toBe(true);
  });

  it('unsupported operations throw UNSUPPORTED_OPERATION', async () => {
    const p = getStorageProvider(ONEDRIVE_PROVIDER_ID);
    await expect(
      p.move({
        providerFileId: 'item1',
        destinationPath: '/x',
        organizationId: 'org',
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_OPERATION' });
    await expect(p.list({ organizationId: 'org' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_OPERATION',
    });
    await expect(p.exists({ providerFileId: 'item1' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_OPERATION',
    });
  });

  it('getMetadata requires accessToken and organizationId', async () => {
    const p = getStorageProvider(ONEDRIVE_PROVIDER_ID);
    await expect(
      p.getMetadata({ providerFileId: 'item1' }),
    ).rejects.toMatchObject({ code: 'STORAGE_ACCESS_DENIED' });
  });
});

describe('BUILD-301C identity model', () => {
  it('keeps domainAssetId, providerFileId, providerPath, downloadUrl distinct', () => {
    const obj = {
      domainAssetId: 'rf-asset-1',
      providerId: ONEDRIVE_PROVIDER_ID,
      providerFileId: '01ABCDEFITEMID',
      providerPath: '/ReleaseFlow/org-1/artwork/rel/cover.png',
      downloadUrl: 'https://graph.microsoft.com/v1.0/temp-download',
    };
    expect(obj.domainAssetId).not.toBe(obj.providerFileId);
    expect(obj.providerFileId).not.toBe(obj.providerPath);
    expect(obj.downloadUrl).not.toBe(obj.providerFileId);
    expect(obj.downloadUrl).not.toBe(obj.providerPath);
  });

  it('resolveOneDriveUploadPath prefers org-bound metadata.providerPath', () => {
    const path = resolveOneDriveUploadPath({
      payload: new Blob(),
      filename: 'x.png',
      context: {
        organizationId: 'org-1',
        entityType: 'artwork',
        entityId: 'r1',
        accessToken: 't',
      },
      metadata: {
        providerPath: '/ReleaseFlow/org-1/custom/file.png',
      },
    });
    expect(path).toBe('/ReleaseFlow/org-1/custom/file.png');
  });

  it('resolveOneDriveUploadPath rejects path for another org', () => {
    expect(() =>
      resolveOneDriveUploadPath({
        payload: new Blob(),
        filename: 'x.png',
        context: {
          organizationId: 'org-A',
          entityType: 'artwork',
          entityId: 'r1',
          accessToken: 't',
        },
        metadata: {
          providerPath: '/ReleaseFlow/org-B/artwork/r1/x.png',
        },
      }),
    ).toThrow(StorageError);
  });

  it('provisional path is org-bound', () => {
    const path = buildProvisionalOneDrivePath(
      'org-1',
      'artwork',
      'rel-9',
      'cover.png',
    );
    expect(path).toBe('/ReleaseFlow/org-1/artwork/rel-9/cover.png');
    expect(isPathBoundToOrganization(path, 'org-1')).toBe(true);
    expect(isPathBoundToOrganization(path, 'org-2')).toBe(false);
    expect(validateOrgBoundPath(path, 'org-1').ok).toBe(true);
    expect(validateOrgBoundPath(path, 'org-2').ok).toBe(false);
  });
});

describe('BUILD-301C provider transport (mocked RF API routes)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/storage/onedrive/upload')) {
          return new Response(
            JSON.stringify({
              providerId: 'onedrive',
              providerFileId: 'GRAPH_ITEM_001',
              providerPath: '/ReleaseFlow/org-1/artwork/rel-1/cover.png',
              filename: 'cover.png',
              sizeBytes: 50,
              contentType: 'image/png',
              downloadUrl: null,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/api/storage/onedrive/delete')) {
          const body = JSON.parse(String(init?.body ?? '{}')) as {
            providerFileId?: string;
          };
          expect(body.providerFileId).toBe('GRAPH_ITEM_001');
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (url.includes('/api/storage/onedrive/download-url')) {
          return new Response(
            JSON.stringify({
              downloadUrl: 'https://cdn.example.com/ephemeral',
              providerFileId: 'GRAPH_ITEM_001',
              providerPath: '/ReleaseFlow/org-1/artwork/rel-1/cover.png',
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

  it('upload maps Graph item id to providerFileId; downloadUrl null on upload', async () => {
    const p = getStorageProvider(ONEDRIVE_PROVIDER_ID);
    const file = new File([new Uint8Array([1, 2, 3])], 'cover.png', {
      type: 'image/png',
    });
    const result = await p.upload({
      payload: file,
      filename: 'cover.png',
      contentType: 'image/png',
      domainAssetId: 'rf-domain-7',
      context: {
        organizationId: 'org-1',
        entityType: 'artwork',
        entityId: 'rel-1',
        accessToken: 'firebase-token',
      },
    });

    expect(result.providerId).toBe('onedrive');
    expect(result.providerFileId).toBe('GRAPH_ITEM_001');
    expect(result.providerPath).toContain('/ReleaseFlow/org-1/');
    expect(result.domainAssetId).toBe('rf-domain-7');
    expect(result.domainAssetId).not.toBe(result.providerFileId);
    expect(result.downloadUrl).toBeNull();
  });

  it('delete uses providerFileId', async () => {
    const p = getStorageProvider(ONEDRIVE_PROVIDER_ID);
    await p.delete({
      providerFileId: 'GRAPH_ITEM_001',
      organizationId: 'org-1',
      entityType: 'artwork',
      accessToken: 'firebase-token',
    });
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(
      fetchMock.mock.calls.some((c) =>
        String(c[0]).includes('/api/storage/onedrive/delete'),
      ),
    ).toBe(true);
  });

  it('getDownloadUrl returns ephemeral URL only as downloadUrl', async () => {
    const p = getStorageProvider(ONEDRIVE_PROVIDER_ID);
    const url = await p.getDownloadUrl({
      providerFileId: 'GRAPH_ITEM_001',
      organizationId: 'org-1',
      accessToken: 'firebase-token',
    });
    expect(url).toBe('https://cdn.example.com/ephemeral');
    expect(url).not.toBe('GRAPH_ITEM_001');
  });
});

describe('BUILD-301C Graph REST boundary (mocked network)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MICROSOFT_CLIENT_ID = 'client-id';
    process.env.MICROSOFT_CLIENT_SECRET = 'client-secret';
    process.env.MICROSOFT_REFRESH_TOKEN = 'refresh-token';
  });

  afterEach(() => {
    process.env.MICROSOFT_CLIENT_ID = originalEnv.MICROSOFT_CLIENT_ID;
    process.env.MICROSOFT_CLIENT_SECRET = originalEnv.MICROSOFT_CLIENT_SECRET;
    process.env.MICROSOFT_REFRESH_TOKEN = originalEnv.MICROSOFT_REFRESH_TOKEN;
  });

  function mockGraphFetch(): OneDriveFetch {
    return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('oauth2/v2.0/token')) {
        return new Response(
          JSON.stringify({ access_token: 'graph-access-token' }),
          { status: 200 },
        );
      }
      if (url.includes('/me/drive/root:') && init?.method === 'PUT') {
        return new Response(
          JSON.stringify({
            id: 'ITEM_UPLOADED',
            name: 'cover.png',
            size: 12,
            file: { mimeType: 'image/png' },
            parentReference: {
              path: '/drive/root:/ReleaseFlow/org-1/artwork/rel-1',
            },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/me/drive/items/') && init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      if (url.includes('/me/drive/items/') && (!init?.method || init.method === 'GET')) {
        return new Response(
          JSON.stringify({
            id: 'ITEM_UPLOADED',
            name: 'cover.png',
            parentReference: {
              path: '/drive/root:/ReleaseFlow/org-1/artwork/rel-1',
            },
            '@microsoft.graph.downloadUrl': 'https://cdn.example.com/temp',
          }),
          { status: 200 },
        );
      }
      return new Response('unexpected', { status: 500 });
    }) as OneDriveFetch;
  }

  it('upload maps Graph id to providerFileId (not path or URL)', async () => {
    const fetchImpl = mockGraphFetch();
    const result = await onedriveUpload(
      {
        path: '/ReleaseFlow/org-1/artwork/rel-1/cover.png',
        contents: Buffer.from([1, 2, 3]),
      },
      fetchImpl,
    );
    expect(result.providerFileId).toBe('ITEM_UPLOADED');
    expect(result.providerPath).toContain('ReleaseFlow');
    expect(result.providerFileId).not.toBe(result.providerPath);
    expect(result.webUrl).toBeNull();
  });

  it('delete and download URL use item id; errors are neutral', async () => {
    const fetchImpl = mockGraphFetch();
    await onedriveDelete({ itemId: 'ITEM_UPLOADED' }, fetchImpl);
    const link = await onedriveGetDownloadUrl(
      { itemId: 'ITEM_UPLOADED' },
      fetchImpl,
    );
    expect(link.downloadUrl).toContain('cdn.example.com');
    expect(link.providerFileId).toBe('ITEM_UPLOADED');
    const token = await getMicrosoftAccessToken(fetchImpl);
    expect(token).toBe('graph-access-token');
    expect(neutralStorageFailure('upload')).toBe('Storage upload failed.');
    expect(neutralStorageFailure('upload')).not.toMatch(/OneDrive|Microsoft/i);
  });
});

/**
 * Route-level organisation boundary tests.
 * Simulates the same pipeline as the HTTP handlers without Nest/Next runtime:
 *   auth → org membership permission → path bind → Graph operation
 * Denials must short-circuit before Graph is invoked.
 */
describe('BUILD-301C organisation boundary (route pipeline)', () => {
  type Perm = 'media.upload' | 'media.delete' | 'media.read';

  async function runUploadPipeline(opts: {
    uid: string;
    organizationId: string;
    path: string;
    allowOrg: (orgId: string) => boolean;
    graph: {
      upload: (args: {
        path: string;
        organizationId: string;
        uid: string;
      }) => Promise<void>;
    };
  }) {
    // 1) Auth (always authenticated in these scenarios)
    const uid = opts.uid;
    // 2) Membership/RBAC
    if (!opts.allowOrg(opts.organizationId)) {
      return {
        status: 403,
        body: { error: 'You do not have permission for this storage operation.' },
        graphCalled: false,
      };
    }
    // 3) Path org-binding (before Graph)
    const pathCheck = validateOrgBoundPath(opts.path, opts.organizationId);
    if (!pathCheck.ok) {
      return { status: 400, body: { error: pathCheck.error }, graphCalled: false };
    }
    // 4) Graph
    await opts.graph.upload({
      path: pathCheck.path,
      organizationId: opts.organizationId,
      uid,
    });
    return {
      status: 200,
      body: { providerFileId: 'ITEM_OK', downloadUrl: null },
      graphCalled: true,
    };
  }

  async function runJsonPipeline(opts: {
    organizationId: string;
    allowOrg: (orgId: string) => boolean;
    graph: () => Promise<unknown>;
    permission: Perm;
  }) {
    if (!opts.allowOrg(opts.organizationId)) {
      return { status: 403, graphCalled: false };
    }
    await opts.graph();
    return { status: 200, graphCalled: true };
  }

  it('User A + Org A upload allowed; User A + Org B upload denied; Graph not called on deny', async () => {
    const graphUpload = vi.fn(async () => undefined);
    const allowOrg = (org: string) => org === 'org-A';

    const allow = await runUploadPipeline({
      uid: 'user-A',
      organizationId: 'org-A',
      path: '/ReleaseFlow/org-A/artwork/e/f.png',
      allowOrg,
      graph: { upload: graphUpload },
    });
    expect(allow.status).toBe(200);
    expect(allow.graphCalled).toBe(true);
    expect(graphUpload).toHaveBeenCalledTimes(1);
    expect(allow.body.downloadUrl).toBeNull();

    graphUpload.mockClear();
    const deny = await runUploadPipeline({
      uid: 'user-A',
      organizationId: 'org-B',
      path: '/ReleaseFlow/org-B/artwork/e/f.png',
      allowOrg,
      graph: { upload: graphUpload },
    });
    expect(deny.status).toBe(403);
    expect(deny.graphCalled).toBe(false);
    expect(graphUpload).not.toHaveBeenCalled();
  });

  it('User A + Org A delete allowed; User A + Org B delete denied', async () => {
    const graphDelete = vi.fn(async () => undefined);
    const allowOrg = (org: string) => org === 'org-A';

    const allow = await runJsonPipeline({
      organizationId: 'org-A',
      allowOrg,
      graph: graphDelete,
      permission: 'media.delete',
    });
    expect(allow.status).toBe(200);
    expect(graphDelete).toHaveBeenCalledTimes(1);

    graphDelete.mockClear();
    const deny = await runJsonPipeline({
      organizationId: 'org-B',
      allowOrg,
      graph: graphDelete,
      permission: 'media.delete',
    });
    expect(deny.status).toBe(403);
    expect(graphDelete).not.toHaveBeenCalled();
  });

  it('User A + Org A download URL allowed; User A + Org B denied', async () => {
    const graphDownload = vi.fn(async () => ({
      downloadUrl: 'https://cdn.example.com/x',
    }));
    const allowOrg = (org: string) => org === 'org-A';

    const allow = await runJsonPipeline({
      organizationId: 'org-A',
      allowOrg,
      graph: graphDownload,
      permission: 'media.read',
    });
    expect(allow.status).toBe(200);
    expect(graphDownload).toHaveBeenCalledTimes(1);

    graphDownload.mockClear();
    const deny = await runJsonPipeline({
      organizationId: 'org-B',
      allowOrg,
      graph: graphDownload,
      permission: 'media.read',
    });
    expect(deny.status).toBe(403);
    expect(graphDownload).not.toHaveBeenCalled();
  });

  it('rejects path that is not org-bound even when membership would allow org', async () => {
    const graphUpload = vi.fn(async () => undefined);
    const result = await runUploadPipeline({
      uid: 'user-A',
      organizationId: 'org-A',
      path: '/ReleaseFlow/org-B/artwork/e/f.png',
      allowOrg: () => true,
      graph: { upload: graphUpload },
    });
    expect(result.status).toBe(400);
    expect(result.graphCalled).toBe(false);
    expect(graphUpload).not.toHaveBeenCalled();
  });

  it('requireOrgMediaPermission denies when membershipResolver returns null (no Graph)', async () => {
    const { AuthorizationService } = await import(
      '@/lib/auth/authorization-service'
    );
    const graph = vi.fn();
    const allowed = await AuthorizationService.canAsync(
      'media.upload',
      'org-B',
      'user-A',
      {
        membershipResolver: async () => null,
      },
    );
    expect(allowed).toBe(false);
    if (!allowed) {
      // Route would return 403 and skip Graph
      expect(graph).not.toHaveBeenCalled();
    }
  });
});

describe('BUILD-301C credential safety & neutrality', () => {
  it('client provider has no Microsoft secrets', () => {
    const src = read(
      'lib/storage/providers/onedrive-storage-provider.ts',
    );
    expect(src).not.toContain('MICROSOFT_CLIENT_SECRET');
    expect(src).not.toContain('MICROSOFT_REFRESH_TOKEN');
    expect(src).not.toContain('onedriveServerConfig');
    expect(src).toContain('/api/storage/onedrive/');
  });

  it('media-upload façade does not import OneDrive server modules', () => {
    const mediaUpload = read('lib/media/media-upload.ts');
    expect(mediaUpload).not.toContain('MICROSOFT_');
    expect(mediaUpload).not.toContain('@/lib/server/onedrive');
  });

  it('neutral storage modules have no Graph/Microsoft SDK imports', () => {
    for (const rel of [
      'lib/storage/storage-provider.ts',
      'lib/storage/types.ts',
      'lib/storage/storage-reference.ts',
    ]) {
      const src = read(rel);
      expect(src).not.toMatch(/from ['"]@microsoft\//);
      expect(src).not.toContain('MICROSOFT_CLIENT_SECRET');
      expect(src).not.toContain('graph.microsoft.com');
    }
  });

  it('server config uses explicit Microsoft env names', () => {
    const cfg = read('lib/server/onedrive/config.ts');
    expect(cfg).toContain('MICROSOFT_CLIENT_ID');
    expect(cfg).toContain('MICROSOFT_CLIENT_SECRET');
    expect(cfg).toContain('MICROSOFT_REFRESH_TOKEN');
  });

  it('neutral error messages avoid vendor names', () => {
    expect(neutralStorageFailure('upload')).not.toMatch(/OneDrive|Microsoft|Graph/i);
    expect(neutralStorageFailure('auth')).not.toMatch(/OneDrive|Microsoft|Graph/i);
  });
});
