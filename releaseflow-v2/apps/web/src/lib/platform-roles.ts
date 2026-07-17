/**
 * CE-001 — Platform Role → system role mapping.
 *
 * Platform roles are the security-defining roles an administrator assigns to a
 * collaborator via an invitation: `administrator`, `release_manager`,
 * `collaborator`. They map onto the canonical system roles defined in
 * `packages/core/src/auth/roles.ts` so that the Authorization Service resolves
 * permissions without any invitation-specific logic.
 *
 * Permissions are NEVER stored on invitations — they are inherited from the
 * platform role through `ROLE_PERMISSIONS`.
 */
import type { PlatformRole } from './invitation-repository';

/** Map a CE-001 platform role to a canonical membership/system role id. */
export function platformRoleToSystemRole(platformRole: PlatformRole): string {
  switch (platformRole) {
    case 'administrator':
      return 'administrator';
    case 'release_manager':
      return 'release_manager';
    case 'collaborator':
      return 'contributor';
    default:
      return 'contributor';
  }
}

/** Map a canonical system role back to the nearest CE-001 platform role. */
export function systemRoleToPlatformRole(roleId: string | null | undefined): PlatformRole {
  switch (roleId) {
    case 'administrator':
    case 'admin':
    case 'owner':
      return 'administrator';
    case 'release_manager':
    case 'project_manager':
      return 'release_manager';
    default:
      return 'collaborator';
  }
}

/**
 * Human-readable labels for platform (security) roles.
 * DOM-001: Manager / Contributor (not creative contribution roles).
 */
export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  administrator: 'Administrator',
  release_manager: 'Manager',
  collaborator: 'Contributor',
};

export const PLATFORM_ROLE_OPTIONS: PlatformRole[] = ['administrator', 'release_manager', 'collaborator'];
