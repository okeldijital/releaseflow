/**
 * BUILD-031A — Canonical permission identifiers.
 *
 * Permissions are string constants consumed by the role definitions
 * (./roles) and the authorization service. They form the stable contract
 * between every ReleaseFlow module (media, releases, assignments, approvals,
 * budgeting, and future modules) and the permission registry (./registry).
 *
 * Do not rename an existing identifier; treat them as API surface. Add new
 * identifiers as modules onboard to the platform authorization model.
 */

export const PERMISSIONS = {
  // --- Media subsystem ---
  MediaRead: 'media.read',
  MediaUpload: 'media.upload',
  MediaReplace: 'media.replace',
  MediaDelete: 'media.delete',
  MediaReview: 'media.review',
  MediaApprove: 'media.approve',
  MediaRestore: 'media.restore',

  // --- Platform (seeded, consumed by future modules) ---
  ReleaseRead: 'release.read',
  ReleaseWrite: 'release.write',
  ArtistRead: 'artist.read',
  ArtistWrite: 'artist.write',
  AssignmentManage: 'assignment.manage',
  WorkflowManage: 'workflow.manage',
  OrganizationManage: 'organization.manage',
  UserInvite: 'user.invite',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** All permission identifiers, used for wildcard expansion. */
export const ALL_PERMISSIONS: readonly Permission[] = Object.freeze(
  Object.values(PERMISSIONS) as Permission[],
);

/** Wildcard granted to the Owner role (and any role marked with `*`). */
export const WILDCARD = '*' as const;
export type Wildcard = typeof WILDCARD;

export function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}
