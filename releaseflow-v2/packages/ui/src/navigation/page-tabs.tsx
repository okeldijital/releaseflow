/**
 * BUILD-220A — Canonical PageTabs (module navigation).
 *
 * Purely navigational/presentational. Module supplies configuration;
 * this component renders labels, active state, and links.
 *
 * Distinct from `Tabs` (in-page panel switching via onChange).
 * PageTabs uses path-based hrefs for App Router module sections.
 */

import { useCallback, useRef } from 'react';
import type { PageTab, PageTabsProps } from './page-tab-types';
import { resolveActivePageTabId } from './page-tab-active';

export type { PageTab, PageTabsProps } from './page-tab-types';
export {
  normalizePageTabPath,
  isPathUnderHref,
  resolveActivePageTab,
  isPageTabActive,
  resolveActivePageTabId,
} from './page-tab-active';

export function PageTabs({
  tabs,
  activeTab,
  pathname,
  onNavigate,
  className = '',
  'aria-label': ariaLabel = 'Module sections',
}: PageTabsProps) {
  const tabRefs = useRef<Map<string, HTMLAnchorElement | HTMLButtonElement>>(
    new Map(),
  );

  const activeId = resolveActivePageTabId(tabs, { activeTab, pathname });

  const focusTab = useCallback((id: string) => {
    tabRefs.current.get(id)?.focus();
  }, []);

  const navigateTo = useCallback(
    (tab: PageTab) => {
      if (tab.disabled) return;
      if (onNavigate) {
        onNavigate(tab.href);
      }
    },
    [onNavigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const enabled = tabs.filter((t) => !t.disabled);
      if (!enabled.length) return;

      const currentId = activeId ?? enabled[0]!.id;
      const idx = enabled.findIndex((t) => t.id === currentId);
      let next: PageTab | null = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next = enabled[(idx + 1) % enabled.length] ?? null;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        next = enabled[(idx - 1 + enabled.length) % enabled.length] ?? null;
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = enabled[0] ?? null;
      } else if (e.key === 'End') {
        e.preventDefault();
        next = enabled[enabled.length - 1] ?? null;
      }

      if (next) {
        navigateTo(next);
        setTimeout(() => focusTab(next!.id), 0);
      }
    },
    [tabs, activeId, navigateTo, focusTab],
  );

  if (!tabs.length) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={`border-b border-surface-200/70 ${className}`}
    >
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex overflow-x-auto"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const active = activeId === tab.id;
          const sharedClass = `
            inline-flex items-center gap-2 shrink-0 whitespace-nowrap
            px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-100
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
            ${active
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-content-secondary hover:text-content-primary hover:border-surface-300'}
            ${tab.disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer'}
          `.trim();

          const badge =
            tab.badge !== undefined && tab.badge !== null && tab.badge !== '' ? (
              <span
                className={`text-xs rounded-full px-2 py-0.5 font-semibold leading-none border ${
                  active
                    ? 'bg-primary-700/20 text-primary-400 border-primary-500'
                    : 'bg-layer-3 text-content-primary border-border-default'
                }`}
              >
                {tab.badge}
              </span>
            ) : null;

          if (tab.disabled) {
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-disabled="true"
                disabled
                tabIndex={-1}
                className={sharedClass}
              >
                {tab.label}
                {badge}
              </button>
            );
          }

          return (
            <a
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              href={tab.href}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              tabIndex={active ? 0 : -1}
              className={sharedClass}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  navigateTo(tab);
                }
              }}
            >
              {tab.label}
              {badge}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
