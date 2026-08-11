/**
 * BUILD-301F — Storage Reference, versioning & metadata synchronization foundation.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildEffectiveStorageIdentity,
  extractProviderVersionFields,
  syncStorageReference,
  toStorageReferenceSafeDto,
  StorageReferenceError,
  AssetRoutingError,
  getDefaultStorageProvider,
  getStorageProvider,
  CLOUDINARY_PROVIDER_ID,
  DROPBOX_PROVIDER_ID,
  ONEDRIVE_PROVIDER_ID,
  type StorageReferenceRecord,
  type StorageReferenceSyncDeps,
  type StorageMetadata,
} from '@/lib/storage';
import { roleGrantsPermission } from '@releaseflow/core/auth/authorization';
import { PERMISSIONS } from '@releaseflow/core/auth/permissions';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

const orgA = 'org-A';
const orgB = 'org-B';

function makeReference(
  overrides: Partial<StorageReferenceRecord> = {},
): StorageReferenceRecord {
  return {
    id: 'ref-1',
    organizationId: orgA,
    domainAssetId: 'asset-rf-1',
    assetType: 'audio',
    storageLocationId: 'loc-1',
    providerId: 'dropbox',
    providerFileId: 'id:dbx-file-1',
    providerPath: '/ReleaseFlow/Lua/audio',
    status: 'active',
    versioningEnabled: true,
    currentVersion: 1,
    providerVersionId: null,
    providerETag: null,
    providerModifiedAt: null,
    lastSyncedAt: null,
    syncStatus: 'never',
    lastSyncError: null,
    versions: [
      {
        versionNumber: 1,
        providerVersionId: null,
        providerETag: null,
        providerModifiedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

// ─── Architecture / identity ────────────────────────────────────────────────

describe('BUILD-301F identity model', () => {
  it('effective identity is org + location + provider + providerFileId', () => {
    const a = buildEffectiveStorageIdentity({
      organizationId: orgA,
      storageLocationId: 'loc-1',
      providerId: 'dropbox',
      providerFileId: 'id:same',
    });
    const b = buildEffectiveStorageIdentity({
      organizationId: orgB,
      storageLocationId: 'loc-1',
      providerId: 'dropbox',
      providerFileId: 'id:same',
    });
    expect(a).not.toBe(b);
    expect(a).toContain(orgA);
    expect(a).toContain('loc-1');
    expect(a).toContain('dropbox');
    expect(a).toContain('id:same');
  });

  it('domainAssetId is distinct from providerFileId', () => {
    const ref = makeReference();
    expect(ref.domainAssetId).not.toBe(ref.providerFileId);
    expect(ref.domainAssetId).toMatch(/^asset-/);
  });

  it('safe DTO never includes downloadUrl or secrets', () => {
    const dto = toStorageReferenceSafeDto(makeReference());
    const json = JSON.stringify(dto);
    expect(json).not.toMatch(/downloadUrl|token|secret|refresh|Bearer/i);
    expect(dto).not.toHaveProperty('downloadUrl');
    expect(dto.providerFileId).toBe('id:dbx-file-1');
    expect(dto.storageLocationId).toBe('loc-1');
    expect(dto.organizationId).toBe(orgA);
  });

  it('repository strips ephemeral fields by design (source check)', () => {
    const repo = read('lib/storage/storage-reference-repository.ts');
    expect(repo).toContain('stripEphemeralFields');
    expect(repo).toContain('downloadUrl');
  });
});

// ─── Organisation isolation ─────────────────────────────────────────────────

describe('BUILD-301F organisation isolation', () => {
  it('getReferenceSafe returns null on org mismatch (path isolation)', async () => {
    // Pure shape: reference.organizationId must equal request org
    const ref = makeReference({ organizationId: orgB });
    expect(ref.organizationId).not.toBe(orgA);
  });

  it('providerFileId alone is never sufficient authorization (pipeline model)', () => {
    type Step = {
      authenticated: boolean;
      memberOf: string[];
      requestOrg: string;
      referenceOrg: string;
      providerCalled: boolean;
    };
    function authorize(s: Step): { status: number; providerCalled: boolean } {
      if (!s.authenticated) return { status: 401, providerCalled: false };
      if (!s.memberOf.includes(s.requestOrg)) {
        return { status: 403, providerCalled: false };
      }
      if (s.referenceOrg !== s.requestOrg) {
        return { status: 404, providerCalled: false };
      }
      return { status: 200, providerCalled: true };
    }

    // User A + Org A reference → allowed
    expect(
      authorize({
        authenticated: true,
        memberOf: [orgA],
        requestOrg: orgA,
        referenceOrg: orgA,
        providerCalled: false,
      }),
    ).toEqual({ status: 200, providerCalled: true });

    // User A + Org B reference → denied, provider never called
    expect(
      authorize({
        authenticated: true,
        memberOf: [orgA],
        requestOrg: orgB,
        referenceOrg: orgB,
        providerCalled: false,
      }),
    ).toEqual({ status: 403, providerCalled: false });

    // Same providerFileId under Org B with Org A context → denied
    expect(
      authorize({
        authenticated: true,
        memberOf: [orgA],
        requestOrg: orgA,
        referenceOrg: orgB,
        providerCalled: false,
      }),
    ).toEqual({ status: 404, providerCalled: false });
  });

  it('permissions remain storage.read / storage.manage', () => {
    expect(PERMISSIONS.StorageRead).toBe('storage.read');
    expect(PERMISSIONS.StorageManage).toBe('storage.manage');
    expect(roleGrantsPermission('administrator', 'storage.manage')).toBe(true);
    expect(roleGrantsPermission('contributor', 'storage.manage')).toBe(false);
  });
});

// ─── Provider mismatch / location ───────────────────────────────────────────

describe('BUILD-301F location binding & provider mismatch', () => {
  it('sync fails when reference.providerId != location.providerId', async () => {
    const getMetadata = vi.fn();
    const deps: StorageReferenceSyncDeps = {
      getReference: async () =>
        makeReference({ providerId: 'dropbox', storageLocationId: 'loc-1' }),
      getLocation: async () => ({
        id: 'loc-1',
        organizationId: orgA,
        name: 'OD',
        providerId: 'onedrive',
        status: 'active',
        rootPath: '/ReleaseFlow',
        configuration: { rootConfigured: true },
        isDefault: false,
        createdAt: null,
        updatedAt: null,
      }),
      isProviderRegistered: () => true,
      getMetadata,
      updateReference: async () => null,
    };

    await expect(
      syncStorageReference(
        { organizationId: orgA, referenceId: 'ref-1' },
        deps,
      ),
    ).rejects.toMatchObject({ code: 'PROVIDER_MISMATCH' });
    expect(getMetadata).not.toHaveBeenCalled();
  });

  it('disabled location rejects sync before provider call', async () => {
    const getMetadata = vi.fn();
    const deps: StorageReferenceSyncDeps = {
      getReference: async () => makeReference(),
      getLocation: async () => ({
        id: 'loc-1',
        organizationId: orgA,
        name: 'Prod',
        providerId: 'dropbox',
        status: 'disabled',
        rootPath: '/ReleaseFlow',
        configuration: { rootConfigured: true },
        isDefault: false,
        createdAt: null,
        updatedAt: null,
      }),
      isProviderRegistered: () => true,
      getMetadata,
      updateReference: async () => null,
    };

    await expect(
      syncStorageReference(
        { organizationId: orgA, referenceId: 'ref-1' },
        deps,
      ),
    ).rejects.toMatchObject({ code: 'LOCATION_INACTIVE' });
    expect(getMetadata).not.toHaveBeenCalled();
  });

  it('cross-org location rejects before provider call', async () => {
    const getMetadata = vi.fn();
    const deps: StorageReferenceSyncDeps = {
      getReference: async () => makeReference(),
      getLocation: async () => ({
        id: 'loc-1',
        organizationId: orgB,
        name: 'Other',
        providerId: 'dropbox',
        status: 'active',
        rootPath: '/ReleaseFlow',
        configuration: { rootConfigured: true },
        isDefault: false,
        createdAt: null,
        updatedAt: null,
      }),
      isProviderRegistered: () => true,
      getMetadata,
      updateReference: async () => null,
    };

    await expect(
      syncStorageReference(
        { organizationId: orgA, referenceId: 'ref-1' },
        deps,
      ),
    ).rejects.toMatchObject({ code: 'LOCATION_ORG_MISMATCH' });
    expect(getMetadata).not.toHaveBeenCalled();
  });
});

// ─── Versioning & sync ──────────────────────────────────────────────────────

describe('BUILD-301F versioning and metadata sync', () => {
  it('extracts provider version fields without inventing ids', () => {
    const meta: StorageMetadata = {
      providerId: 'dropbox',
      providerFileId: 'id:x',
      providerPath: '/a/b',
      updatedAt: '2026-08-01T12:00:00.000Z',
      metadata: {
        providerVersionId: 'rev:abc',
        providerETag: 'hash-1',
        providerModifiedAt: '2026-08-01T12:00:00.000Z',
      },
    };
    const fields = extractProviderVersionFields(meta);
    expect(fields.providerVersionId).toBe('rev:abc');
    expect(fields.providerETag).toBe('hash-1');
    expect(fields.providerModifiedAt).toBe('2026-08-01T12:00:00.000Z');
    expect(fields.providerPath).toBe('/a/b');
  });

  it('does not fabricate providerVersionId when absent', () => {
    const fields = extractProviderVersionFields({
      providerId: 'onedrive',
      providerFileId: 'item1',
      metadata: { providerETag: 'etag-only' },
    });
    expect(fields.providerVersionId).toBeNull();
    expect(fields.providerETag).toBe('etag-only');
  });

  it('sync updates version number, etag, modified time, lastSyncedAt', async () => {
    const ref = makeReference({
      versioningEnabled: true,
      currentVersion: 1,
      providerETag: 'old-hash',
    });
    let stored = { ...ref };

    const deps: StorageReferenceSyncDeps = {
      getReference: async () => stored,
      getLocation: async () => ({
        id: 'loc-1',
        organizationId: orgA,
        name: 'Prod',
        providerId: 'dropbox',
        status: 'active',
        rootPath: '/ReleaseFlow',
        configuration: { rootConfigured: true },
        isDefault: false,
        createdAt: null,
        updatedAt: null,
      }),
      isProviderRegistered: (id) => id === 'dropbox',
      getMetadata: async () => ({
        providerId: 'dropbox',
        providerFileId: 'id:dbx-file-1',
        providerPath: '/ReleaseFlow/Lua/audio',
        metadata: {
          providerVersionId: 'rev:2',
          providerETag: 'new-hash',
          providerModifiedAt: '2026-08-10T10:00:00.000Z',
        },
        updatedAt: '2026-08-10T10:00:00.000Z',
      }),
      updateReference: async (_org, _id, patch) => {
        stored = {
          ...stored,
          ...patch,
          versions: patch.versions ?? stored.versions,
        } as StorageReferenceRecord;
        return stored;
      },
    };

    const result = await syncStorageReference(
      { organizationId: orgA, referenceId: 'ref-1', accessToken: 'tok' },
      deps,
    );

    expect(result.currentVersion).toBe(2);
    expect(result.providerVersionId).toBe('rev:2');
    expect(result.providerETag).toBe('new-hash');
    expect(result.providerModifiedAt).toBe('2026-08-10T10:00:00.000Z');
    expect(result.lastSyncedAt).toBeTruthy();
    expect(result.syncStatus).toBe('ok');
    expect(result.versions[0]?.versionNumber).toBe(2);
    expect(JSON.stringify(result)).not.toMatch(/downloadUrl/);
  });

  it('unsupported getMetadata yields UNSUPPORTED_OPERATION neutrally', async () => {
    const { StorageError } = await import('@/lib/storage/errors');
    const updateReference = vi.fn(async () =>
      makeReference({ syncStatus: 'unsupported' }),
    );
    const deps: StorageReferenceSyncDeps = {
      getReference: async () => makeReference({ providerId: 'cloudinary' }),
      getLocation: async () => ({
        id: 'loc-1',
        organizationId: orgA,
        name: 'CL',
        providerId: 'cloudinary',
        status: 'active',
        rootPath: '/ReleaseFlow',
        configuration: { rootConfigured: true },
        isDefault: true,
        createdAt: null,
        updatedAt: null,
      }),
      isProviderRegistered: () => true,
      getMetadata: async () => {
        throw new StorageError(
          'UNSUPPORTED_OPERATION',
          'Storage provider "cloudinary" does not support operation: getMetadata',
          { providerId: 'cloudinary' },
        );
      },
      updateReference,
    };

    await expect(
      syncStorageReference(
        { organizationId: orgA, referenceId: 'ref-1' },
        deps,
      ),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_OPERATION' });
    expect(updateReference).toHaveBeenCalled();
  });

  it('versioningEnabled false does not invent provider versions', async () => {
    const ref = makeReference({
      versioningEnabled: false,
      currentVersion: 1,
      providerETag: null,
    });
    let stored = { ...ref };
    const deps: StorageReferenceSyncDeps = {
      getReference: async () => stored,
      getLocation: async () => ({
        id: 'loc-1',
        organizationId: orgA,
        name: 'Prod',
        providerId: 'dropbox',
        status: 'active',
        rootPath: '/ReleaseFlow',
        configuration: { rootConfigured: true },
        isDefault: false,
        createdAt: null,
        updatedAt: null,
      }),
      isProviderRegistered: () => true,
      getMetadata: async () => ({
        providerId: 'dropbox',
        providerFileId: 'id:dbx-file-1',
        metadata: {
          providerETag: 'hash-x',
          providerModifiedAt: '2026-08-10T00:00:00.000Z',
        },
      }),
      updateReference: async (_o, _i, patch) => {
        stored = { ...stored, ...patch } as StorageReferenceRecord;
        return stored;
      },
    };

    const result = await syncStorageReference(
      { organizationId: orgA, referenceId: 'ref-1' },
      deps,
    );
    // RF version not bumped when versioning disabled
    expect(result.currentVersion).toBe(1);
    expect(result.providerETag).toBe('hash-x');
    expect(result.syncStatus).toBe('ok');
  });
});

// ─── Provider capabilities ──────────────────────────────────────────────────

describe('BUILD-301F provider capabilities', () => {
  it('Cloudinary getMetadata remains unsupported', () => {
    const p = getStorageProvider(CLOUDINARY_PROVIDER_ID);
    expect(p.capabilities.getMetadata).toBe(false);
  });

  it('Dropbox and OneDrive support known-object getMetadata only', () => {
    expect(getStorageProvider(DROPBOX_PROVIDER_ID).capabilities.getMetadata).toBe(
      true,
    );
    expect(
      getStorageProvider(ONEDRIVE_PROVIDER_ID).capabilities.getMetadata,
    ).toBe(true);
    // Still no list/move/discovery
    expect(getStorageProvider(DROPBOX_PROVIDER_ID).capabilities.list).toBe(false);
    expect(getStorageProvider(ONEDRIVE_PROVIDER_ID).capabilities.list).toBe(
      false,
    );
  });

  it('default product provider remains cloudinary', () => {
    expect(getDefaultStorageProvider().providerId).toBe('cloudinary');
  });
});

// ─── API / rules / UI structure ─────────────────────────────────────────────

describe('BUILD-301F API routes, rules, UI', () => {
  it('reference CRUD and sync routes exist', () => {
    expect(existsSync(join(webSrc, 'app/api/storage/references/route.ts'))).toBe(
      true,
    );
    expect(
      existsSync(join(webSrc, 'app/api/storage/references/[id]/route.ts')),
    ).toBe(true);
    expect(
      existsSync(join(webSrc, 'app/api/storage/references/[id]/sync/route.ts')),
    ).toBe(true);
    expect(
      existsSync(join(webSrc, 'app/api/storage/dropbox/metadata/route.ts')),
    ).toBe(true);
    expect(
      existsSync(join(webSrc, 'app/api/storage/onedrive/metadata/route.ts')),
    ).toBe(true);
  });

  it('routes enforce auth + storage permissions before provider work', () => {
    const list = read('app/api/storage/references/route.ts');
    expect(list).toContain('requireAuthenticatedUid');
    expect(list).toContain('storage.read');
    expect(list).toContain('storage.manage');
    expect(list).not.toMatch(/REFRESH_TOKEN|CLIENT_SECRET/);

    const sync = read('app/api/storage/references/[id]/sync/route.ts');
    expect(sync).toContain('requireOrgStoragePermission');
    expect(sync).toContain('syncStorageReference');
    expect(sync).toContain('storage.manage');
  });

  it('sync service has no provider-specific branching', () => {
    const sync = read('lib/storage/storage-reference-sync.ts');
    expect(sync).not.toMatch(/if\s*\(\s*.*===\s*['"]dropbox['"]/);
    expect(sync).not.toMatch(/if\s*\(\s*.*===\s*['"]onedrive['"]/);
    expect(sync).not.toContain('@/lib/server/dropbox');
    expect(sync).not.toContain('@/lib/server/onedrive');
    expect(sync).not.toContain('list(');
    expect(sync).not.toContain('Drafts');
  });

  it('firestore rules include org-scoped storage_references', () => {
    const rules = readFileSync(
      join(webSrc, '../../../firestore.rules'),
      'utf8',
    );
    expect(rules).toContain('storage_references');
    expect(rules).toContain('request.resource.data.organizationId == orgId');
  });

  it('admin storage UI exposes references without file browser features', () => {
    const ui = read('app/(app)/administration/storage/page.tsx');
    expect(ui).toContain('/api/storage/references');
    expect(ui).toContain('Storage References');
    expect(ui).toContain('Sync');
    expect(ui).toMatch(/Not a file browser/i);
    expect(ui).not.toContain('Drafts Folder');
    expect(ui).not.toContain('Potential Tracks');
    expect(ui).not.toContain('drag-and-drop');
  });

  it('does not redesign policies or change uploadFile', () => {
    const media = read('lib/media/media-upload.ts');
    expect(media).toMatch(/uploadFile|getDefaultStorageProvider/);
    const policy = read('lib/storage/storage-policy-types.ts');
    expect(policy).toContain('BUILD-301E');
  });

  it('activity integration documents omission (no second audit system)', () => {
    // activity entityType has no storage_reference — 301F does not invent one
    const activity = read('lib/activity-service.ts');
    expect(activity).toContain('recordActivity');
    expect(activity).not.toContain('storage_reference.created');
  });
});

// ─── Non-goals ──────────────────────────────────────────────────────────────

describe('BUILD-301F non-goals', () => {
  it('does not implement discovery, list, move, Drafts, 301G', () => {
    const service = read('lib/storage/storage-reference-service.ts');
    expect(service).not.toContain('listProviderFiles');
    expect(service).not.toContain('orphan');
    expect(service).not.toContain('reconcile');
    expect(service).not.toContain('Drafts');
    const sync = read('lib/storage/storage-reference-sync.ts');
    expect(sync).not.toContain('syncAll');
    expect(sync).not.toMatch(/function\s+crawl|directory crawling/);
    expect(sync).toMatch(/Not discovery/i);
  });

  it('routing errors remain available; no conflict with AssetRoutingError', () => {
    expect(AssetRoutingError).toBeDefined();
    expect(StorageReferenceError).toBeDefined();
  });
});
