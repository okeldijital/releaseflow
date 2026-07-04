'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { createNewTrack } from '@/lib/track-service';

export default function AddTrackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { activeOrgId } = useOrgStore();
  const releaseId = params.get('releaseId') ?? '';
  const releaseName = params.get('name') ?? 'Your Release';
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in');
  }, [user, loading, router]);

  if (loading || !user) return null;

  async function handleAddTrack() {
    if (!user || !activeOrgId || !title.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createNewTrack({
        releaseId,
        title: title.trim(),
        organizationId: activeOrgId,
        createdBy: user.uid,
      });
      router.push(`/releases/${releaseId}`);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      setCreating(false);
      throw error;
    }
  }

  function handleSkip() {
    router.push(`/releases/${releaseId}`);
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-500 ${
              i < 5
                ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
                : i === 5
                  ? 'h-2 w-2 bg-primary-500/60'
                  : 'h-1.5 w-1.5 bg-surface-700'
            }`}
          />
        ))}
      </div>

      <p className="text-xs font-medium text-text-500 uppercase tracking-widest mb-3">{releaseName}</p>
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-surface-50">Add your first track</h1>
      <p className="mt-2 text-sm text-text-400">Every release starts with at least one track.</p>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Track title"
        className="mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-[18px] text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleAddTrack(); }}
      />

      {error && (
        <p className="mt-4 text-sm text-danger-400">{error}</p>
      )}

      <button
        type="button"
        onClick={handleAddTrack}
        disabled={!title.trim() || creating}
        className="mt-8 w-full h-12 rounded-xl bg-primary-500 text-white font-semibold text-[15px] hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]"
      >
        {creating ? 'Creating...' : 'Add Track'}
      </button>

      <button
        type="button"
        onClick={handleSkip}
        className="mt-3 w-full h-12 rounded-xl border border-surface-700 bg-transparent text-[15px] font-medium text-text-400 hover:text-text-200 hover:border-surface-600 active:scale-[0.98] transition-all duration-150"
      >
        Skip — add tracks later
      </button>
    </div>
  );
}
