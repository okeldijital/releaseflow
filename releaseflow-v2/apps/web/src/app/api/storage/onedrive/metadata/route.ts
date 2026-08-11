/**
 * BUILD-301F — OneDrive known-object metadata (not discovery).
 * Auth → membership → permission → then Graph item metadata.
 * Neutral errors. No tokens. No download URL as identity.
 */

import { NextResponse } from 'next/server';
import {
  onedriveGetMetadata,
  isOneDriveConfigured,
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

    const result = await onedriveGetMetadata({ itemId: body.providerFileId });

    return NextResponse.json({
      providerFileId: result.providerFileId,
      providerPath: result.providerPath,
      filename: result.filename,
      sizeBytes: result.sizeBytes,
      contentType: result.contentType,
      providerVersionId: result.providerVersionId,
      providerETag: result.providerETag,
      providerModifiedAt: result.providerModifiedAt,
    });
  } catch {
    return NextResponse.json(
      { error: neutralStorageFailure('metadata') },
      { status: 500 },
    );
  }
}
