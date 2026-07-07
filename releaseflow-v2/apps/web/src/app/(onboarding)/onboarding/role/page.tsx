'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const ROLE_CATEGORIES: { key: string; label: string; roles: { value: string; label: string }[] }[] = [
  { key: 'business', label: 'Business',
    roles: [
      { value: 'Company Owner', label: 'Company Owner' },
      { value: 'Label Manager', label: 'Label Manager' },
      { value: 'A&R Manager', label: 'A&R Manager' },
      { value: 'Operations Manager', label: 'Operations Manager' },
    ]},
  { key: 'creative', label: 'Creative',
    roles: [
      { value: 'Producer', label: 'Producer' },
      { value: 'Recording Engineer', label: 'Recording Engineer' },
      { value: 'Mixing Engineer', label: 'Mixing Engineer' },
      { value: 'Mastering Engineer', label: 'Mastering Engineer' },
      { value: 'Graphic Designer', label: 'Graphic Designer' },
      { value: 'Video Producer', label: 'Video Producer' },
      { value: 'Photographer', label: 'Photographer' },
    ]},
  { key: 'artist', label: 'Artist',
    roles: [
      { value: 'Artist', label: 'Artist' },
      { value: 'Songwriter', label: 'Songwriter' },
      { value: 'Composer', label: 'Composer' },
    ]},
  { key: 'support', label: 'Support',
    roles: [
      { value: 'Marketing', label: 'Marketing' },
      { value: 'Distribution', label: 'Distribution' },
      { value: 'Administrator', label: 'Administrator' },
    ]},
];

export default function ChooseRolePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const companyId = params.get('companyId') ?? '';
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in');
  }, [user, loading, router]);

  if (loading || !user) return null;

  const category = ROLE_CATEGORIES.find((c) => c.roles.some((r) => r.value === selectedRole));

  function handleContinue() {
    if (!selectedRole || !category) return;
    router.push(`/onboarding/complete?companyId=${companyId}&role=${encodeURIComponent(selectedRole)}&category=${category.key}`);
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className={`block rounded-full transition-all duration-500 ${
            i < 2 ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
            : i === 2 ? 'h-2 w-2 bg-primary-500/60'
            : 'h-1.5 w-1.5 bg-surface-700'
          }`} />
        ))}
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-surface-50">What is your role at this company?</h1>
      <p className="mt-2 text-sm text-text-400">We&apos;ll personalize ReleaseFlow based on the work you do.</p>

      <div className="mt-8 space-y-6">
        {ROLE_CATEGORIES.map((cat) => (
          <div key={cat.key} className="text-left">
            <p className="text-xs font-medium text-text-500 uppercase tracking-widest mb-2 px-1">{cat.label}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {cat.roles.map((role) => (
                <button key={role.value} onClick={() => setSelectedRole(role.value)}
                  className={`text-left rounded-xl border px-4 py-3 transition-all duration-150 ${
                    selectedRole === role.value
                      ? 'border-primary-500/60 bg-primary-500/10 shadow-[0_0_20px_rgba(204,85,0,0.06)]'
                      : 'border-surface-700 bg-surface-900 hover:border-surface-600'
                  }`}>
                  <p className="text-sm font-medium text-surface-100">{role.label}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleContinue} disabled={!selectedRole}
        className="mt-10 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]">
        Continue
      </button>

      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-sm">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-white"><path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" /></svg>
          </div>
          <span className="text-body font-semibold text-surface-50 tracking-tight">ReleaseFlow</span>
        </div>
      </div>
    </div>
  );
}
