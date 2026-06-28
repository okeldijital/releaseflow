import { type ReactNode } from 'react';

export interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  section?: string;
}

export interface NavSection {
  key: string;
  label: string;
}

interface SidebarProps {
  items: NavItem[];
  sections: NavSection[];
  activePath: string;
  onNavigate: (href: string) => void;
  userEmail?: string;
  userImage?: string;
  onSignOut: () => void;
  collapsed?: boolean;
  onToggle: () => void;
}

function isActive(activePath: string, item: NavItem): boolean {
  if (item.href === '/') return activePath === '/';
  return activePath === item.href || activePath.startsWith(item.href + '/');
}

function LogoMark() {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500 shadow-sm shrink-0"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 fill-white"
        aria-hidden="true"
      >
        <path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" />
      </svg>
    </div>
  );
}

export function Sidebar({
  items,
  sections,
  activePath,
  onNavigate,
  userEmail,
  onSignOut,
  collapsed = false,
  onToggle,
}: SidebarProps) {
  const sectionLabelMap = new Map(sections.map((s) => [s.key, s.label]));
  const sectionOrder = sections.map((s) => s.key);

  const grouped = items.reduce(
    (acc, item) => {
      const key = item.section ?? sectionOrder[0] ?? 'default';
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>,
  );

  const initials = userEmail?.charAt(0).toUpperCase() ?? '?';

  return (
    <>
      {!collapsed ? (
        <aside
          className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-surface-200 bg-surface-50 lg:static lg:z-auto dark:bg-surface-900 dark:border-surface-700"
          aria-label="Main navigation"
        >
          <div className="flex h-16 items-center gap-3 border-b border-surface-200 px-6 dark:border-surface-700">
            <LogoMark />
            <span className="text-base font-semibold text-text-900 tracking-tight dark:text-text-50">
              ReleaseFlow
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6" aria-label="Site navigation">
            {sectionOrder.map((key) => {
              const groupItems = grouped[key];
              if (!groupItems || groupItems.length === 0) return null;
              const label = sectionLabelMap.get(key) ?? key;

              return (
                <div key={key}>
                  <p
                    className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-400 dark:text-text-500"
                    role="heading"
                    aria-level={2}
                  >
                    {label}
                  </p>

                  <ul className="space-y-1" role="list">
                    {groupItems.map((item) => {
                      const active = isActive(activePath, item);
                      return (
                        <li key={item.href}>
                          <button
                            onClick={() => onNavigate(item.href)}
                            aria-current={active ? 'page' : undefined}
                            className={`
                              flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-left
                              transition-colors duration-100 ease-out
                              ${
                                active
                                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                  : 'text-text-600 hover:bg-surface-100 hover:text-text-900 dark:text-text-400 dark:hover:bg-surface-800 dark:hover:text-text-100'
                              }
                            `.trim()}
                          >
                            <span
                              className={`h-4 w-4 shrink-0 ${active ? 'text-primary-500' : 'text-text-400'}`}
                              aria-hidden="true"
                            >
                              {item.icon}
                            </span>

                            <span className="flex-1">{item.label}</span>

                            {active ? (
                              <span
                                className="h-2 w-2 rounded-full bg-primary-500 shrink-0"
                                aria-hidden="true"
                              />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-surface-200 px-3 py-3 dark:border-surface-700">
            <div className="flex items-center gap-3 rounded-md px-3 py-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-800 dark:text-text-200">
                  {userEmail}
                </p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-text-500 hover:bg-surface-100 hover:text-text-800 dark:hover:bg-surface-800 dark:hover:text-text-200 transition-colors duration-100"
            >
              Sign out
            </button>
          </div>
        </aside>
      ) : null}

      {!collapsed ? (
        <div
          className="fixed inset-0 z-30 bg-surface-900/30 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}

export function SidebarMobileToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="rounded-md p-2 text-text-500 hover:bg-surface-100 hover:text-text-900 transition-colors duration-100 lg:hidden"
      onClick={onToggle}
      aria-label={collapsed ? 'Open navigation menu' : 'Close navigation menu'}
      aria-expanded={!collapsed}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
