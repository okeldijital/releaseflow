/**
 * BUILD-220A — Canonical module tab configuration contract.
 *
 * Configuration-driven module navigation (EPIC-220).
 * Presentational only — no domain or data-fetching concerns.
 */

export interface PageTab {
  /** Stable identifier for the tab (e.g. "all", "draft"). */
  id: string;
  /** Visible label. */
  label: string;
  /** Path-based module URL (e.g. "/releases", "/releases/draft"). */
  href: string;
  /** When true, tab is not interactive. */
  disabled?: boolean;
  /** Optional count/badge (e.g. draft count). */
  badge?: string | number;
}

export interface PageTabsProps {
  /** Ordered tab configuration for the current module. */
  tabs: PageTab[];
  /**
   * Explicit active tab id. When omitted, active state is derived from
   * `pathname` via longest-prefix matching.
   */
  activeTab?: string;
  /**
   * Current location pathname (e.g. from Next.js usePathname).
   * Required for automatic active detection when `activeTab` is not set.
   */
  pathname?: string;
  /**
   * Navigation adapter. When provided, click prevents default and calls this
   * (App Router: router.push). Without it, native <a href> navigation is used.
   */
  onNavigate?: (href: string) => void;
  className?: string;
  /** Accessible name for the tab list. */
  'aria-label'?: string;
}
