/**
 * BUILD-220A — Deterministic active-tab resolution for path-based module tabs.
 *
 * Rules:
 * - Prefer exact path match.
 * - Else prefer the longest href that is a path prefix of the current path.
 * - Never use naive substring matching (e.g. includes("/releases")).
 * - At most one tab is considered active.
 */

import type { PageTab } from './page-tab-types';

/** Normalize path for comparison: strip query/hash, trailing slash (except root). */
export function normalizePageTabPath(pathname: string): string {
  if (!pathname) return '/';
  let p = pathname.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  const noQuery = p.split('?')[0] ?? p;
  const noHash = noQuery.split('#')[0] ?? noQuery;
  p = noHash;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

/**
 * True when `path` is exactly `href` or a nested path under `href`
 * (boundary-safe: `/releases` matches `/releases/draft`, not `/releases-extra`).
 */
export function isPathUnderHref(path: string, href: string): boolean {
  const p = normalizePageTabPath(path);
  const h = normalizePageTabPath(href);
  if (p === h) return true;
  if (h === '/') return p.startsWith('/');
  return p.startsWith(`${h}/`);
}

/**
 * Resolve the single active tab for a pathname among a tab list.
 * Returns null when no tab matches.
 */
export function resolveActivePageTab(
  pathname: string,
  tabs: readonly PageTab[],
): PageTab | null {
  if (!tabs.length) return null;
  const path = normalizePageTabPath(pathname);

  const exact = tabs.find((t) => normalizePageTabPath(t.href) === path);
  if (exact) return exact;

  const candidates = tabs
    .map((tab) => ({ tab, href: normalizePageTabPath(tab.href) }))
    .filter(({ href }) => isPathUnderHref(path, href))
    .sort((a, b) => b.href.length - a.href.length);

  return candidates[0]?.tab ?? null;
}

/**
 * Whether a specific tab is the active one for the current path.
 */
export function isPageTabActive(
  pathname: string,
  tab: PageTab,
  tabs: readonly PageTab[],
): boolean {
  const active = resolveActivePageTab(pathname, tabs);
  return active?.id === tab.id;
}

/**
 * Resolve active tab id from explicit prop or pathname.
 */
export function resolveActivePageTabId(
  tabs: readonly PageTab[],
  options: { activeTab?: string; pathname?: string },
): string | null {
  if (options.activeTab) {
    const found = tabs.find((t) => t.id === options.activeTab);
    return found ? found.id : null;
  }
  if (options.pathname !== undefined) {
    return resolveActivePageTab(options.pathname, tabs)?.id ?? null;
  }
  return null;
}
