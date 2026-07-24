import { type ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import {
  OverflowMenuPanel,
  type OverflowMenuItem,
  type OverflowMenuPosition,
} from '../components/overflow-menu';
import { Avatar } from '../components/avatar';
import { Search } from '../components/search';

interface TopbarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** id of the sidebar element — used for aria-controls on the mobile toggle */
  sidebarId?: string;
  breadcrumbs?: ReactNode;
  title?: string;
  children?: ReactNode;
  /** Logo node rendered in the header (e.g. ReleaseFlowLogo). */
  logo?: ReactNode;
  /** Always-on global search in the shell (default true). */
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
  userEmail?: string;
  /** Canonical display name for Avatar (BUILD-014B). */
  userName?: string;
  userImage?: string;
  onSignOut?: () => void;
  onNavigate?: (href: string) => void;
  /** hide hamburger toggle on phone screens — used with bottom nav */
  hideMobileToggle?: boolean;
}

/**
 * Canonical global header:
 * Org Switcher | Hamburger (mobile/tablet) | Global Search | Notifications | Avatar
 */
export function Topbar({
  collapsed,
  onToggle,
  sidebarId,
  breadcrumbs: _breadcrumbs,
  title: _title,
  children,
  logo,
  showSearch = true,
  onSearch,
  notificationCount = 0,
  onOpenNotifications,
  onOpenCommandPalette,
  userEmail,
  userName,
  userImage,
  onSignOut,
  onNavigate,
  hideMobileToggle,
}: TopbarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userMenuActive, setUserMenuActive] = useState(-1);
  const [userMenuPos, setUserMenuPos] = useState<OverflowMenuPosition | null>(null);
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const userMenuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleSearch(v: string) {
    setSearchValue(v);
    onSearch?.(v);
  }

  function openGlobalSearch() {
    onOpenCommandPalette?.();
  }

  const closeUserMenu = useCallback((focusTrigger = true) => {
    setUserMenuOpen(false);
    setUserMenuActive(-1);
    if (focusTrigger) userMenuTriggerRef.current?.focus();
  }, []);

  const openUserMenu = useCallback(() => {
    if (!userMenuTriggerRef.current) return;
    const rect = userMenuTriggerRef.current.getBoundingClientRect();
    setUserMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setUserMenuOpen(true);
    setUserMenuActive(0);
  }, []);

  const userMenuItems: OverflowMenuItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      variant: 'secondary',
      onClick: () => {
        onNavigate?.('/profile');
      },
    },
    {
      id: 'administration',
      label: 'Administration',
      variant: 'secondary',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
      onClick: () => {
        onNavigate?.('/administration');
      },
    },
    {
      id: 'signout',
      label: 'Sign out',
      variant: 'danger',
      separatorBefore: true,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      onClick: () => {
        onSignOut?.();
      },
    },
  ];

  useEffect(() => {
    if (!userMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeUserMenu();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = e.key === 'ArrowDown'
          ? (userMenuActive + 1) % userMenuItems.length
          : (userMenuActive - 1 + userMenuItems.length) % userMenuItems.length;
        setUserMenuActive(next);
        userMenuItemRefs.current[next]?.focus();
        return;
      }
      if (e.key === 'Tab') {
        closeUserMenu(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [userMenuOpen, userMenuActive, closeUserMenu, userMenuItems.length]);

  const avatarName = userName || userEmail || 'User';

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-transparent border-b border-surface-200/40 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-4 lg:px-6">
        {/* Left: Hamburger (mobile/tablet only) + Logo + Org switcher / global controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className={`rounded-lg p-2 text-content-primary hover:bg-surface-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 lg:hidden ${hideMobileToggle ? 'hidden md:inline-flex' : ''}`}
            aria-label={collapsed ? 'Open navigation' : 'Close navigation'}
            aria-expanded={!collapsed}
            aria-controls={sidebarId}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {logo ? <div className="flex items-center shrink-0">{logo}</div> : null}
          {children}
        </div>

        {/* Center: Global Search (500–700px, flex-centered) */}
        {showSearch ? (
          <div className="flex flex-1 min-w-0 justify-center px-1 sm:px-2">
            <div className="relative w-full max-w-[min(100%,700px)] min-w-0 sm:min-w-[200px] md:min-w-[280px] lg:min-w-[360px]">
              {/* Desktop / tablet: existing Search component */}
              <div
                className="hidden sm:block w-full"
                onFocusCapture={openGlobalSearch}
                onClick={openGlobalSearch}
              >
                <Search
                  value={searchValue}
                  onChange={handleSearch}
                  placeholder="Search releases, tracks, artists, people..."
                  className="w-full"
                />
              </div>
              {/* Mobile: same control pattern — open global search (no second search impl) */}
              <button
                type="button"
                onClick={openGlobalSearch}
                className="sm:hidden flex w-full items-center gap-2 h-10 rounded-md border border-surface-700 bg-surface-800 px-3 text-sm text-content-label"
                aria-label="Open search"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="truncate">Search…</span>
              </button>
              {onOpenCommandPalette ? (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-surface-200 bg-layer-2 px-1.5 py-0.5 text-caption font-medium text-content-label shadow-sm">
                  ⌘K
                </kbd>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0" />
        )}

        {/* Right: notifications, avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {onOpenNotifications ? (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative rounded-lg p-2 text-content-primary hover:bg-surface-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-caption font-bold text-surface-50 ring-2 ring-surface-0">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              ) : null}
            </button>
          ) : null}

          {userEmail ? (
            <div className="relative">
              <button
                ref={userMenuTriggerRef}
                type="button"
                onClick={() => (userMenuOpen ? closeUserMenu(false) : openUserMenu())}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-200 shadow-sm hover:ring-2 hover:ring-primary-500/20 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                aria-label="User account menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <Avatar
                  src={userImage}
                  name={avatarName}
                  size="md"
                />
              </button>

              {userMenuOpen && userMenuPos ? (
                <OverflowMenuPanel
                  items={userMenuItems}
                  position={userMenuPos}
                  activeIndex={userMenuActive}
                  itemRefs={userMenuItemRefs}
                  ariaLabel="Account"
                  header={
                    <div className="px-3 py-2 border-b border-border-default mb-1.5">
                      <p className="text-caption font-bold uppercase tracking-wider text-content-label">Signed in as</p>
                      <p className="text-sm font-medium text-content-primary truncate mt-0.5">{userEmail}</p>
                    </div>
                  }
                  onSelect={(item) => {
                    closeUserMenu();
                    item.onClick?.();
                  }}
                  onClose={() => closeUserMenu(false)}
                />
              ) : null}
            </div>
          ) : null}
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
