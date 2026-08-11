/**
 * BUILD-301E — Get / update / delete a single folder template.
 */

import { NextResponse } from 'next/server';
import {
  requireAuthenticatedUid,
  requireOrgStoragePermission,
  parseOrganizationId,
} from '@/lib/server/storage/auth-context';
import {
  deleteTemplateSafe,
  getTemplateSafe,
  FolderTemplateConfigError,
  updateTemplateSafe,
} from '@/lib/storage/folder-template-service';
import type { UpdateFolderTemplateInput } from '@/lib/storage/folder-template-types';

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

  const template = await getTemplateSafe(organizationId, id);
  if (!template) {
    return NextResponse.json(
      { error: 'Folder template could not be found.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ template });
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await requireAuthenticatedUid(request);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateFolderTemplateInput & {
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
    const template = await updateTemplateSafe(organizationId, id, {
      name: body.name,
      structure: body.structure,
      description: body.description,
      active: body.active,
    });
    return NextResponse.json({ template });
  } catch (err) {
    if (err instanceof FolderTemplateConfigError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: 'Folder template could not be updated.' },
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
    await deleteTemplateSafe(organizationId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof FolderTemplateConfigError && err.code === 'NOT_FOUND') {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Folder template could not be deleted.' },
      { status: 500 },
    );
  }
}
