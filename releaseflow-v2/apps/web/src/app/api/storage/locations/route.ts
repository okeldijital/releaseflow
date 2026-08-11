/**
 * BUILD-301D — List / create organization storage locations.
 * Never returns provider secrets.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  createLocationSafe,
  listLocationsSafe,
  StorageConfigError,
} from '@/lib/storage/storage-location-service';
import type { CreateStorageLocationInput } from '@/lib/storage/storage-location-types';

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
    const locations = await listLocationsSafe(organizationId);
    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json(
      { error: 'Storage configuration could not be loaded.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as CreateStorageLocationInput & {
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
    const location = await createLocationSafe(organizationId, {
      name: body.name ?? '',
      providerId: body.providerId,
      rootPath: body.rootPath,
      isDefault: body.isDefault,
      status: body.status,
    });
    return NextResponse.json({ location }, { status: 201 });
  } catch (err) {
    if (err instanceof StorageConfigError) {
      const status =
        err.code === 'UNKNOWN_PROVIDER' || err.code === 'VALIDATION'
          ? 400
          : err.code === 'NOT_FOUND'
            ? 404
            : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: 'Storage configuration could not be saved.' },
      { status: 500 },
    );
  }
}
