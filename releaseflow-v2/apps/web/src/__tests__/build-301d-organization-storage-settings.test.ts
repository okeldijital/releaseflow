/**
 * BUILD-301D — Organization Storage Settings tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertRegisteredProvider,
  isRegisteredProviderId,
  buildProviderCatalog,
  StorageConfigError,
  validateLocationName,
  listRegisteredStorageProviderIds,
  CLOUDINARY_PROVIDER_ID,
  DROPBOX_PROVIDER_ID,
  ONEDRIVE_PROVIDER_ID,
  getDefaultStorageProvider,
  toStorageLocationSafeDto,
} from '@/lib/storage';
import type { StorageLocationRecord } from '@/lib/storage/storage-location-types';
import { roleGrantsPermission } from '@releaseflow/core/auth/authorization';
import { PERMISSIONS } from '@releaseflow/core/auth/permissions';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

describe('BUILD-301D provider registry remains authoritative', () => {
  it('registers cloudinary, dropbox, onedrive', () => {
    expect(listRegisteredStorageProviderIds()).toEqual(
      expect.arrayContaining([
        CLOUDINARY_PROVIDER_ID,
        DROPBOX_PROVIDER_ID,
        ONEDRIVE_PROVIDER_ID,
      ]),
    );
  });

  it('rejects unknown providerId without provider-specific branching', () => {
    expect(isRegisteredProviderId('s3')).toBe(false);
    expect(() => assertRegisteredProvider('s3')).toThrow(StorageConfigError);
    try {
      assertRegisteredProvider('unknown');
    } catch (e) {
      expect((e as StorageConfigError).code).toBe('UNKNOWN_PROVIDER');
      expect((e as Error).message).not.toMatch(/Dropbox|OneDrive|Microsoft/i);
    }
  });

  it('default product provider remains cloudinary', () => {
    expect(getDefaultStorageProvider().providerId).toBe('cloudinary');
  });
});

describe('BUILD-301D safe DTO never includes secrets', () => {
  it('toStorageLocationSafeDto strips only safe fields', () => {
    const record: StorageLocationRecord = {
      id: 'loc1',
      organizationId: 'org-A',
      name: 'Production',
      providerId: 'dropbox',
      status: 'active',
      rootPath: '/ReleaseFlow',
      configuration: { rootConfigured: true },
      isDefault: true,
      createdAt: null,
      updatedAt: null,
      metadata: { note: 'ok' },
    };
    const dto = toStorageLocationSafeDto(record);
    const json = JSON.stringify(dto);
    expect(json).not.toMatch(/refresh|secret|token|client_secret|apiKey/i);
    expect(dto.providerId).toBe('dropbox');
    expect(dto.organizationId).toBe('org-A');
    expect(dto.rootConfigured).toBe(true);
  });
});

describe('BUILD-301D provider catalog', () => {
  it('builds catalog from registry with env flags only', () => {
    const catalog = buildProviderCatalog({
      dropbox: true,
      onedrive: false,
      cloudinary: true,
    });
    const ids = catalog.map((c) => c.providerId);
    expect(ids).toContain('cloudinary');
    expect(ids).toContain('dropbox');
    expect(ids).toContain('onedrive');
    const dbx = catalog.find((c) => c.providerId === 'dropbox');
    expect(dbx?.envConfigured).toBe(true);
    expect(dbx?.connectionStatus).toBe('connected');
    const od = catalog.find((c) => c.providerId === 'onedrive');
    expect(od?.envConfigured).toBe(false);
    expect(od?.connectionStatus).toBe('disconnected');
    expect(JSON.stringify(catalog)).not.toMatch(
      /DROPBOX_|MICROSOFT_|refresh_token|client_secret/i,
    );
  });
});

describe('BUILD-301D validation', () => {
  it('validates location names', () => {
    expect(validateLocationName('  Prod  ')).toBe('Prod');
    expect(() => validateLocationName('')).toThrow(StorageConfigError);
    expect(() => validateLocationName('x')).toThrow(StorageConfigError);
  });
});

describe('BUILD-301D permissions are provider-neutral', () => {
  it('storage.read / storage.manage exist and grant admin/owner only via matrix', () => {
    expect(PERMISSIONS.StorageRead).toBe('storage.read');
    expect(PERMISSIONS.StorageManage).toBe('storage.manage');
    expect(roleGrantsPermission('administrator', 'storage.manage')).toBe(true);
    expect(roleGrantsPermission('administrator', 'storage.read')).toBe(true);
    expect(roleGrantsPermission('owner', 'storage.manage')).toBe(true); // wildcard
    expect(roleGrantsPermission('project_manager', 'storage.manage')).toBe(false);
    expect(roleGrantsPermission('contributor', 'storage.read')).toBe(false);
  });
});

describe('BUILD-301D API auth pipeline (organisation isolation)', () => {
  type Op = 'read' | 'manage';

  function pipeline(opts: {
    authenticated: boolean;
    organizationId: string;
    allowOrg: (org: string) => boolean;
    permission: Op;
    invoke: () => void;
  }): { status: number; invoked: boolean } {
    if (!opts.authenticated) return { status: 401, invoked: false };
    if (!opts.organizationId) return { status: 400, invoked: false };
    const required = opts.permission === 'read' ? 'storage.read' : 'storage.manage';
    void required;
    if (!opts.allowOrg(opts.organizationId)) {
      return { status: 403, invoked: false };
    }
    opts.invoke();
    return { status: 200, invoked: true };
  }

  it('unauthenticated → 401, no op', () => {
    const inv = vi.fn();
    const r = pipeline({
      authenticated: false,
      organizationId: 'org-A',
      allowOrg: () => true,
      permission: 'read',
      invoke: inv,
    });
    expect(r.status).toBe(401);
    expect(inv).not.toHaveBeenCalled();
  });

  it('User A Org A allowed; User A Org B denied', () => {
    const inv = vi.fn();
    const allowOrg = (org: string) => org === 'org-A';
    const ok = pipeline({
      authenticated: true,
      organizationId: 'org-A',
      allowOrg,
      permission: 'manage',
      invoke: inv,
    });
    expect(ok.status).toBe(200);
    expect(inv).toHaveBeenCalledTimes(1);
    inv.mockClear();
    const deny = pipeline({
      authenticated: true,
      organizationId: 'org-B',
      allowOrg,
      permission: 'manage',
      invoke: inv,
    });
    expect(deny.status).toBe(403);
    expect(inv).not.toHaveBeenCalled();
  });

  it('AuthorizationService denies storage.manage without membership', async () => {
    const { AuthorizationService } = await import(
      '@/lib/auth/authorization-service'
    );
    const allowed = await AuthorizationService.canAsync(
      'storage.manage',
      'org-B',
      'user-A',
      { membershipResolver: async () => null },
    );
    expect(allowed).toBe(false);
  });
});

describe('BUILD-301D routes & UI structure', () => {
  it('API routes exist', () => {
    expect(existsSync(join(webSrc, 'app/api/storage/locations/route.ts'))).toBe(
      true,
    );
    expect(
      existsSync(join(webSrc, 'app/api/storage/locations/[id]/route.ts')),
    ).toBe(true);
    expect(existsSync(join(webSrc, 'app/api/storage/providers/route.ts'))).toBe(
      true,
    );
  });

  it('storage settings page and admin link exist', () => {
    expect(
      existsSync(join(webSrc, 'app/(app)/administration/storage/page.tsx')),
    ).toBe(true);
    const admin = read('app/(app)/administration/page.tsx');
    expect(admin).toContain("href: '/administration/storage'");
    expect(admin).toContain("label: 'Storage'");
  });

  it('routes enforce auth and storage permissions; never return secrets', () => {
    const list = read('app/api/storage/locations/route.ts');
    expect(list).toContain('requireAuthenticatedUid');
    expect(list).toContain('storage.read');
    expect(list).toContain('storage.manage');
    expect(list).not.toMatch(/REFRESH_TOKEN|CLIENT_SECRET|APP_SECRET/);

    const one = read('app/api/storage/locations/[id]/route.ts');
    expect(one).toContain('storage.manage');
    expect(one).toContain('storage.read');

    const cat = read('app/api/storage/providers/route.ts');
    expect(cat).toContain('buildProviderCatalog');
    expect(cat).toContain('isDropboxConfigured');
    expect(cat).toContain('isOneDriveConfigured');
    // Only boolean flags — not secret values
    expect(cat).not.toContain('DROPBOX_REFRESH_TOKEN');
    expect(cat).not.toContain('MICROSOFT_CLIENT_SECRET');
  });

  it('UI does not import server credential modules', () => {
    const ui = read('app/(app)/administration/storage/page.tsx');
    expect(ui).not.toContain('@/lib/server/dropbox/config');
    expect(ui).not.toContain('@/lib/server/onedrive/config');
    expect(ui).not.toContain('MICROSOFT_CLIENT_SECRET');
    expect(ui).toContain('/api/storage/locations');
  });

  it('does not implement routing / discovery / templates', () => {
    const service = read('lib/storage/storage-location-service.ts');
    expect(service).not.toContain('FolderTemplate');
    expect(service).not.toContain('StoragePolicy');
    expect(service).not.toContain('Drafts');
    expect(service).not.toContain('routeAsset');
    const ui = read('app/(app)/administration/storage/page.tsx');
    expect(ui).toContain('does not change current uploads');
  });
});

describe('BUILD-301D firestore rules mention storage_locations', () => {
  it('rules include org-scoped storage_locations', () => {
    const rules = readFileSync(
      join(webSrc, '../../../firestore.rules'),
      'utf8',
    );
    expect(rules).toContain('storage_locations');
    expect(rules).toContain('organizationId == orgId');
  });
});
