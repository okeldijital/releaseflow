'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function ReleaseDatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const releaseType = params.get('type') ?? 'single';
  const name = params.get('name') ?? 'Untitled';
  const [date, setDate] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in');
  }, [user, loading, router]);

  if (loading || !user) return null;

  function handleContinue() {
    const dateParam = date ? `&date=${date}` : '';
    router.push(`/onboarding/ready?type=${releaseType}&name=${encodeURIComponent(name)}${dateParam}`);
  }

  function handleSkip() {
    router.push(`/onboarding/ready?type=${releaseType}&name=${encodeURIComponent(name)}`);
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-500 ${
              i < 3
                ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
                : i === 3
                  ? 'h-2 w-2 bg-primary-500/60'
                  : 'h-1.5 w-1.5 bg-surface-700'
            }`}
          />
        ))}
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-primary-400">When do you want to release it?</h1>
      <p className="mt-2 text-sm text-text-400">You can always change this later.</p>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-body-large text-surface-50 text-center focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150 [color-scheme:dark]"
        min={new Date().toISOString().split('T')[0]}
      />

      <button
        type="button"
        onClick={handleContinue}
        disabled={!date}
        className="mt-8 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]"
      >
        Continue
      </button>

      <button
        type="button"
        onClick={handleSkip}
        className="mt-3 w-full h-12 rounded-xl border border-surface-700 bg-transparent text-body font-medium text-text-400 hover:text-text-200 hover:border-surface-600 active:scale-[0.98] transition-all duration-150"
      >
        Skip for now
      </button>
    </div>
  );
}
