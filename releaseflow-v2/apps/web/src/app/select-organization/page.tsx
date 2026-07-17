'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import {
  getOrganizationsByUser,
  getPendingMemberships,
  acceptMembership,
  removeMembership,
  createOrganization,
  type OrganizationRecord,
  type MembershipRecord,
} from '@/lib/organization-repository';
import { getAuthInstance } from '@/lib/firebase';
import { signOut } from '@firebase/auth';

export default function SelectOrganizationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { activeOrgId, setActiveOrgId, setOrgsLoaded } = useOrgStore();
  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);
  const [invites, setInvites] = useState<(MembershipRecord & { orgName?: string })[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [orgError, setOrgError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    const uid = user.uid;
    let cancelled = false;

    async function load() {
      const userOrgs = await getOrganizationsByUser(uid);
      if (cancelled) return;
      setOrgs(userOrgs);

      const pendingInvites = await getPendingMemberships(uid);
      if (cancelled) return;
      setInvites(pendingInvites);

      const preselected = activeOrgId ?? userOrgs[0]?.id ?? null;
      setSelectedId(preselected);

      if (userOrgs.length === 1 && userOrgs[0]) {
        setActiveOrgId(userOrgs[0].id);
        setOrgsLoaded(true);
        router.replace('/dashboard');
        return;
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, activeOrgId, setActiveOrgId, setOrgsLoaded, router]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  async function handleContinue() {
    if (!selectedId || !user) return;
    setSaving(true);
    setActiveOrgId(selectedId);
    setOrgsLoaded(true);
    router.replace('/dashboard');
  }

  async function handleAcceptInvite(inviteId: string) {
    setSaving(true);
    setInviteError('');
    try {
      await acceptMembership(inviteId);
      if (!user) return;
      const userOrgs = await getOrganizationsByUser(user.uid);
      const pendingInvites = await getPendingMemberships(user.uid);
      setOrgs(userOrgs);
      setInvites(pendingInvites);
      const firstOrg = userOrgs[0];
      if (firstOrg) {
        setSelectedId(firstOrg.id);
      }
    } catch {
      setInviteError('Failed to accept invitation. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeclineInvite(inviteId: string) {
    setSaving(true);
    setInviteError('');
    try {
      await removeMembership(inviteId);
      if (!user) return;
      const pendingInvites = await getPendingMemberships(user.uid);
      setInvites(pendingInvites);
    } catch {
      setInviteError('Failed to decline invitation. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim() || !user) return;
    setCreatingOrg(true);
    setOrgError('');
    try {
      const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const org = await createOrganization(newOrgName.trim(), slug, user.uid);
      
      setActiveOrgId(org.id);
      setOrgsLoaded(true);
      router.replace('/dashboard');
    } catch {
      setOrgError('Failed to create organization. Please try again.');
      setCreatingOrg(false);
    }
  }

  async function handleSignOut() {
    const auth = getAuthInstance();
    if (auth) {
      await signOut(auth);
    }
    useOrgStore.getState().setActiveOrgId(null);
    useOrgStore.getState().setOrgsLoaded(false);
    router.replace('/sign-in');
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 py-12">
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(204,85,0,0.06) 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 shadow-lg">
              <svg viewBox="0 0 20 20" className="h-6 w-6 fill-white">
                <path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" />
              </svg>
            </div>
            <h1 className="text-display-md font-semibold text-surface-50 tracking-tight">Welcome back,</h1>
            <p className="text-display-md font-semibold text-primary-400 tracking-tight">{displayName}</p>
            {orgs.length > 0 ? (
              <p className="mt-2 text-sm text-text-400">Choose an organization</p>
            ) : (
              <p className="mt-2 text-sm text-text-400">Create or join an organization to get started</p>
            )}
          </div>

          {orgs.length > 0 && (
            <div className="mb-6">
              <div className="space-y-2 mb-4">
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-surface-700/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface-900 px-3 text-xs font-medium text-text-500 uppercase tracking-wider">or</span>
                </div>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-3">Pending Invitations ({invites.length})</h2>
              {inviteError && (
                <p className="mb-3 text-sm text-danger-400 bg-danger-500/10 rounded-lg py-2 px-3">{inviteError}</p>
              )}
              <div className="space-y-3">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex flex-col gap-3 border border-surface-700/60 rounded-xl bg-surface-800/40 p-4">
                    <div>
                      <p className="text-sm font-medium text-surface-100">{inv.orgName ?? 'Organization'}</p>
                      <p className="text-xs text-text-500 capitalize">Role: {inv.roleId}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvite(inv.id)}
                        disabled={saving}
                        className="flex-1 h-9 rounded-lg bg-primary-500 text-xs font-semibold text-surface-50 hover:bg-primary-400 disabled:opacity-50 transition-colors pointer-events-auto cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(inv.id)}
                        disabled={saving}
                        className="flex-1 h-9 rounded-lg border border-surface-700 bg-transparent text-xs font-semibold text-text-400 hover:text-text-200 hover:border-surface-600 disabled:opacity-50 transition-colors pointer-events-auto cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-surface-700/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface-900 px-3 text-xs font-medium text-text-500 uppercase tracking-wider">or</span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-3">Create an Organization</h2>
            {orgError && (
              <p className="mb-3 text-sm text-danger-400 bg-danger-500/10 rounded-lg py-2 px-3">{orgError}</p>
            )}
            <form onSubmit={handleCreateOrg} className="space-y-3">
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Organization name"
                required
                className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-body text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
              />
              <button
                type="submit"
                disabled={creatingOrg || !newOrgName.trim()}
                className="w-full h-11 rounded-xl bg-surface-800 hover:bg-surface-700 border border-surface-700/80 text-surface-200 font-semibold text-sm hover:border-surface-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
              >
                {creatingOrg ? 'Creating...' : 'Create Organization'}
              </button>
            </form>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-text-500 hover:text-primary-400 transition-colors duration-150 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
