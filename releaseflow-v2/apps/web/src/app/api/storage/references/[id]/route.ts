/**
 * BUILD-301F — Get / update / delete a single storage reference.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  deleteReferenceSafe,
  getReferenceSafe,
  StorageReferenceError,
  updateReferenceSafe,
} from '@/lib/storage/storage-reference-service';
import type { UpdateStorageReferenceInput } from '@/lib/storage/storage-reference-types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const organizationId = parseOrganizationId(request);
  const perm = await requireOrgStoragePermission(
    organizationId,
    auth.uid,
    'storage.read',
  );
  if (perm !== true) return perm.error;

  const reference = await getReferenceSafe(organizationId, id);
  if (!reference) {
    return NextResponse.json(
      { error: 'Storage reference not found.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ reference });
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateStorageReferenceInput & {
    organizationId?: string;
    downloadUrl?: string;
  };
  void body.downloadUrl;

  const organizationId = parseOrganizationId(request, body.organizationId);
  const perm = await requireOrgStoragePermission(
    organizationId,
    auth.uid,
    'storage.manage',
  );
  if (perm !== true) return perm.error;

  try {
    const reference = await updateReferenceSafe(organizationId, id, {
      providerPath: body.providerPath,
      status: body.status,
      versioningEnabled: body.versioningEnabled,
      providerVersionId: body.providerVersionId,
      providerETag: body.providerETag,
      providerModifiedAt: body.providerModifiedAt,
      detach: body.detach,
    });
    return NextResponse.json({ reference });
  } catch (err) {
    if (err instanceof StorageReferenceError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: 'Storage reference could not be updated.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: Ctx) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const organizationId = parseOrganizationId(request);
  const perm = await requireOrgStoragePermission(
    organizationId,
    auth.uid,
    'storage.manage',
  );
  if (perm !== true) return perm.error;

  try {
    await deleteReferenceSafe(organizationId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StorageReferenceError && err.code === 'NOT_FOUND') {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Storage reference could not be deleted.' },
      { status: 500 },
    );
  }
}
