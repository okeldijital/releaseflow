/**
 * BUILD-031A / RBAC-001 — Canonical permission identifiers.
 *
 * Single source of truth for every authorization decision.
 * Do not rename existing identifiers; add new ones as modules onboard.
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

  // --- Artwork module ---
  ArtworkRead: 'artwork.read',
  ArtworkUpload: 'artwork.upload',
  ArtworkReplace: 'artwork.replace',
  ArtworkDelete: 'artwork.delete',

  // --- Profile ---
  ProfileUpload: 'profile.upload',

  // --- Releases ---
  ReleaseRead: 'release.read',
  ReleaseWrite: 'release.write',
  ReleaseDelete: 'release.delete',
  ReleasePublish: 'release.publish',

  // --- Artists / people ---
  ArtistRead: 'artist.read',
  ArtistWrite: 'artist.write',
  PeopleManage: 'people.manage',

  // --- Assignments / workflow ---
  AssignmentManage: 'assignment.manage',
  AssignmentView: 'assignment.view',
  WorkflowManage: 'workflow.manage',
  CommentCreate: 'comment.create',

  // --- Organization / users ---
  OrganizationManage: 'organization.manage',
  UserInvite: 'user.invite',
  UserRemove: 'user.remove',
  AdminAccess: 'admin.access',

  // --- Schedule ---
  ScheduleTeam: 'schedule.team',
  SchedulePersonal: 'schedule.personal',
  ScheduleReschedule: 'schedule.reschedule',

  // --- Readiness ---
  ReadinessView: 'readiness.view',
  ReadinessManage: 'readiness.manage',
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

/**
 * Named capability helpers — map product language to permission ids.
 * UI and services should prefer these over raw strings where possible.
 */
/**
 * Named business capabilities → permission ids.
 * Prefer AuthorizationService.canCreateRelease() over raw permission strings.
 */
export const CAPABILITIES = {
  viewDashboard: PERMISSIONS.ReleaseRead,
  viewReleases: PERMISSIONS.ReleaseRead,
  createRelease: PERMISSIONS.ReleaseWrite,
  editRelease: PERMISSIONS.ReleaseWrite,
  deleteRelease: PERMISSIONS.ReleaseDelete,
  publishRelease: PERMISSIONS.ReleasePublish,
  approveRelease: PERMISSIONS.ReleasePublish,
  inviteUsers: PERMISSIONS.UserInvite,
  inviteCollaborators: PERMISSIONS.UserInvite,
  removeUsers: PERMISSIONS.UserRemove,
  manageUsers: PERMISSIONS.UserRemove,
  manageOrganization: PERMISSIONS.OrganizationManage,
  viewOrganizationSettings: PERMISSIONS.OrganizationManage,
  viewAdministration: PERMISSIONS.AdminAccess,
  accessAdministration: PERMISSIONS.AdminAccess,
  manageAssignments: PERMISSIONS.AssignmentManage,
  assignWork: PERMISSIONS.AssignmentManage,
  viewAssignments: PERMISSIONS.AssignmentView,
  reviewAssignment: PERMISSIONS.MediaReview,
  comment: PERMISSIONS.CommentCreate,
  viewTeamSchedule: PERMISSIONS.ScheduleTeam,
  viewPersonalSchedule: PERMISSIONS.SchedulePersonal,
  rescheduleAssignments: PERMISSIONS.ScheduleReschedule,
  viewReleaseReadiness: PERMISSIONS.ReadinessView,
  viewReadiness: PERMISSIONS.ReadinessView,
  goNoGo: PERMISSIONS.ReadinessManage,
  managePeople: PERMISSIONS.PeopleManage,
  viewNotifications: PERMISSIONS.ReleaseRead, // any active member with release.read
  viewAnalytics: PERMISSIONS.AdminAccess,
  uploadMedia: PERMISSIONS.MediaUpload,
  uploadArtwork: PERMISSIONS.ArtworkUpload,
} as const;

export type CapabilityName = keyof typeof CAPABILITIES;
