/**
 * BUILD-031A — Canonical permission registry (single source of truth).
 *
 * Every permission defined in ./permissions has exactly one registry entry
 * describing what it does and which roles receive it by default. Future
 * modules seed their permissions here so the platform keeps one consistent
 * RBAC surface instead of each feature inventing its own access rules.
 */

import type { Permission } from './permissions';
import type { RoleId } from './roles';

export interface PermissionRegistryEntry {
  /** Stable permission identifier (must match ./permissions). */
  id: Permission;
  /** Human-readable description of the action this permission grants. */
  description: string;
  /** Roles that receive this permission by default. */
  defaultRoles: RoleId[];
  /** Modules / features that consume this permission. */
  usedBy: string[];
}

export const PERMISSION_REGISTRY: readonly PermissionRegistryEntry[] = Object.freeze([
  {
    id: 'media.read',
    description: 'View media assets and their versions, reviews, and usage.',
    defaultRoles: ['owner', 'administrator', 'project_manager', 'producer', 'designer', 'engineer', 'reviewer', 'contributor', 'viewer'],
    usedBy: ['Release Artwork', 'Artist Images', 'People Images', 'Marketing Assets'],
  },
  {
    id: 'media.upload',
    description: 'Upload new media assets.',
    defaultRoles: ['owner', 'administrator', 'project_manager', 'producer', 'designer', 'contributor'],
    usedBy: ['Release Artwork', 'Artist Images', 'People Images', 'Marketing Assets'],
  },
  {
    id: 'media.replace',
    description: 'Replace the contents of an existing media asset with a new version.',
    defaultRoles: ['owner', 'administrator', 'project_manager', 'designer'],
    usedBy: ['Release Artwork', 'Artist Images'],
  },
  {
    id: 'media.delete',
    description: 'Delete media assets (when not in use).',
    defaultRoles: ['owner', 'administrator'],
    usedBy: ['Release Artwork', 'Marketing Assets'],
  },
  {
    id: 'media.review',
    description: 'Submit reviews and change requests on media assets.',
    defaultRoles: ['owner', 'administrator', 'project_manager', 'designer', 'reviewer'],
    usedBy: ['Approvals', 'Reviews'],
  },
  {
    id: 'media.approve',
    description: 'Approve or reject media assets.',
    defaultRoles: ['owner', 'administrator', 'project_manager'],
    usedBy: ['Approvals'],
  },
  {
    id: 'media.restore',
    description: 'Restore a previous version of a media asset.',
    defaultRoles: ['owner', 'administrator', 'project_manager'],
    usedBy: ['Release Artwork'],
  },
  {
    id: 'release.read',
    description: 'View releases and their related metadata.',
    defaultRoles: ['owner', 'administrator', 'project_manager'],
    usedBy: ['Releases', 'Schedule'],
  },
  {
    id: 'release.write',
    description: 'Create and edit releases.',
    defaultRoles: ['owner', 'administrator', 'project_manager'],
    usedBy: ['Releases'],
  },
  {
    id: 'artist.read',
    description: 'View artists and their catalog.',
    defaultRoles: ['owner', 'administrator', 'project_manager'],
    usedBy: ['Artists'],
  },
  {
    id: 'artist.write',
    description: 'Create and edit artists.',
    defaultRoles: ['owner', 'administrator', 'project_manager'],
    usedBy: ['Artists'],
  },
  {
    id: 'assignment.manage',
    description: 'Manage task and resource assignments.',
    defaultRoles: ['owner', 'administrator', 'project_manager'],
    usedBy: ['Assignments', 'My Work'],
  },
  {
    id: 'workflow.manage',
    description: 'Manage workflows, stages, and dependencies.',
    defaultRoles: ['owner', 'administrator', 'project_manager'],
    usedBy: ['Workflows', 'Schedule'],
  },
  {
    id: 'organization.manage',
    description: 'Manage organization settings and structure.',
    defaultRoles: ['owner'],
    usedBy: ['Administration'],
  },
  {
    id: 'user.invite',
    description: 'Invite users and manage membership.',
    defaultRoles: ['owner', 'administrator'],
    usedBy: ['Members', 'Invitations'],
  },
]);

const REGISTRY_BY_ID = new Map<Permission, PermissionRegistryEntry>(
  PERMISSION_REGISTRY.map((entry) => [entry.id, entry]),
);

export function getPermissionRegistryEntry(id: Permission): PermissionRegistryEntry | undefined {
  return REGISTRY_BY_ID.get(id);
}
