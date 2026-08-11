/**
 * BUILD-301F — Dropbox known-object metadata (not discovery).
 * Auth → membership → permission → then Dropbox get_metadata.
 * Never returns tokens. downloadUrl is not included (not identity).
 */

import { NextResponse } from 'next/server';
import {
  dropboxGetMetadata,
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
    const result = await dropboxGetMetadata({ pathOrId });

    return NextResponse.json({
      providerFileId: result.providerFileId,
      providerPath: result.providerPath,
      filename: result.filename,
      sizeBytes: result.sizeBytes,
      providerVersionId: result.providerVersionId,
      providerETag: result.providerETag,
      providerModifiedAt: result.providerModifiedAt,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Storage metadata synchronization failed.';
    return NextResponse.json(
      { error: message.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]') },
      { status: 500 },
    );
  }
}
