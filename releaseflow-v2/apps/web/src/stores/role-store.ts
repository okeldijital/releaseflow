/**
 * AUTH-001 — Role store is a thin React binding over AuthorizationService.
 * Permission decisions always flow through AuthorizationService.
 */

import { create } from 'zustand';
import type { Permission } from '@releaseflow/core/auth/permissions';
import {
  AuthorizationService,
  type AuthorizationContext,
} from '@/lib/auth/authorization-service';

export type AppRole = 'owner' | 'admin' | 'release_manager' | 'contributor' | 'viewer';

function mapRoleIdToAppRole(roleId: string | null): AppRole {
  switch (roleId) {
    case 'owner':
      return 'owner';
    case 'admin':
    case 'administrator':
      return 'admin';
    case 'release_manager':
    case 'project_manager':
      return 'release_manager';
    case 'viewer':
      return 'viewer';
    default:
      return 'contributor';
  }
}

interface RoleState {
  role: AppRole;
  roleId: string | null;
  permissions: Permission[];
  organizationId: string | null;
  loading: boolean;
  /** Load authorization context via AuthorizationService. */
  resolveRole: (userId: string, organizationId?: string | null) => Promise<void>;
  /** Session can() — delegates to AuthorizationService. */
  can: (permission: Permission) => boolean;
  isCollaborator: () => boolean;
  reset: () => void;
}

function applyContext(ctx: AuthorizationContext | null): Partial<RoleState> {
  if (!ctx) {
    return {
      role: 'viewer',
      roleId: null,
      permissions: [],
      organizationId: null,
      loading: false,
    };
  }
  return {
    role: mapRoleIdToAppRole(ctx.roleId),
    roleId: ctx.roleId,
    permissions: ctx.permissions,
    organizationId: ctx.organizationId,
    loading: false,
  };
}

export const useRoleStore = create<RoleState>((set) => ({
  role: 'viewer',
  roleId: null,
  permissions: [],
  organizationId: null,
  loading: true,

  resolveRole: async (userId: string, organizationId?: string | null) => {
    set({ loading: true });
    if (!organizationId) {
      set({
        role: 'contributor',
        roleId: null,
        permissions: [],
        organizationId: null,
        loading: false,
      });
      return;
    }
    const ctx = await AuthorizationService.loadContext(userId, organizationId);
    set(applyContext(ctx));
  },

  can: (permission: Permission) => AuthorizationService.can(permission),

  isCollaborator: () => AuthorizationService.isCollaboratorWorkspace(),

  reset: () => {
    AuthorizationService.clearContext();
    set({
      role: 'viewer',
      roleId: null,
      permissions: [],
      organizationId: null,
      loading: true,
    });
  },
}));

export const ROLE_DEFAULT_ROUTES: Record<AppRole, string> = {
  owner: '/dashboard',
  admin: '/dashboard',
  release_manager: '/dashboard',
  contributor: '/home',
  viewer: '/home',
};
