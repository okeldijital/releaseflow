'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { TrackRecord } from '@/lib/track-repository';
import { editTrack, removeTrack, archiveTrackById, duplicateTrack } from '@/lib/track-service';
import { getArtistsByRole } from '@/lib/track-artist-repository';
import { toast } from '@/stores/toast-store';
import { fetchRelease } from '@/lib/release-service';
import { getReleasesByTrack } from '@/lib/release-track-repository';
import { getCreditsByTrack, setTrackCredits } from '@/lib/credit-repository';
import type { TrackCredit } from '@/app/(app)/types';

import { fetchArtist } from '@/lib/artist-service';
import { resolveRecordingType, recordingTypeLabel } from '@/lib/recording-type';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { Button, Badge, LoadingState, Tabs } from '@releaseflow/ui';

const TAB_IDS = ['overview', 'publishing', 'credits', 'settings'] as const;
type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  publishing: 'Publishing',
  credits: 'Credits',
  settings: 'Edit',
};

const CREDIT_TYPES = ['Producer', 'Composer', 'Lyricist', 'Songwriter', 'Publisher', 'Performer'] as const;


async function resolveArtistNames(orgId: string | null, artistIds: string[]): Promise<string[]> {
  if (!orgId || artistIds.length === 0) return [];
  const names = await Promise.all(
    artistIds.map(async (aid) => {
      const a = await fetchArtist(orgId, aid);
      return a?.name;
    }),
  );
  return names.filter(Boolean) as string[];
}

interface TrackWorkspaceProps {
  track: TrackRecord;
  trackId: string;
  activeOrgId: string | null;
  onRefresh: () => void;
}

export function TrackWorkspace({ track, trackId, activeOrgId, onRefresh }: TrackWorkspaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<TrackCredit[]>([]);
  const [releaseName, setReleaseName] = useState<string | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [artistSummary, setArtistSummary] = useState<string>('—');

  const recordingType = resolveRecordingType(track.recordingType);

  const load = useCallback(async () => {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [
        creditData,
        releaseIds,
      ] = await Promise.all([
        getCreditsByTrack(trackId),
        getReleasesByTrack(trackId),
      ]);

      setCredits(creditData);

      if (releaseIds[0]) {
        setReleaseId(releaseIds[0]);
        const rel = await fetchRelease(releaseIds[0]);
        setReleaseName(rel?.title ?? null);
      } else {
        setReleaseId(null);
        setReleaseName(null);
      }

      const originalArtists = await getArtistsByRole(trackId, 'ORIGINAL_ARTIST');
      const remixArtists = await getArtistsByRole(trackId, 'REMIX_ARTIST');
      const primaryArtists = await getArtistsByRole(trackId, 'PRIMARY_ARTIST');
      const featuredArtists = await getArtistsByRole(trackId, 'FEATURED_ARTIST');

      const hasTrackArtists = originalArtists.length > 0 || remixArtists.length > 0 || primaryArtists.length > 0;

      if (hasTrackArtists) {
        if (recordingType === 'remix') {
          const allNames = await resolveArtistNames(activeOrgId, [
            ...originalArtists.map((a) => a.artistId),
            ...remixArtists.map((a) => a.artistId),
          ]);
          setArtistSummary(allNames.join(' · ') || '—');
        } else {
          const allNames = await resolveArtistNames(activeOrgId, [
            ...primaryArtists.map((a) => a.artistId),
            ...featuredArtists.map((a) => a.artistId),
          ]);
          setArtistSummary(allNames.join(' · ') || '—');
        }
      } else if (recordingType === 'remix') {
        const [orig, rem] = await Promise.all([
          track.originalArtistId ? fetchArtist(activeOrgId, track.originalArtistId) : null,
          track.remixerArtistId ? fetchArtist(activeOrgId, track.remixerArtistId) : null,
        ]);
        setArtistSummary([orig?.name, rem?.name].filter(Boolean).join(' · ') || '—');
      } else {
        const primary = track.primaryArtistId ? await fetchArtist(activeOrgId, track.primaryArtistId) : null;
        const featured = await Promise.all(
          (track.featuredArtistIds ?? []).map(async (aid) => {
            const a = await fetchArtist(activeOrgId, aid);
            return a?.name;
          }),
        );
        setArtistSummary([primary?.name, ...featured.filter(Boolean)].filter(Boolean).join(' · ') || '—');
      }
    } catch {
      /* safe defaults */
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, trackId, recordingType, track]);

  useEffect(() => { load(); }, [load]);

  async function handleSaveCredits(newCredits: TrackCredit[]) {
    await setTrackCredits(trackId, newCredits);
    await load();
  }

  async function handleArchive() {
    try {
      await archiveTrackById(trackId);
      toast.success('Track archived.');
      router.push(releaseId ? `/releases/${releaseId}` : '/tracks');
    } catch (error) {
      console.error(error);
      toast.error('Unable to archive track.');
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this track permanently?")) return;
    await removeTrack(trackId, activeOrgId ?? undefined, user?.uid);
    toast.success("Track deleted.");
    router.push(releaseId ? `/releases/${releaseId}` : '/tracks');
  }

  async function handleDuplicate() {
    if (!user) return;
    const newId = await duplicateTrack(trackId, user.uid);
    router.push(`/tracks/${newId}`);
  }

  function formatDuration(seconds?: number): string {
    if (!seconds) return '—';
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function getCreditsByType(type: string): string[] {
    return credits
      .filter((c) => c.role.toLowerCase() === type.toLowerCase())
      .map((c) => c.name);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-6xl mx-auto page-transition">
      <div className="flex items-center justify-between mb-6 gap-4">
        <Link href="/tracks" className="inline-flex items-center gap-1.5 text-sm text-text-400 hover:text-text-700 transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tracks
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button size="sm" variant="primary" onClick={() => setTab('settings')}>Edit Track</Button>
          <EntityOverflowMenu
            aria-label="More track actions"
            items={[
              { id: 'duplicate', label: 'Duplicate', onClick: handleDuplicate },
              { id: 'archive', label: 'Archive', onClick: handleArchive },
              { id: 'delete', label: 'Delete', variant: 'danger', separatorBefore: true, onClick: handleDelete },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="mb-8" aria-label="Track overview">
        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <h1 className="text-2xl font-semibold text-primary-400 tracking-tight leading-tight">{track.title}</h1>
            {track.version ? <p className="text-sm text-text-500 mt-0.5">{track.version}</p> : null}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                label={recordingTypeLabel(recordingType, true)}
                color={recordingType === 'remix' ? 'bg-workflow-mixing/15 text-workflow-mixing' : 'bg-surface-100 text-text-600'}
              />
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-text-500">Recording Type</dt>
            <dd className="text-text-800">{recordingTypeLabel(recordingType)}</dd>
            <dt className="text-text-500">Release</dt>
            <dd className="text-text-800 truncate">
              {releaseId && releaseName ? (
                <Link href={`/releases/${releaseId}`} className="text-primary-600 hover:text-primary-700">{releaseName}</Link>
              ) : 'No release linked'}
            </dd>
            <dt className="text-text-500">{recordingType === 'remix' ? 'Original · Remix Artists' : 'Artists'}</dt>
            <dd className="text-text-800 truncate">{artistSummary}</dd>
          </dl>
        </div>
      </section>

      <Tabs
        tabs={TAB_IDS.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
        activeTab={tab}
        onChange={(v) => setTab(v as TabId)}
        variant="underline"
        className="mb-8"
      />

      {tab === 'overview' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 grid gap-4 sm:grid-cols-2 text-sm">
          <MetaField label="Title" value={track.title} />
          <MetaField label="Version" value={track.version ?? '—'} />
          <MetaField label="Recording Type" value={recordingTypeLabel(recordingType)} />
          <MetaField label="Release" value={releaseName ?? 'No release linked'} />
          <MetaField label="Duration" value={formatDuration(track.duration)} />
        </div>
      )}

      {tab === 'publishing' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 grid gap-4 sm:grid-cols-2 text-sm">
          <MetaField label="ISRC" value={track.isrc ?? '—'} />
          <MetaField label="Explicit" value={track.explicit ? 'Yes' : 'No'} />
          <MetaField label="Language" value={track.language ?? '—'} />
          <MetaField label="Genre" value={track.genre ?? '—'} />
          <MetaField label="Track Number" value={track.trackNumber?.toString() ?? '—'} />
          <MetaField label="Disc Number" value={track.discNumber?.toString() ?? '—'} />
          <MetaField label="Publisher" value={getCreditsByType('Publisher').join(', ') || '—'} />
          <MetaField label="Writers" value={[...getCreditsByType('Writer'), ...getCreditsByType('Lyricist')].join(', ') || '—'} />
          <MetaField label="Composers" value={getCreditsByType('Composer').join(', ') || '—'} />
        </div>
      )}

      {tab === 'credits' && (
        <CreditsTable
          credits={credits}
          onSave={handleSaveCredits}
        />
      )}

      {tab === 'settings' && (
        <SettingsPanel
          track={track}
          releaseName={releaseName}
          releaseId={releaseId}
          onSaved={() => { onRefresh(); load(); }}
        />
      )}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-text-800 mt-0.5">{value}</p>
    </div>
  );
}

function CreditsTable({
  credits,
  onSave,
}: {
  credits: TrackCredit[];
  onSave: (credits: TrackCredit[]) => void;
}) {
  const [localCredits, setLocalCredits] = useState<TrackCredit[]>(credits);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalCredits(credits);
  }, [credits]);

  function getCreditsForRole(role: string) {
    return localCredits
      .map((c, i) => ({ ...c, index: i }))
      .filter((c) => c.role.toLowerCase() === role.toLowerCase());
  }

  function addEntry(role: string) {
    setLocalCredits((prev) => [...prev, { role, name: '' }]);
  }

  function removeEntry(index: number) {
    setLocalCredits((prev) => prev.filter((_, i) => i !== index));
  }

  function updateEntry(index: number, name: string) {
    setLocalCredits((prev) =>
      prev.map((c, i) => (i === index ? { ...c, name } : c)),
    );
  }

  async function handleSave() {
    setSaving(true);
    await onSave(localCredits.filter((c) => c.name.trim()));
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      {CREDIT_TYPES.map((role) => {
        const entries = getCreditsForRole(role);
        return (
          <div key={role}>
            <p className="text-sm font-semibold text-text-700 mb-2">{role}</p>
            <div className="space-y-2">
              {entries.length === 0 ? (
                <p className="text-sm text-text-400 italic">No {role.toLowerCase()} credits yet.</p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={entry.name}
                      onChange={(e) => updateEntry(entry.index, e.target.value)}
                      placeholder={`Enter ${role.toLowerCase()} name...`}
                      className="block flex-1 h-9 rounded-lg border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.index)}
                      className="text-xs text-danger-500 hover:text-danger-600 font-medium shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
              <button
                type="button"
                onClick={() => addEntry(role)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                + Add {role.toLowerCase()}
              </button>
            </div>
          </div>
        );
      })}
      <div className="pt-4 border-t border-surface-200">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Credits'}
        </Button>
      </div>
    </div>
  );
}

function SettingsPanel({
  track,
  releaseName,
  releaseId,
  onSaved,
}: {
  track: TrackRecord;
  releaseName: string | null;
  releaseId: string | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(track.title);
  const [version, setVersion] = useState(track.version ?? '');
  const [subtitle, setSubtitle] = useState(track.subtitle ?? '');
  const [recordingType, setRecordingType] = useState<string>(track.recordingType ?? 'original');
  const [genre, setGenre] = useState(track.genre ?? '');
  const [language, setLanguage] = useState(track.language ?? '');
  const [explicit, setExplicit] = useState(track.explicit ? 'true' : 'false');
  const [isrc, setIsrc] = useState(track.isrc ?? '');
  const [trackNumber, setTrackNumber] = useState(track.trackNumber?.toString() ?? '');
  const [discNumber, setDiscNumber] = useState(track.discNumber?.toString() ?? '');
  const [duration, setDuration] = useState(track.duration?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(track.title);
    setVersion(track.version ?? '');
    setSubtitle(track.subtitle ?? '');
    setRecordingType(track.recordingType ?? 'original');
    setGenre(track.genre ?? '');
    setLanguage(track.language ?? '');
    setExplicit(track.explicit ? 'true' : 'false');
    setIsrc(track.isrc ?? '');
    setTrackNumber(track.trackNumber?.toString() ?? '');
    setDiscNumber(track.discNumber?.toString() ?? '');
    setDuration(track.duration?.toString() ?? '');
  }, [track]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await editTrack(track.id, {
      title: title.trim(),
      version: version.trim() || null,
      subtitle: subtitle.trim() || null,
      recordingType: recordingType as 'original' | 'remix',
      genre: genre.trim() || null,
      language: language.trim() || null,
      explicit: explicit === 'true',
      isrc: isrc.trim() || null,
      trackNumber: trackNumber ? parseInt(trackNumber, 10) : null,
      discNumber: discNumber ? parseInt(discNumber, 10) : null,
      duration: duration ? parseInt(duration, 10) : null,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-6 space-y-6">
      <p className="text-sm font-semibold text-text-800">Edit Track</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-400 uppercase tracking-wider">Identity</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Version"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-400 uppercase tracking-wider">Recording</p>
            <select
              value={recordingType}
              onChange={(e) => setRecordingType(e.target.value)}
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 focus:border-primary-500 focus:outline-none"
            >
              <option value="original">Original</option>
              <option value="remix">Remix</option>
            </select>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Genre"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Language"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-400 uppercase tracking-wider">Publishing</p>
            <input
              type="text"
              value={isrc}
              onChange={(e) => setIsrc(e.target.value)}
              placeholder="ISRC"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
            <input
              type="number"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              placeholder="Track Number"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
            <input
              type="number"
              value={discNumber}
              onChange={(e) => setDiscNumber(e.target.value)}
              placeholder="Disc Number"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (seconds)"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
            <select
              value={explicit}
              onChange={(e) => setExplicit(e.target.value)}
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-800 focus:border-primary-500 focus:outline-none"
            >
              <option value="false">Not Explicit</option>
              <option value="true">Explicit</option>
            </select>
            <div className="flex items-center h-10 rounded-xl border border-surface-200 px-3 text-sm text-text-500 bg-surface-50">
              {releaseId && releaseName ? (
                <Link href={`/releases/${releaseId}`} className="text-primary-600 hover:text-primary-700">{releaseName}</Link>
              ) : 'No release linked'}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-surface-200">
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
