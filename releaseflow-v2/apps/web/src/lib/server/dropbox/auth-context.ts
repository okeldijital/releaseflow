/**
 * Shared RF auth + membership helpers for Dropbox storage API routes.
 */

import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';
import { AuthorizationService, type MembershipResolver } from '@/lib/auth/authorization-service';
import { resolveRole } from '@releaseflow/core/auth/authorization';

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

export async function requireOrgMediaPermission(
  organizationId: string,
  uid: string,
  permission: 'media.upload' | 'media.delete' | 'media.read' = 'media.upload',
): Promise<true | { error: Response }> {
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
          error: 'You do not have permission for this storage operation.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }
  return true;
}
