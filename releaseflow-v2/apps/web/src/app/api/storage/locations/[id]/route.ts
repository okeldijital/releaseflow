/**
 * BUILD-301D — Get / update / delete a single storage location.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  deleteLocationSafe,
  getLocationSafe,
  StorageConfigError,
  updateLocationSafe,
} from '@/lib/storage/storage-location-service';
import type { UpdateStorageLocationInput } from '@/lib/storage/storage-location-types';

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

  const location = await getLocationSafe(organizationId, id);
  if (!location) {
    return NextResponse.json(
      { error: 'Storage location could not be found.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ location });
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateStorageLocationInput & {
    organizationId?: string;
  };
  const organizationId = parseOrganizationId(request, body.organizationId);
  const perm = await requireOrgStoragePermission(
    organizationId,
    auth.uid,
    'storage.manage',
  );
  if (perm !== true) return perm.error;

  try {
    const location = await updateLocationSafe(organizationId, id, {
      name: body.name,
      rootPath: body.rootPath,
      status: body.status,
      isDefault: body.isDefault,
    });
    return NextResponse.json({ location });
  } catch (err) {
    if (err instanceof StorageConfigError) {
      const status =
        err.code === 'NOT_FOUND'
          ? 404
          : err.code === 'VALIDATION'
            ? 400
            : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: 'Storage location could not be updated.' },
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
    await deleteLocationSafe(organizationId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StorageConfigError && err.code === 'NOT_FOUND') {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Storage location could not be updated.' },
      { status: 500 },
    );
  }
}
