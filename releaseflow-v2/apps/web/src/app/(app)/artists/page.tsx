'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getArtists } from '@/lib/artist-service';
import type { Artist } from '../types';

const typeLabels: Record<string, string> = {
  original_artist: 'Original Artist',
  remix_artist: 'Remix Artist',
  cover_artist: 'Cover Artist',
  producer: 'Producer',
  dj: 'DJ',
  band: 'Band',
  label: 'Label',
};

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArtists().then(setArtists).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Artists</h1>
        <Link href="/artists/new" className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">New Artist</Link>
      </div>

      {artists.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <p className="text-zinc-500 mb-1">No artists yet.</p>
          <Link href="/artists/new" className="text-sm text-zinc-900 dark:text-zinc-100 underline underline-offset-4">Add your first artist</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {artists.map((a) => (
            <Link key={a.id} href={`/artists/${a.id}`} className="flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center text-lg font-semibold text-zinc-500 dark:text-zinc-400 overflow-hidden">
                {a.imageUrl ? <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" /> : a.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">{typeLabels[a.artistType] ?? a.artistType}</span>
                  {a.genres && a.genres.length > 0 ? (
                    <span className="text-xs text-zinc-400">{a.genres.slice(0, 2).join(', ')}</span>
                  ) : null}
                </div>
              </div>
              <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>{a.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
