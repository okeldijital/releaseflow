import { type ReactNode, useState } from 'react';
import { Sidebar, type NavItem } from '../navigation/sidebar';
import { Topbar, Breadcrumbs } from '../navigation/topbar';

interface AppShellProps {
  navItems: NavItem[];
  activePath: string;
  onNavigate: (href: string) => void;
  userEmail?: string;
  userImage?: string;
  onSignOut: () => void;
  breadcrumbItems?: { label: string; href?: string }[];
  topbarChildren?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  navItems, activePath, onNavigate, userEmail, userImage, onSignOut,
  breadcrumbItems, topbarChildren, children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar
        items={navItems}
        activePath={activePath}
        onNavigate={onNavigate}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={onSignOut}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} breadcrumbs={breadcrumbItems ? <Breadcrumbs items={breadcrumbItems} /> : undefined}>
          {topbarChildren}
        </Topbar>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

interface WorkspaceLayoutProps {
  children: ReactNode;
  contextRail?: ReactNode;
}

export function WorkspaceLayout({ children, contextRail }: WorkspaceLayoutProps) {
  return (
    <div className="flex flex-1">
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
      {contextRail ? (
        <aside className="hidden lg:block w-80 shrink-0 border-l border-surface-200 bg-surface-100 overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
          {contextRail}
        </aside>
      ) : null}
    </div>
  );
}

interface DashboardLayoutProps {
  metrics?: ReactNode;
  workArea?: ReactNode;
  activity?: ReactNode;
}

export function DashboardLayout({ metrics, workArea, activity }: DashboardLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {metrics ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics}
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {workArea}
        </div>
        <div className="space-y-6">
          {activity}
        </div>
      </div>
    </div>
  );
}
