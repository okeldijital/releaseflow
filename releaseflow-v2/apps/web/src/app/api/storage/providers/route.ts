/**
 * BUILD-301D — Provider catalog (registry-backed, no secrets).
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import { buildProviderCatalog } from '@/lib/storage/storage-location-service';
import { isDropboxConfigured } from '@/lib/server/dropbox';
import { isOneDriveConfigured } from '@/lib/server/onedrive';

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

  // Env flags only — never expose actual credential values.
  const providers = buildProviderCatalog({
    dropbox: isDropboxConfigured(),
    onedrive: isOneDriveConfigured(),
    cloudinary: true,
  });

  return NextResponse.json({ providers });
}
