'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { AppShell, Skeleton } from '@releaseflow/ui';
import type { NavItem, NavSection } from '@releaseflow/ui';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import type { OrganizationRecord } from '@/lib/organization-repository';

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
    </svg>
  );
}

const navSections: NavSection[] = [
  { key: 'operations', label: 'Operations' },
  { key: 'resources', label: 'Resources' },
  { key: 'system', label: 'System' },
];

const navItems: NavItem[] = [
  {
    label: 'Home',
    icon: NavIcon({ d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }),
    href: '/dashboard',
    section: 'operations',
  },
  {
    label: 'Releases',
    icon: NavIcon({ d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }),
    href: '/releases',
    section: 'operations',
  },
  {
    label: 'Work',
    icon: NavIcon({ d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }),
    href: '/work',
    section: 'operations',
  },
  {
    label: 'Artists',
    icon: NavIcon({ d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' }),
    href: '/artists',
    section: 'resources',
  },
  {
    label: 'Assets',
    icon: NavIcon({ d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }),
    href: '/assets',
    section: 'resources',
  },
  {
    label: 'People',
    icon: NavIcon({ d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }),
    href: '/people',
    section: 'resources',
  },
  {
    label: 'Administration',
    icon: NavIcon({ d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
    href: '/administration',
    section: 'system',
  },
];

const pathLabels: Record<string, string> = {
  '/dashboard': 'Operations',
  '/releases': 'Releases',
  '/artists': 'Artists',
  '/assets': 'Assets',
  '/people': 'People',
  '/work': 'Work',
  '/administration': 'Administration',
  '/campaigns': 'Campaigns',
  '/approvals': 'Approvals',
  '/budgets': 'Budgets',
  '/brief': 'Brief',
  '/organizations': 'Organization',
  '/contributor': 'Contributor',
  '/rights-holders': 'Rights Holders',
  '/audit': 'Audit',
  '/diagnostics': 'Diagnostics',
};

function buildBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const href = '/' + segments.slice(0, i + 1).join('/');

    if (/^[a-f0-9-]{20,}$/.test(segment)) {
      if (crumbs.length > 0) {
        crumbs.push({ label: segment.slice(0, 8) + '...', href: undefined });
      }
      continue;
    }

    const key = '/' + segment;
    if (pathLabels[key]) {
      crumbs.push({ label: pathLabels[key], href });
    } else if (segments[i - 1] === 'releases' && i === segments.length - 1) {
      crumbs.push({ label: 'Detail', href: undefined });
    } else if (segment === 'new') {
      crumbs.push({ label: 'New', href });
    } else if (segment === 'edit') {
      crumbs.push({ label: 'Edit', href });
    } else if (segment === 'audit') {
      crumbs.push({ label: 'Audit', href });
    } else if (segment === 'diagnostics') {
      crumbs.push({ label: 'Diagnostics', href });
    } else {
      crumbs.push({ label: segment, href: undefined });
    }
  }

  return crumbs;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrgId, setActiveOrgId, setOrgsLoaded } = useOrgStore();
  const { resolveRole } = useRoleStore();
  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in');
    if (user) resolveRole(user.uid);
  }, [user, loading, router, resolveRole]);

  useEffect(() => {
    if (!user) return;
    getOrganizationsByUser(user.uid).then((data) => {
      setOrgs(data);
      if (data.length > 0 && data[0]) setActiveOrgId(data[0].id);
      setOrgsLoaded(true);
    });
  }, [user, setActiveOrgId, setOrgsLoaded]);

  const breadcrumbItems = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
        {/* Skeleton sidebar */}
        <aside className="w-[232px] border-r border-surface-200/80 bg-surface-50 px-4 py-5 space-y-5 hidden lg:block dark:bg-surface-900 dark:border-surface-700/80">
          <div className="flex items-center gap-2.5 px-1 pb-3 border-b border-surface-200/60 dark:border-surface-700/60">
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
        {/* Skeleton main */}
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

  async function handleSignOut() {
    const auth = getAuthInstance();
    if (auth) await firebaseSignOut(auth);
    useOrgStore.getState().setActiveOrgId(null);
    useOrgStore.getState().setOrgsLoaded(false);
    useRoleStore.getState().reset();
  }

  return (
    <AppShell
        navItems={navItems}
        navSections={navSections}
        activePath={pathname}
        onNavigate={(href) => router.push(href)}
        userEmail={user.email ?? undefined}
        onSignOut={handleSignOut}
        breadcrumbItems={breadcrumbItems}
        topbarChildren={
          orgs.length > 0 ? (
            <select
              value={activeOrgId ?? ''}
              onChange={(e) => setActiveOrgId(e.target.value || null)}
              className="h-8 rounded-lg border border-surface-200 bg-white px-3 pr-7 text-[13px] font-medium text-text-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-150 cursor-pointer hover:border-surface-300 dark:bg-surface-900 dark:border-surface-700 dark:text-text-300"
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
  );
}
