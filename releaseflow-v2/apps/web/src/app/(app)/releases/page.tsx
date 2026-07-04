'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useReleases } from '@/hooks/useRelease';
import { fmtDate } from '@/lib/utils';
import { Button, StatusBadge, LoadingState, EmptyState } from '@releaseflow/ui';

export default function ReleasesPage() {
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const { releases, loading, error, refresh } = useReleases();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">Releases</p>
          <p className="mt-1 text-sm text-text-400">Manage every release from planning to distribution.</p>
          {releases.length > 0 ? (
            <p className="mt-0.5 text-sm text-text-400">{releases.length} release{releases.length !== 1 ? 's' : ''}</p>
          ) : null}
        </div>
        {activeOrgId ? (
          <Link href="/releases/new">
            <Button variant="primary" size="md" className="rounded-xl">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Release
            </Button>
          </Link>
        ) : null}
      </div>

      {!activeOrgId ? (
        <EmptyState
          title="No organisation selected"
          description="Select an organisation from the top bar to view its releases."
          action={{ label: 'Manage Organisations', onClick: () => router.push('/organizations') }}
        />
      ) : error ? (
        <EmptyState title="Failed to load releases" description={error} action={{ label: 'Retry', onClick: refresh }} />
      ) : releases.length === 0 ? (
        <EmptyState
          title="No releases yet"
          description="Create your first release to begin managing production, legal, distribution and collaboration."
          action={{ label: 'Create Release', onClick: () => router.push('/releases/new') }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-200/80 bg-layer-2 divide-y divide-surface-100/80 dark:bg-surface-900 dark:border-surface-700/80 dark:divide-surface-800">
          {releases.map((release) => (
            <Link
              key={release.id}
              href={`/releases/${release.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50/80 dark:hover:bg-surface-800/40 transition-colors duration-100 group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 text-primary-400" aria-hidden="true">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="font-semibold text-text-900 dark:text-text-50 truncate group-hover:text-primary-600 transition-colors duration-100">{release.title}</p>
                  <StatusBadge status={release.status} />
                </div>
                <p className="mt-0.5 text-xs text-text-500 capitalize">
                  {release.releaseType}
                  {release.targetReleaseDate ? (<> &middot; Target {fmtDate(release.targetReleaseDate)}</>) : null}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-text-400 hidden sm:block">{fmtDate(release.createdAt)}</span>
                <svg className="h-4 w-4 text-text-300 group-hover:text-text-500 transition-colors duration-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
