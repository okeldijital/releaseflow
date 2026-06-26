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
    <header className="sticky top-0 z-10 border-b border-surface-200 bg-white/80 dark:bg-surface-900/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <SidebarMobileToggle collapsed={collapsed} onToggle={onToggle} />
          {breadcrumbs}
        </div>
        <div className="flex items-center gap-4 ml-auto">
          {children}
        </div>
      </div>
    </header>
  );
}

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 ? <span className="text-text-300">/</span> : null}
          {item.href ? (
            <a href={item.href} className="text-text-500 hover:text-text-900 transition-colors">{item.label}</a>
          ) : (
            <span className="text-text-700 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
