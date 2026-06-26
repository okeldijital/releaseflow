import { type ReactNode } from 'react';

export interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  section?: string;
}

interface SidebarProps {
  items: NavItem[];
  activePath: string;
  onNavigate: (href: string) => void;
  userEmail?: string;
  userImage?: string;
  onSignOut: () => void;
  collapsed?: boolean;
  onToggle: () => void;
}

const sections: Record<string, string> = {
  operations: 'Operations',
  execution: 'Execution',
  monitoring: 'Monitoring',
  administration: 'Administration',
};

export function Sidebar({ items, activePath, onNavigate, userEmail, onSignOut, collapsed = false, onToggle }: SidebarProps) {
  const grouped = items.reduce((acc, item) => {
    const s = item.section ?? 'operations';
    if (!acc[s]) acc[s] = [];
    acc[s]!.push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <>
      {!collapsed ? (
        <aside className="fixed inset-y-0 left-0 z-30 w-60 transform border-r border-surface-200 bg-white dark:bg-surface-900 transition-transform lg:static lg:translate-x-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2 border-b border-surface-200 px-6">
              <div className="h-6 w-6 rounded-md bg-primary-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">R</span>
              </div>
              <span className="text-lg font-bold text-text-900">ReleaseFlow</span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              {Object.entries(grouped).map(([key, groupItems]) => (
                <div key={key}>
                  <p className="px-3 text-xs font-medium text-text-400 uppercase tracking-wider mb-2">{sections[key] ?? key}</p>
                  <div className="space-y-1">
                    {groupItems.map((item) => {
                      const active = activePath === item.href || activePath.startsWith(item.href + '/');
                      return (
                        <button
                          key={item.href}
                          onClick={() => onNavigate(item.href)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full text-left transition-colors ${
                            active
                              ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                              : 'text-text-500 hover:bg-surface-100 hover:text-text-900 dark:hover:bg-surface-800 dark:hover:text-text-100'
                          }`}
                        >
                          <span className="h-5 w-5 shrink-0">{item.icon}</span>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-surface-200 px-3 py-4">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-200 text-xs font-medium text-text-500">
                  {userEmail?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-900">{userEmail}</p>
                </div>
              </div>
              <button onClick={onSignOut} className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-text-500 hover:bg-surface-100 hover:text-text-900 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </aside>
      ) : null}
      {collapsed ? (
        <div className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={onToggle} />
      ) : null}
    </>
  );
}

export function SidebarMobileToggle({ collapsed: _collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <button className="lg:hidden rounded-lg p-2 text-text-500 hover:bg-surface-100" onClick={onToggle}>
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
