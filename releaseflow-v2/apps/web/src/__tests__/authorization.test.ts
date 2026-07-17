/**
 * BUILD-031A / RBAC-001 — Authorization tests.
 */

import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  CAPABILITIES,
  type Permission,
} from '@releaseflow/core/auth/permissions';
import {
  ROLE_DEFINITIONS,
  ROLE_PERMISSIONS,
  getRolePermissions,
  normalizeRoleId,
  isCollaboratorRole,
} from '@releaseflow/core/auth/roles';
import { PERMISSION_REGISTRY } from '@releaseflow/core/auth/registry';
import { roleGrantsPermission, resolvePermissions, resolveRole } from '@releaseflow/core/auth/authorization';
import { hasPermission, type MembershipResolver } from '@/lib/auth/authorization-service';

describe('RBAC-001 — Permission model', () => {
  it('exposes media permissions', () => {
    for (const p of [
      'media.read', 'media.upload', 'media.replace', 'media.delete',
      'media.review', 'media.approve', 'media.restore',
    ]) {
      expect(ALL_PERMISSIONS).toContain(p as Permission);
    }
  });

  it('exposes platform permissions including delete/invite/schedule/readiness', () => {
    for (const p of [
      'release.read', 'release.write', 'release.delete', 'release.publish',
      'artist.read', 'artist.write',
      'assignment.manage', 'assignment.view',
      'workflow.manage',
      'organization.manage',
      'user.invite', 'user.remove',
      'admin.access',
      'schedule.team', 'schedule.personal', 'schedule.reschedule',
      'readiness.view', 'readiness.manage',
      'comment.create',
      'people.manage',
    ]) {
      expect(ALL_PERMISSIONS).toContain(p as Permission);
    }
  });

  it('exposes named CAPABILITIES', () => {
    expect(CAPABILITIES.createRelease).toBe('release.write');
    expect(CAPABILITIES.deleteRelease).toBe('release.delete');
    expect(CAPABILITIES.inviteUsers).toBe('user.invite');
  });
});

describe('RBAC-001 — Role definitions', () => {
  const expectedRoles = [
    'owner', 'administrator', 'project_manager', 'producer', 'designer',
    'engineer', 'reviewer', 'contributor', 'viewer',
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
    expect(normalizeRoleId('collaborator')).toBe('contributor');
    expect(normalizeRoleId('owner')).toBe('owner');
    expect(normalizeRoleId('unknown-role')).toBeNull();
    expect(normalizeRoleId(null)).toBeNull();
  });

  it('identifies collaborator-tier roles', () => {
    expect(isCollaboratorRole('contributor')).toBe(true);
    expect(isCollaboratorRole('viewer')).toBe(true);
    expect(isCollaboratorRole('administrator')).toBe(false);
    expect(isCollaboratorRole('project_manager')).toBe(false);
    expect(isCollaboratorRole('owner')).toBe(false);
  });
});

describe('RBAC-001 — Platform role matrix', () => {
  const matrix: Array<[string, Permission, boolean]> = [
    // Collaborator (contributor)
    ['contributor', 'release.read', true],
    ['contributor', 'release.write', false],
    ['contributor', 'release.delete', false],
    ['contributor', 'user.invite', false],
    ['contributor', 'user.remove', false],
    ['contributor', 'organization.manage', false],
    ['contributor', 'admin.access', false],
    ['contributor', 'assignment.manage', false],
    ['contributor', 'assignment.view', true],
    ['contributor', 'schedule.team', false],
    ['contributor', 'schedule.personal', true],
    ['contributor', 'schedule.reschedule', false],
    ['contributor', 'readiness.view', true],
    ['contributor', 'readiness.manage', false],
    ['contributor', 'comment.create', true],
    // Manager (project_manager)
    ['project_manager', 'release.write', true],
    ['project_manager', 'release.delete', false],
    ['project_manager', 'user.invite', true],
    ['project_manager', 'user.remove', false],
    ['project_manager', 'organization.manage', false],
    ['project_manager', 'admin.access', false],
    ['project_manager', 'schedule.team', true],
    ['project_manager', 'readiness.manage', true],
    // Administrator
    ['administrator', 'release.write', true],
    ['administrator', 'release.delete', true],
    ['administrator', 'user.invite', true],
    ['administrator', 'user.remove', true],
    ['administrator', 'organization.manage', true],
    ['administrator', 'admin.access', true],
    // Aliases
    ['release_manager', 'release.write', true],
    ['release_manager', 'release.delete', false],
    ['admin', 'admin.access', true],
    ['collaborator', 'release.write', false],
  ];

  for (const [role, permission, expected] of matrix) {
    it(`${role} ${expected ? 'can' : 'cannot'} ${permission}`, () => {
      expect(roleGrantsPermission(role, permission)).toBe(expected);
    });
  }
});

describe('BUILD-031A — Media matrix regression', () => {
  const matrix: Record<string, Record<string, boolean>> = {
    owner: { 'media.read': true, 'media.upload': true, 'media.delete': true },
    administrator: { 'media.read': true, 'media.upload': true, 'media.delete': true },
    project_manager: { 'media.read': true, 'media.upload': true, 'media.delete': false },
    viewer: { 'media.read': true, 'media.upload': false },
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
});

describe('BUILD-031A — Authorization Service (hasPermission)', () => {
  function makeResolver(map: Record<string, string | null>): MembershipResolver {
    return async (orgId, userId) => map[`${orgId}:${userId}`] ?? null;
  }

  it('allows Administrator create release', async () => {
    const resolver = makeResolver({ 'org-1:u-admin': 'administrator' });
    await expect(
      hasPermission('org-1', 'u-admin', PERMISSIONS.ReleaseWrite, {
        membershipResolver: resolver,
        bypassCache: true,
      }),
    ).resolves.toBe(true);
  });

  it('denies Collaborator create release', async () => {
    const resolver = makeResolver({ 'org-1:u-collab': 'contributor' });
    await expect(
      hasPermission('org-1', 'u-collab', PERMISSIONS.ReleaseWrite, {
        membershipResolver: resolver,
        bypassCache: true,
      }),
    ).resolves.toBe(false);
  });

  it('denies Collaborator admin access', async () => {
    const resolver = makeResolver({ 'org-1:u-collab': 'contributor' });
    await expect(
      hasPermission('org-1', 'u-collab', PERMISSIONS.AdminAccess, {
        membershipResolver: resolver,
        bypassCache: true,
      }),
    ).resolves.toBe(false);
  });

  it('allows Manager invite but not org manage', async () => {
    const resolver = makeResolver({ 'org-1:u-mgr': 'project_manager' });
    await expect(
      hasPermission('org-1', 'u-mgr', PERMISSIONS.UserInvite, {
        membershipResolver: resolver,
        bypassCache: true,
      }),
    ).resolves.toBe(true);
    await expect(
      hasPermission('org-1', 'u-mgr', PERMISSIONS.OrganizationManage, {
        membershipResolver: resolver,
        bypassCache: true,
      }),
    ).resolves.toBe(false);
  });

  it('denies anonymous', async () => {
    const resolver = makeResolver({ 'org-1:anon': 'owner' });
    await expect(
      hasPermission('org-1', null, PERMISSIONS.MediaUpload, {
        membershipResolver: resolver,
        bypassCache: true,
      }),
    ).resolves.toBe(false);
  });

  it('denies cross-org membership', async () => {
    const resolver = makeResolver({ 'org-1:u-owner': 'owner' });
    await expect(
      hasPermission('org-2', 'u-owner', PERMISSIONS.MediaUpload, {
        membershipResolver: resolver,
        bypassCache: true,
      }),
    ).resolves.toBe(false);
  });

  it('denies inactive membership', async () => {
    const inactiveResolver: MembershipResolver = async () => null;
    await expect(
      hasPermission('org-1', 'u-owner', PERMISSIONS.MediaUpload, {
        membershipResolver: inactiveResolver,
        bypassCache: true,
      }),
    ).resolves.toBe(false);
    expect(resolveRole({ roleId: 'owner', status: 'pending' })).toBeNull();
    expect(resolveRole({ roleId: 'owner', status: 'active' })).toBe('owner');
  });

  it('resolves permissions for a role independently', () => {
    expect(resolvePermissions('viewer')).toContain('media.read');
    expect(resolvePermissions('viewer')).not.toContain('media.upload');
    expect(resolvePermissions('unknown')).toEqual([]);
    expect(resolvePermissions('contributor')).not.toContain('release.write');
  });
});
