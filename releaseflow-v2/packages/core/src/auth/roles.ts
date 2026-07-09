/**
 * BUILD-031A — Role definitions and role → permission mapping.
 *
 * Roles are centralized here so every module resolves permissions through a
 * single source. The Authorization Service (apps/web) and the pure decision
 * helpers in ./authorization both consume this mapping; no feature should
 * re-derive role permissions elsewhere.
 */

import { ALL_PERMISSIONS, WILDCARD, type Permission, type Wildcard } from './permissions';

/** Canonical role identifiers. Use these in membership records. */
export type RoleId =
  | 'owner'
  | 'administrator'
  | 'project_manager'
  | 'producer'
  | 'designer'
  | 'engineer'
  | 'reviewer'
  | 'contributor'
  | 'viewer';

export type RolePermissions = Permission[] | Wildcard;

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
}

/** Human-readable role catalog. */
export const ROLE_DEFINITIONS: Record<RoleId, RoleDefinition> = {
  owner: { id: 'owner', name: 'Owner', description: 'Full access to the organization and all modules.' },
  administrator: { id: 'administrator', name: 'Administrator', description: 'Most management permissions across all modules.' },
  project_manager: { id: 'project_manager', name: 'Project Manager', description: 'Media, releases, and assignment management.' },
  producer: { id: 'producer', name: 'Producer', description: 'Read and upload media.' },
  designer: { id: 'designer', name: 'Designer', description: 'Upload and replace media, submit reviews.' },
  engineer: { id: 'engineer', name: 'Engineer', description: 'Read-only media access.' },
  reviewer: { id: 'reviewer', name: 'Reviewer', description: 'Review media assets.' },
  contributor: { id: 'contributor', name: 'Contributor', description: 'Limited upload access.' },
  viewer: { id: 'viewer', name: 'Viewer', description: 'Read-only access.' },
};

/**
 * Default role → permission grants. `*` grants every platform permission.
 * Roles not listed here receive no permissions.
 */
export const ROLE_PERMISSIONS: Record<RoleId, RolePermissions> = {
  owner: WILDCARD,
  administrator: [
    'media.read',
    'media.upload',
    'media.replace',
    'media.delete',
    'media.review',
    'media.approve',
    'media.restore',
    'release.read',
    'release.write',
    'artist.read',
    'artist.write',
    'assignment.manage',
    'workflow.manage',
    'user.invite',
  ],
  project_manager: [
    'media.read',
    'media.upload',
    'media.replace',
    'media.review',
    'media.approve',
    'media.restore',
    'release.read',
    'release.write',
    'artist.read',
    'artist.write',
    'assignment.manage',
    'workflow.manage',
  ],
  producer: ['media.read', 'media.upload'],
  designer: ['media.read', 'media.upload', 'media.replace', 'media.review'],
  engineer: ['media.read'],
  reviewer: ['media.read', 'media.review'],
  contributor: ['media.read', 'media.upload'],
  viewer: ['media.read'],
};

/**
 * Legacy role identifiers still present in existing membership records.
 * Normalized to their closest canonical role so older data keeps working.
 */
const ROLE_ALIASES: Record<string, RoleId> = {
  admin: 'administrator',
  release_manager: 'project_manager',
  member: 'contributor',
};

export function normalizeRoleId(roleId: string | null | undefined): RoleId | null {
  if (!roleId) return null;
  if (roleId in ROLE_PERMISSIONS) return roleId as RoleId;
  const alias = ROLE_ALIASES[roleId];
  return alias ?? null;
}

export function getRolePermissions(roleId: string | null | undefined): Permission[] | null {
  const normalized = normalizeRoleId(roleId);
  if (!normalized) return null;
  const grants = ROLE_PERMISSIONS[normalized];
  if (grants === WILDCARD) return [...ALL_PERMISSIONS];
  return grants;
}
