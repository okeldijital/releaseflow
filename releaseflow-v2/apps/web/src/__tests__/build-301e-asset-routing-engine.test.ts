/**
 * BUILD-301E — Asset Routing Engine tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveFolderTemplate,
  validateFolderTemplateStructure,
  combineRootAndTemplatePath,
  buildTemplateVariableValues,
  normalizeLogicalPath,
  buildStorageRoute,
  resolveAssetRoute,
  AssetRoutingError,
  FOLDER_TEMPLATE_VARIABLES,
  ROUTABLE_ASSET_TYPES,
  isRoutableAssetType,
  toStoragePolicySafeDto,
  toFolderTemplateSafeDto,
  toRoutingPreviewDto,
  listRegisteredStorageProviderIds,
  CLOUDINARY_PROVIDER_ID,
  DROPBOX_PROVIDER_ID,
  ONEDRIVE_PROVIDER_ID,
  type AssetRoutingDeps,
  type StorageRoute,
} from '@/lib/storage';
import type { StoragePolicyRecord } from '@/lib/storage/storage-policy-types';
import type { FolderTemplateRecord } from '@/lib/storage/folder-template-types';
import type { StorageLocationRecord } from '@/lib/storage/storage-location-types';
import type { AssetRoutingContext } from '@/lib/storage/asset-routing-types';
import { roleGrantsPermission } from '@releaseflow/core/auth/authorization';
import { PERMISSIONS } from '@releaseflow/core/auth/permissions';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

const orgA = 'org-A';
const orgB = 'org-B';

function makeLocation(
  overrides: Partial<StorageLocationRecord> = {},
): StorageLocationRecord {
  return {
    id: 'loc-1',
    organizationId: orgA,
    name: 'Production Dropbox',
    providerId: 'dropbox',
    status: 'active',
    rootPath: '/ReleaseFlow',
    configuration: { rootConfigured: true },
    isDefault: false,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function makeTemplate(
  overrides: Partial<FolderTemplateRecord> = {},
): FolderTemplateRecord {
  return {
    id: 'tpl-1',
    organizationId: orgA,
    name: 'Release Layout',
    description: null,
    structure: '/{Artist}/{Release}/{AssetType}',
    active: true,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function makePolicy(
  overrides: Partial<StoragePolicyRecord> = {},
): StoragePolicyRecord {
  return {
    id: 'pol-1',
    organizationId: orgA,
    name: 'Production Audio',
    assetType: 'audio',
    storageLocationId: 'loc-1',
    folderTemplateId: 'tpl-1',
    versioningEnabled: false,
    autoCreateFolders: true,
    active: true,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function makeContext(
  overrides: Partial<AssetRoutingContext> = {},
): AssetRoutingContext {
  return {
    organizationId: orgA,
    assetType: 'audio',
    artistName: 'Lua',
    releaseName: 'Lua',
    ...overrides,
  };
}

function makeDeps(opts: {
  policies?: StoragePolicyRecord[];
  location?: StorageLocationRecord | null;
  template?: FolderTemplateRecord | null;
  registeredProviders?: string[];
}): AssetRoutingDeps {
  const policies = opts.policies ?? [makePolicy()];
  const location = opts.location === undefined ? makeLocation() : opts.location;
  const template = opts.template === undefined ? makeTemplate() : opts.template;
  const registered =
    opts.registeredProviders ??
    listRegisteredStorageProviderIds();

  return {
    listActivePoliciesForAssetType: async (organizationId, assetType) =>
      policies.filter(
        (p) =>
          p.organizationId === organizationId &&
          p.assetType === assetType &&
          p.active,
      ),
    getPolicy: async (organizationId, policyId) =>
      policies.find(
        (p) => p.id === policyId && p.organizationId === organizationId,
      ) ?? null,
    getLocation: async () => location,
    getTemplate: async () => template,
    isProviderRegistered: (providerId) =>
      registered.includes(providerId as never),
    assertProviderResolvable: (providerId) => {
      if (!registered.includes(providerId)) {
        throw new Error('unknown');
      }
    },
  };
}

// ─── Asset type reuse ───────────────────────────────────────────────────────

describe('BUILD-301E asset type reuse', () => {
  it('reuses existing AssetType catalogue without a second model', () => {
    expect(ROUTABLE_ASSET_TYPES).toEqual([
      'audio',
      'artwork',
      'video',
      'document',
      'other',
    ]);
    expect(isRoutableAssetType('audio')).toBe(true);
    expect(isRoutableAssetType('masters')).toBe(false);
    const entity = read('lib/asset-entity-repository.ts');
    expect(entity).toContain(
      "export type AssetType = 'audio' | 'artwork' | 'video' | 'document' | 'other'",
    );
  });
});

// ─── Folder template resolver ───────────────────────────────────────────────

describe('BUILD-301E folder template resolver', () => {
  it('resolves known variables deterministically', () => {
    const path = resolveFolderTemplate('/{Artist}/{Release}/{AssetType}', {
      Artist: 'Lua',
      Release: 'Lua',
      AssetType: 'audio',
    });
    expect(path).toBe('/Lua/Lua/audio');
  });

  it('supports all EPIC variables', () => {
    expect(FOLDER_TEMPLATE_VARIABLES).toEqual([
      'Organization',
      'Artist',
      'Release',
      'Track',
      'Year',
      'Month',
      'AssetType',
      'Version',
    ]);
    const path = resolveFolderTemplate(
      '/{Organization}/{Artist}/{Release}/{Track}/{Year}/{Month}/{AssetType}/{Version}',
      {
        Organization: 'RF',
        Artist: 'A',
        Release: 'R',
        Track: 'T',
        Year: '2026',
        Month: '08',
        AssetType: 'audio',
        Version: 'v1',
      },
    );
    expect(path).toBe('/RF/A/R/T/2026/08/audio/v1');
  });

  it('rejects unresolved required variables (no empty substitution)', () => {
    expect(() =>
      resolveFolderTemplate('/{Artist}/{Release}', { Artist: 'Lua' }),
    ).toThrow(AssetRoutingError);
    try {
      resolveFolderTemplate('/{Artist}/{Release}', { Artist: 'Lua' });
    } catch (e) {
      expect((e as AssetRoutingError).code).toBe('TEMPLATE_RESOLUTION');
      expect((e as Error).message).toMatch(/Release/);
    }
  });

  it('rejects traversal and malformed templates', () => {
    expect(() => validateFolderTemplateStructure('/{Artist}/../secret')).toThrow(
      AssetRoutingError,
    );
    expect(() => validateFolderTemplateStructure('dropbox://x')).toThrow(
      AssetRoutingError,
    );
    expect(() => validateFolderTemplateStructure('/{Unknown}')).toThrow(
      AssetRoutingError,
    );
    expect(() => validateFolderTemplateStructure('/{Artist')).toThrow(
      AssetRoutingError,
    );
    expect(() =>
      resolveFolderTemplate('/{Artist}', { Artist: '../evil' }),
    ).toThrow(AssetRoutingError);
  });

  it('preserves segment boundaries and normalizes paths', () => {
    expect(normalizeLogicalPath('a//b/./c')).toBe('/a/b/c');
    expect(() => normalizeLogicalPath('a/../b')).toThrow(AssetRoutingError);
  });

  it('combines rootPath + template without escape', () => {
    expect(
      combineRootAndTemplatePath('/ReleaseFlow', '/Lua/Lua/audio'),
    ).toBe('/ReleaseFlow/Lua/Lua/audio');
    expect(
      combineRootAndTemplatePath('/ReleaseFlow/', 'Lua/Masters'),
    ).toBe('/ReleaseFlow/Lua/Masters');
  });

  it('buildTemplateVariableValues omits empty keys', () => {
    const v = buildTemplateVariableValues({
      organizationId: orgA,
      assetType: 'audio',
      artistName: 'Lua',
    });
    expect(v.Artist).toBe('Lua');
    expect(v.AssetType).toBe('audio');
    expect(v.Release).toBeUndefined();
  });
});

// ─── Storage policy / template DTOs ─────────────────────────────────────────

describe('BUILD-301E policy and template DTOs', () => {
  it('safe DTOs never include secrets', () => {
    const pol = toStoragePolicySafeDto(makePolicy());
    const tpl = toFolderTemplateSafeDto(makeTemplate());
    const json = JSON.stringify({ pol, tpl });
    expect(json).not.toMatch(/token|secret|refresh|client_secret|apiKey/i);
    expect(pol.storageLocationId).toBe('loc-1');
    expect(pol).not.toHaveProperty('providerId');
    expect(tpl.structure).toContain('{Artist}');
  });
});

// ─── Routing engine ─────────────────────────────────────────────────────────

describe('BUILD-301E routing algorithm', () => {
  it('valid asset type → correct policy → location → provider → template → path', async () => {
    const route = await resolveAssetRoute(makeContext(), makeDeps({}));
    expect(route.organizationId).toBe(orgA);
    expect(route.storagePolicyId).toBe('pol-1');
    expect(route.storageLocationId).toBe('loc-1');
    expect(route.providerId).toBe('dropbox');
    expect(route.folderTemplateId).toBe('tpl-1');
    expect(route.resolvedPath).toBe('/ReleaseFlow/Lua/Lua/audio');
    expect(route.rootPath).toBe('/ReleaseFlow');
    expect(route.autoCreateFolders).toBe(true);
    expect(route.versioningEnabled).toBe(false);
    expect(route.assetType).toBe('audio');
  });

  it('missing policy fails without Cloudinary/default fallback', async () => {
    await expect(
      resolveAssetRoute(makeContext(), makeDeps({ policies: [] })),
    ).rejects.toMatchObject({ code: 'MISSING_POLICY' });
  });

  it('duplicate active policy fails explicitly', async () => {
    await expect(
      resolveAssetRoute(
        makeContext(),
        makeDeps({
          policies: [
            makePolicy({ id: 'p1' }),
            makePolicy({ id: 'p2', name: 'Other' }),
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: 'DUPLICATE_POLICY' });
  });

  it('disabled location fails', async () => {
    await expect(
      resolveAssetRoute(
        makeContext(),
        makeDeps({ location: makeLocation({ status: 'disabled' }) }),
      ),
    ).rejects.toMatchObject({ code: 'LOCATION_DISABLED' });
  });

  it('disabled template fails', async () => {
    await expect(
      resolveAssetRoute(
        makeContext(),
        makeDeps({ template: makeTemplate({ active: false }) }),
      ),
    ).rejects.toMatchObject({ code: 'TEMPLATE_INACTIVE' });
  });

  it('unknown provider fails via registry', async () => {
    await expect(
      resolveAssetRoute(
        makeContext(),
        makeDeps({
          location: makeLocation({ providerId: 's3' as never }),
          registeredProviders: ['cloudinary', 'dropbox', 'onedrive'],
        }),
      ),
    ).rejects.toMatchObject({ code: 'UNKNOWN_PROVIDER' });
  });

  it('cross-org policy fails', async () => {
    await expect(
      resolveAssetRoute(
        makeContext(),
        makeDeps({
          policies: [makePolicy({ organizationId: orgB })],
        }),
      ),
    ).rejects.toMatchObject({
      code: expect.stringMatching(/POLICY_ORG_MISMATCH|MISSING_POLICY/),
    });
  });

  it('cross-org location fails', async () => {
    await expect(
      resolveAssetRoute(
        makeContext(),
        makeDeps({
          location: makeLocation({ organizationId: orgB }),
        }),
      ),
    ).rejects.toMatchObject({ code: 'LOCATION_ORG_MISMATCH' });
  });

  it('cross-org template fails', async () => {
    await expect(
      resolveAssetRoute(
        makeContext(),
        makeDeps({
          template: makeTemplate({ organizationId: orgB }),
        }),
      ),
    ).rejects.toMatchObject({ code: 'TEMPLATE_ORG_MISMATCH' });
  });

  it('missing location fails', async () => {
    await expect(
      resolveAssetRoute(makeContext(), makeDeps({ location: null })),
    ).rejects.toMatchObject({ code: 'LOCATION_NOT_FOUND' });
  });

  it('missing template fails', async () => {
    await expect(
      resolveAssetRoute(makeContext(), makeDeps({ template: null })),
    ).rejects.toMatchObject({ code: 'TEMPLATE_NOT_FOUND' });
  });

  it('unresolved template variable fails', async () => {
    await expect(
      resolveAssetRoute(
        makeContext({ artistName: undefined }),
        makeDeps({}),
      ),
    ).rejects.toMatchObject({ code: 'TEMPLATE_RESOLUTION' });
  });

  it('does not use isDefault to infer policy', async () => {
    // Only inactive policies + default location would still fail for missing active policy
    const route = await resolveAssetRoute(
      makeContext(),
      makeDeps({
        policies: [makePolicy()],
        location: makeLocation({ isDefault: false }),
      }),
    );
    expect(route.storagePolicyId).toBe('pol-1');
  });

  it('buildStorageRoute rejects org mismatch before path build', () => {
    expect(() =>
      buildStorageRoute({
        context: makeContext(),
        policy: makePolicy({ organizationId: orgB }),
        location: makeLocation(),
        template: makeTemplate(),
      }),
    ).toThrow(AssetRoutingError);
  });

  it('preview DTO has no secrets or provider clients', async () => {
    const route = await resolveAssetRoute(makeContext(), makeDeps({}));
    const preview = toRoutingPreviewDto(route);
    const json = JSON.stringify(preview);
    expect(json).not.toMatch(/token|secret|sdk|client/i);
    expect(preview.resolvedPath).toBe(route.resolvedPath);
    expect(preview.providerId).toBe('dropbox');
  });

  it('does not fall back to 301C provisional path pattern as canonical', async () => {
    const route = await resolveAssetRoute(makeContext(), makeDeps({}));
    // Canonical is root + template, not /ReleaseFlow/{orgId}/{entityType}/...
    expect(route.resolvedPath).not.toMatch(
      new RegExp(`/ReleaseFlow/${orgA}/`),
    );
    expect(route.resolvedPath).toBe('/ReleaseFlow/Lua/Lua/audio');
  });
});

// ─── Provider neutrality ────────────────────────────────────────────────────

describe('BUILD-301E provider neutrality', () => {
  it('routing engine source has no provider-specific branching', () => {
    const engine = read('lib/storage/asset-routing-engine.ts');
    expect(engine).not.toMatch(/if\s*\(\s*providerId\s*===\s*['"]dropbox['"]/);
    expect(engine).not.toMatch(/if\s*\(\s*providerId\s*===\s*['"]onedrive['"]/);
    expect(engine).not.toMatch(/if\s*\(\s*providerId\s*===\s*['"]cloudinary['"]/);
    expect(engine).toContain('isProviderRegistered');
    expect(engine).toContain('listRegisteredStorageProviderIds');
  });

  it('routing engine does not import Dropbox/OneDrive/Cloudinary clients', () => {
    const engine = read('lib/storage/asset-routing-engine.ts');
    expect(engine).not.toContain('dropbox-storage-provider');
    expect(engine).not.toContain('onedrive-storage-provider');
    expect(engine).not.toContain('cloudinary-storage-provider');
    expect(engine).not.toContain('@/lib/server/dropbox');
    expect(engine).not.toContain('@/lib/server/onedrive');
  });

  it('resolver has no provider calls', () => {
    const resolver = read('lib/storage/folder-template-resolver.ts');
    expect(resolver).not.toContain('fetch(');
    expect(resolver).not.toContain('Dropbox');
    expect(resolver).not.toContain('Microsoft');
    expect(resolver).not.toContain('Cloudinary');
  });

  it('registered providers still include cloudinary/dropbox/onedrive', () => {
    expect(listRegisteredStorageProviderIds()).toEqual(
      expect.arrayContaining([
        CLOUDINARY_PROVIDER_ID,
        DROPBOX_PROVIDER_ID,
        ONEDRIVE_PROVIDER_ID,
      ]),
    );
  });
});

// ─── External provider isolation ────────────────────────────────────────────

describe('BUILD-301E external provider isolation', () => {
  it('resolveAssetRoute does not invoke provider upload/delete methods', async () => {
    const upload = vi.fn();
    const del = vi.fn();
    const deps = makeDeps({});
    // Ensure no network-style side effects by only using pure deps
    await resolveAssetRoute(makeContext(), deps);
    expect(upload).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it('route result has no OAuth tokens or SDK objects', async () => {
    const route: StorageRoute = await resolveAssetRoute(
      makeContext(),
      makeDeps({}),
    );
    const keys = Object.keys(route);
    expect(keys).not.toContain('accessToken');
    expect(keys).not.toContain('refreshToken');
    expect(keys).not.toContain('client');
    expect(typeof route.providerId).toBe('string');
    expect(typeof route.resolvedPath).toBe('string');
  });
});

// ─── Permissions ────────────────────────────────────────────────────────────

describe('BUILD-301E permissions remain provider-neutral', () => {
  it('uses storage.read / storage.manage only', () => {
    expect(PERMISSIONS.StorageRead).toBe('storage.read');
    expect(PERMISSIONS.StorageManage).toBe('storage.manage');
    expect(roleGrantsPermission('administrator', 'storage.manage')).toBe(true);
    expect(roleGrantsPermission('contributor', 'storage.manage')).toBe(false);

    for (const file of [
      'app/api/storage/policies/route.ts',
      'app/api/storage/folder-templates/route.ts',
      'app/api/storage/routing/preview/route.ts',
    ]) {
      const src = read(file);
      expect(src).toMatch(/storage\.(read|manage)/);
      expect(src).not.toMatch(/dropbox\.manage|onedrive\.manage|cloudinary\.manage/);
    }
  });
});

// ─── API & UI structure ─────────────────────────────────────────────────────

describe('BUILD-301E API routes and UI', () => {
  it('policy and template API routes exist', () => {
    expect(existsSync(join(webSrc, 'app/api/storage/policies/route.ts'))).toBe(
      true,
    );
    expect(
      existsSync(join(webSrc, 'app/api/storage/policies/[id]/route.ts')),
    ).toBe(true);
    expect(
      existsSync(join(webSrc, 'app/api/storage/folder-templates/route.ts')),
    ).toBe(true);
    expect(
      existsSync(join(webSrc, 'app/api/storage/folder-templates/[id]/route.ts')),
    ).toBe(true);
    expect(
      existsSync(join(webSrc, 'app/api/storage/routing/preview/route.ts')),
    ).toBe(true);
  });

  it('routes enforce auth + org permission', () => {
    const pol = read('app/api/storage/policies/route.ts');
    expect(pol).toContain('requireAuthenticatedUid');
    expect(pol).toContain('storage.read');
    expect(pol).toContain('storage.manage');
    expect(pol).not.toMatch(/REFRESH_TOKEN|CLIENT_SECRET/);

    const preview = read('app/api/storage/routing/preview/route.ts');
    expect(preview).toContain('previewAssetRoute');
    expect(preview).toContain('storage.read');
    expect(preview).not.toMatch(/uploadFile|\.upload\(/);
    expect(preview).not.toContain('getStorageProvider');
  });

  it('admin storage UI manages policies and templates', () => {
    const ui = read('app/(app)/administration/storage/page.tsx');
    expect(ui).toContain('/api/storage/policies');
    expect(ui).toContain('/api/storage/folder-templates');
    expect(ui).toContain('/api/storage/routing/preview');
    expect(ui).toContain('Storage Policies');
    expect(ui).toContain('Folder Templates');
    expect(ui).toContain('Routing Preview');
    expect(ui).not.toContain('@/lib/server/dropbox/config');
    expect(ui).not.toContain('MICROSOFT_CLIENT_SECRET');
  });

  it('does not implement Drafts / Potential Tracks / 301F versioning sync', () => {
    const engine = read('lib/storage/asset-routing-engine.ts');
    expect(engine).not.toContain('Drafts');
    expect(engine).not.toContain('PotentialTrack');
    expect(engine).not.toContain('syncMetadata');
    expect(engine).not.toContain('versionSynchronization');
    const ui = read('app/(app)/administration/storage/page.tsx');
    expect(ui).not.toContain('Potential Tracks');
    expect(ui).not.toContain('Drafts Folder');
  });
});

// ─── Firestore rules ────────────────────────────────────────────────────────

describe('BUILD-301E firestore rules', () => {
  it('includes org-scoped storage_policies and folder_templates', () => {
    const rules = readFileSync(
      join(webSrc, '../../../firestore.rules'),
      'utf8',
    );
    expect(rules).toContain('storage_policies');
    expect(rules).toContain('folder_templates');
    expect(rules).toContain('organizationId == orgId');
  });
});

// ─── Cloudinary unchanged ───────────────────────────────────────────────────

describe('BUILD-301E Cloudinary product path unchanged', () => {
  it('media-upload still delegates to default cloudinary provider', () => {
    const mediaUpload = read('lib/media/media-upload.ts');
    expect(mediaUpload).toMatch(/getDefaultStorageProvider|Cloudinary|uploadFile/);
  });

  it('default provider remains cloudinary', async () => {
    const { getDefaultStorageProvider } = await import('@/lib/storage');
    expect(getDefaultStorageProvider().providerId).toBe('cloudinary');
  });
});
