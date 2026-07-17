'use client';

import type { NavItem } from './sidebar';

interface BottomNavProps {
  items: NavItem[];
  activePath: string;
  onNavigate: (href: string) => void;
}

function isActive(activePath: string, item: NavItem): boolean {
  if (item.href === '/') return activePath === '/';
  return activePath === item.href || activePath.startsWith(item.href + '/');
}

export function BottomNav({ items, activePath, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 z-50
        flex items-center justify-around
        bg-layer-2 border-t border-border-default
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
            onClick={() => onNavigate(item.href)}
            aria-current={active ? 'page' : undefined}
            className={`
              flex flex-col items-center gap-0.5
              pt-2 pb-1 px-3 min-w-0 flex-1
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
              ${active
                ? 'text-primary-400'
                : 'text-content-label hover:text-content-secondary'
              }
            `}
          >
            <span className="relative h-6 w-6 shrink-0" aria-hidden="true">
              {item.icon}
              {item.badge != null && item.badge > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary-500 text-white text-[9px] font-semibold flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] font-medium leading-tight truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
