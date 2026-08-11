/**
 * BUILD-301E — Routing preview (no upload, no provider API calls).
 *
 * POST body: AssetRoutingContext fields
 * Response: AssetRoutingPreviewDto
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  previewAssetRoute,
  AssetRoutingError,
  toRoutingPreviewDto,
  isRoutableAssetType,
} from '@/lib/storage';
import type { AssetType } from '@/lib/asset-entity-repository';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    organizationName?: string;
    assetType?: string;
    releaseId?: string;
    releaseName?: string;
    artistId?: string;
    artistName?: string;
    trackId?: string;
    trackName?: string;
    filename?: string;
    version?: string;
    year?: string | number;
    month?: string | number;
  };

  const organizationId = parseOrganizationId(request, body.organizationId);
  const perm = await requireOrgStoragePermission(
    organizationId,
    auth.uid,
    'storage.read',
  );
  if (perm !== true) return perm.error;

  if (!body.assetType || !isRoutableAssetType(body.assetType)) {
    return NextResponse.json(
      { error: 'A valid asset type is required for routing preview.' },
      { status: 400 },
    );
  }

  try {
    const route = await previewAssetRoute({
      organizationId,
      organizationName: body.organizationName,
      assetType: body.assetType as AssetType,
      releaseId: body.releaseId,
      releaseName: body.releaseName,
      artistId: body.artistId,
      artistName: body.artistName,
      trackId: body.trackId,
      trackName: body.trackName,
      filename: body.filename,
      version: body.version,
      year: body.year,
      month: body.month,
    });
    return NextResponse.json({ preview: toRoutingPreviewDto(route) });
  } catch (err) {
    if (err instanceof AssetRoutingError) {
      const status =
        err.code === 'MISSING_POLICY'
          ? 404
          : err.code === 'DUPLICATE_POLICY'
            ? 409
            : err.code === 'POLICY_ORG_MISMATCH' ||
                err.code === 'LOCATION_ORG_MISMATCH' ||
                err.code === 'TEMPLATE_ORG_MISMATCH'
              ? 403
              : 400;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    return NextResponse.json(
      { error: 'Routing preview could not be resolved.' },
      { status: 500 },
    );
  }
}
