import { NextResponse } from 'next/server';
import { cloudinaryConfig } from '@releaseflow/firebase/cloudinary/config';
import { signUpload } from '@releaseflow/firebase/cloudinary/signature';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';
import { hasPermission, type MembershipResolver } from '@/lib/auth/authorization-service';
import { resolveRole } from '@releaseflow/core/auth/authorization';

export const runtime = 'nodejs';

const ROOT_FOLDER = 'releaseflow';

// Server-controlled mapping of entity type → org-scoped subfolder.
const ENTITY_SUBFOLDER: Record<string, string> = {
  release: 'releases',
  artist: 'artists',
  person: 'people',
  marketing: 'marketing',
  artwork: 'releases',
  avatar: 'avatars',
};

// Membership resolution via the Admin SDK. The role → permission decision is
// delegated to the Authorization Service; we only resolve the active role here.
const serverMembershipResolver: MembershipResolver = async (organizationId, uid) => {
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
      entityType?: string;
      entityId?: string;
      organizationId?: string;
      tags?: string[];
    };

    if (!body.entityType || !body.entityId || !body.organizationId) {
      return NextResponse.json({ error: 'Missing upload context.' }, { status: 400 });
    }

    const permission = body.entityType === 'artwork' ? 'artwork.upload' : body.entityType === 'avatar' ? 'profile.upload' : 'media.upload';
    if (!(await hasPermission(body.organizationId, uid, permission, { membershipResolver: serverMembershipResolver }))) {
      return NextResponse.json(
        { error: `You do not have permission to upload ${body.entityType === 'artwork' ? 'artwork' : body.entityType === 'avatar' ? 'avatar' : 'media'} for this organization.` },
        { status: 403 },
      );
    }

    const subfolder = ENTITY_SUBFOLDER[body.entityType] ?? 'assets';
    const folder = `${ROOT_FOLDER}/${body.organizationId}/${subfolder}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = signUpload({ folder, timestamp });

    return NextResponse.json({
      cloudName: cfg.cloudName,
      apiKey: cfg.apiKey,
      timestamp: signed.timestamp,
      signature: signed.signature,
      folder: signed.folder,
      context: {
        organizationId: body.organizationId,
        entityType: body.entityType,
        entityId: body.entityId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload signature failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
