/**
 * BUILD-031A — Pure authorization decision logic.
 *
 * These helpers contain the actual "allow / deny" computation and have no
 * dependency on Firestore. The membership lookup (which differs between the
 * client SDK and the Admin SDK) lives in the web Authorization Service, which
 * delegates the decision here. This keeps the permission model single-sourced.
 */

import { getRolePermissions } from './roles';
import type { Permission } from './permissions';

/**
 * Resolve the effective role id from a membership record. Returns `null` when
 * the record is missing, inactive, or carries an unknown role.
 */
export function resolveRole(membership: { roleId?: string | null; status?: string } | null | undefined): string | null {
  if (!membership) return null;
  if (membership.status && membership.status !== 'active') return null;
  return membership.roleId ?? null;
}

/** True when the role grants the requested permission. */
export function roleGrantsPermission(roleId: string | null | undefined, permission: Permission): boolean {
  const permissions = getRolePermissions(roleId);
  if (permissions === null) return false;
  return permissions.includes(permission);
}

/** Resolve the permission set for a role, returning an empty array when unknown. */
export function resolvePermissions(roleId: string | null | undefined): Permission[] {
  return getRolePermissions(roleId) ?? [];
}
