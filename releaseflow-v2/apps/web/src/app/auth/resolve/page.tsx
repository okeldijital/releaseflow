'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import { getUserProfile } from '@/lib/user-profile-repository';
import { useOrgStore } from '@/stores/org-store';

export default function AuthResolvePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { setActiveOrgId, setOrgsLoaded } = useOrgStore();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    const uid = user.uid;
    let cancelled = false;

    async function resolve() {
      const profile = await getUserProfile(uid);
      if (cancelled) return;

      const orgs = await getOrganizationsByUser(uid);
      if (cancelled) return;

      if (!profile || !profile.onboardingCompleted) {
        router.replace('/onboarding');
        return;
      }

      const persistedOrgId = useOrgStore.getState().activeOrgId;

      if (persistedOrgId && orgs.some((o) => o.id === persistedOrgId)) {
        setActiveOrgId(persistedOrgId);
      } else if (orgs.length === 1 && orgs[0]) {
        setActiveOrgId(orgs[0].id);
      }

      setOrgsLoaded(true);

      if (orgs.length > 1 && (!persistedOrgId || !orgs.some((o) => o.id === persistedOrgId))) {
        router.replace('/select-organization');
      } else if (orgs.length === 0) {
        router.replace('/select-organization');
      } else {
        router.replace('/dashboard');
      }
    }

    resolve();

    return () => { cancelled = true; };
  }, [user, loading, router, setActiveOrgId, setOrgsLoaded]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950">
      <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );
}
