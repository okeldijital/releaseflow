/**
 * BUILD-031A — Authorization Service (web).
 *
 * Single entry point for "does this user have this permission in this org?".
 * Resolution flow:
 *
 *   Authenticated User → Organization Membership → Assigned Role → Permissions
 *
 * The membership lookup is the only DB-touching step and is kept pluggable so
 * the same decision logic serves the client (via getDb) and the server (via the
 * Admin SDK), and so tests can inject a resolver. The role → permission
 * decision itself is delegated to @releaseflow/core (no duplication elsewhere).
 */

import type { Firestore } from '@firebase/firestore';
import { collection, query, where, limit, getDocs } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import {
  resolveRole,
  roleGrantsPermission,
} from '@releaseflow/core/auth/authorization';
import type { Permission } from '@releaseflow/core/auth/permissions';

/** Resolves a membership record's role id, or null when there is no active membership. */
export type MembershipResolver = (
  organizationId: string,
  userId: string,
) => Promise<string | null>;

export interface AuthorizationOptions {
  /** Inject a membership resolver (server Admin SDK, or a mock in tests). */
  membershipResolver?: MembershipResolver;
  /** Inject a Firestore instance. Defaults to the client database. */
  db?: Firestore;
}

function defaultMembershipResolver(db: Firestore): MembershipResolver {
  return async (organizationId, userId) => {
    const snap = await getDocs(
      query(
        collection(db, 'memberships'),
        where('userId', '==', userId),
        where('organizationId', '==', organizationId),
        where('status', '==', 'active'),
        limit(1),
      ),
    );
    if (snap.empty) return null;
    const data = snap.docs[0]?.data() as { roleId?: string | null; status?: string } | undefined;
    return resolveRole(data);
  };
}

/**
 * Returns true when `userId` has `permission` within `organizationId`.
 * Returns false for anonymous users, users with no active membership in the
 * organization, or roles that do not grant the permission.
 */
export async function hasPermission(
  organizationId: string,
  userId: string | null | undefined,
  permission: Permission,
  options: AuthorizationOptions = {},
): Promise<boolean> {
  if (!organizationId || !userId) return false;

  const resolver =
    options.membershipResolver ?? defaultMembershipResolver(options.db ?? (getDb() as Firestore));

  const roleId = await resolver(organizationId, userId);
  if (!roleId) return false;

  return roleGrantsPermission(roleId, permission);
}

export class AuthorizationError extends Error {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly permission: Permission,
  ) {
    super(`Permission denied: ${permission} (org ${organizationId})`);
    this.name = 'AuthorizationError';
  }
}

/** Like hasPermission but throws AuthorizationError instead of returning false. */
export async function requirePermission(
  organizationId: string,
  userId: string | null | undefined,
  permission: Permission,
  options?: AuthorizationOptions,
): Promise<void> {
  const allowed = await hasPermission(organizationId, userId, permission, options);
  if (!allowed) {
    throw new AuthorizationError(organizationId, userId ?? '', permission);
  }
}
