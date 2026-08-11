/**
 * BUILD-301E — Folder Template model.
 *
 * Logical folder structure only. No provider-specific paths or SDKs.
 * Path: organizations/{organizationId}/folder_templates/{id}
 */

/** Supported template variables (EPIC-301 folder-template design). */
export const FOLDER_TEMPLATE_VARIABLES = [
  'Organization',
  'Artist',
  'Release',
  'Track',
  'Year',
  'Month',
  'AssetType',
  'Version',
] as const;

export type FolderTemplateVariable = (typeof FOLDER_TEMPLATE_VARIABLES)[number];

/**
 * Organization-owned logical folder template.
 * `structure` is a logical path with optional {Variable} placeholders.
 */
export interface FolderTemplateRecord {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  /** Logical path e.g. /{Artist}/{Release}/{AssetType} */
  structure: string;
  active: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface FolderTemplateSafeDto {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  structure: string;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateFolderTemplateInput {
  name: string;
  structure: string;
  description?: string | null;
  active?: boolean;
}

export interface UpdateFolderTemplateInput {
  name?: string;
  structure?: string;
  description?: string | null;
  active?: boolean;
}

function timestampToIso(value: unknown): string | null {
  if (
    value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value) return String(value);
  return null;
}

export function toFolderTemplateSafeDto(
  record: FolderTemplateRecord,
): FolderTemplateSafeDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    description: record.description ?? null,
    structure: record.structure,
    active: record.active,
    createdAt: timestampToIso(record.createdAt),
    updatedAt: timestampToIso(record.updatedAt),
  };
}
