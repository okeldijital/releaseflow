/**
 * AUTH-001 — Central AuthorizationService tests.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthorizationService,
  type MembershipResolver,
} from '@/lib/auth/authorization-service';
import { PERMISSIONS } from '@releaseflow/core/auth/permissions';

describe('AUTH-001 AuthorizationService', () => {
  beforeEach(() => {
    AuthorizationService.clearContext();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  function makeResolver(map: Record<string, string | null>): MembershipResolver {
    return async (orgId, userId) => map[`${orgId}:${userId}`] ?? null;
  }

  it('loads context for administrator with elevated capabilities', async () => {
    const resolver = makeResolver({ 'org-1:u-admin': 'administrator' });
    await AuthorizationService.loadContext('u-admin', 'org-1', { membershipResolver: resolver });

    expect(AuthorizationService.getCurrentRole()).toBe('administrator');
    expect(AuthorizationService.getCurrentOrganization()).toBe('org-1');
    expect(AuthorizationService.canCreateRelease()).toBe(true);
    expect(AuthorizationService.canDeleteRelease()).toBe(true);
    expect(AuthorizationService.canInviteCollaborators()).toBe(true);
    expect(AuthorizationService.canManageOrganization()).toBe(true);
    expect(AuthorizationService.canViewAdministration()).toBe(true);
    expect(AuthorizationService.isCollaboratorWorkspace()).toBe(false);
  });

  it('loads context for manager with delegated capabilities', async () => {
    const resolver = makeResolver({ 'org-1:u-mgr': 'project_manager' });
    await AuthorizationService.loadContext('u-mgr', 'org-1', { membershipResolver: resolver });

    expect(AuthorizationService.canCreateRelease()).toBe(true);
    expect(AuthorizationService.canDeleteRelease()).toBe(false);
    expect(AuthorizationService.canInviteCollaborators()).toBe(true);
    expect(AuthorizationService.canManageOrganization()).toBe(false);
    expect(AuthorizationService.canViewAdministration()).toBe(false);
    expect(AuthorizationService.canViewTeamSchedule()).toBe(true);
    expect(AuthorizationService.canGoNoGo()).toBe(true);
  });

  it('loads context for collaborator with restricted capabilities', async () => {
    const resolver = makeResolver({ 'org-1:u-collab': 'contributor' });
    await AuthorizationService.loadContext('u-collab', 'org-1', { membershipResolver: resolver });

    expect(AuthorizationService.canCreateRelease()).toBe(false);
    expect(AuthorizationService.canDeleteRelease()).toBe(false);
    expect(AuthorizationService.canInviteCollaborators()).toBe(false);
    expect(AuthorizationService.canManageOrganization()).toBe(false);
    expect(AuthorizationService.canViewAdministration()).toBe(false);
    expect(AuthorizationService.canViewTeamSchedule()).toBe(false);
    expect(AuthorizationService.canRescheduleAssignments()).toBe(false);
    expect(AuthorizationService.canComment()).toBe(true);
    expect(AuthorizationService.canViewPersonalSchedule()).toBe(true);
    expect(AuthorizationService.isCollaboratorWorkspace()).toBe(true);
  });

  it('fails closed with missing membership', async () => {
    const resolver = makeResolver({});
    await AuthorizationService.loadContext('u-none', 'org-1', { membershipResolver: resolver });

    expect(AuthorizationService.getCurrentRole()).toBeNull();
    expect(AuthorizationService.getPermissions()).toEqual([]);
    expect(AuthorizationService.canCreateRelease()).toBe(false);
    expect(AuthorizationService.canViewAdministration()).toBe(false);
    expect(AuthorizationService.isCollaboratorWorkspace()).toBe(true);
  });

  it('fails closed when no context loaded', () => {
    expect(AuthorizationService.canCreateRelease()).toBe(false);
    expect(AuthorizationService.can('release.read')).toBe(false);
    const explanation = AuthorizationService.explain('release.write');
    expect(explanation.allowed).toBe(false);
    expect(explanation.decision).toBe('DENIED');
  });

  it('explain returns granted reason for manager create release', async () => {
    const resolver = makeResolver({ 'org-1:u-mgr': 'project_manager' });
    await AuthorizationService.loadContext('u-mgr', 'org-1', { membershipResolver: resolver });
    const e = AuthorizationService.explain(PERMISSIONS.ReleaseWrite);
    expect(e.allowed).toBe(true);
    expect(e.roleId).toBe('project_manager');
    expect(e.reason).toMatch(/granted by role/i);
  });

  it('explain returns denied reason for collaborator create release', async () => {
    const resolver = makeResolver({ 'org-1:u-c': 'contributor' });
    await AuthorizationService.loadContext('u-c', 'org-1', { membershipResolver: resolver });
    const e = AuthorizationService.explain(PERMISSIONS.ReleaseWrite);
    expect(e.allowed).toBe(false);
    expect(e.reason).toMatch(/missing/i);
  });

  it('require throws AuthorizationError when denied', async () => {
    const resolver = makeResolver({ 'org-1:u-c': 'contributor' });
    await expect(
      AuthorizationService.requireCreateRelease('org-1', 'u-c', { membershipResolver: resolver }),
    ).rejects.toMatchObject({ name: 'AuthorizationError' });
  });

  it('require succeeds for administrator', async () => {
    const resolver = makeResolver({ 'org-1:u-a': 'administrator' });
    await expect(
      AuthorizationService.requireCreateRelease('org-1', 'u-a', { membershipResolver: resolver }),
    ).resolves.toBeUndefined();
  });

  it('invalidates and reloads context on organization switch', async () => {
    const resolver = makeResolver({
      'org-1:u-multi': 'administrator',
      'org-2:u-multi': 'contributor',
    });

    await AuthorizationService.loadContext('u-multi', 'org-1', { membershipResolver: resolver });
    expect(AuthorizationService.canCreateRelease()).toBe(true);

    await AuthorizationService.loadContext('u-multi', 'org-2', { membershipResolver: resolver });
    expect(AuthorizationService.getCurrentOrganization()).toBe('org-2');
    expect(AuthorizationService.canCreateRelease()).toBe(false);
    expect(AuthorizationService.isCollaboratorWorkspace()).toBe(true);
  });

  it('clearContext on logout fails closed', async () => {
    const resolver = makeResolver({ 'org-1:u-a': 'administrator' });
    await AuthorizationService.loadContext('u-a', 'org-1', { membershipResolver: resolver });
    expect(AuthorizationService.canCreateRelease()).toBe(true);

    AuthorizationService.clearContext();
    expect(AuthorizationService.getCurrentRole()).toBeNull();
    expect(AuthorizationService.canCreateRelease()).toBe(false);
  });

  it('cannot is inverse of can', async () => {
    const resolver = makeResolver({ 'org-1:u-c': 'contributor' });
    await AuthorizationService.loadContext('u-c', 'org-1', { membershipResolver: resolver });
    expect(AuthorizationService.cannot('release.write')).toBe(true);
    expect(AuthorizationService.cannot('comment.create')).toBe(false);
  });

  it('async can works without session for explicit org/user', async () => {
    const resolver = makeResolver({ 'org-x:u-x': 'project_manager' });
    const allowed = await AuthorizationService.canAsync(
      PERMISSIONS.UserInvite,
      'org-x',
      'u-x',
      { membershipResolver: resolver },
    );
    expect(allowed).toBe(true);
  });

  it('unknown role fails closed', async () => {
    const resolver = makeResolver({ 'org-1:u-bad': 'not_a_real_role' });
    // normalizeRoleId returns null for unknown → resolvePermissions empty via roleGrantsPermission
    // getUserRole path uses resolveRole which returns raw roleId; roleGrantsPermission normalizes
    await AuthorizationService.loadContext('u-bad', 'org-1', { membershipResolver: resolver });
    // loadContext uses resolvePermissions(roleId) which returns [] for unknown
    // Actually resolvePermissions uses getRolePermissions which returns null → []
    expect(AuthorizationService.canCreateRelease()).toBe(false);
  });
});
