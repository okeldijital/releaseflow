/**
 * BUILD-301B — Server-side Dropbox temporary download URL.
 * URL is delivery only — not asset identity.
 */

import { NextResponse } from 'next/server';
import {
  dropboxGetTemporaryLink,
  isDropboxConfigured,
} from '@/lib/server/dropbox';
import {
  requireAuthenticatedUid,
  requireOrgMediaPermission,
} from '@/lib/server/dropbox/auth-context';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isDropboxConfigured()) {
      return NextResponse.json(
        { error: 'Dropbox configuration is incomplete.' },
        { status: 500 },
      );
    }

    const auth = await requireAuthenticatedUid(request);
    if ('error' in auth) return auth.error;

    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
      providerFileId?: string;
      providerPath?: string;
    };

    if (!body.organizationId || (!body.providerFileId && !body.providerPath)) {
      return NextResponse.json(
        { error: 'Missing organizationId and providerFileId or providerPath.' },
        { status: 400 },
      );
    }

    const perm = await requireOrgMediaPermission(
      body.organizationId,
      auth.uid,
      'media.read',
    );
    if (perm !== true) return perm.error;

    const pathOrId = body.providerFileId || body.providerPath!;
    const result = await dropboxGetTemporaryLink({ pathOrId });

    return NextResponse.json({
      downloadUrl: result.link,
      providerFileId: result.metadata.id,
      providerPath: result.metadata.path_display ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Dropbox download URL failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
