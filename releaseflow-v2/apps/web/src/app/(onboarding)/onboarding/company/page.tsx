'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getOrganizationsByUser, createOrganization } from '@/lib/organization-repository';
import {
  hasPendingInvitation,
  getInvitationNavigationState,
  getStoredInvitationToken,
} from '@/lib/auth-return';
import { OnboardingBrandBar } from '@/components/branding/onboarding-brand-bar';

const FLOW_LOG = '[Invitation Flow]';

export default function CompanyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) { router.push('/sign-in'); return; }
    // UAT-005 / ARCH-001: invitation token pending → resume invite (org from Firestore, not session).
    if (user && hasPendingInvitation()) {
      const nav = getInvitationNavigationState();
      const token = nav?.token || getStoredInvitationToken();
      const dest = nav?.returnUrl || (token ? `/invite/${token}` : '/auth/resolve');
      console.log(FLOW_LOG, '· Blocked company selection — invitation token present', {
        reason: 'invitation_already_defines_organization',
        dest,
        tokenPrefix: token?.slice(0, 8),
      });
      router.replace(dest);
      return;
    }
    if (user) getOrganizationsByUser(user.uid).then(setOrgs);
  }, [user, loading, router]);

  if (loading || !user) return null;
  if (hasPendingInvitation()) return null;

  function handleContinue(orgId: string) {
    router.push(`/onboarding/role?companyId=${orgId}`);
  }

  async function handleCreate() {
    if (!user || !companyName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const org = await createOrganization(companyName.trim(), slug, user.uid);
      handleContinue(org.id);
    } catch {
      setError('Could not create company. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className={`block rounded-full transition-all duration-500 ${
            i < 1 ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
            : i === 1 ? 'h-2 w-2 bg-primary-500/60'
            : 'h-1.5 w-1.5 bg-surface-700'
          }`} />
        ))}
      </div>

      {!showCreate ? (
        <>
          <h1 className="text-display-md font-semibold tracking-tight text-primary-400">
            Which company are you working with?
          </h1>
          <p className="mt-2 text-sm text-text-400">Choose an existing company or create a new one.</p>

          {orgs.length > 0 && (
            <div className="mt-8 space-y-2.5">
              {orgs.map((org) => (
                <button key={org.id} onClick={() => setSelectedOrg(org.id)}
                  className={`w-full text-left rounded-xl border px-5 py-4 transition-all duration-150 ${
                    selectedOrg === org.id
                      ? 'border-primary-500/60 bg-primary-500/10'
                      : 'border-surface-700 bg-surface-900 hover:border-surface-600'
                  }`}>
                  <p className="text-body font-medium text-surface-100">{org.name}</p>
                </button>
              ))}
            </div>
          )}

          <button onClick={() => selectedOrg && handleContinue(selectedOrg)} disabled={!selectedOrg}
            className="mt-6 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]">
            Continue
          </button>

          <button onClick={() => setShowCreate(true)}
            className="mt-3 w-full h-12 rounded-xl border border-surface-700 bg-transparent text-body font-medium text-text-400 hover:text-text-200 hover:border-surface-600 active:scale-[0.98] transition-all duration-150">
            + Create Company
          </button>
        </>
      ) : (
        <>
          <h1 className="text-display-md font-semibold tracking-tight text-primary-400">Create your company</h1>
          <p className="mt-2 text-sm text-text-400">Name your label or group to get started.</p>

          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name" autoFocus
            className="mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-body-large text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150" />

          {error && <p className="mt-4 text-sm text-danger-400">{error}</p>}

          <button onClick={handleCreate} disabled={!companyName.trim() || saving}
            className="mt-6 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]">
            {saving ? 'Creating...' : 'Continue'}
          </button>

          {orgs.length > 0 && (
            <button onClick={() => setShowCreate(false)}
              className="mt-3 w-full h-12 rounded-xl border border-surface-700 bg-transparent text-body font-medium text-text-400 hover:text-text-200 hover:border-surface-600 active:scale-[0.98] transition-all duration-150">
              Back to company list
            </button>
          )}
        </>
      )}

            <OnboardingBrandBar />
    </div>
  );
}
