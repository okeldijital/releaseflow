/**
 * BUILD-301E — Provider-neutral folder template resolver.
 *
 * Replaces known variables; rejects unresolved variables; preserves segment
 * boundaries; prevents traversal; rejects malformed / escape paths.
 * Deterministic. Does not call any storage provider.
 */

import {
  FOLDER_TEMPLATE_VARIABLES,
  type FolderTemplateVariable,
} from './folder-template-types';
import { AssetRoutingError } from './asset-routing-types';
import type { AssetRoutingContext } from './asset-routing-types';

const VARIABLE_PATTERN = /\{([A-Za-z]+)\}/g;

/** Values available for substitution from routing context. */
export type TemplateVariableValues = Partial<
  Record<FolderTemplateVariable, string>
>;

/**
 * Build variable map from routing context.
 * Only includes keys with non-empty resolved values.
 * Missing keys are left unset so the resolver can reject them.
 */
export function buildTemplateVariableValues(
  context: AssetRoutingContext,
): TemplateVariableValues {
  const values: TemplateVariableValues = {};

  const set = (key: FolderTemplateVariable, raw: unknown) => {
    if (raw === undefined || raw === null) return;
    const s = String(raw).trim();
    if (!s) return;
    values[key] = s;
  };

  set('Organization', context.organizationName);
  set('Artist', context.artistName);
  set('Release', context.releaseName);
  set('Track', context.trackName);
  set('Year', context.year);
  set('Month', context.month);
  set('AssetType', context.assetType);
  set('Version', context.version);

  return values;
}

/**
 * Validate a template structure string (create/update time).
 * Does not require variable values — only structure integrity.
 */
export function validateFolderTemplateStructure(structure: string): string {
  const trimmed = structure.trim();
  if (!trimmed) {
    throw new AssetRoutingError(
      'TEMPLATE_RESOLUTION',
      'Folder template structure is required.',
    );
  }
  if (trimmed.includes('..')) {
    throw new AssetRoutingError(
      'PATH_SECURITY',
      'Folder template must not contain path traversal segments.',
    );
  }
  // Reject Windows drive escapes / provider URI schemes
  if (/^[a-zA-Z]:/.test(trimmed) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    throw new AssetRoutingError(
      'PATH_SECURITY',
      'Folder template must not use provider-specific or absolute escape paths.',
    );
  }

  // Known variables only
  const matches = [...trimmed.matchAll(VARIABLE_PATTERN)];
  for (const m of matches) {
    const name = m[1];
    if (!name) continue;
    if (
      !(FOLDER_TEMPLATE_VARIABLES as readonly string[]).includes(name)
    ) {
      throw new AssetRoutingError(
        'TEMPLATE_RESOLUTION',
        `Unknown folder template variable: {${name}}.`,
      );
    }
  }

  // Unmatched braces
  const withoutVars = trimmed.replace(VARIABLE_PATTERN, '');
  if (withoutVars.includes('{') || withoutVars.includes('}')) {
    throw new AssetRoutingError(
      'TEMPLATE_RESOLUTION',
      'Folder template structure is malformed.',
    );
  }

  // Empty path segments (except leading slash only)
  const segments = trimmed.split('/').filter((s, i) => {
    // allow leading empty from absolute-looking logical path
    if (i === 0 && s === '') return false;
    return true;
  });
  for (const seg of segments) {
    if (seg === '') {
      throw new AssetRoutingError(
        'TEMPLATE_RESOLUTION',
        'Folder template has empty path segments.',
      );
    }
    if (seg === '.' || seg === '..') {
      throw new AssetRoutingError(
        'PATH_SECURITY',
        'Folder template must not contain path traversal segments.',
      );
    }
  }

  return trimmed;
}

/**
 * Resolve a logical template path with context values.
 * Returns a logical relative path starting with `/` (no trailing slash unless root).
 */
export function resolveFolderTemplate(
  structure: string,
  values: TemplateVariableValues,
): string {
  const validated = validateFolderTemplateStructure(structure);

  // Collect required variables from template
  const required = new Set<string>();
  for (const m of validated.matchAll(VARIABLE_PATTERN)) {
    if (m[1]) required.add(m[1]);
  }

  for (const name of required) {
    const val = values[name as FolderTemplateVariable];
    if (val === undefined || val === null || String(val).trim() === '') {
      throw new AssetRoutingError(
        'TEMPLATE_RESOLUTION',
        `Missing required template variable: {${name}}.`,
      );
    }
    // Reject values that inject traversal or path separators
    const s = String(val).trim();
    if (s.includes('..') || s.includes('/') || s.includes('\\')) {
      throw new AssetRoutingError(
        'PATH_SECURITY',
        `Template variable {${name}} contains an invalid path value.`,
      );
    }
  }

  let resolved = validated.replace(VARIABLE_PATTERN, (_full, name: string) => {
    const val = values[name as FolderTemplateVariable];
    return String(val).trim();
  });

  // Normalize segment boundaries
  resolved = normalizeLogicalPath(resolved);

  if (resolved.includes('..')) {
    throw new AssetRoutingError(
      'PATH_SECURITY',
      'Resolved template path contains path traversal.',
    );
  }

  return resolved;
}

/**
 * Normalize to a single leading-slash logical path without `//` or trailing slash.
 */
export function normalizeLogicalPath(path: string): string {
  const parts = path
    .replace(/\\/g, '/')
    .split('/')
    .filter((p) => p.length > 0 && p !== '.');
  if (parts.some((p) => p === '..')) {
    throw new AssetRoutingError(
      'PATH_SECURITY',
      'Path contains traversal segments.',
    );
  }
  return '/' + parts.join('/');
}

/**
 * Combine storage location rootPath with resolved template path.
 * Final destination must remain under rootPath. Template cannot override root.
 */
export function combineRootAndTemplatePath(
  rootPath: string,
  resolvedTemplatePath: string,
): string {
  const root = normalizeLogicalPath(rootPath || '/');
  const relative = normalizeLogicalPath(resolvedTemplatePath);

  // Strip leading slash from relative for join under root
  const relativeParts = relative.split('/').filter(Boolean);
  const rootParts = root.split('/').filter(Boolean);
  const finalParts = [...rootParts, ...relativeParts];

  if (finalParts.some((p) => p === '..')) {
    throw new AssetRoutingError(
      'PATH_SECURITY',
      'Final destination path contains traversal.',
    );
  }

  const finalPath = '/' + finalParts.join('/');

  // Ensure final is under root (root is prefix of final segments)
  if (root !== '/' && finalPath !== root && !finalPath.startsWith(root + '/')) {
    throw new AssetRoutingError(
      'PATH_SECURITY',
      'Resolved path escapes the storage location root.',
    );
  }

  return finalPath;
}
