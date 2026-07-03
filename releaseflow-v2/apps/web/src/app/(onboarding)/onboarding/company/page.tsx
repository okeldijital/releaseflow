'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getOrganizationsByUser, createOrganization } from '@/lib/organization-repository';

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
    if (user) getOrganizationsByUser(user.uid).then(setOrgs);
  }, [user, loading, router]);

  if (loading || !user) return null;

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
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-surface-50">
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
                  <p className="text-[15px] font-medium text-surface-100">{org.name}</p>
                </button>
              ))}
            </div>
          )}

          <button onClick={() => selectedOrg && handleContinue(selectedOrg)} disabled={!selectedOrg}
            className="mt-6 w-full h-12 rounded-xl bg-primary-500 text-white font-semibold text-[15px] hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]">
            Continue
          </button>

          <button onClick={() => setShowCreate(true)}
            className="mt-3 w-full h-12 rounded-xl border border-surface-700 bg-transparent text-[15px] font-medium text-text-400 hover:text-text-200 hover:border-surface-600 active:scale-[0.98] transition-all duration-150">
            + Create Company
          </button>
        </>
      ) : (
        <>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-surface-50">Create your company</h1>
          <p className="mt-2 text-sm text-text-400">Name your label or group to get started.</p>

          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name" autoFocus
            className="mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-[18px] text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150" />

          {error && <p className="mt-4 text-sm text-danger-400">{error}</p>}

          <button onClick={handleCreate} disabled={!companyName.trim() || saving}
            className="mt-6 w-full h-12 rounded-xl bg-primary-500 text-white font-semibold text-[15px] hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]">
            {saving ? 'Creating...' : 'Continue'}
          </button>

          {orgs.length > 0 && (
            <button onClick={() => setShowCreate(false)}
              className="mt-3 w-full h-12 rounded-xl border border-surface-700 bg-transparent text-[15px] font-medium text-text-400 hover:text-text-200 hover:border-surface-600 active:scale-[0.98] transition-all duration-150">
              Back to company list
            </button>
          )}
        </>
      )}

      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-sm">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-white"><path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" /></svg>
          </div>
          <span className="text-[15px] font-semibold text-surface-50 tracking-tight">ReleaseFlow</span>
        </div>
      </div>
    </div>
  );
}
