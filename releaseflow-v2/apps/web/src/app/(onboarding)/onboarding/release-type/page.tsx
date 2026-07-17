'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { OnboardingBrandBar } from '@/components/branding/onboarding-brand-bar';

const RELEASE_TYPES = [
  { value: 'single', label: 'Single', description: 'One track release' },
  { value: 'ep', label: 'EP', description: '3–6 tracks' },
  { value: 'album', label: 'Album', description: '7+ tracks' },
  { value: 'deluxe', label: 'Deluxe', description: 'Album with bonus tracks' },
  { value: 'compilation', label: 'Compilation', description: 'Collection from various artists' },
];

export default function ReleaseTypePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in');
  }, [user, loading, router]);

  if (loading || !user) return null;

  function handleContinue() {
    if (!selected) return;
    router.push(`/onboarding/release-name?type=${selected}`);
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-500 ${
              i === 0
                ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
                : i === 1
                  ? 'h-2 w-2 bg-primary-500/60'
                  : 'h-1.5 w-1.5 bg-surface-700'
            }`}
          />
        ))}
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-primary-400">What are you releasing?</h1>
      <p className="mt-2 text-sm text-text-400">Choose the format for your first release.</p>

      <div className="mt-8 space-y-2.5">
        {RELEASE_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setSelected(type.value)}
            className={`w-full text-left rounded-xl border px-5 py-4 transition-all duration-150 ${
              selected === type.value
                ? 'border-primary-500/60 bg-primary-500/10 shadow-[0_0_20px_rgba(204,85,0,0.08)]'
                : 'border-surface-700 bg-surface-900 hover:border-surface-600'
            }`}
          >
            <p className="text-body font-medium text-surface-100">{type.label}</p>
            <p className="text-xs text-text-500 mt-0.5">{type.description}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected}
        className="mt-10 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]"
      >
        Continue
      </button>

            <OnboardingBrandBar />
    </div>
  );
}
