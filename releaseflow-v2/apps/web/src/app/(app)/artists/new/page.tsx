'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createArtist } from '@/lib/artist-service';

const artistTypes = [
  { value: 'original_artist', label: 'Original Artist' },
  { value: 'remix_artist', label: 'Remix Artist' },
  { value: 'cover_artist', label: 'Cover Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'dj', label: 'DJ' },
  { value: 'band', label: 'Band' },
  { value: 'label', label: 'Label' },
] as const;

export default function NewArtistPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [artistType, setArtistType] = useState('original_artist');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [genres, setGenres] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [spotify, setSpotify] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (instagram) socialLinks.instagram = instagram;
      if (spotify) socialLinks.spotify = spotify;
      if (website) socialLinks.website = website;
      const id = await createArtist({
        name: name.trim(),
        artistType: artistType as never,
        bio: bio.trim() || undefined,
        country: country.trim() || undefined,
        genres: genres ? genres.split(',').map((g) => g.trim()).filter(Boolean) : undefined,
        imageUrl: imageUrl.trim() || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });
      router.push(`/artists/${id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Link href="/artists" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-block">&larr; Back</Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">New Artist</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Artist name"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
            <select value={artistType} onChange={(e) => setArtistType(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900">
              {artistTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Artist biography..."
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Genres</label>
            <input type="text" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Electronic, House"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Image URL</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>

        <details className="group">
          <summary className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">Social Links</summary>
          <div className="mt-3 space-y-3 pl-2">
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            <input type="text" value={spotify} onChange={(e) => setSpotify(e.target.value)} placeholder="Spotify URL"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website URL"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </details>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={submitting || !name.trim()}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Artist'}
          </button>
          <Link href="/artists" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
