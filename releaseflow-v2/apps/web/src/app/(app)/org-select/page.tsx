'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import { getUserProfile, updateUserDefaultOrg } from '@/lib/user-profile-repository';
import type { OrganizationRecord } from '@/lib/organization-repository';
import { Skeleton } from '@releaseflow/ui';

export default function OrgSelectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { activeOrgId, setActiveOrgId, setOrgsLoaded } = useOrgStore();
  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    const uid = user!.uid;
    async function load() {
      const profile = await getUserProfile(uid);
      const userOrgs = await getOrganizationsByUser(uid);
      setOrgs(userOrgs);

      let preselected = activeOrgId || profile?.defaultOrganizationId || null;
      if (!preselected && userOrgs.length > 0) preselected = userOrgs[0]!.id;
      setSelectedId(preselected);

      if (userOrgs.length === 1) {
        setActiveOrgId(userOrgs[0]!.id);
        setOrgsLoaded(true);
        router.replace('/dashboard');
        return;
      }

      setLoading(false);
    }
    load();
  }, [user, authLoading, activeOrgId, setActiveOrgId, setOrgsLoaded, router]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  async function handleContinue() {
    if (!selectedId || !user) return;
    setSaving(true);
    setActiveOrgId(selectedId);
    setOrgsLoaded(true);
    await updateUserDefaultOrg(user.uid, selectedId);
    router.replace('/dashboard');
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 py-12">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton variant="card" className="h-16" />
          <Skeleton variant="card" className="h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 py-12">
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(204,85,0,0.06) 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 shadow-lg">
              <svg viewBox="0 0 20 20" className="h-6 w-6 fill-white">
                <path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" />
              </svg>
            </div>
            <h1 className="text-display-md font-semibold text-surface-50 tracking-tight">Welcome back,</h1>
            <p className="text-display-md font-semibold text-primary-400 tracking-tight">{displayName}</p>
            <p className="mt-2 text-sm text-text-400">Which organization would you like to access today?</p>
          </div>

          <div className="space-y-2 mb-6">
            {orgs.map((org) => {
              const isSelected = selectedId === org.id;
              const initial = org.name.charAt(0).toUpperCase();
              return (
                <button
                  key={org.id}
                  onClick={() => setSelectedId(org.id)}
                  className={`w-full flex items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-150 text-left ${
                    isSelected
                      ? 'border-primary-500/60 bg-primary-500/10 ring-1 ring-primary-500/30'
                      : 'border-surface-700/60 bg-surface-800/50 hover:border-surface-600 hover:bg-surface-800'
                  }`}
                >
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-lg ${
                    isSelected ? 'bg-primary-500' : 'bg-gradient-to-br from-primary-500 to-primary-700'
                  }`}>
                    <span className="text-lg font-bold text-surface-50/90">{initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isSelected ? 'text-primary-300' : 'text-text-800'}`}>{org.name}</p>
                    <p className="text-xs text-text-500">{org.slug}</p>
                  </div>
                  {isSelected && (
                    <svg className="h-5 w-5 shrink-0 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedId || saving}
            className="w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]"
          >
            {saving ? 'Opening...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
