/**
 * BUILD-301C — Server-side OneDrive upload.
 * Credentials never leave this process.
 */

import { NextResponse } from 'next/server';
import {
  isOneDriveConfigured,
  onedriveUpload,
  neutralStorageFailure,
  validateOrgBoundPath,
} from '@/lib/server/onedrive';
import {
  requireAuthenticatedUid,
  requireOrgMediaPermission,
} from '@/lib/server/onedrive/auth-context';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isOneDriveConfigured()) {
      return NextResponse.json(
        { error: neutralStorageFailure('config') },
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

    const hasFile =
      file != null
      && typeof file === 'object'
      && typeof (file as Blob).arrayBuffer === 'function';
    if (!hasFile || !organizationId || !path) {
      return NextResponse.json(
        { error: 'Missing file, organizationId, or path.' },
        { status: 400 },
      );
    }

    const pathCheck = validateOrgBoundPath(path, organizationId);
    if (!pathCheck.ok) {
      return NextResponse.json({ error: pathCheck.error }, { status: 400 });
    }

    const perm = await requireOrgMediaPermission(
      organizationId,
      auth.uid,
      'media.upload',
    );
    if (perm !== true) return perm.error;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await onedriveUpload({
      path: pathCheck.path,
      contents: buffer,
      contentType,
    });

    // Never return access tokens or vendor secrets.
    return NextResponse.json({
      providerId: 'onedrive',
      providerFileId: result.providerFileId,
      providerPath: result.providerPath,
      filename: result.filename || filename || 'file',
      sizeBytes: result.sizeBytes,
      contentType: result.contentType,
      downloadUrl: null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : neutralStorageFailure('upload');
    // Prefer already-neutral messages from onedrive-api
    return NextResponse.json(
      { error: message.includes('Storage ') ? message : neutralStorageFailure('upload') },
      { status: 500 },
    );
  }
}
