/**
 * BUILD-031A / RBAC-001 — Role definitions and role → permission mapping.
 *
 * Platform roles (invitation / membership):
 *   administrator → administrator
 *   release_manager (Manager) → project_manager
 *   collaborator → contributor
 *
 * Professional roles are informational only — never mapped here.
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
  administrator: { id: 'administrator', name: 'Administrator', description: 'Full organizational control except ownership transfer.' },
  project_manager: { id: 'project_manager', name: 'Manager', description: 'Release coordination, assignments, readiness — not org settings.' },
  producer: { id: 'producer', name: 'Producer', description: 'Read and upload media.' },
  designer: { id: 'designer', name: 'Designer', description: 'Upload and replace media, submit reviews.' },
  engineer: { id: 'engineer', name: 'Engineer', description: 'Read-only media access.' },
  reviewer: { id: 'reviewer', name: 'Reviewer', description: 'Review media assets.' },
  contributor: { id: 'contributor', name: 'Collaborator', description: 'Assigned work only — no create release, invite, or admin.' },
  viewer: { id: 'viewer', name: 'Viewer', description: 'Read-only access.' },
};

/**
 * RBAC-001 permission matrix (platform roles).
 *
 * Administrator: full management including delete release, org, remove users.
 * Manager (project_manager): create/edit releases, invite, assignments, team schedule, readiness — no org manage / delete release / remove users.
 * Collaborator (contributor): view own work, comment, personal schedule — no create/delete release, invite, admin, team schedule, go/no-go.
 */
export const ROLE_PERMISSIONS: Record<RoleId, RolePermissions> = {
  owner: WILDCARD,

  administrator: [
    'media.read', 'media.upload', 'media.replace', 'media.delete', 'media.review', 'media.approve', 'media.restore',
    'artwork.read', 'artwork.upload', 'artwork.replace', 'artwork.delete',
    'profile.upload',
    'release.read', 'release.write', 'release.delete', 'release.publish',
    'artist.read', 'artist.write',
    'people.manage',
    'assignment.manage', 'assignment.view',
    'workflow.manage',
    'comment.create',
    'organization.manage',
    'user.invite', 'user.remove',
    'admin.access',
    'schedule.team', 'schedule.personal', 'schedule.reschedule',
    'readiness.view', 'readiness.manage',
  ],

  project_manager: [
    'media.read', 'media.upload', 'media.replace', 'media.review', 'media.approve', 'media.restore',
    'artwork.read', 'artwork.upload', 'artwork.replace', 'artwork.delete',
    'profile.upload',
    'release.read', 'release.write', 'release.publish',
    // no release.delete
    'artist.read', 'artist.write',
    'people.manage',
    'assignment.manage', 'assignment.view',
    'workflow.manage',
    'comment.create',
    // no organization.manage
    'user.invite',
    // no user.remove
    // no admin.access (full administration shell restricted)
    'schedule.team', 'schedule.personal', 'schedule.reschedule',
    'readiness.view', 'readiness.manage',
  ],

  producer: [
    'media.read', 'media.upload',
    'artwork.read', 'artwork.upload',
    'release.read',
    'assignment.view',
    'comment.create',
    'schedule.personal',
    'profile.upload',
  ],

  designer: [
    'media.read', 'media.upload', 'media.replace', 'media.review',
    'artwork.read', 'artwork.upload', 'artwork.replace',
    'release.read',
    'assignment.view',
    'comment.create',
    'schedule.personal',
    'profile.upload',
  ],

  engineer: [
    'media.read',
    'artwork.read',
    'release.read',
    'assignment.view',
    'comment.create',
    'schedule.personal',
    'profile.upload',
  ],

  reviewer: [
    'media.read', 'media.review',
    'artwork.read',
    'release.read',
    'assignment.view',
    'comment.create',
    'schedule.personal',
    'profile.upload',
  ],

  /** Collaborator — assigned work only */
  contributor: [
    'media.read', 'media.upload',
    'artwork.read', 'artwork.upload',
    'profile.upload',
    'release.read',
    // no release.write / release.delete / release.publish
    'artist.read',
    // no people.manage
    'assignment.view',
    // no assignment.manage
    'comment.create',
    // no organization.manage, user.invite, user.remove, admin.access
    'schedule.personal',
    // no schedule.team / schedule.reschedule
    'readiness.view',
    // no readiness.manage (go/no-go)
  ],

  viewer: [
    'media.read',
    'artwork.read',
    'release.read',
    'schedule.personal',
  ],
};

/**
 * Legacy role identifiers still present in existing membership records.
 * Normalized to their closest canonical role so older data keeps working.
 */
const ROLE_ALIASES: Record<string, RoleId> = {
  admin: 'administrator',
  release_manager: 'project_manager',
  member: 'contributor',
  collaborator: 'contributor',
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

/** True when role is a full platform administrator (or owner). */
export function isElevatedAdminRole(roleId: string | null | undefined): boolean {
  const n = normalizeRoleId(roleId);
  return n === 'owner' || n === 'administrator';
}

/** True when role is manager-tier (can coordinate, not full org admin). */
export function isManagerRole(roleId: string | null | undefined): boolean {
  const n = normalizeRoleId(roleId);
  return n === 'project_manager' || isElevatedAdminRole(roleId);
}

/** True when role is collaborator-tier (contributor or pure viewer). */
export function isCollaboratorRole(roleId: string | null | undefined): boolean {
  const n = normalizeRoleId(roleId);
  return n === 'contributor' || n === 'viewer' || n === 'producer' || n === 'designer' || n === 'engineer' || n === 'reviewer';
}
