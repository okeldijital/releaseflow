'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { AppShell, Skeleton } from '@releaseflow/ui';
import type { NavItem } from '@releaseflow/ui';
import type { Organization } from './types';

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: NavIcon({ d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }), href: '/dashboard', section: 'operations' },
  { label: 'Releases', icon: NavIcon({ d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }), href: '/releases', section: 'operations' },
  { label: 'Artists', icon: NavIcon({ d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' }), href: '/artists', section: 'operations' },
  { label: 'Campaigns', icon: NavIcon({ d: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' }), href: '/campaigns', section: 'execution' },
  { label: 'Operations', icon: NavIcon({ d: 'M13 10V3L4 14h7v7l9-11h-7z' }), href: '/operations', section: 'monitoring' },
  { label: 'Approvals', icon: NavIcon({ d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }), href: '/approvals', section: 'monitoring' },
  { label: 'Organizations', icon: NavIcon({ d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }), href: '/organizations', section: 'administration' },
  { label: 'Contributor', icon: NavIcon({ d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }), href: '/contributor', section: 'execution' },
];

async function getOrganizationsByUser(userId: string): Promise<Organization[]> {
  const db = getDb();
  if (!db) return [];
  const membershipsRef = collection(db, 'memberships');
  const q = query(membershipsRef, where('userId', '==', userId), where('status', '==', 'active'));
  const snapshot = await getDocs(q);
  const orgs: Organization[] = [];
  for (const d of snapshot.docs) {
    const membership = d.data() as { organizationId: string };
    const orgSnap = await getDoc(doc(db, 'organizations', membership.organizationId));
    if (orgSnap.exists()) orgs.push(orgSnap.data() as Organization);
  }
  return orgs;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrgId, setActiveOrgId } = useOrgStore();
  const { resolveRole } = useRoleStore();
  const [orgs, setOrgs] = useState<Organization[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in');
    if (user) resolveRole(user.uid);
  }, [user, loading, router, resolveRole]);

  useEffect(() => {
    if (!user) return;
    getOrganizationsByUser(user.uid).then((data) => {
      setOrgs(data);
      if (!activeOrgId && data[0]) setActiveOrgId(data[0].id);
    });
  }, [user, activeOrgId, setActiveOrgId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <aside className="w-60 border-r border-surface-200 bg-white px-4 py-5 space-y-4 hidden lg:block">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-2.5 w-48" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-2.5 w-full" /><Skeleton className="h-2.5 w-3/4" /><Skeleton className="h-2.5 w-1/2" />
          </div>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-2.5 w-full" /><Skeleton className="h-2.5 w-2/3" />
          </div>
        </aside>
        <div className="flex-1 px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 grid-cols-3">
              <Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" />
            </div>
            <Skeleton variant="card" />
            <Skeleton variant="card" className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  async function handleSignOut() {
    const auth = getAuthInstance();
    if (auth) await firebaseSignOut(auth);
  }

  return (
    <AppShell
      navItems={navItems}
      activePath={pathname}
      onNavigate={(href) => router.push(href)}
      userEmail={user.email ?? undefined}
      onSignOut={handleSignOut}
      topbarChildren={
        orgs.length > 0 ? (
          <select value={activeOrgId ?? ''} onChange={(e) => setActiveOrgId(e.target.value || null)}
            className="rounded-lg border border-surface-300 bg-white dark:bg-surface-800 px-3 py-1.5 text-sm text-text-700 dark:text-text-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
            {orgs.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
