'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArtists } from '@/hooks/useArtist';
import { Avatar, Button, EmptyState, LoadingState, StatusBadge } from '@releaseflow/ui';

const typeLabels: Record<string, string> = {
  original_artist: 'Original Artist', remix_artist: 'Remix Artist',
  cover_artist: 'Cover Artist', producer: 'Producer', dj: 'DJ',
  band: 'Band', label: 'Label',
};

export default function ArtistsPage() {
  const router = useRouter();
  const { artists, loading } = useArtists();

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
          <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">Artists</p>
          <p className="mt-1 text-sm text-text-400">Artists connected to your catalogue.</p>
          {artists.length > 0 ? (
            <p className="mt-0.5 text-sm text-text-400">{artists.length} artist{artists.length !== 1 ? 's' : ''}</p>
          ) : null}
        </div>
        <Link href="/artists/new">
          <Button variant="primary" size="md" className="rounded-xl">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Artist
          </Button>
        </Link>
      </div>

      {artists.length === 0 ? (
        <EmptyState title="No artists yet" description="Add your first artist to connect them to releases." action={{ label: 'Add Artist', onClick: () => router.push('/artists/new') }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-200/80 bg-layer-2 divide-y divide-surface-100/80 dark:bg-surface-900 dark:border-surface-700/80 dark:divide-surface-800">
          {artists.map((a) => (
            <Link key={a.id} href={`/artists/${a.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50/80 dark:hover:bg-surface-800/40 transition-colors duration-100 group">
              <Avatar name={a.name} src={a.imageUrl ?? undefined} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-900 dark:text-text-50 truncate group-hover:text-primary-600 transition-colors duration-100">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-text-500">{typeLabels[a.artistType] ?? a.artistType}</span>
                  {a.genres && a.genres.length > 0 ? <span className="text-xs text-text-400">{a.genres.slice(0, 2).join(', ')}</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={a.status} />
                <svg className="h-4 w-4 text-text-300 group-hover:text-text-500 transition-colors duration-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
