/**
 * BUILD-031A / RBAC-001 — Canonical permission registry (single source of truth).
 */

import type { Permission } from './permissions';
import type { RoleId } from './roles';

export interface PermissionRegistryEntry {
  id: Permission;
  description: string;
  defaultRoles: RoleId[];
  usedBy: string[];
}

const MANAGERS: RoleId[] = ['owner', 'administrator', 'project_manager'];
const ALL_MEMBERS: RoleId[] = [
  'owner', 'administrator', 'project_manager', 'producer', 'designer',
  'engineer', 'reviewer', 'contributor', 'viewer',
];
const WORKERS: RoleId[] = [
  'owner', 'administrator', 'project_manager', 'producer', 'designer',
  'engineer', 'reviewer', 'contributor',
];

export const PERMISSION_REGISTRY: readonly PermissionRegistryEntry[] = Object.freeze([
  {
    id: 'media.read',
    description: 'View media assets and their versions, reviews, and usage.',
    defaultRoles: ALL_MEMBERS,
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
    defaultRoles: MANAGERS,
    usedBy: ['Approvals'],
  },
  {
    id: 'media.restore',
    description: 'Restore a previous version of a media asset.',
    defaultRoles: MANAGERS,
    usedBy: ['Release Artwork'],
  },
  {
    id: 'artwork.read',
    description: 'View release artwork.',
    defaultRoles: ALL_MEMBERS,
    usedBy: ['Release Workspace'],
  },
  {
    id: 'artwork.upload',
    description: 'Upload release artwork.',
    defaultRoles: ['owner', 'administrator', 'project_manager', 'producer', 'designer', 'contributor'],
    usedBy: ['Release Workspace'],
  },
  {
    id: 'artwork.replace',
    description: 'Replace an existing release artwork.',
    defaultRoles: ['owner', 'administrator', 'project_manager', 'designer'],
    usedBy: ['Release Workspace'],
  },
  {
    id: 'artwork.delete',
    description: 'Delete release artwork.',
    defaultRoles: MANAGERS,
    usedBy: ['Release Workspace'],
  },
  {
    id: 'profile.upload',
    description: 'Upload and update profile avatar.',
    defaultRoles: WORKERS,
    usedBy: ['Profile'],
  },
  {
    id: 'release.read',
    description: 'View releases and related metadata.',
    defaultRoles: ALL_MEMBERS,
    usedBy: ['Releases', 'Schedule', 'Collaborator Workspace'],
  },
  {
    id: 'release.write',
    description: 'Create and edit releases.',
    defaultRoles: MANAGERS,
    usedBy: ['Releases'],
  },
  {
    id: 'release.delete',
    description: 'Delete or archive releases.',
    defaultRoles: ['owner', 'administrator'],
    usedBy: ['Releases'],
  },
  {
    id: 'release.publish',
    description: 'Publish a release or change public distribution status.',
    defaultRoles: MANAGERS,
    usedBy: ['Releases', 'Distribution'],
  },
  {
    id: 'artist.read',
    description: 'View artists and their catalog.',
    defaultRoles: [...MANAGERS, 'contributor', 'producer', 'designer', 'engineer', 'reviewer'],
    usedBy: ['Artists'],
  },
  {
    id: 'artist.write',
    description: 'Create and edit artists.',
    defaultRoles: MANAGERS,
    usedBy: ['Artists'],
  },
  {
    id: 'people.manage',
    description: 'Manage people directory and professional roles.',
    defaultRoles: MANAGERS,
    usedBy: ['People', 'Invitations'],
  },
  {
    id: 'assignment.manage',
    description: 'Assign, reassign, and delete work assignments.',
    defaultRoles: MANAGERS,
    usedBy: ['Assignments'],
  },
  {
    id: 'assignment.view',
    description: 'View assignments (own or team depending on role).',
    defaultRoles: WORKERS,
    usedBy: ['Assignments', 'My Work'],
  },
  {
    id: 'workflow.manage',
    description: 'Manage workflows, stages, and dependencies.',
    defaultRoles: MANAGERS,
    usedBy: ['Workflows', 'Schedule'],
  },
  {
    id: 'comment.create',
    description: 'Comment and reply on assignments and releases.',
    defaultRoles: WORKERS,
    usedBy: ['Assignment Collaboration'],
  },
  {
    id: 'organization.manage',
    description: 'Manage organization settings and structure.',
    defaultRoles: ['owner', 'administrator'],
    usedBy: ['Administration'],
  },
  {
    id: 'user.invite',
    description: 'Invite users to the organization.',
    defaultRoles: MANAGERS,
    usedBy: ['Members', 'Invitations'],
  },
  {
    id: 'user.remove',
    description: 'Remove users from the organization.',
    defaultRoles: ['owner', 'administrator'],
    usedBy: ['Members'],
  },
  {
    id: 'admin.access',
    description: 'Access the administration workspace.',
    defaultRoles: ['owner', 'administrator'],
    usedBy: ['Administration'],
  },
  {
    id: 'schedule.team',
    description: 'View team schedule and capacity planning.',
    defaultRoles: MANAGERS,
    usedBy: ['Schedule'],
  },
  {
    id: 'schedule.personal',
    description: 'View personal schedule.',
    defaultRoles: WORKERS,
    usedBy: ['Schedule', 'Collaborator Workspace'],
  },
  {
    id: 'schedule.reschedule',
    description: 'Reschedule assignments for the team.',
    defaultRoles: MANAGERS,
    usedBy: ['Schedule'],
  },
  {
    id: 'readiness.view',
    description: 'View release readiness (limited for collaborators).',
    defaultRoles: [...MANAGERS, 'contributor'],
    usedBy: ['Release Readiness'],
  },
  {
    id: 'readiness.manage',
    description: 'Go / No-Go decisions and readiness management.',
    defaultRoles: MANAGERS,
    usedBy: ['Release Readiness'],
  },
]);

const REGISTRY_BY_ID = new Map<Permission, PermissionRegistryEntry>(
  PERMISSION_REGISTRY.map((entry) => [entry.id, entry]),
);

export function getPermissionRegistryEntry(id: Permission): PermissionRegistryEntry | undefined {
  return REGISTRY_BY_ID.get(id);
}
