/**
 * BUILD-014D — Canonical media destroy endpoint.
 * Replaces /api/artwork/destroy and /api/avatar/destroy.
 *
 * Signature string-to-sign: public_id + timestamp only (never api_key).
 */
import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { cloudinaryConfig } from '@releaseflow/firebase/cloudinary/config';
import { getAdminAuth } from '@/lib/server/firebase-admin';
import { AuthorizationService, type MembershipResolver } from '@/lib/auth/authorization-service';
import { resolveRole } from '@releaseflow/core/auth/authorization';

export const runtime = 'nodejs';

const serverMembershipResolver: MembershipResolver = async (organizationId, uid) => {
  const { getAdminDb } = await import('@/lib/server/firebase-admin');
  const db = getAdminDb();
  const snap = await db
    .collection('memberships')
    .where('userId', '==', uid)
    .where('organizationId', '==', organizationId)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  if (snap.empty) return null;
  const data = snap.docs[0]?.data() as { roleId?: string | null; status?: string } | undefined;
  return resolveRole(data);
};

function destroyPermission(entityType: string): 'artwork.delete' | 'profile.upload' | 'media.upload' {
  if (entityType === 'artwork') return 'artwork.delete';
  if (entityType === 'avatar') return 'profile.upload';
  return 'media.upload';
}

function generateDestroySignature(params: string[], apiSecret: string): string {
  const sortedParams = params.sort().join('&');
  const stringToSign = `${sortedParams}${apiSecret}`;
  return createHash('sha1').update(stringToSign).digest('hex');
}

export async function POST(request: Request) {
  try {
    let cfg;
    try {
      cfg = cloudinaryConfig();
    } catch {
      return NextResponse.json({ error: 'Cloudinary configuration is incomplete.' }, { status: 500 });
    }
    if (!cfg.cloudName || !cfg.apiKey || !cfg.apiSecret) {
      return NextResponse.json({ error: 'Cloudinary configuration is incomplete.' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = (await request.json().catch(() => ({}))) as {
      publicId?: string;
      organizationId?: string;
      entityType?: string;
    };

    if (!body.publicId || !body.organizationId || !body.entityType) {
      return NextResponse.json(
        { error: 'Missing publicId, organizationId, or entityType.' },
        { status: 400 },
      );
    }

    const permission = destroyPermission(body.entityType);
    if (!(await AuthorizationService.canAsync(permission, body.organizationId, uid, {
      membershipResolver: serverMembershipResolver,
    }))) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this media.' },
        { status: 403 },
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    // BUILD-010 / BUG-010: only public_id + timestamp in the string-to-sign.
    const paramPairs = [
      `public_id=${body.publicId}`,
      `timestamp=${timestamp}`,
    ];
    const signature = generateDestroySignature(paramPairs, cfg.apiSecret);

    const formData = new FormData();
    formData.append('public_id', body.publicId);
    formData.append('api_key', cfg.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const destroyRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`,
      { method: 'POST', body: formData },
    );

    const data = await destroyRes.json();
    if (data.error) {
      return NextResponse.json(
        { error: data.error.message ?? 'Cloudinary destroy failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Media destroy failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
