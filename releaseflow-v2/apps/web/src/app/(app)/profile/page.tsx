'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { signOut as firebaseSignOut } from '@firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useRoleStore } from '@/stores/role-store';
import { getOrganization } from '@/lib/organization-repository';
import { getPersonByOrganizationAndUserId } from '@/lib/people-repository';
import type { PersonRecord } from '@/lib/people-repository';
import { Avatar, Button, Skeleton } from '@releaseflow/ui';
import { NotificationPreferencesPanel } from '@/components/profile/notification-preferences-panel';
import { StoragePanel } from '@/components/pwa/storage-panel';
import { InstallButton } from '@/components/pwa/install-button';

export default function ProfilePage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activeOrgId) { setLoading(false); return; }
    const load = async () => {
      try {
        const [p, org] = await Promise.all([
          getPersonByOrganizationAndUserId(activeOrgId, user.uid),
          getOrganization(activeOrgId),
        ]);
        setPerson(p);
        setOrgName(org?.name ?? '');
      } catch {
        setPerson(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, activeOrgId]);

  async function handleSignOut() {
    try {
      const { clearOfflineDataOnLogout } = await import('@/lib/pwa/clear-on-logout');
      await clearOfflineDataOnLogout();
    } catch { /* ignore */ }
    const auth = getAuthInstance();
    if (auth) await firebaseSignOut(auth);
    useOrgStore.getState().setActiveOrgId(null);
    useOrgStore.getState().setOrgsLoaded(false);
    useRoleStore.getState().reset();
    router.replace('/sign-in');
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-10 page-transition">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="card" className="h-14" />
          <Skeleton variant="card" className="h-14" />
          <Skeleton variant="card" className="h-14" />
        </div>
      </div>
    );
  }

  const photoURL = user?.photoURL ?? undefined;
  const displayName = user?.displayName ?? person?.displayName ?? user?.email?.split('@')[0] ?? 'User';

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-10 page-transition">
      <div className="flex flex-col items-center mb-8">
        <Avatar
          src={photoURL}
          name={displayName}
          size="xl"
          className="shadow-lg"
        />
        <h1 className="text-xl font-semibold text-surface-50 mt-4">{displayName}</h1>
      </div>

      <div className="rounded-xl border border-surface-700/60 bg-surface-900 divide-y divide-surface-700/40">
        {user?.email && (
          <div className="px-5 py-4">
            <p className="text-xs text-text-500 uppercase tracking-widest">Email</p>
            <p className="text-sm text-surface-100 mt-1">{user.email}</p>
          </div>
        )}
        {user?.phoneNumber && (
          <div className="px-5 py-4">
            <p className="text-xs text-text-500 uppercase tracking-widest">Phone</p>
            <p className="text-sm text-surface-100 mt-1">{user.phoneNumber}</p>
          </div>
        )}
        {orgName && (
          <div className="px-5 py-4">
            <p className="text-xs text-text-500 uppercase tracking-widest">Organization</p>
            <p className="text-sm text-surface-100 mt-1">{orgName}</p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-surface-700/60 bg-surface-900 px-5 py-5">
        <h2 className="text-sm font-semibold text-primary-400 mb-4">Notifications</h2>
        <NotificationPreferencesPanel />
      </div>

      <div className="mt-8 rounded-xl border border-surface-700/60 bg-surface-900 px-5 py-5">
        <h2 className="text-sm font-semibold text-primary-400 mb-4">Storage</h2>
        <StoragePanel />
      </div>

      <div className="mt-8 rounded-xl border border-surface-700/60 bg-surface-900 px-5 py-5">
        <h2 className="text-sm font-semibold text-primary-400 mb-2">Install ReleaseFlow</h2>
        <p className="text-xs text-text-500 mb-3">
          Install as an app for faster launch and offline access. Optional — never required.
        </p>
        <InstallButton />
      </div>

      <div className="mt-8">
        <Button
          variant="danger"
          className="w-full"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
