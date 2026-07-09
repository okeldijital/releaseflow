import { NextResponse } from 'next/server';
import { cloudinaryConfig } from '@releaseflow/firebase/cloudinary/config';
import { signUpload } from '@releaseflow/firebase/cloudinary/signature';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';

export const runtime = 'nodejs';

const ENTITY_FOLDERS: Record<string, string> = {
  release: cloudinaryConfig.folders.releases,
  artist: cloudinaryConfig.folders.avatars,
  person: cloudinaryConfig.folders.avatars,
};

function configIncomplete(): boolean {
  return !cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret;
}

async function isOrgMember(uid: string, organizationId: string): Promise<boolean> {
  const db = getAdminDb();
  const snap = await db
    .collection('memberships')
    .where('userId', '==', uid)
    .where('organizationId', '==', organizationId)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  return !snap.empty;
}

export async function POST(request: Request) {
  try {
    if (configIncomplete()) {
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

    if (!(await isOrgMember(uid, body.organizationId))) {
      return NextResponse.json(
        { error: 'You do not have permission to upload artwork for this release.' },
        { status: 403 },
      );
    }

    const folder = ENTITY_FOLDERS[body.entityType] ?? cloudinaryConfig.folders.assets;
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = signUpload({ folder, timestamp });

    return NextResponse.json({
      cloudName: cloudinaryConfig.cloudName,
      apiKey: cloudinaryConfig.apiKey,
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
