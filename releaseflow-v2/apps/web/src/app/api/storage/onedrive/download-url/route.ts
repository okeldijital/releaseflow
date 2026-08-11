/**
 * BUILD-301C — Server-side OneDrive ephemeral download URL.
 * URL is delivery only — not asset identity.
 */

import { NextResponse } from 'next/server';
import {
  isOneDriveConfigured,
  onedriveGetDownloadUrl,
  neutralStorageFailure,
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

    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
      providerFileId?: string;
    };

    if (!body.organizationId || !body.providerFileId) {
      return NextResponse.json(
        { error: 'Missing organizationId or providerFileId.' },
        { status: 400 },
      );
    }

    const perm = await requireOrgMediaPermission(
      body.organizationId,
      auth.uid,
      'media.read',
    );
    if (perm !== true) return perm.error;

    const result = await onedriveGetDownloadUrl({
      itemId: body.providerFileId,
    });

    return NextResponse.json({
      downloadUrl: result.downloadUrl,
      providerFileId: result.providerFileId,
      providerPath: result.providerPath,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : neutralStorageFailure('download');
    return NextResponse.json(
      { error: message.includes('Storage ') ? message : neutralStorageFailure('download') },
      { status: 500 },
    );
  }
}
