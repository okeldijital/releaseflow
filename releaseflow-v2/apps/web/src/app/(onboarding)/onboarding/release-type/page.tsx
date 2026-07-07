'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

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

      <h1 className="text-display-md font-semibold tracking-tight text-surface-50">What are you releasing?</h1>
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

      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-sm">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-white">
              <path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" />
            </svg>
          </div>
          <span className="text-body font-semibold text-surface-50 tracking-tight">ReleaseFlow</span>
        </div>
      </div>
    </div>
  );
}
