import { NextResponse } from 'next/server';
import { cloudinaryConfig } from '@releaseflow/firebase/cloudinary/config';
import { getAdminAuth } from '@/lib/server/firebase-admin';
import { hasPermission, type MembershipResolver } from '@/lib/auth/authorization-service';
import { resolveRole } from '@releaseflow/core/auth/authorization';
import { createHash } from 'node:crypto';

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

export async function POST(request: Request) {
  try {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
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
    };

    if (!body.publicId || !body.organizationId) {
      return NextResponse.json({ error: 'Missing publicId or organizationId.' }, { status: 400 });
    }

    if (!(await hasPermission(body.organizationId, uid, 'artwork.delete', { membershipResolver: serverMembershipResolver }))) {
      return NextResponse.json(
        { error: 'You do not have permission to delete artwork for this organization.' },
        { status: 403 },
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams();
    params.append('public_id', body.publicId);
    params.append('api_key', cloudinaryConfig.apiKey);
    params.append('timestamp', String(timestamp));

    const signature = generateDestroySignature(params.toString());

    const formData = new FormData();
    formData.append('public_id', body.publicId);
    formData.append('api_key', cloudinaryConfig.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const destroyRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`,
      { method: 'POST', body: formData },
    );

    const data = await destroyRes.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? 'Cloudinary destroy failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Artwork destroy failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateDestroySignature(params: string): string {
  const sortedParams = params
    .split('&')
    .filter(Boolean)
    .sort()
    .join('&');
  const stringToSign = `${sortedParams}${cloudinaryConfig.apiSecret}`;
  return createHash('sha1').update(stringToSign).digest('hex');
}
