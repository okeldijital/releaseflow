/**
 * BUILD-031A — Authorization normalization tests.
 *
 * Covers the canonical permission model, role → permission mapping, the
 * permission registry, and the Authorization Service (hasPermission) including
 * the cross-org and anonymous boundaries.
 */

import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  type Permission,
} from '@releaseflow/core/auth/permissions';
import {
  ROLE_DEFINITIONS,
  ROLE_PERMISSIONS,
  getRolePermissions,
  normalizeRoleId,
} from '@releaseflow/core/auth/roles';
import { PERMISSION_REGISTRY } from '@releaseflow/core/auth/registry';
import { roleGrantsPermission, resolvePermissions, resolveRole } from '@releaseflow/core/auth/authorization';
import { hasPermission, type MembershipResolver } from '@/lib/auth/authorization-service';

describe('BUILD-031A — Permission model', () => {
  it('exposes the required media permissions', () => {
    for (const p of [
      'media.read',
      'media.upload',
      'media.replace',
      'media.delete',
      'media.review',
      'media.approve',
      'media.restore',
    ]) {
      expect(ALL_PERMISSIONS).toContain(p as Permission);
    }
  });

  it('exposes the seeded platform permissions', () => {
    for (const p of [
      'release.read',
      'release.write',
      'artist.read',
      'artist.write',
      'assignment.manage',
      'workflow.manage',
      'organization.manage',
      'user.invite',
    ]) {
      expect(ALL_PERMISSIONS).toContain(p as Permission);
    }
  });
});

describe('BUILD-031A — Role definitions', () => {
  const expectedRoles = [
    'owner',
    'administrator',
    'project_manager',
    'producer',
    'designer',
    'engineer',
    'reviewer',
    'contributor',
    'viewer',
  ];

  it('defines all default roles', () => {
    for (const role of expectedRoles) {
      expect(ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]).toBeDefined();
    }
  });

  it('grants the Owner role every permission via wildcard', () => {
    expect(ROLE_PERMISSIONS.owner).toBe('*');
    const perms = getRolePermissions('owner');
    expect(perms).not.toBeNull();
    for (const p of ALL_PERMISSIONS) {
      expect(perms).toContain(p);
    }
  });

  it('normalizes legacy role ids', () => {
    expect(normalizeRoleId('admin')).toBe('administrator');
    expect(normalizeRoleId('release_manager')).toBe('project_manager');
    expect(normalizeRoleId('owner')).toBe('owner');
    expect(normalizeRoleId('unknown-role')).toBeNull();
    expect(normalizeRoleId(null)).toBeNull();
  });
});

describe('BUILD-031A — Default permission matrix', () => {
  const matrix: Record<string, Record<string, boolean>> = {
    owner: { 'media.read': true, 'media.upload': true, 'media.replace': true, 'media.delete': true, 'media.review': true, 'media.approve': true },
    administrator: { 'media.read': true, 'media.upload': true, 'media.replace': true, 'media.delete': true, 'media.review': true, 'media.approve': true },
    project_manager: { 'media.read': true, 'media.upload': true, 'media.replace': true, 'media.delete': false, 'media.review': true, 'media.approve': true },
    producer: { 'media.read': true, 'media.upload': true, 'media.replace': false, 'media.delete': false, 'media.review': false, 'media.approve': false },
    designer: { 'media.read': true, 'media.upload': true, 'media.replace': true, 'media.delete': false, 'media.review': true, 'media.approve': false },
    viewer: { 'media.read': true, 'media.upload': false, 'media.replace': false, 'media.delete': false, 'media.review': false, 'media.approve': false },
  };

  for (const [role, perms] of Object.entries(matrix)) {
    for (const [permission, expected] of Object.entries(perms)) {
      it(`${role} ${expected ? 'can' : 'cannot'} ${permission}`, () => {
        expect(roleGrantsPermission(role, permission as Permission)).toBe(expected);
      });
    }
  }
});

describe('BUILD-031A — Permission registry', () => {
  it('has a registry entry for every permission', () => {
    for (const p of ALL_PERMISSIONS) {
      const entry = PERMISSION_REGISTRY.find((e) => e.id === p);
      expect(entry, `registry entry for ${p}`).toBeDefined();
      expect(entry!.description.length).toBeGreaterThan(0);
      expect(entry!.defaultRoles.length).toBeGreaterThan(0);
    }
  });

  it('only references defined roles as default roles', () => {
    const validRoles = new Set(Object.keys(ROLE_DEFINITIONS));
    for (const entry of PERMISSION_REGISTRY) {
      for (const role of entry.defaultRoles) {
        expect(validRoles.has(role), `${entry.id} references unknown role ${role}`).toBe(true);
      }
    }
  });

  it('media.upload is used by artwork, artist, people, and marketing assets', () => {
    const entry = PERMISSION_REGISTRY.find((e) => e.id === 'media.upload');
    expect(entry!.usedBy).toEqual(
      expect.arrayContaining(['Release Artwork', 'Artist Images', 'People Images', 'Marketing Assets']),
    );
  });
});

describe('BUILD-031A — Authorization Service (hasPermission)', () => {
  // Resolver keyed by "orgId:userId" → roleId.
  function makeResolver(map: Record<string, string | null>): MembershipResolver {
    return async (orgId, userId) => map[`${orgId}:${userId}`] ?? null;
  }

  it('allows Owner media.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-owner': 'owner' });
    await expect(hasPermission('org-1', 'u-owner', PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('allows Administrator media.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-admin': 'administrator' });
    await expect(hasPermission('org-1', 'u-admin', PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('allows Designer media.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-designer': 'designer' });
    await expect(hasPermission('org-1', 'u-designer', PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('allows Producer media.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-producer': 'producer' });
    await expect(hasPermission('org-1', 'u-producer', PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('denies Viewer media.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-viewer': 'viewer' });
    await expect(hasPermission('org-1', 'u-viewer', PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(false);
  });

  it('denies anonymous (no user)', async () => {
    const resolver = makeResolver({ 'org-1:anon': 'owner' });
    await expect(hasPermission('org-1', null, PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(false);
    await expect(hasPermission('org-1', undefined, PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(false);
    await expect(hasPermission('org-1', '', PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(false);
  });

  it('denies access in a different organization (no membership)', async () => {
    // User is an owner of org-1 but has no membership in org-2.
    const resolver = makeResolver({ 'org-1:u-owner': 'owner' });
    await expect(hasPermission('org-2', 'u-owner', PERMISSIONS.MediaUpload, { membershipResolver: resolver })).resolves.toBe(false);
  });

  it('denies an inactive membership', async () => {
    // The resolver returns null for non-active memberships, which the service
    // maps to "no permission". resolveRole itself drops inactive memberships.
    const inactiveResolver: MembershipResolver = async () => null;
    await expect(hasPermission('org-1', 'u-owner', PERMISSIONS.MediaUpload, { membershipResolver: inactiveResolver })).resolves.toBe(false);
    expect(resolveRole({ roleId: 'owner', status: 'pending' })).toBeNull();
    expect(resolveRole({ roleId: 'owner', status: 'active' })).toBe('owner');
  });

  it('resolves permissions for a role independently', () => {
    expect(resolvePermissions('viewer')).toContain('media.read');
    expect(resolvePermissions('viewer')).not.toContain('media.upload');
    expect(resolvePermissions('unknown')).toEqual([]);
  });
});
