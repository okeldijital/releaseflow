/**
 * BUILD-301D — Auth helpers for organization storage configuration APIs.
 */

import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';
import { AuthorizationService, type MembershipResolver } from '@/lib/auth/authorization-service';
import { resolveRole } from '@releaseflow/core/auth/authorization';
import type { Permission } from '@releaseflow/core/auth/permissions';

export const serverMembershipResolver: MembershipResolver = async (
  organizationId,
  uid,
) => {
  const db = getAdminDb();
  const snap = await db
    .collection('memberships')
    .where('userId', '==', uid)
    .where('organizationId', '==', organizationId)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  if (snap.empty) return null;
  const data = snap.docs[0]?.data() as
    | { roleId?: string | null; status?: string }
    | undefined;
  return resolveRole(data);
};

export async function requireAuthenticatedUid(
  request: Request,
): Promise<{ uid: string } | { error: Response }> {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
}

export async function requireOrgStoragePermission(
  organizationId: string,
  uid: string,
  permission: Permission,
): Promise<true | { error: Response }> {
  if (!organizationId) {
    return {
      error: new Response(JSON.stringify({ error: 'Missing organizationId.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  const ok = await AuthorizationService.canAsync(
    permission,
    organizationId,
    uid,
    { membershipResolver: serverMembershipResolver },
  );
  if (!ok) {
    return {
      error: new Response(
        JSON.stringify({
          error: 'You do not have permission for this storage configuration operation.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }
  return true;
}

export function parseOrganizationId(
  request: Request,
  bodyOrg?: string | null,
): string {
  const url = new URL(request.url);
  return (
    bodyOrg
    || url.searchParams.get('organizationId')
    || request.headers.get('x-organization-id')
    || ''
  );
}
