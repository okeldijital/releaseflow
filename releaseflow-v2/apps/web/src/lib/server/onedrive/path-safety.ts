/**
 * BUILD-301C — Transitional path binding for shared-provider storage.
 *
 * Does NOT implement Storage Policy / Folder Template.
 * Ensures provisional paths remain under /ReleaseFlow/{organizationId}/.
 */

export const ONEDRIVE_PATH_ROOT = '/ReleaseFlow';

/**
 * Provisional path when no resolved providerPath is supplied.
 * Adapter-local only; future BUILD-301E owns authoritative resolution.
 */
export function buildProvisionalOneDrivePath(
  organizationId: string,
  entityType: string,
  entityId: string,
  filename: string,
): string {
  const safeName = filename.replace(/[/\\]/g, '_');
  return `${ONEDRIVE_PATH_ROOT}/${organizationId}/${entityType}/${entityId}/${safeName}`;
}

/**
 * True when path is bound to the given organisation prefix.
 * Paths use leading slash; comparison is case-sensitive on org id.
 */
export function isPathBoundToOrganization(
  path: string,
  organizationId: string,
): boolean {
  if (!path || !organizationId) return false;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const prefix = `${ONEDRIVE_PATH_ROOT}/${organizationId}/`;
  return normalized === `${ONEDRIVE_PATH_ROOT}/${organizationId}`
    || normalized.startsWith(prefix);
}

/**
 * Validates path against organization. Returns normalized path or error message.
 */
export function validateOrgBoundPath(
  path: string,
  organizationId: string,
): { ok: true; path: string } | { ok: false; error: string } {
  if (!path.trim()) {
    return { ok: false, error: 'Invalid storage path.' };
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Reject path traversal
  if (normalized.includes('..')) {
    return { ok: false, error: 'Invalid storage path.' };
  }
  if (!isPathBoundToOrganization(normalized, organizationId)) {
    return { ok: false, error: 'Storage path is not allowed for this organization.' };
  }
  return { ok: true, path: normalized };
}
