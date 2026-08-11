/**
 * BUILD-301B — Server-side Dropbox upload.
 * Credentials never leave this process.
 */

import { NextResponse } from 'next/server';
import {
  dropboxUpload,
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

    const form = await request.formData();
    const file = form.get('file');
    const organizationId = String(form.get('organizationId') ?? '');
    const path = String(form.get('path') ?? '');
    const filename = String(form.get('filename') ?? '');
    const contentType = String(form.get('contentType') ?? '') || undefined;

    if (!(file instanceof Blob) || !organizationId || !path) {
      return NextResponse.json(
        { error: 'Missing file, organizationId, or path.' },
        { status: 400 },
      );
    }

    const perm = await requireOrgMediaPermission(
      organizationId,
      auth.uid,
      'media.upload',
    );
    if (perm !== true) return perm.error;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await dropboxUpload({
      path,
      contents: buffer,
      contentType,
    });

    return NextResponse.json({
      providerId: 'dropbox',
      providerFileId: result.providerFileId,
      providerPath: result.providerPath,
      filename: result.filename || filename || 'file',
      sizeBytes: result.sizeBytes,
      contentHash: result.contentHash,
      serverModified: result.serverModified,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Dropbox upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
