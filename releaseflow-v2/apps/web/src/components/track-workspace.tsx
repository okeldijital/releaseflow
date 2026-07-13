'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { TrackRecord } from '@/lib/track-repository';
import type { CreditRecord } from '@/lib/credit-repository';
import type { TrackRightRecord } from '@/lib/rights-repository';
import { editTrack, removeTrack, archiveTrackById, duplicateTrack } from '@/lib/track-service';
import { getArtistsByRole } from '@/lib/track-artist-repository';
import { toast } from '@/stores/toast-store';
import { fetchRelease } from '@/lib/release-service';
import { getReleasesByTrack } from '@/lib/release-track-repository';
import type { Artwork } from '@/lib/artwork/artwork-types';
import { getCreditsByTrack, createCredit, deleteCredit } from '@/lib/credit-repository';
import { getRightsByTrack } from '@/lib/rights-repository';

import { fetchArtist } from '@/lib/artist-service';
import { getPerson } from '@/lib/people-repository';
import { resolveRecordingType, recordingTypeLabel } from '@/lib/recording-type';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import { Button, Badge, StatusBadge, LoadingState, Tabs } from '@releaseflow/ui';

const TAB_IDS = ['overview', 'publishing', 'credits', 'settings'] as const;
type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  publishing: 'Publishing',
  credits: 'Credits',
  settings: 'Edit',
};

const READINESS_CATS = ['Metadata', 'Rights', 'Credits'] as const;

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
  const [credits, setCredits] = useState<(CreditRecord & { personName: string })[]>([]);
  const [rights, setRights] = useState<TrackRightRecord[]>([]);
  const [releaseName, setReleaseName] = useState<string | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [releaseArtwork, setReleaseArtwork] = useState<Artwork | null>(null);
  const [artistSummary, setArtistSummary] = useState<string>('—');
  const [orgPeople, setOrgPeople] = useState<{ id: string; displayName: string }[]>([]);
  const [creditPicker, setCreditPicker] = useState<Record<string, string>>({});

  const recordingType = resolveRecordingType(track.recordingType);

  const load = useCallback(async () => {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [
        creditData,
        rightsData,
        releaseIds,
      ] = await Promise.all([
        getCreditsByTrack(trackId),
        getRightsByTrack(trackId),
        getReleasesByTrack(trackId),
      ]);

      setRights(rightsData);

      const creditsResolved = await Promise.all(
        creditData.map(async (c) => {
          const person = await getPerson(c.personId);
          return { ...c, personName: person?.displayName ?? c.personId };
        }),
      );
      setCredits(creditsResolved);

      if (releaseIds[0]) {
        setReleaseId(releaseIds[0]);
        const rel = await fetchRelease(releaseIds[0]);
        setReleaseName(rel?.title ?? null);
        setReleaseArtwork(rel?.artwork ?? null);
      } else {
        setReleaseId(null);
        setReleaseName(null);
        setReleaseArtwork(null);
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

      const { getPeopleByOrg } = await import('@/lib/people-repository');
      setOrgPeople(await getPeopleByOrg(activeOrgId));
    } catch {
      /* safe defaults */
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, trackId, recordingType, track]);

  useEffect(() => { load(); }, [load]);

  const readinessMap = useMemo(() => {
    const metadata = !!(track.isrc?.trim() && track.genre?.trim() && track.language?.trim());
    const rightsOk = rights.length > 0;
    const creditsOk = credits.length > 0;
    return {
      Metadata: metadata,
      Rights: rightsOk,
      Credits: creditsOk,
    } satisfies Record<typeof READINESS_CATS[number], boolean>;
  }, [track, rights, credits]);

  const readinessPct = Math.round(
    (READINESS_CATS.filter((c) => readinessMap[c]).length / READINESS_CATS.length) * 100,
  );

  async function handleAddCredit(type: string, personId: string) {
    if (!activeOrgId || !personId) return;
    await createCredit({ trackId, organizationId: activeOrgId, personId, creditType: type });
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
      .filter((c) => c.creditType.toLowerCase() === type.toLowerCase())
      .map((c) => c.personName);
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
      <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-6 mb-8" aria-label="Track overview">
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4 flex flex-col items-center gap-2 min-h-[200px]">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Artwork</p>
          {releaseArtwork ? (
            <ArtworkDisplay
              artwork={releaseArtwork}
              releaseTitle={releaseName ?? track.title}
              size="lg"
              className="max-w-[200px]"
            />
          ) : (
            <p className="text-sm text-text-500 text-center">Artwork is managed from the Release Workspace.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <h1 className="text-2xl font-semibold text-primary-400 tracking-tight leading-tight">{track.title}</h1>
            {track.version ? <p className="text-sm text-text-500 mt-0.5">{track.version}</p> : null}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                label={recordingTypeLabel(recordingType, true)}
                color={recordingType === 'remix' ? 'bg-workflow-mixing/15 text-workflow-mixing' : 'bg-surface-100 text-text-600'}
              />
              <StatusBadge status={track.status} />
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-text-500">Recording Type</dt>
            <dd className="text-text-800">{recordingTypeLabel(recordingType)}</dd>
            <dt className="text-text-500">Release</dt>
            <dd className="text-text-800 truncate">
              {releaseId && releaseName ? (
                <Link href={`/releases/${releaseId}`} className="text-primary-600 hover:text-primary-700">{releaseName}</Link>
              ) : 'Not linked'}
            </dd>
            <dt className="text-text-500">{recordingType === 'remix' ? 'Original · Remix Artists' : 'Artists'}</dt>
            <dd className="text-text-800 truncate">{artistSummary}</dd>
            <dt className="text-text-500">Status</dt>
            <dd><StatusBadge status={track.status} /></dd>
          </dl>
        </div>

        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Track Readiness</p>
            <span className={`text-2xl font-semibold tabular-nums ${readinessPct >= 80 ? 'text-success-600' : readinessPct >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
              {readinessPct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${readinessPct >= 80 ? 'bg-success-500' : readinessPct >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`}
              style={{ width: `${readinessPct}%` }}
            />
          </div>
          <ul className="space-y-1.5">
            {READINESS_CATS.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => {
                    if (cat === 'Metadata') setTab('publishing');
                    else if (cat === 'Credits') setTab('credits');
                    else setTab('overview');
                  }}
                  className="flex items-center gap-2 text-xs w-full text-left hover:text-primary-600 transition-colors"
                >
                  {readinessMap[cat]
                    ? <svg className="h-3.5 w-3.5 text-success-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
                    : <span className="h-3.5 w-3.5 rounded-full border-2 border-surface-300 shrink-0 inline-block" />}
                  <span className={readinessMap[cat] ? 'text-text-700' : 'text-text-400'}>{cat}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-500 mt-auto">{readinessPct >= 80 ? 'Ready' : readinessPct >= 50 ? 'In Progress' : 'Needs Work'}</p>
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
          <MetaField label="Release" value={releaseName ?? 'Not linked'} />
          <MetaField label="Status" value={track.status} />
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
          people={orgPeople}
          creditPicker={creditPicker}
          setCreditPicker={setCreditPicker}
          onAdd={handleAddCredit}
          onRemove={async (id) => { await deleteCredit(id); await load(); }}
        />
      )}

      {tab === 'settings' && (
        <SettingsPanel
          track={track}
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
      <p className="text-sm font-medium text-text-900 mt-0.5">{value}</p>
    </div>
  );
}

function CreditsTable({
  credits,
  people,
  creditPicker,
  setCreditPicker,
  onAdd,
  onRemove,
}: {
  credits: (CreditRecord & { personName: string })[];
  people: { id: string; displayName: string }[];
  creditPicker: Record<string, string>;
  setCreditPicker: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAdd: (type: string, personId: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden">
      <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-surface-100 bg-surface-50 text-caption font-semibold text-text-500 uppercase tracking-wider">
        <span>Role</span><span>Person</span><span />
      </div>
      {CREDIT_TYPES.map((type) => {
        const typeCredits = credits.filter((c) => c.creditType.toLowerCase() === type.toLowerCase());
        return (
          <div key={type} className="border-t border-surface-100 first:border-t-0 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider sm:hidden">{type}</p>
            {typeCredits.length === 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-text-500 hidden sm:inline w-28 shrink-0">{type}</span>
                <select
                  value={creditPicker[type] ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) { onAdd(type, v); setCreditPicker((p) => ({ ...p, [type]: '' })); }
                  }}
                  className="flex-1 h-9 rounded-lg border border-surface-200 px-3 text-sm text-text-700"
                >
                  <option value="">Add {type.toLowerCase()}...</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                </select>
              </div>
            ) : typeCredits.map((c) => (
              <div key={c.id} className="flex items-center gap-3 sm:grid sm:grid-cols-[1fr_1fr_auto]">
                <span className="text-sm text-text-600 hidden sm:block">{type}</span>
                <span className="text-sm font-medium text-text-900">{c.personName}</span>
                <button type="button" onClick={() => onRemove(c.id)} className="text-xs text-danger-500 hover:text-danger-600">Remove</button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SettingsPanel({
  track,
  onSaved,
}: {
  track: TrackRecord;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(track.title);
  const [version, setVersion] = useState(track.version ?? '');
  const [isrc, setIsrc] = useState(track.isrc ?? '');
  const [genre, setGenre] = useState(track.genre ?? '');
  const [language, setLanguage] = useState(track.language ?? '');
  const [explicit, setExplicit] = useState(track.explicit ? 'true' : 'false');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(track.title);
    setVersion(track.version ?? '');
    setIsrc(track.isrc ?? '');
    setGenre(track.genre ?? '');
    setLanguage(track.language ?? '');
    setExplicit(track.explicit ? 'true' : 'false');
  }, [track]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await editTrack(track.id, {
      title: title.trim(),
      version: version.trim() || undefined,
      isrc: isrc.trim() || undefined,
      genre: genre.trim() || undefined,
      language: language.trim() || undefined,
      explicit: explicit === 'true',
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 space-y-4 max-w-lg">
      <p className="text-sm font-semibold text-text-900">Edit Track</p>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm" />
      <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version" className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm" />
      <input type="text" value={isrc} onChange={(e) => setIsrc(e.target.value)} placeholder="ISRC" className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm" />
      <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre" className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm" />
      <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Language" className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm" />
      <select value={explicit} onChange={(e) => setExplicit(e.target.value)} className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm">
        <option value="false">Not Explicit</option>
        <option value="true">Explicit</option>
      </select>
      <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
