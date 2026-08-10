/**
 * BUILD-220A — Canonical module page hierarchy slots.
 *
 * Enforces EPIC-220 order without domain logic:
 *   Page Header → PageTabs → Toolbar → Content
 *
 * Global search stays in the shell top bar (not here).
 */

import type { ReactNode } from 'react';

export interface ModulePageProps {
  /** Page title / actions region. */
  header?: ReactNode;
  /** Module navigation — typically `<PageTabs … />`. */
  tabs?: ReactNode;
  /** Filters, view toggles, primary actions for the active tab. */
  toolbar?: ReactNode;
  /** Main module content. Optional when chrome-only (e.g. tabs + external body). */
  children?: ReactNode;
  className?: string;
}

/**
 * Composition layout for module list/hub pages.
 * Does not fetch data or know about Releases/Library/etc.
 */
export function ModulePage({
  header,
  tabs,
  toolbar,
  children,
  className = '',
}: ModulePageProps) {
  return (
    <div className={`flex flex-col gap-0 ${className}`.trim()}>
      {header ? (
        <header className="mb-4 sm:mb-5">{header}</header>
      ) : null}
      {tabs ? <div className="mb-4 sm:mb-5">{tabs}</div> : null}
      {toolbar ? (
        <div className="mb-4 sm:mb-5">{toolbar}</div>
      ) : null}
      {children != null ? (
        <div className="min-w-0 flex-1">{children}</div>
      ) : null}
    </div>
  );
}
