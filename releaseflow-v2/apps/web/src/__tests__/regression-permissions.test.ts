import { describe, it, expect } from 'vitest';

type PermissionRole = 'owner' | 'admin' | 'project_manager' | 'a_and_r' | 'artist' | 'producer' | 'mix_engineer' | 'mastering_engineer' | 'designer' | 'viewer';

interface Permission {
  action: string;
  resource: string;
  roles: PermissionRole[];
}

const PERMISSIONS: Permission[] = [
  { action: 'create_release', resource: 'releases', roles: ['owner', 'admin', 'project_manager', 'a_and_r'] },
  { action: 'edit_release', resource: 'releases', roles: ['owner', 'admin', 'project_manager', 'a_and_r'] },
  { action: 'view_releases', resource: 'releases', roles: ['owner', 'admin', 'project_manager', 'a_and_r', 'artist', 'producer', 'mix_engineer', 'mastering_engineer', 'designer', 'viewer'] },
  { action: 'delete_release', resource: 'releases', roles: ['owner', 'admin'] },
  { action: 'manage_team', resource: 'settings/team', roles: ['owner', 'admin'] },
  { action: 'manage_billing', resource: 'settings/billing', roles: ['owner'] },
  { action: 'view_campaigns', resource: 'campaigns', roles: ['owner', 'admin', 'project_manager', 'a_and_r', 'artist', 'producer'] },
  { action: 'create_campaign', resource: 'campaigns', roles: ['owner', 'admin', 'project_manager'] },
  { action: 'manage_integrations', resource: 'settings/integrations', roles: ['owner', 'admin'] },
  { action: 'view_organization', resource: 'organizations', roles: ['owner', 'admin', 'project_manager', 'a_and_r', 'artist', 'producer', 'mix_engineer', 'mastering_engineer', 'designer', 'viewer'] },
];

function can(role: PermissionRole, action: string, resource: string): boolean {
  const perm = PERMISSIONS.find((p) => p.action === action && p.resource === resource);
  return perm ? perm.roles.includes(role) : false;
}

describe('Regression — Permission Model', () => {
  describe('Owner permissions', () => {
    it('can create, edit, delete releases', () => {
      expect(can('owner', 'create_release', 'releases')).toBe(true);
      expect(can('owner', 'edit_release', 'releases')).toBe(true);
      expect(can('owner', 'delete_release', 'releases')).toBe(true);
    });

    it('can manage team and billing', () => {
      expect(can('owner', 'manage_team', 'settings/team')).toBe(true);
      expect(can('owner', 'manage_billing', 'settings/billing')).toBe(true);
    });

    it('can manage integrations', () => {
      expect(can('owner', 'manage_integrations', 'settings/integrations')).toBe(true);
    });
  });

  describe('Admin permissions', () => {
    it('can manage team but not billing', () => {
      expect(can('admin', 'manage_team', 'settings/team')).toBe(true);
      expect(can('admin', 'manage_billing', 'settings/billing')).toBe(false);
    });

    it('can delete releases', () => {
      expect(can('admin', 'create_release', 'releases')).toBe(true);
      expect(can('admin', 'view_releases', 'releases')).toBe(true);
      expect(can('admin', 'delete_release', 'releases')).toBe(true);
    });
  });

  describe('Project Manager permissions', () => {
    it('can create releases but not manage billing', () => {
      expect(can('project_manager', 'create_release', 'releases')).toBe(true);
      expect(can('project_manager', 'manage_billing', 'settings/billing')).toBe(false);
    });

    it('can create campaigns', () => {
      expect(can('project_manager', 'create_campaign', 'campaigns')).toBe(true);
    });
  });

  describe('Artist permissions', () => {
    it('can view releases but not create', () => {
      expect(can('artist', 'view_releases', 'releases')).toBe(true);
      expect(can('artist', 'create_release', 'releases')).toBe(false);
    });

    it('cannot manage team or billing', () => {
      expect(can('artist', 'manage_team', 'settings/team')).toBe(false);
      expect(can('artist', 'manage_billing', 'settings/billing')).toBe(false);
    });

    it('can view campaigns', () => {
      expect(can('artist', 'view_campaigns', 'campaigns')).toBe(true);
    });

    it('cannot create campaigns', () => {
      expect(can('artist', 'create_campaign', 'campaigns')).toBe(false);
    });
  });

  describe('Viewer permissions', () => {
    it('can view releases but nothing else', () => {
      expect(can('viewer', 'view_releases', 'releases')).toBe(true);
      expect(can('viewer', 'create_release', 'releases')).toBe(false);
      expect(can('viewer', 'edit_release', 'releases')).toBe(false);
      expect(can('viewer', 'manage_team', 'settings/team')).toBe(false);
    });
  });

  describe('Permission enum coverage', () => {
    it('all defined actions have role coverage', () => {
      for (const perm of PERMISSIONS) {
        expect(perm.roles.length).toBeGreaterThan(0);
      }
    });

    it('owner has access to all defined actions', () => {
      for (const perm of PERMISSIONS) {
        expect(perm.roles).toContain('owner');
      }
    });

    it('viewer only has view access', () => {
      const viewerPerms = PERMISSIONS.filter((p) => p.roles.includes('viewer'));
      for (const perm of viewerPerms) {
        expect(perm.action).toMatch(/^view/);
      }
    });
  });
});

describe('Regression — Role escalation prevention', () => {
  it('viewer cannot escalate to create', () => {
    expect(can('viewer', 'create_release', 'releases')).toBe(false);
    expect(can('viewer', 'manage_team', 'settings/team')).toBe(false);
  });

  it('artist cannot escalate to delete', () => {
    expect(can('artist', 'delete_release', 'releases')).toBe(false);
  });

  it('project_manager cannot escalate to billing', () => {
    expect(can('project_manager', 'manage_billing', 'settings/billing')).toBe(false);
  });
});

describe('Regression — Cross-org permission boundary', () => {
  function evaluatePermission(userOrgs: string[], resourceOrg: string, role: PermissionRole, action: string, resource: string): boolean {
    if (!userOrgs.includes(resourceOrg)) return false;
    return can(role, action, resource);
  }

  it('denies access when user not in resource org', () => {
    expect(evaluatePermission(['org-a'], 'org-b', 'owner', 'view_releases', 'releases')).toBe(false);
  });

  it('allows access only when user belongs to resource org', () => {
    expect(evaluatePermission(['org-a', 'org-b'], 'org-a', 'owner', 'view_releases', 'releases')).toBe(true);
    expect(evaluatePermission(['org-a', 'org-b'], 'org-c', 'owner', 'view_releases', 'releases')).toBe(false);
  });
});
