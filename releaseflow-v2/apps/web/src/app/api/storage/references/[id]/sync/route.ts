/**
 * BUILD-301F — Sync one known StorageReference (Provider → RF metadata).
 *
 * Pipeline: Firebase auth → membership → storage permission → reference lookup
 * → org validation → location validation → provider registry → known providerFileId
 * → provider getMetadata → update sync fields.
 *
 * Never calls provider before authorization. Not discovery / list / sync-all.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import { syncStorageReference } from '@/lib/storage/storage-reference-sync';
import { StorageReferenceError } from '@/lib/storage/storage-reference-service';
import { StorageError, isStorageError } from '@/lib/storage/errors';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
  };
  const organizationId = parseOrganizationId(request, body.organizationId);

  const perm = await requireOrgStoragePermission(
    organizationId,
    auth.uid,
    'storage.manage',
  );
  if (perm !== true) return perm.error;

  // Forward the same bearer token for provider transport (Dropbox/OneDrive routes)
  const authHeader = request.headers.get('authorization') ?? '';
  const accessToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  try {
    const reference = await syncStorageReference({
      organizationId,
      referenceId: id,
      accessToken,
    });
    return NextResponse.json({ reference });
  } catch (err) {
    if (isStorageError(err) && err.code === 'UNSUPPORTED_OPERATION') {
      return NextResponse.json(
        { error: 'Storage operation is not supported.', code: err.code },
        { status: 400 },
      );
    }
    if (err instanceof StorageReferenceError) {
      const status =
        err.code === 'NOT_FOUND'
          ? 404
          : err.code === 'FORBIDDEN' || err.code === 'LOCATION_ORG_MISMATCH'
            ? 403
            : 400;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    if (err instanceof StorageError) {
      return NextResponse.json(
        { error: 'Storage metadata synchronization failed.' },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: 'Storage metadata synchronization failed.' },
      { status: 500 },
    );
  }
}
