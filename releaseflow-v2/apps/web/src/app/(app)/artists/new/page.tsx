'use client';

import Link from 'next/link';
import { useState, FormEvent, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { createNewArtist, checkDuplicateArtists } from '@/lib/artist-service';
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
  const [stageName, setStageName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [artistType, setArtistType] = useState('original_artist');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [genres, setGenres] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [contact, setContact] = useState('');
  const [isni, setIsni] = useState('');
  const [ipi, setIpi] = useState('');
  const [notes, setNotes] = useState('');
  const [instagram, setInstagram] = useState('');
  const [spotify, setSpotify] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [duplicates, setDuplicates] = useState<{ id: string; name: string }[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [shouldContinue, setShouldContinue] = useState(false);

  useEffect(() => {
    if (!showDuplicateWarning) {
      setDuplicates([]);
      setShouldContinue(false);
    }
  }, [showDuplicateWarning]);

  const checkDuplicates = useCallback(async (currentName: string) => {
    if (!activeOrgId || !currentName.trim()) return;
    const result = await checkDuplicateArtists(activeOrgId, currentName.trim(), stageName || undefined);
    setDuplicates(result.matches.map((m) => ({ id: m.id, name: m.name })));
    return result.isDuplicate;
  }, [activeOrgId, stageName]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!shouldContinue) {
      const isDup = await checkDuplicates(name);
      if (isDup) {
        setShowDuplicateWarning(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (instagram) socialLinks.instagram = instagram;
      if (spotify) socialLinks.spotify = spotify;
      if (website) socialLinks.website = website;
      const result = await createNewArtist({
        name: name.trim(),
        stageName: stageName.trim() || undefined,
        legalName: legalName.trim() || undefined,
        artistType: artistType as never,
        organizationId: activeOrgId ?? '',
        bio: bio.trim() || undefined,
        country: country.trim() || undefined,
        genres: genres ? genres.split(',').map((g) => g.trim()).filter(Boolean) : undefined,
        imageUrl: imageUrl.trim() || undefined,
        contact: contact.trim() || undefined,
        isni: isni.trim() || undefined,
        ipi: ipi.trim() || undefined,
        notes: notes.trim() || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });
      bumpArtistCatalogue();
      router.push(`/artists/${result.id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }, [name, shouldContinue, checkDuplicates, instagram, spotify, website, stageName, legalName, artistType, activeOrgId, bio, country, genres, imageUrl, contact, isni, ipi, notes, bumpArtistCatalogue, router]);

  const handleMergeInstead = useCallback((artistId: string) => {
    router.push(`/artists/${artistId}`);
  }, [router]);

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Link href="/artists" className="text-sm text-text-400 hover:text-surface-50 mb-6 inline-block">&larr; Back</Link>
      <p className="text-2xl font-bold text-surface-50 mb-8">New Artist</p>

      {showDuplicateWarning && duplicates.length > 0 && (
        <Card padding="md" className="mb-6 border-warning-500/60">
          <p className="text-sm font-semibold text-warning-500 mb-2">Possible duplicate found</p>
          <div className="space-y-1 mb-4">
            {duplicates.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-surface-100">{d.name}</span>
                <button
                  onClick={() => handleMergeInstead(d.id)}
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  View
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setShowDuplicateWarning(false); setShouldContinue(true); setTimeout(() => {
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
              }, 0); }}
            >
              Continue
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDuplicateWarning(false)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Artist name" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Stage Name" type="text" value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Stage name" />
            <Input label="Legal Name" type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Legal name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type" options={artistTypes.map((t) => ({ value: t.value, label: t.label }))} value={artistType} onChange={(v) => setArtistType(v)} />
            <Input label="Country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" />
          </div>
          <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Artist biography..." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Genres" type="text" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Electronic, House" />
            <Input label="Image URL" type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone" />
            <Input label="ISNI" type="text" value={isni} onChange={(e) => setIsni(e.target.value)} placeholder="0000-0000-0000-0000" />
          </div>
          <Input label="IPI" type="text" value={ipi} onChange={(e) => setIpi(e.target.value)} placeholder="IPI number" />
          <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes..." />

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
