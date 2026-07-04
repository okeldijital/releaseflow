'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { createNewArtist } from '@/lib/artist-service';
import { useArtists } from '@/hooks/useArtist';
import { Button, Card, Input, Select, TextArea } from '@releaseflow/ui';

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
  const { activeOrgId } = useOrgStore();
  const { bumpArtistCatalogue } = useArtists();
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
      const result = await createNewArtist({
        name: name.trim(),
        artistType: artistType as never,
        organizationId: activeOrgId ?? '',
        bio: bio.trim() || undefined,
        country: country.trim() || undefined,
        genres: genres ? genres.split(',').map((g) => g.trim()).filter(Boolean) : undefined,
        imageUrl: imageUrl.trim() || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });
      bumpArtistCatalogue();
      router.push(`/artists/${result.id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Link href="/artists" className="text-sm text-text-400 hover:text-surface-50 mb-6 inline-block">&larr; Back</Link>
      <p className="text-2xl font-bold text-surface-50 mb-8">New Artist</p>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Artist name" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type" options={artistTypes.map((t) => ({ value: t.value, label: t.label }))} value={artistType} onChange={(v) => setArtistType(v)} />
            <Input label="Country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" />
          </div>
          <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Artist biography..." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Genres" type="text" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Electronic, House" />
            <Input label="Image URL" type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>

          <details className="group">
            <summary className="text-sm font-medium text-text-400 hover:text-surface-50 cursor-pointer">Social Links</summary>
            <div className="mt-3 space-y-3 pl-2">
              <Input label="Instagram" type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" />
              <Input label="Spotify" type="text" value={spotify} onChange={(e) => setSpotify(e.target.value)} placeholder="Spotify URL" />
              <Input label="Website" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website URL" />
            </div>
          </details>

          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" loading={submitting} disabled={submitting || !name.trim()}>
              {submitting ? 'Creating...' : 'Create Artist'}
            </Button>
            <Link href="/artists" className="text-sm text-text-400 hover:text-surface-50">Cancel</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
