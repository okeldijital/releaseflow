'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { createNewTrack } from '@/lib/track-service';
import { fetchRelease } from '@/lib/release-service';
import { addTrackToRelease, getTracksByRelease } from '@/lib/release-track-repository';
import { Button, EmptyState, LoadingState, Input, Select } from '@releaseflow/ui';

const explicitOptions = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

export default function NewTrackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const releaseId = searchParams.get('releaseId') ?? '';
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();

  const [releaseTitle, setReleaseTitle] = useState<string | null>(null);
  const [loadingRelease, setLoadingRelease] = useState(!!releaseId);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [isrc, setIsrc] = useState('');
  const [duration, setDuration] = useState('');
  const [genre, setGenre] = useState('');
  const [explicit, setExplicit] = useState('false');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!releaseId) {
      setLoadingRelease(false);
      return;
    }
    let cancelled = false;
    async function loadRelease() {
      setLoadingRelease(true);
      try {
        const release = await fetchRelease(releaseId);
        if (cancelled) return;
        if (!release) {
          setError('Release not found.');
          setReleaseTitle(null);
        } else if (activeOrgId && release.organizationId !== activeOrgId) {
          setError('You do not have access to this release.');
          setReleaseTitle(null);
        } else {
          setReleaseTitle(release.title);
        }
      } catch {
        if (!cancelled) setError('Could not load release.');
      } finally {
        if (!cancelled) setLoadingRelease(false);
      }
    }
    loadRelease();
    return () => { cancelled = true; };
  }, [releaseId, activeOrgId]);

  async function handleSave() {
    if (!activeOrgId || !title.trim() || !user) return;
    setSaving(true);
    setError('');
    try {
      const trackId = await createNewTrack({
        organizationId: activeOrgId,
        title: title.trim(),
        createdBy: user.uid,
        version: version.trim() || undefined,
        isrc: isrc.trim() || undefined,
        duration: duration ? Number(duration) : undefined,
        genre: genre.trim() || undefined,
        explicit: explicit === 'true',
      });

      if (releaseId) {
        const existing = await getTracksByRelease(releaseId);
        await addTrackToRelease(releaseId, trackId, existing.length + 1);
        router.push(`/releases/${releaseId}`);
      } else {
        router.push(`/tracks/${trackId}`);
      }
    } catch {
      setError('Could not create track. Please try again.');
      setSaving(false);
    }
  }

  function handleCancel() {
    if (releaseId) router.push(`/releases/${releaseId}`);
    else router.push('/tracks');
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <EmptyState title="No organization selected" description="Select an organization to create a track." />
      </div>
    );
  }

  if (loadingRelease) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">New Track</p>
        {releaseId && releaseTitle ? (
          <p className="mt-1 text-sm text-text-400">
            Adding to <span className="font-medium text-surface-200">{releaseTitle}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-text-400">Create a new recording for your catalogue.</p>
        )}
      </div>

      <div className="rounded-xl border border-surface-200/80 bg-white dark:bg-surface-900 p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" />
          <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. Radio Edit" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="ISRC" value={isrc} onChange={(e) => setIsrc(e.target.value)} placeholder="e.g. US-ABC-12-34567" />
          <Input label="Duration (seconds)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 210" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Pop, Electronic" />
          <Select label="Explicit" options={explicitOptions} value={explicit} onChange={setExplicit} />
        </div>
        {error ? <p className="text-sm text-danger-400">{error}</p> : null}
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !title.trim() || !user}>
            {saving ? 'Creating...' : 'Save'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}