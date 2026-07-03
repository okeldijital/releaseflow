'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function ReleaseNamePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const releaseType = params.get('type') ?? 'single';
  const [name, setName] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in');
  }, [user, loading, router]);

  if (loading || !user) return null;

  function handleContinue() {
    if (!name.trim()) return;
    router.push(`/onboarding/release-date?type=${releaseType}&name=${encodeURIComponent(name.trim())}`);
  }

  const typeLabel = { single: 'Single', ep: 'EP', album: 'Album', deluxe: 'Deluxe', compilation: 'Compilation' }[releaseType] ?? 'Release';

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-500 ${
              i < 2
                ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
                : i === 2
                  ? 'h-2 w-2 bg-primary-500/60'
                  : 'h-1.5 w-1.5 bg-surface-700'
            }`}
          />
        ))}
      </div>

      <p className="text-xs font-medium text-primary-400 uppercase tracking-widest mb-3">{typeLabel}</p>
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-surface-50">What is it called?</h1>
      <p className="mt-2 text-sm text-text-400">Give your {typeLabel.toLowerCase()} a name.</p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={typeLabel === 'Album' ? 'Midnight Frequencies' : 'Track Title'}
        className="mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-[18px] text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleContinue(); }}
      />

      <button
        type="button"
        onClick={handleContinue}
        disabled={!name.trim()}
        className="mt-8 w-full h-12 rounded-xl bg-primary-500 text-white font-semibold text-[15px] hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]"
      >
        Continue
      </button>
    </div>
  );
}
