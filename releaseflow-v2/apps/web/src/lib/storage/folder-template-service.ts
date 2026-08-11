/**
 * BUILD-301E — Domain-facing folder template operations.
 */

import {
  createFolderTemplate,
  deleteFolderTemplate,
  getFolderTemplate,
  listFolderTemplates,
  updateFolderTemplate,
} from './folder-template-repository';
import type {
  CreateFolderTemplateInput,
  FolderTemplateSafeDto,
  UpdateFolderTemplateInput,
} from './folder-template-types';
import { toFolderTemplateSafeDto } from './folder-template-types';
import { validateFolderTemplateStructure } from './folder-template-resolver';
import { AssetRoutingError } from './asset-routing-types';

export class FolderTemplateConfigError extends Error {
  readonly code: 'VALIDATION' | 'NOT_FOUND' | 'FORBIDDEN';

  constructor(code: FolderTemplateConfigError['code'], message: string) {
    super(message);
    this.name = 'FolderTemplateConfigError';
    this.code = code;
  }
}

export function validateTemplateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    throw new FolderTemplateConfigError(
      'VALIDATION',
      'Folder template name is required.',
    );
  }
  if (trimmed.length > 120) {
    throw new FolderTemplateConfigError(
      'VALIDATION',
      'Folder template name is too long.',
    );
  }
  return trimmed;
}

function validateStructureSafe(structure: string): string {
  try {
    return validateFolderTemplateStructure(structure);
  } catch (err) {
    if (err instanceof AssetRoutingError) {
      throw new FolderTemplateConfigError('VALIDATION', err.message);
    }
    throw err;
  }
}

export async function listTemplatesSafe(
  organizationId: string,
): Promise<FolderTemplateSafeDto[]> {
  const rows = await listFolderTemplates(organizationId);
  return rows.map(toFolderTemplateSafeDto);
}

export async function getTemplateSafe(
  organizationId: string,
  id: string,
): Promise<FolderTemplateSafeDto | null> {
  const row = await getFolderTemplate(organizationId, id);
  return row ? toFolderTemplateSafeDto(row) : null;
}

export async function createTemplateSafe(
  organizationId: string,
  input: CreateFolderTemplateInput,
): Promise<FolderTemplateSafeDto> {
  const name = validateTemplateName(input.name);
  const structure = validateStructureSafe(input.structure);
  const created = await createFolderTemplate(organizationId, {
    ...input,
    name,
    structure,
  });
  return toFolderTemplateSafeDto(created);
}

export async function updateTemplateSafe(
  organizationId: string,
  id: string,
  input: UpdateFolderTemplateInput,
): Promise<FolderTemplateSafeDto> {
  let next = { ...input };
  if (next.name !== undefined) {
    next = { ...next, name: validateTemplateName(next.name) };
  }
  if (next.structure !== undefined) {
    next = { ...next, structure: validateStructureSafe(next.structure) };
  }
  const updated = await updateFolderTemplate(organizationId, id, next);
  if (!updated) {
    throw new FolderTemplateConfigError(
      'NOT_FOUND',
      'Folder template could not be found.',
    );
  }
  return toFolderTemplateSafeDto(updated);
}

export async function deleteTemplateSafe(
  organizationId: string,
  id: string,
): Promise<void> {
  const ok = await deleteFolderTemplate(organizationId, id);
  if (!ok) {
    throw new FolderTemplateConfigError(
      'NOT_FOUND',
      'Folder template could not be found.',
    );
  }
}
