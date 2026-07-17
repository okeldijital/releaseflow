'use client';

import { type ReactNode, useRef, useEffect, useState } from 'react';
import { Tooltip } from '../components/tooltip';
import { Avatar } from '../components/avatar';

export interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  section?: string;
  /** Unread / count badge (e.g. notifications). */
  badge?: number;
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
  /** true = icon-rail (desktop) / drawer-closed (mobile) */
  collapsed: boolean;
  onToggle: () => void;
  /** hide sidebar on mobile (phone) screens — used for collaborator bottom nav */
  hideMobile?: boolean;
}

function isActive(activePath: string, item: NavItem): boolean {
  if (item.href === '/') return activePath === '/';
  return activePath === item.href || activePath.startsWith(item.href + '/');
}

/** BRAND-001 — official logo from app public assets (no recolour / no badge). */
const RELEASEFLOW_LOGO_SRC = '/icons/ReleaseFlow-Logo.svg';

function BrandLogo({ collapsed }: { collapsed: boolean }) {
  const size = collapsed ? 32 : 112;
  return (
    <img
      src={RELEASEFLOW_LOGO_SRC}
      alt="ReleaseFlow"
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: 'auto', maxWidth: size, aspectRatio: '1 / 1' }}
      decoding="async"
      draggable={false}
    />
  );
}

function SignOutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

export function Sidebar({
  items,
  sections,
  activePath,
  onNavigate,
  userEmail,
  userImage,
  onSignOut,
  collapsed,
  onToggle,
  hideMobile,
}: SidebarProps) {
  const sectionLabelMap = new Map(sections.map((s) => [s.key, s.label]));
  const sectionOrder = sections.map((s) => s.key);
  const sidebarRef = useRef<HTMLElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent) {
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    currentXRef.current = e.clientX;
  }

  function handlePointerUp(_e: React.PointerEvent) {
    if (!isDragging) return;
    setIsDragging(false);
    const delta = currentXRef.current - startXRef.current;
    if (delta > 80) {
      onToggle();
    }
  }

  // Close on Escape (tablet/mobile drawer only)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !collapsed && window.matchMedia('(max-width: 1023px)').matches) {
        onToggle();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [collapsed, onToggle]);

  // Move focus into sidebar when drawer opens on mobile
  useEffect(() => {
    if (!collapsed && window.matchMedia('(max-width: 1023px)').matches) {
      const firstFocusable = sidebarRef.current?.querySelector<HTMLElement>(
        'button,[href],input,select,[tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }
  }, [collapsed]);

  const grouped = items.reduce(
    (acc, item) => {
      const key = item.section ?? sectionOrder[0] ?? 'default';
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>,
  );



  /*
   * Navigate and auto-close on tablet/mobile.
   * On desktop the drawer stays open after navigation.
   */
  function navigate(href: string) {
    onNavigate(href);
    if (window.matchMedia('(max-width: 1023px)').matches) onToggle();
  }

  /* ── Reusable button rows ─────────────────────────────────────────── */

  const signOutButton = (
    <button
      onClick={onSignOut}
      className={`
        flex w-full items-center gap-3 rounded-lg text-sm font-medium text-left
        text-content-secondary hover:bg-surface-100/20 hover:text-content-primary
       
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500/40
        transition-colors duration-150 min-h-[44px]
        ${collapsed ? 'lg:justify-center lg:px-2 px-3 py-2.5' : 'px-3 py-2.5'}
      `}
    >
      <span className="text-content-secondary shrink-0"><SignOutIcon /></span>
      <span className={`flex-1 ${collapsed ? 'lg:hidden' : ''}`}>Sign out</span>
    </button>
  );

  const userCard = (
    <div
      className={`
        flex items-center gap-3 rounded-lg min-h-[44px]
        ${collapsed ? 'lg:justify-center lg:px-2 px-3 py-2.5' : 'px-3 py-2.5'}
      `}
    >
      <Avatar
        src={userImage}
        name={userEmail ?? 'User'}
        size="md"
        className="shadow-sm"
      />
      <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
        <p className="truncate text-xs font-medium text-content-secondary">{userEmail}</p>
      </div>
    </div>
  );

  /* ── Sidebar element ────────────────────────────────────────────────
   *
   * Layout contract:
   * • Desktop (≥1024px): fixed to the left edge, full-height, never
   *   overlaps content — the content column gets its margin from the
   *   parent flex container which reserves space for the sidebar.
   *
   *   `lg:relative` + parent flex makes the sidebar occupy natural
   *   flex space so the content column sits to its right with no gap
   *   or overlap.  This is simpler and more reliable than fixed+offset.
   *
   * • Tablet/Mobile (<1024px): slide-over drawer fixed to the left,
   *   z-indexed above content. The backdrop handles dismiss.
   *
   * Motion: transition is on `width` (desktop) and `transform`
   * (mobile). Both are gated by motion-safe so `prefers-reduced-motion`
   * users get instant transitions.
   * ─────────────────────────────────────────────────────────────────── */
  return (
    <>
      <aside
        id="rf-sidebar"
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
          className={`
          ${hideMobile ? 'hidden md:flex' : 'flex'}
          fixed inset-y-0 left-0 z-40 flex-col h-full
          touch-pan-y

          motion-safe:transition-transform motion-safe:duration-200
          ${collapsed ? '-translate-x-full' : 'translate-x-0'}

          lg:relative lg:inset-auto lg:z-auto lg:translate-x-0

          motion-safe:lg:transition-[width] motion-safe:lg:duration-200
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]'}

          motion-reduce:transition-none
          ${collapsed ? 'motion-reduce:lg:w-[72px]' : 'motion-reduce:lg:w-[280px]'}

          bg-surface-950
        `}
        onPointerDown={window.matchMedia('(max-width: 1023px)').matches ? handlePointerDown : undefined}
        onPointerMove={window.matchMedia('(max-width: 1023px)').matches ? handlePointerMove : undefined}
        onPointerUp={window.matchMedia('(max-width: 1023px)').matches ? handlePointerUp : undefined}
      >
        {/* ── Desktop collapse/expand toggle button ─────────────────── */}
        <button
          onClick={onToggle}
          className="
            hidden lg:flex absolute -right-3.5 top-5 z-50
            h-7 w-7 items-center justify-center rounded-full
            border border-surface-200
            bg-layer-2
            text-content-secondary
            shadow-sm
            hover:bg-surface-50 hover:text-content-primary
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30
            transition-colors duration-150
          "
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="rf-sidebar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            }
          </svg>
        </button>

        {/* ── Zone 1 — Brand (BRAND-001 official logo; wordmark is in the asset) ─ */}
        <div className="flex h-16 items-center px-4 shrink-0 overflow-hidden">
          <BrandLogo collapsed={collapsed} />
        </div>

        {/* ── Zone 2 — Navigation ─────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-4 px-3" aria-label="Site navigation">
          {sectionOrder.map((key) => {
            const groupItems = grouped[key];
            if (!groupItems || groupItems.length === 0) return null;
            const label = sectionLabelMap.get(key) ?? key;

            return (
              <div key={key}>
                {/* Section divider in collapsed mode, label in expanded */}
                {collapsed
                  ? null
                  : <p className="mb-1 px-3 text-caption font-medium uppercase tracking-[0.1em] text-content-secondary" role="heading" aria-level={2}>{label}</p>
                }

                <ul className="space-y-1" role="list">
                  {groupItems.map((item) => {
                    const active = isActive(activePath, item);

                    const btn = (
                      <button
                        onClick={() => navigate(item.href)}
                        aria-current={active ? 'page' : undefined}
                        className={`
                          flex w-full items-center gap-2.5 rounded-md text-body font-normal text-left
                          transition-colors duration-150 min-h-[40px]
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30
                          ${active
                            ? 'text-content-primary'
                            : 'text-content-secondary hover:text-content-primary'}
                          ${collapsed ? 'lg:justify-center lg:px-2 px-3 py-1.5' : 'px-3 py-1.5'}
                        `}
                      >
                        <span
                          className={`h-4 w-4 shrink-0 ${active ? 'text-content-primary' : 'text-content-secondary'}`}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        <span className={`flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
                          {item.label}
                        </span>
                        {item.badge != null && item.badge > 0 ? (
                          <span
                            className={`
                              min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white
                              text-[10px] font-semibold flex items-center justify-center shrink-0
                              ${collapsed ? 'lg:absolute lg:top-1 lg:right-1' : ''}
                            `}
                            aria-label={`${item.badge} unread`}
                          >
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        ) : active && !collapsed ? (
                           <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0 hidden lg:block" aria-hidden="true" />
                        ) : null}
                      </button>
                    );

                    return (
                      <li key={item.href}>
                        {/* Wrap with tooltip only in desktop collapsed (icon rail) mode */}
                        <div className="hidden lg:block">
                          {collapsed
                            ? <Tooltip content={item.label} position="right" delay={150}>{btn}</Tooltip>
                            : btn
                          }
                        </div>
                        {/* Mobile always shows label */}
                        <div className="lg:hidden">{btn}</div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

          {/* ── Zone 3 — User / Sign Out ─────────────────── */}
          <div className="shrink-0 p-3 space-y-1">
            {/* User card */}
          <div className="hidden lg:block">
            {collapsed
              ? <Tooltip content={userEmail ?? 'Profile'} position="right" delay={150}>{userCard}</Tooltip>
              : userCard
            }
          </div>
          <div className="lg:hidden">{userCard}</div>

          {/* Sign out */}
          <div className="hidden lg:block">
            {collapsed
              ? <Tooltip content="Sign out" position="right" delay={150}>{signOutButton}</Tooltip>
              : signOutButton
            }
          </div>
          <div className="lg:hidden">{signOutButton}</div>
        </div>
      </aside>

      {/* ── Backdrop — tablet/mobile only ───────────────────────────── */}
      {!collapsed && (
        <div
          className="
            fixed inset-0 z-30
            bg-surface-900/40 backdrop-blur-sm
            lg:hidden
            motion-safe:transition-opacity motion-safe:duration-200
            motion-reduce:transition-none
          "
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
    </>
  );
}
