/**
 * BUILD-301F — List / create organization storage references.
 * Auth → membership → storage permission → org-scoped operation.
 * Never returns secrets or treats providerFileId as authorization alone.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  createReferenceSafe,
  listReferencesSafe,
  StorageReferenceError,
} from '@/lib/storage/storage-reference-service';
import type { CreateStorageReferenceInput } from '@/lib/storage/storage-reference-types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const organizationId = parseOrganizationId(request);
  const perm = await requireOrgStoragePermission(
    organizationId,
    auth.uid,
    'storage.read',
  );
  if (perm !== true) return perm.error;

  try {
    const references = await listReferencesSafe(organizationId);
    return NextResponse.json({ references });
  } catch {
    return NextResponse.json(
      { error: 'Storage references could not be loaded.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as CreateStorageReferenceInput & {
    organizationId?: string;
    downloadUrl?: string;
  };
  // Explicitly ignore any client-supplied downloadUrl (not identity)
  void body.downloadUrl;

  const organizationId = parseOrganizationId(request, body.organizationId);
  const perm = await requireOrgStoragePermission(
    organizationId,
    auth.uid,
    'storage.manage',
  );
  if (perm !== true) return perm.error;

  try {
    const reference = await createReferenceSafe(organizationId, {
      domainAssetId: body.domainAssetId,
      assetType: body.assetType,
      storageLocationId: body.storageLocationId,
      providerFileId: body.providerFileId,
      providerPath: body.providerPath,
      providerId: body.providerId,
      versioningEnabled: body.versioningEnabled,
      status: body.status,
      providerVersionId: body.providerVersionId,
      providerETag: body.providerETag,
      providerModifiedAt: body.providerModifiedAt,
      currentVersion: body.currentVersion,
    });
    return NextResponse.json({ reference }, { status: 201 });
  } catch (err) {
    if (err instanceof StorageReferenceError) {
      const status =
        err.code === 'NOT_FOUND'
          ? 404
          : err.code === 'FORBIDDEN' || err.code === 'LOCATION_ORG_MISMATCH'
            ? 403
            : err.code === 'LOCATION_INACTIVE' ||
                err.code === 'PROVIDER_MISMATCH' ||
                err.code === 'UNKNOWN_PROVIDER'
              ? 400
              : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: 'Storage reference could not be saved.' },
      { status: 500 },
    );
  }
}
