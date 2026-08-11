/**
 * BUILD-301E — List / create organization storage policies.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  createPolicySafe,
  listPoliciesSafe,
  StoragePolicyConfigError,
} from '@/lib/storage/storage-policy-service';
import type { CreateStoragePolicyInput } from '@/lib/storage/storage-policy-types';

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
    const policies = await listPoliciesSafe(organizationId);
    return NextResponse.json({ policies });
  } catch {
    return NextResponse.json(
      { error: 'Storage policies could not be loaded.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as CreateStoragePolicyInput & {
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
    const policy = await createPolicySafe(organizationId, {
      name: body.name ?? '',
      assetType: body.assetType,
      storageLocationId: body.storageLocationId,
      folderTemplateId: body.folderTemplateId,
      versioningEnabled: body.versioningEnabled,
      autoCreateFolders: body.autoCreateFolders,
      active: body.active,
    });
    return NextResponse.json({ policy }, { status: 201 });
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
      { error: 'Storage policy could not be saved.' },
      { status: 500 },
    );
  }
}
