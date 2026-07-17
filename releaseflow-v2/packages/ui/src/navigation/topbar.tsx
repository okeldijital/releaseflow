import { type ReactNode, useState, useEffect, useRef } from 'react';

interface TopbarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** id of the sidebar element — used for aria-controls on the mobile toggle */
  sidebarId?: string;
  breadcrumbs?: ReactNode;
  title?: string;
  children?: ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
  userEmail?: string;
  userImage?: string;
  onSignOut?: () => void;
  onNavigate?: (href: string) => void;
}

export function Topbar({
  collapsed, onToggle, sidebarId, breadcrumbs: _breadcrumbs, title: _title, children,
  showSearch = false, onSearch, notificationCount = 0,
  onOpenNotifications, onOpenCommandPalette,
  userEmail, onSignOut, onNavigate,
}: TopbarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  function handleSearch(v: string) {
    setSearchValue(v);
    onSearch?.(v);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  const initials = userEmail?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-transparent">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        {/* Left Section: Mobile drawer toggle */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onToggle}
            className="rounded-lg p-2 text-content-primary hover:bg-surface-100 transition-colors duration-150 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            aria-label={collapsed ? 'Open navigation' : 'Close navigation'}
            aria-expanded={!collapsed}
            aria-controls={sidebarId}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Center/Right Section: Search, Org Switcher, Notifications, User Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {showSearch && (
            <div className="relative w-full max-w-md hidden sm:block">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-4 w-4 text-content-label" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                role="searchbox"
                placeholder="Search releases, tasks, assets..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-[300px] lg:w-[380px] rounded-xl border border-surface-200/70 bg-surface-50 py-1.5 pl-9 pr-14 text-sm text-content-primary placeholder:text-content-label focus:border-primary-400 focus:bg-layer-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-150"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => { setSearchValue(''); onSearch?.(''); }}
                  className="absolute right-11 top-1/2 -translate-y-1/2 p-1 rounded-md text-content-label transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="h-3 w-3" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M3.646 3.646a.5.5 0 01.708 0L7 6.293l2.646-2.647a.5.5 0 01.708.708L7.707 7l2.647 2.646a.5.5 0 01-.708.708L7 7.707 4.354 10.354a.5.5 0 01-.708-.708L6.293 7 3.646 4.354a.5.5 0 010-.708z" />
                  </svg>
                </button>
              ) : null}
              {onOpenCommandPalette && (
                <button
                  onClick={onOpenCommandPalette}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded border border-surface-200 bg-layer-2 px-1.5 py-0.5 text-caption font-medium text-content-label shadow-sm hover:border-surface-300 transition-colors duration-150"
                  aria-label="Open command palette"
                >
                  <kbd className="font-mono text-caption">⌘K</kbd>
                </button>
              )}
            </div>
          )}

          {/* Org Switcher select element child */}
          {children}

          {/* Notification Center Trigger */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative rounded-lg p-2 text-content-primary hover:bg-surface-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-caption font-bold text-surface-50 ring-2 ring-surface-0">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* User Menu Dropdown */}
          {userEmail && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-xs border border-surface-200 shadow-sm hover:ring-2 hover:ring-primary-500/20 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                aria-label="User account menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {initials}
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-200 bg-layer-2 p-1.5 shadow-modal z-50 animate-fade-in focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="px-3 py-2 border-b border-surface-100 mb-1.5">
                    <p className="text-caption font-bold uppercase tracking-wider text-content-label">Signed in as</p>
                    <p className="text-sm font-medium text-content-primary truncate mt-0.5">{userEmail}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate?.('/administration');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg text-content-primary hover:bg-surface-50 transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                    role="menuitem"
                  >
                <svg className="h-4 w-4 text-content-label" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                    <span>Administration</span>
                  </button>

                  {onSignOut && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onSignOut();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg text-danger-500 hover:bg-danger-50 transition-colors duration-150 text-left mt-1 border-t border-surface-100 pt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500/40"
                      role="menuitem"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 min-w-0">
            {i > 0 ? (
                <svg className="h-3.5 w-3.5 text-content-label shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : null}
            {item.href && i < items.length - 1 ? (
              <a
                href={item.href}
                className="text-content-secondary hover:text-primary-500 transition-colors duration-150 font-medium truncate"
              >
                {item.label}
              </a>
            ) : (
              <span
                className="font-semibold text-content-primary truncate"
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
