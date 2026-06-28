import { type ReactNode } from 'react';
import { SidebarMobileToggle } from './sidebar';

interface TopbarProps {
  collapsed: boolean;
  onToggle: () => void;
  breadcrumbs?: ReactNode;
  children?: ReactNode;
}

export function Topbar({ collapsed, onToggle, breadcrumbs, children }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-200 bg-white/90 backdrop-blur-md dark:bg-surface-900/90 dark:border-surface-700">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <SidebarMobileToggle collapsed={collapsed} onToggle={onToggle} />

        <div className="flex-1 min-w-0">
          {breadcrumbs}
        </div>

        {children ? (
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {children}
          </div>
        ) : null}
      </div>
    </header>
  );
}

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 ? (
              <svg
                className="h-3 w-3 text-text-300 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            ) : null}
            {item.href && i < items.length - 1 ? (
              <a
                href={item.href}
                className="text-text-400 hover:text-text-700 transition-colors duration-100 dark:text-text-500 dark:hover:text-text-300"
              >
                {item.label}
              </a>
            ) : (
              <span
                className="font-medium text-text-800 dark:text-text-200"
                aria-current={i === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
