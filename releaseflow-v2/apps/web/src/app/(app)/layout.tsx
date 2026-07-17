'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import { signOut as firebaseSignOut } from '@firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { AppShell, Skeleton, BottomNav } from '@releaseflow/ui';
import { CommandPalette } from '@/components/command-palette';
import type { NavItem, NavSection } from '@releaseflow/ui';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import type { OrganizationRecord } from '@/lib/organization-repository';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
    </svg>
  );
}

/* ─── Admin Navigation ─────────────────────────────────────────────── */

const adminNavSections: NavSection[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'releases', label: 'Releases' },
  { key: 'collaboration', label: 'Collaboration' },
  { key: 'library', label: 'Library' },
  { key: 'system', label: 'System' },
];

const adminNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: NavIcon({ d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }),
    href: '/dashboard',
    section: 'dashboard',
  },
  {
    label: 'Releases',
    icon: NavIcon({ d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }),
    href: '/releases',
    section: 'releases',
  },
  {
    label: 'Schedule',
    icon: NavIcon({ d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }),
    href: '/schedule',
    section: 'releases',
  },
  {
    label: 'Assignments',
    icon: NavIcon({ d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }),
    href: '/assignments',
    section: 'collaboration',
  },
  {
    label: 'Inbox',
    icon: NavIcon({ d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' }),
    href: '/notifications',
    section: 'collaboration',
  },
  {
    label: 'People',
    icon: NavIcon({ d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }),
    href: '/people',
    section: 'collaboration',
  },
  {
    label: 'Tracks',
    icon: NavIcon({ d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }),
    href: '/tracks',
    section: 'library',
  },
  {
    label: 'Artists',
    icon: NavIcon({ d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' }),
    href: '/artists',
    section: 'library',
  },
  {
    label: 'Administration',
    icon: NavIcon({ d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
    href: '/administration',
    section: 'system',
  },
];

/* ─── Collaborator Navigation ──────────────────────────────────────── */

const collaboratorNavSections: NavSection[] = [
  { key: 'main', label: 'Main' },
];

/* MUX-002 — collaborator primary workspace (read-only outside own assignments) */
const collaboratorNavItems: NavItem[] = [
  {
    label: 'Home',
    icon: NavIcon({ d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }),
    href: '/home',
    section: 'main',
  },
  {
    label: 'My Assignments',
    icon: NavIcon({ d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }),
    href: '/assignments',
    section: 'main',
  },
  {
    label: 'Releases',
    icon: NavIcon({ d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }),
    href: '/releases',
    section: 'main',
  },
  {
    label: 'Tracks',
    icon: NavIcon({ d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' }),
    href: '/tracks',
    section: 'main',
  },
  {
    label: 'Schedule',
    icon: NavIcon({ d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }),
    href: '/schedule',
    section: 'main',
  },
  {
    label: 'Comments',
    icon: NavIcon({ d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.043 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }),
    href: '/comments',
    section: 'main',
  },
  {
    label: 'Profile',
    icon: NavIcon({ d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }),
    href: '/profile',
    section: 'main',
  },
];

/* ─── Bottom Nav Items for Phone (MUX-002: Comments replaces Notifications) ─ */

const collaboratorBottomNavItems: NavItem[] = [
  {
    label: 'Home',
    icon: NavIcon({ d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }),
    href: '/home',
  },
  {
    label: 'Work',
    icon: NavIcon({ d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }),
    href: '/assignments',
  },
  {
    label: 'Schedule',
    icon: NavIcon({ d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }),
    href: '/schedule',
  },
  {
    label: 'Comments',
    icon: NavIcon({ d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.043 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }),
    href: '/comments',
  },
  {
    label: 'Profile',
    icon: NavIcon({ d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }),
    href: '/profile',
  },
];

/* ─── Route / nav rules via AuthorizationService capabilities ───── */

type RouteGuard = { prefix: string; check: () => boolean };

const ROUTE_GUARDS: RouteGuard[] = [
  { prefix: '/administration', check: () => AuthorizationService.canViewAdministration() },
  { prefix: '/organizations', check: () => AuthorizationService.canManageOrganization() },
  { prefix: '/people', check: () => AuthorizationService.canManagePeople() },
  // MUX-002: tracks readable for collaborators (artist.read); write still gated in UI
  { prefix: '/tracks', check: () => AuthorizationService.can('artist.read') || AuthorizationService.can('artist.write') },
  { prefix: '/artists', check: () => AuthorizationService.can('artist.write') },
  { prefix: '/releases/new', check: () => AuthorizationService.canCreateRelease() },
];

/** Paths collaborators must never open (management surfaces). */
const COLLABORATOR_BLOCKED_PREFIXES = [
  '/dashboard',
  '/administration',
  '/organizations',
  '/people',
  // tracks + releases allowed read-only (MUX-002)
  '/artists',
  '/releases/new',
];

function isCollaboratorBlockedPath(path: string): boolean {
  return COLLABORATOR_BLOCKED_PREFIXES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

/** Nav item → capability check via AuthorizationService. */
const NAV_CAN: Record<string, (() => boolean) | null> = {
  '/dashboard': () => AuthorizationService.canCreateRelease(),
  '/releases': () => AuthorizationService.canViewReleases(),
  '/schedule': () => AuthorizationService.canViewPersonalSchedule(),
  '/assignments': () => AuthorizationService.canViewAssignments(),
  '/notifications': null,
  '/comments': null,
  '/people': () => AuthorizationService.canManagePeople(),
  '/tracks': () => AuthorizationService.can('artist.read') || AuthorizationService.can('artist.write'),
  '/artists': () => AuthorizationService.can('artist.write'),
  '/administration': () => AuthorizationService.canViewAdministration(),
};

/* ─── Layout ───────────────────────────────────────────────────────── */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrgId, setActiveOrgId, setOrgsLoaded, switchingOrg } = useOrgStore();
  const { resolveRole, loading: roleLoading, isCollaborator } = useRoleStore();
  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);
  const { count: notificationCount } = useNotificationBadge();

  // AUTH-001: load AuthorizationService context when user/org changes.
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/sign-in'); return; }
    if (activeOrgId) {
      void resolveRole(user.uid, activeOrgId);
    }
  }, [user, loading, router, resolveRole, activeOrgId]);

  useEffect(() => {
    if (!user) return;
    getOrganizationsByUser(user.uid).then((data) => {
      setOrgs(data);
      if (data.length === 0) {
        router.replace('/auth/resolve');
        return;
      }
      if (!activeOrgId || !data.find((o) => o.id === activeOrgId)) {
        if (data[0]) setActiveOrgId(data[0].id);
      }
      setOrgsLoaded(true);
    });
  }, [user, activeOrgId, setActiveOrgId, setOrgsLoaded, router]);

  /* ── AuthorizationService route guard ───────────────────────────── */
  useEffect(() => {
    if (roleLoading) return;
    const collab = AuthorizationService.isCollaboratorWorkspace();

    if (collab && isCollaboratorBlockedPath(pathname)) {
      const explanation = AuthorizationService.explain('admin.access');
      console.log('[Authorization]', {
        Path: pathname,
        Decision: 'DENIED',
        Reason: 'collaborator_route_blocked',
        Detail: explanation.reason,
      });
      router.replace('/home');
      return;
    }

    for (const { prefix, check } of ROUTE_GUARDS) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (!check()) {
          console.log('[Authorization]', {
            Path: pathname,
            Decision: 'DENIED',
            Reason: 'route_capability_missing',
          });
          router.replace(collab ? '/home' : '/dashboard');
          return;
        }
      }
    }

    if (
      (pathname === '/dashboard' || pathname.startsWith('/dashboard/'))
      && !AuthorizationService.canCreateRelease()
    ) {
      router.replace(collab ? '/home' : '/releases');
    }
  }, [roleLoading, pathname, router, isCollaborator]);

  // Fail closed while loading: collaborator shell (no admin chrome).
  const isCollab = useMemo(
    () => roleLoading || AuthorizationService.isCollaboratorWorkspace(),
    [roleLoading, isCollaborator],
  );

  if (loading || (user && roleLoading && !activeOrgId)) {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <aside className="w-[232px] border-r border-surface-200/80 bg-surface-50 px-4 py-5 space-y-5 hidden lg:block">
          <div className="flex items-center gap-2.5 px-1 pb-3 border-b border-surface-200/60">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1.5 pt-2">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5 pt-2">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </aside>
        <div className="flex-1 px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-52" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            <div className="grid gap-4 grid-cols-3">
              <Skeleton variant="card" />
              <Skeleton variant="card" />
              <Skeleton variant="card" />
            </div>
            <Skeleton variant="card" />
            <Skeleton variant="card" className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // While role resolves for active org, show skeleton (never flash admin chrome).
  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  async function handleSignOut() {
    try {
      const { clearOfflineDataOnLogout } = await import('@/lib/pwa/clear-on-logout');
      await clearOfflineDataOnLogout();
    } catch {
      /* ignore offline clear failures */
    }
    const auth = getAuthInstance();
    if (auth) await firebaseSignOut(auth);
    useOrgStore.getState().setActiveOrgId(null);
    useOrgStore.getState().setOrgsLoaded(false);
    useRoleStore.getState().reset();
  }

  const withBadge = (items: NavItem[]): NavItem[] =>
    items.map((item) =>
      item.href === '/notifications' && notificationCount > 0
        ? { ...item, badge: notificationCount }
        : item,
    );

  const filterByPermission = (items: NavItem[]): NavItem[] =>
    items.filter((item) => {
      const href = item.href ?? '';
      const check = NAV_CAN[href];
      if (check === undefined) return true;
      if (check === null) return true;
      return check();
    });

  const navItems = withBadge(
    isCollab ? collaboratorNavItems : filterByPermission(adminNavItems),
  );
  const navSections = isCollab ? collaboratorNavSections : adminNavSections;
  const bottomItems = withBadge(collaboratorBottomNavItems);

  return (
    <>
      <AppShell
        navItems={navItems}
        navSections={navSections}
        activePath={pathname}
        onNavigate={(href) => router.push(href)}
        userEmail={user.email ?? undefined}
        userImage={user.photoURL ?? undefined}
        onSignOut={handleSignOut}
        notificationCount={notificationCount}
        onOpenNotifications={() => router.push('/notifications')}
        bottomNav={
          isCollab ? (
            <BottomNav
              items={bottomItems}
              activePath={pathname}
              onNavigate={(href) => router.push(href)}
            />
          ) : undefined
        }
        hideMobileSidebar={isCollab}
        topbarChildren={
          // MUX-001: org switcher on desktop always; on phone only when multi-org
          orgs.length > 1 ? (
            <select
              value={activeOrgId ?? ''}
              onChange={(e) => setActiveOrgId(e.target.value || null)}
              className="h-9 min-h-[40px] rounded-lg border border-surface-200 bg-layer-2 px-3 pr-7 text-body-small font-medium text-text-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-150 cursor-pointer hover:border-surface-300 max-w-[140px] sm:max-w-none"
              aria-label="Active organisation"
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          ) : orgs.length === 1 && !isCollab ? (
            <select
              value={activeOrgId ?? ''}
              onChange={(e) => setActiveOrgId(e.target.value || null)}
              className="hidden sm:block h-8 rounded-lg border border-surface-200 bg-layer-2 px-3 pr-7 text-body-small font-medium text-text-700"
              aria-label="Active organisation"
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          ) : null
        }
      >
        {children}
      </AppShell>
      {switchingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/30 backdrop-blur-sm transition-all duration-300">
          <div className="rounded-xl bg-surface-50 px-6 py-4 shadow-raised border border-surface-200/80 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              <span className="text-sm text-text-600">Switching organisation&hellip;</span>
            </div>
          </div>
        </div>
      )}
      <CommandPalette />
    </>
  );
}
