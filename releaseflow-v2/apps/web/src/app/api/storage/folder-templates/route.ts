/**
 * BUILD-301E — List / create organization folder templates.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  createTemplateSafe,
  listTemplatesSafe,
  FolderTemplateConfigError,
} from '@/lib/storage/folder-template-service';
import type { CreateFolderTemplateInput } from '@/lib/storage/folder-template-types';

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
    const templates = await listTemplatesSafe(organizationId);
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json(
      { error: 'Folder templates could not be loaded.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as CreateFolderTemplateInput & {
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
    const template = await createTemplateSafe(organizationId, {
      name: body.name ?? '',
      structure: body.structure ?? '',
      description: body.description,
      active: body.active,
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    if (err instanceof FolderTemplateConfigError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: 'Folder template could not be saved.' },
      { status: 500 },
    );
  }
}
