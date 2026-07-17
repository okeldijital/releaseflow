'use client';

import type { NavItem } from './sidebar';

interface BottomNavProps {
  items: NavItem[];
  activePath: string;
  onNavigate: (href: string) => void;
}

function isActive(activePath: string, item: NavItem): boolean {
  if (item.href === '/') return activePath === '/';
  return activePath === item.href || activePath.startsWith(`${item.href}/`);
}

/**
 * MUX-001 — Mobile bottom navigation.
 * 48px+ touch targets, safe-area inset, phone only.
 */
export function BottomNav({ items, activePath, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 z-50
        flex items-stretch justify-around
        bg-layer-2/95 backdrop-blur-md border-t border-border-default
        pb-[env(safe-area-inset-bottom)]
        md:hidden
      "
      aria-label="Bottom navigation"
    >
      {items.map((item) => {
        const active = isActive(activePath, item);
        return (
          <button
            key={item.href}
            type="button"
            onClick={() => onNavigate(item.href)}
            aria-current={active ? 'page' : undefined}
            className={`
              flex flex-col items-center justify-center gap-0.5
              min-h-[56px] min-w-[48px] flex-1 px-1
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40
              ${active
                ? 'text-primary-400'
                : 'text-content-label active:text-content-secondary'
              }
            `}
          >
            <span className="relative h-6 w-6 shrink-0" aria-hidden="true">
              {item.icon}
              {item.badge != null && item.badge > 0 ? (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-500 text-white text-[10px] font-semibold flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium leading-tight truncate max-w-full px-0.5">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
