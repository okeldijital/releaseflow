'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { createReleaseWithFullWorkflow } from '@/lib/release-service';
import { getStageTemplatesForReleaseType } from '@/lib/workflow-templates';
import { getRequirementNamesForReleaseType } from '@/lib/requirement-templates';

export default function ReleaseReadyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { activeOrgId } = useOrgStore();
  const releaseTypeParam = params.get('type') ?? 'single';
  const rt = (['single', 'ep', 'album', 'compilation', 'remix'] as const).includes(releaseTypeParam as never) ? releaseTypeParam : 'single';
  const name = params.get('name') ?? 'Untitled';
  const date = params.get('date') ?? null;
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in');
  }, [user, loading, router]);

  if (loading || !user) return null;

  async function handleCreate() {
    if (!user) return;
    setCreating(true);
    setError('');
    try {
      const stageTemplates = getStageTemplatesForReleaseType(rt as never);
      const requirementNames = getRequirementNamesForReleaseType(rt as never);
      const { releaseId } = await createReleaseWithFullWorkflow(
        {
          title: name,
          releaseType: rt as 'single' | 'ep' | 'album' | 'compilation' | 'remix',
          status: 'planning',
          organizationId: activeOrgId ?? '',
          createdBy: user.uid,
          targetReleaseDate: date ? new Date(date) : null,
        },
        stageTemplates,
        requirementNames,
        user.uid,
      );
      router.push(`/onboarding/add-track?releaseId=${releaseId}&name=${encodeURIComponent(name)}`);
    } catch {
      setError('Could not create release. Please try again.');
      setCreating(false);
    }
  }

  const typeLabel = { single: 'Single', ep: 'EP', album: 'Album', compilation: 'Compilation' }[rt] ?? 'Release';

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-500 ${
              i < 4
                ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
                : i === 4
                  ? 'h-2 w-2 bg-primary-500/60'
                  : 'h-1.5 w-1.5 bg-surface-700'
            }`}
          />
        ))}
      </div>

      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/15">
        <svg className="h-8 w-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-primary-400">Your release is ready</h1>
      <p className="mt-2 text-sm text-text-400">We&apos;ll create your {typeLabel.toLowerCase()} now.</p>

      <div className="mt-8 rounded-xl border border-surface-700 bg-surface-900 px-5 py-4 text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-text-500">Type</span>
          <span className="text-sm text-surface-200">{typeLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-text-500">Title</span>
          <span className="text-sm text-surface-200">{name}</span>
        </div>
        {date && (
          <div className="flex justify-between">
            <span className="text-xs text-text-500">Release date</span>
            <span className="text-sm text-surface-200">{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-danger-400">{error}</p>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="mt-10 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-60 transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]"
      >
        {creating ? 'Creating...' : 'Create Release'}
      </button>
    </div>
  );
}
