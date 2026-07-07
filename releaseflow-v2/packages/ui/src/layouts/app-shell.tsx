'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { Sidebar, type NavItem, type NavSection } from '../navigation/sidebar';
import { Topbar, Breadcrumbs } from '../navigation/topbar';

interface AppShellProps {
  navItems: NavItem[];
  navSections: NavSection[];
  activePath: string;
  onNavigate: (href: string) => void;
  userEmail?: string;
  userImage?: string;
  onSignOut: () => void;
  breadcrumbItems?: { label: string; href?: string }[];
  title?: string;
  topbarChildren?: ReactNode;
  children: ReactNode;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
}

const STORAGE_KEY = 'rf-sidebar-collapsed';

export function AppShell({
  navItems,
  navSections,
  activePath,
  onNavigate,
  userEmail,
  userImage,
  onSignOut,
  breadcrumbItems,
  title,
  topbarChildren,
  children,
  onSearch,
  notificationCount,
  onOpenNotifications,
  onOpenCommandPalette,
}: AppShellProps) {
  // Initialise from localStorage on desktop; mobile always starts closed
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      const saved = localStorage.getItem(STORAGE_KEY);
      setCollapsed(saved === 'true');
    } else {
      // Tablet/mobile: start with drawer closed
      setCollapsed(true);
    }
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      // Only persist on desktop
      if (window.matchMedia('(min-width: 1024px)').matches) {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenCommandPalette?.();
      }
      // ⌘\ to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        handleToggle();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onOpenCommandPalette]);

  return (
    /*
     * Root frame: full viewport, no overflow.
     * `overflow-hidden` on the root prevents double scrollbars — only the
     * main content column scrolls internally.
     */
    <div className="flex h-screen overflow-hidden bg-layer-1 text-content-primary">
      <div className="app-canvas-glow" aria-hidden="true" />

      {/* ── Skip link (accessibility) ────────────────────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-surface-50 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      {/*
       * Render nothing until mounted so we avoid hydration mismatch from
       * localStorage. The skeleton loading state in layout.tsx covers this.
       */}
      {mounted && (
        <Sidebar
          items={navItems}
          sections={navSections}
          activePath={activePath}
          onNavigate={onNavigate}
          userEmail={userEmail}
          userImage={userImage}
          onSignOut={onSignOut}
          collapsed={collapsed}
          onToggle={handleToggle}
        />
      )}

      {/* ── Content column ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        <Topbar
          collapsed={collapsed}
          onToggle={handleToggle}
          sidebarId="rf-sidebar"
          breadcrumbs={
            breadcrumbItems && breadcrumbItems.length > 0
              ? <Breadcrumbs items={breadcrumbItems} />
              : undefined
          }
          title={title}
          showSearch={!!onSearch}
          onSearch={onSearch}
          notificationCount={notificationCount ?? 0}
          onOpenNotifications={onOpenNotifications}
          onOpenCommandPalette={onOpenCommandPalette}
          userEmail={userEmail}
          userImage={userImage}
          onSignOut={onSignOut}
          onNavigate={onNavigate}
        >
          {topbarChildren}
        </Topbar>

        {/* Main scrollable area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto animate-fade-in focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── WorkspaceLayout ─────────────────────────────────────────────────── */

export function WorkspaceLayout({
  children,
  contextRail,
}: {
  children: ReactNode;
  contextRail?: ReactNode;
}) {
  return (
    <div className="flex flex-1 min-w-0 h-full">
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
      {contextRail ? (
        <aside
          className="hidden lg:flex lg:flex-col w-80 shrink-0 bg-surface-50 dark:bg-surface-900 overflow-y-auto"
          aria-label="Context panel"
        >
          {contextRail}
        </aside>
      ) : null}
    </div>
  );
}

/* ── Page width containers ───────────────────────────────────────────── */

export function Page({
  children,
  width = 'standard',
  className = '',
}: {
  children: ReactNode;
  width?: 'narrow' | 'standard' | 'wide';
  className?: string;
}) {
  const widthClasses = {
    narrow: 'max-w-[640px]',
    standard: 'max-w-[1024px]',
    wide: 'max-w-[1280px]',
  };
  return (
    <div className={`mx-auto w-full ${widthClasses[width]} px-4 sm:px-6 md:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

/* ── DashboardLayout ─────────────────────────────────────────────────── */

export function DashboardLayout({
  metrics,
  workArea,
  activity,
}: {
  metrics?: ReactNode;
  workArea?: ReactNode;
  activity?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8 py-8 space-y-8">
      {metrics ? <div className="grid gap-4 sm:grid-cols-3">{metrics}</div> : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">{workArea}</div>
        <div className="space-y-6">{activity}</div>
      </div>
    </div>
  );
}
