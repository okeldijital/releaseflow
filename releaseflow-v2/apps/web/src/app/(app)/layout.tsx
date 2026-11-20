'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentUser } from '@/contexts/current-user-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import { signOut as firebaseSignOut } from '@firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { AppShell, Skeleton, BottomNav } from '@releaseflow/ui';
import { useOpenWorkspaceSearch } from '@/components/app-providers';
import { FeedbackTrigger } from '@/components/feedback';
import { StudioWordmark } from '@/components/branding/studio-wordmark';
import type { NavItem, NavSection } from '@releaseflow/ui';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import type { OrganizationRecord } from '@/lib/organization-repository';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';

const workspaceSymbols = {
  overview: <><rect x="3.5" y="3.5" width="6" height="17" rx="1.6" /><rect x="13" y="3.5" width="7.5" height="6" rx="1.6" /><path d="M13.5 14h6.5m-6.5 5H18" /></>,
  releases: <><rect x="4" y="6.5" width="16" height="14" rx="2.5" /><path d="M7 3.5h10" /><circle cx="12" cy="13.5" r="3.25" /></>,
  team: <><circle cx="9" cy="8" r="3" /><path d="M3 19c.3-4 2.5-6 6-6s5.7 2 6 6M15 5.3a3 3 0 0 1 0 5.5m1.4 2.6c2.8.6 4.3 2.5 4.6 5.6" /></>,
  library: <><path d="M5 4.5v15m4-15v15m4-15v15m3-14.7 3.8 14.5" /></>,
  media: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.7" /><circle cx="8.5" cy="9.5" r="1" /><path d="m5 17 4.3-4.6 2.4 2.2 3.8-4.1 4.3 4.9" /></>,
  calendar: <><rect x="3.8" y="5" width="16.4" height="15.5" rx="2.5" /><path d="M8 3.2v4m8-4v4M4 10h16m-11.5 4h3" /></>,
  settings: <><path d="M3.5 7h5m5.5 0h6.5m-17 10H13m5.5 0h2" /><circle cx="11.3" cy="7" r="2.7" /><circle cx="15.8" cy="17" r="2.7" /></>,
  assignments: <><rect x="5" y="5.5" width="14" height="15" rx="2.3" /><rect x="9" y="3" width="6" height="4" rx="1.4" /><path d="M9 12h6m-6 4h4" /></>,
  tasks: <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="m8 12 2.7 2.8L16.5 9" /></>,
  comments: <path d="M20.5 11.2c0 4.6-3.8 7.5-8.4 7.5-1.3 0-2.4-.2-3.4-.7l-4.5 1.7 1.2-4a7.1 7.1 0 0 1-1.9-4.5c0-4.2 3.7-7.5 8.6-7.5 4.6 0 8.4 3.1 8.4 7.5Z" />,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-4.2 2.7-6.3 7-6.3s6.5 2.1 7 6.3" /></>,
};

function NavIcon({ name }: { name: keyof typeof workspaceSymbols }) {
  return (
    <svg className="studio-nav-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {workspaceSymbols[name]}
    </svg>
  );
}

/* ─── Admin Navigation (BUILD-220H) ───────────────────────────────────
 *
 * Global sidebar = modules only. Lifecycle / filter destinations live in
 * each module's path tabs (RELEASE_PAGE_TABS, COLLABORATION_PAGE_TABS, …).
 *
 * Flat module list: one section without a heading so we never render
 * "RELEASES → Releases" redundancy.
 * ──────────────────────────────────────────────────────────────────── */

const adminNavSections: NavSection[] = [
  { key: 'modules', label: '' },
];

const adminNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <NavIcon name="overview" />,
    href: '/dashboard',
    section: 'modules',
  },
  {
    label: 'Releases',
    icon: <NavIcon name="releases" />,
    href: '/releases',
    section: 'modules',
  },
  {
    label: 'Collaboration',
    icon: <NavIcon name="team" />,
    href: '/collaboration',
    section: 'modules',
  },
  {
    label: 'Library',
    icon: <NavIcon name="library" />,
    href: '/library',
    section: 'modules',
  },
  {
    label: 'Media Files',
    icon: <NavIcon name="media" />,
    href: '/media-files',
    section: 'modules',
  },
  {
    label: 'Calendar',
    icon: <NavIcon name="calendar" />,
    href: '/calendar',
    section: 'modules',
  },
  {
    label: 'Administration',
    icon: <NavIcon name="settings" />,
    href: '/administration',
    section: 'modules',
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
    icon: <NavIcon name="overview" />,
    href: '/home',
    section: 'main',
  },
  {
    label: 'My Assignments',
    icon: <NavIcon name="assignments" />,
    href: '/collaboration/assignments',
    section: 'main',
  },
  {
    label: 'Tasks',
    icon: <NavIcon name="tasks" />,
    href: '/collaboration/tasks',
    section: 'main',
  },
  {
    label: 'Releases',
    icon: <NavIcon name="releases" />,
    href: '/releases',
    section: 'main',
  },
  {
    label: 'Library',
    icon: <NavIcon name="library" />,
    href: '/library',
    section: 'main',
  },
  {
    label: 'Calendar',
    icon: <NavIcon name="calendar" />,
    href: '/calendar',
    section: 'main',
  },
  {
    label: 'Comments',
    icon: <NavIcon name="comments" />,
    href: '/comments',
    section: 'main',
  },
  {
    label: 'Profile',
    icon: <NavIcon name="profile" />,
    href: '/profile',
    section: 'main',
  },
];

/* ─── Bottom Nav Items for Phone (MUX-002: Comments replaces Notifications) ─ */

const collaboratorBottomNavItems: NavItem[] = [
  {
    label: 'Home',
    icon: <NavIcon name="overview" />,
    href: '/home',
  },
  {
    label: 'Work',
    icon: <NavIcon name="assignments" />,
    href: '/collaboration/assignments',
  },
  {
    label: 'Calendar',
    icon: <NavIcon name="calendar" />,
    href: '/calendar',
  },
  {
    label: 'Comments',
    icon: <NavIcon name="comments" />,
    href: '/comments',
  },
  {
    label: 'Profile',
    icon: <NavIcon name="profile" />,
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
  { prefix: '/library', check: () => AuthorizationService.can('artist.read') || AuthorizationService.can('artist.write') },
  { prefix: '/calendar', check: () => AuthorizationService.canViewPersonalSchedule() },
  { prefix: '/releases/new', check: () => AuthorizationService.canCreateRelease() },
];

/** Paths collaborators must never open (management surfaces). */
const COLLABORATOR_BLOCKED_PREFIXES = [
  '/dashboard',
  '/administration',
  '/organizations',
  '/people',
  '/collaboration/people',
  // tracks + releases allowed read-only (MUX-002); artists catalogue still blocked
  '/artists',
  '/library/artists',
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
  '/calendar': () => AuthorizationService.canViewPersonalSchedule(),
  '/calendar/schedule': () => AuthorizationService.canViewPersonalSchedule(),
  '/calendar/deadlines': () => AuthorizationService.canViewPersonalSchedule(),
  '/calendar/releases': () => AuthorizationService.canViewPersonalSchedule(),
  '/collaboration': () => AuthorizationService.canViewAssignments(),
  '/collaboration/assignments': () => AuthorizationService.canViewAssignments(),
  '/collaboration/tasks': () => AuthorizationService.canViewAssignments(),
  '/collaboration/inbox': null,
  '/collaboration/people': () => AuthorizationService.canManagePeople(),
  // Legacy list paths still gated (redirect wrappers)
  '/assignments': () => AuthorizationService.canViewAssignments(),
  '/tasks': () => AuthorizationService.canViewAssignments(),
  '/notifications': null,
  '/comments': null,
  '/people': () => AuthorizationService.canManagePeople(),
  '/tracks': () => AuthorizationService.can('artist.read') || AuthorizationService.can('artist.write'),
  '/artists': () => AuthorizationService.can('artist.write'),
  '/library': () => AuthorizationService.can('artist.read') || AuthorizationService.can('artist.write'),
  '/library/tracks': () => AuthorizationService.can('artist.read') || AuthorizationService.can('artist.write'),
  '/library/artists': () => AuthorizationService.can('artist.write'),
  '/media-files': () => AuthorizationService.canViewReleases() || AuthorizationService.can('artist.read'),
  '/assets': () => AuthorizationService.canViewReleases() || AuthorizationService.can('artist.read'),
  '/administration': () => AuthorizationService.canViewAdministration(),
};

/* ─── Layout ───────────────────────────────────────────────────────── */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { identity, profile } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrgId, setActiveOrgId, setOrgsLoaded, switchingOrg } = useOrgStore();
  const { resolveRole, loading: roleLoading, isCollaborator } = useRoleStore();
  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);
  const { count: notificationCount } = useNotificationBadge();
  const openGlobalSearch = useOpenWorkspaceSearch();

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
      <div className="flex min-h-screen bg-layer-3">
        <aside className="w-[232px] border-r border-surface-200/80 bg-layer-3 px-4 py-5 space-y-5 hidden lg:block">
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
      <div className="flex min-h-screen items-center justify-center bg-layer-3">
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
    items.map((item) => {
      const href = item.href ?? '';
      const isInbox =
        href === '/notifications'
        || href === '/collaboration/inbox'
        || href === '/collaboration';
      return isInbox && notificationCount > 0
        ? { ...item, badge: notificationCount }
        : item;
    });

  const filterByPermission = (items: NavItem[]): NavItem[] =>
    items.filter((item) => {
      const href = item.href ?? '';
      // Prefix match for module roots (e.g. /collaboration)
      const check =
        NAV_CAN[href]
        ?? (href.startsWith('/collaboration')
          ? NAV_CAN['/collaboration']
          : undefined);
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
        userEmail={profile?.email || user.email || identity?.email || undefined}
        userName={identity?.displayName || profile?.displayName || undefined}
        userImage={identity?.avatarUrl ?? profile?.avatarUrl ?? undefined}
        onSignOut={handleSignOut}
        notificationCount={notificationCount}
        onOpenNotifications={() => router.push('/notifications')}
        onOpenCommandPalette={openGlobalSearch}
        logo={<StudioWordmark />}
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
              className="h-9 min-h-[40px] rounded-lg border border-divider bg-layer-2 px-3 pr-7 text-body-small font-medium text-content-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-150 cursor-pointer hover:border-surface-300 max-w-[140px] sm:max-w-none"
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
              className="hidden sm:block h-8 rounded-lg border border-divider bg-layer-2 px-3 pr-7 text-body-small font-medium text-content-secondary"
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
          <div className="rounded-xl bg-layer-3 px-6 py-4 shadow-raised border border-surface-200/80 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              <span className="text-sm text-text-600">Switching organisation&hellip;</span>
            </div>
          </div>
        </div>
      )}
      {/* BUILD-302B — global feedback trigger (authenticated shell only) */}
      <FeedbackTrigger />
    </>
  );
}
