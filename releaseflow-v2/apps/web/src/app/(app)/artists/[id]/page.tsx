'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getArtist, updateArtist, checkArtistReadiness, getCreditsByArtist } from '@/lib/artist-service';
import type { Artist, ReleaseArtist, TrackCredit } from '../../types';

const typeLabels: Record<string, string> = {
  original_artist: 'Original Artist',
  remix_artist: 'Remix Artist',
  cover_artist: 'Cover Artist',
  producer: 'Producer',
  dj: 'DJ',
  band: 'Band',
  label: 'Label',
};

export default function ArtistDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [readiness, setReadiness] = useState<{ ready: boolean; percentage: number; missing: string[] } | null>(null);
  const [releases, setReleases] = useState<{ id: string; title: string; role: string }[]>([]);
  const [credits, setCredits] = useState<(TrackCredit & { trackTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [genres, setGenres] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function loadData() {
    const [a, r] = await Promise.all([getArtist(id), checkArtistReadiness(id)]);
    if (!a) return;
    setArtist(a);
    setReadiness(r);
    setBio(a.bio ?? '');
    setCountry(a.country ?? '');
    setGenres((a.genres ?? []).join(', '));
    setImageUrl(a.imageUrl ?? '');

    const db = getDb();
    if (db) {
      const relSnap = await getDocs(query(collection(db, 'release_artists'), where('artistId', '==', id)));
      const rels = relSnap.docs.map((d) => d.data() as ReleaseArtist);
      const relData: { id: string; title: string; role: string }[] = [];
      for (const rel of rels) {
        const rSnap = await getDoc(doc(db, 'releases', rel.releaseId));
        if (rSnap.exists()) relData.push({ id: rSnap.id, title: rSnap.data().title as string, role: rel.role });
      }
      setReleases(relData);

      const credSnap = await getCreditsByArtist(id);
      const credData: (TrackCredit & { trackTitle?: string })[] = [...credSnap];
      for (const c of credData) {
        const tSnap = await getDoc(doc(db, 'tracks', c.trackId));
        if (tSnap.exists()) c.trackTitle = tSnap.data().title as string;
      }
      setCredits(credData);
    }
  }

  useEffect(() => { loadData().then(() => setLoading(false)); }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    await updateArtist(id, {
      bio: bio.trim() || undefined,
      country: country.trim() || undefined,
      genres: genres ? genres.split(',').map((g) => g.trim()).filter(Boolean) : undefined,
      imageUrl: imageUrl.trim() || undefined,
    });
    setEditing(false);
    await loadData();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }
  if (!artist) {
    return <div className="flex items-center justify-center py-20"><p className="text-zinc-500">Artist not found.</p></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/artists" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-block">&larr; Back</Link>

      <div className="flex items-start gap-6 mb-8">
        <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center text-3xl font-bold text-zinc-500 dark:text-zinc-400 overflow-hidden">
          {artist.imageUrl ? <img src={artist.imageUrl} alt={artist.name} className="h-full w-full object-cover" /> : artist.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{artist.name}</h1>
            <span className={`text-xs rounded-full px-2 py-0.5 ${artist.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>{artist.status}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-0.5 text-zinc-700 dark:text-zinc-300">{typeLabels[artist.artistType] ?? artist.artistType}</span>
            {artist.country ? <span className="text-sm text-zinc-500">{artist.country}</span> : null}
            {artist.genres ? artist.genres.map((g) => <span key={g} className="text-sm text-zinc-400">{g}</span>) : null}
          </div>
          <div className="flex gap-1.5 mt-3">
            {artist.socialLinks?.instagram ? <a href={artist.socialLinks.instagram} target="_blank" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline">Instagram</a> : null}
            {artist.socialLinks?.spotify ? <a href={artist.socialLinks.spotify} target="_blank" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline">Spotify</a> : null}
            {artist.socialLinks?.website ? <a href={artist.socialLinks.website} target="_blank" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline">Website</a> : null}
          </div>
        </div>
      </div>

      {readiness ? (
        <div className="mb-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Artist Readiness</h2>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${readiness.ready ? 'bg-emerald-500' : readiness.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
          </div>
          <div className="mb-2 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${readiness.ready ? 'bg-emerald-500' : readiness.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${readiness.percentage}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">{readiness.percentage}% complete</span>
            {readiness.missing.length > 0 ? (
              <div className="flex gap-1">
                {readiness.missing.map((m) => <span key={m} className="rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.5">{m}</span>)}
              </div>
            ) : (
              <span className="text-emerald-600">Ready for distribution</span>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Profile</h2>
            <button onClick={() => setEditing(!editing)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">{editing ? 'Cancel' : 'Edit'}</button>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Bio"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country"
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                <input value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Genres (comma-separated)"
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
              <button type="submit" className="rounded bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">Save</button>
            </form>
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{artist.bio || 'No bio yet.'}</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Releases ({releases.length})</h2>
          {releases.length === 0 ? (
            <p className="text-sm text-zinc-400">Not linked to any releases yet.</p>
          ) : (
            <div className="space-y-2">
              {releases.map((r) => (
                <Link key={r.id} href={`/releases/${r.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2.5 hover:shadow-sm">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{r.title}</p>
                  <span className="text-xs capitalize text-zinc-400">{r.role.replace(/_/g, ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Track Credits ({credits.length})</h2>
          {credits.length === 0 ? (
            <p className="text-sm text-zinc-400">No track credits yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {credits.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <p className="text-sm text-zinc-900 dark:text-zinc-50 truncate">{c.trackTitle ?? c.trackId}</p>
                  <span className="text-xs capitalize text-zinc-400 shrink-0 ml-2">{c.role.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
