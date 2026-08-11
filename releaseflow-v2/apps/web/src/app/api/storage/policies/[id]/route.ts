/**
 * BUILD-301E — Get / update / delete a single storage policy.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  deletePolicySafe,
  getPolicySafe,
  StoragePolicyConfigError,
  updatePolicySafe,
} from '@/lib/storage/storage-policy-service';
import type { UpdateStoragePolicyInput } from '@/lib/storage/storage-policy-types';

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

  const policy = await getPolicySafe(organizationId, id);
  if (!policy) {
    return NextResponse.json(
      { error: 'Storage policy could not be found.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ policy });
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateStoragePolicyInput & {
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
    const policy = await updatePolicySafe(organizationId, id, {
      name: body.name,
      assetType: body.assetType,
      storageLocationId: body.storageLocationId,
      folderTemplateId: body.folderTemplateId,
      versioningEnabled: body.versioningEnabled,
      autoCreateFolders: body.autoCreateFolders,
      active: body.active,
    });
    return NextResponse.json({ policy });
  } catch (err) {
    if (err instanceof StoragePolicyConfigError) {
      const status =
        err.code === 'NOT_FOUND'
          ? 404
          : err.code === 'DUPLICATE_POLICY'
            ? 409
            : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: 'Storage policy could not be updated.' },
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
    await deletePolicySafe(organizationId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StoragePolicyConfigError && err.code === 'NOT_FOUND') {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Storage policy could not be deleted.' },
      { status: 500 },
    );
  }
}
