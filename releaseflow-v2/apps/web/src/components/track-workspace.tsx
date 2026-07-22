'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { TrackRecord } from '@/lib/track-repository';
import {
  editTrack,
  removeTrack,
  archiveTrackById,
  duplicateTrack,
  syncTrackArtistCredits,
  areTrackArtistsReady,
} from '@/lib/track-service';
import { getArtistsByRole } from '@/lib/track-artist-repository';
import { toast } from '@/stores/toast-store';
import { fetchRelease } from '@/lib/release-service';
import { getReleasesByTrack, addTrackToRelease, removeTrackFromRelease, getReleaseTrackRecordId, getNextPosition } from '@/lib/release-track-repository';
import { getCreditsByTrack, setTrackCredits } from '@/lib/credit-repository';
import type { TrackCredit } from '@/app/(app)/types';
import { fetchArtist } from '@/lib/artist-service';
import { resolveRecordingType, recordingTypeLabel } from '@/lib/recording-type';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { Button, Badge, LoadingState, Tabs, ProgressBar, EmptyState } from '@releaseflow/ui';
import { getActivityByEntity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import { AssignmentsSection } from '@/components/assignments-section';
import { SearchableGenreSelect } from '@/components/shared/searchable-genre-select';
import { AssignmentDialog } from '@/components/assignment-dialog';
import {
  ArtistRelationshipList,
  type ArtistOption,
  type RepeatableArtistEntry,
} from '@/components/artists/artist-relationship-list';
import { OriginalWorkSection, emptyTrackEditorValue } from '@/components/track-editor';
import { useArtists } from '@/hooks/useArtist';
import {
  generateSuggestedDisplayTitle,
  resolveTrackDisplayTitle,
  findDuplicateArtistId,
} from '@/lib/display-title';

/** EPIC-202A — structured performance credit with linkable artist id */
export interface ArtistCreditEntry {
  id: string;
  name: string;
}

export interface ArtistCreditsState {
  original: ArtistCreditEntry[];
  featured: ArtistCreditEntry[];
  remix: ArtistCreditEntry[];
}

const EMPTY_ARTIST_CREDITS: ArtistCreditsState = {
  original: [],
  featured: [],
  remix: [],
};

async function resolveArtistEntries(
  orgId: string | null,
  artistIds: string[],
): Promise<ArtistCreditEntry[]> {
  if (!orgId || artistIds.length === 0) return [];
  const entries = await Promise.all(
    artistIds.map(async (aid) => {
      const a = await fetchArtist(orgId, aid);
      return a ? { id: aid, name: a.name } : null;
    }),
  );
  return entries.filter((e): e is ArtistCreditEntry => Boolean(e));
}

const TAB_IDS = ['overview', 'credits', 'publishing', 'assignments', 'activity', 'edit'] as const;
type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  credits: 'Credits',
  publishing: 'Publishing',
  assignments: 'Assignments',
  activity: 'Activity',
  edit: 'Edit',
};

interface TrackWorkspaceProps {
  track: TrackRecord;
  trackId: string;
  activeOrgId: string | null;
  onRefresh: () => void;
}

interface LinkedRelease {
  id: string;
  releaseId: string;
  title: string;
  releaseType: string;
  artistName?: string;
}

function parseDurationInput(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;
  const mins = parseInt(match[1]!, 10);
  const secs = parseInt(match[2]!, 10);
  if (mins > 99) return null;
  if (mins === 0 && secs === 0) return null;
  return mins * 60 + secs;
}

function fmtDurationDisplay(seconds?: number): string {
  if (!seconds) return '';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds === 0) return '0:00';
  return fmtDurationDisplay(seconds);
}

function parseTimeInputLocal(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;
  const mins = parseInt(match[1]!, 10);
  const secs = parseInt(match[2]!, 10);
  if (mins > 99) return null;
  return mins * 60 + secs;
}

/** BUILD-011 — resolve artist name for Original Work display without new picker UI. */
function OriginalWorkArtistName({
  artistId,
  organizationId,
}: {
  artistId: string;
  organizationId: string | null;
}) {
  const [name, setName] = useState<string>(artistId);
  useEffect(() => {
    let cancelled = false;
    if (!organizationId || !artistId) return;
    void fetchArtist(organizationId, artistId).then((a) => {
      if (!cancelled && a?.name) setName(a.name);
    }).catch(() => { /* keep id fallback */ });
    return () => { cancelled = true; };
  }, [artistId, organizationId]);
  return <>{name}</>;
}

const GENRE_PRESETS = [
  'Pop', 'Hip Hop', 'Rap', 'R&B', 'Afro House', 'House', 'Deep House',
  'Afro Tech', 'Amapiano', 'Gqom', 'Gospel', 'Jazz', 'Soul', 'Rock',
  'Metal', 'Indie', 'Alternative', 'Dance', 'Electronic', 'EDM',
  'Drum & Bass', 'Dubstep', 'Reggae', 'Dancehall', 'Kwaito', 'Afro Pop',
  'Classical', 'Country', 'Folk', 'Instrumental', 'Soundtrack', 'World',
  'Experimental',
];

const RECORDING_TYPE_BADGES: Record<string, string> = {
  original: 'bg-workflow-planning/15 text-workflow-planning',
  remix: 'bg-workflow-recording/15 text-workflow-recording',
};

export function TrackWorkspace({ track, trackId, activeOrgId, onRefresh }: TrackWorkspaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<TrackCredit[]>([]);
  const [linkedReleases, setLinkedReleases] = useState<LinkedRelease[]>([]);
  const [artistCredits, setArtistCredits] = useState<ArtistCreditsState>(EMPTY_ARTIST_CREDITS);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const recordingType = resolveRecordingType(track.recordingType);

  const load = useCallback(async () => {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [creditData, releaseIds] = await Promise.all([
        getCreditsByTrack(trackId),
        getReleasesByTrack(trackId),
      ]);

      setCredits(creditData);

      const releaseList: LinkedRelease[] = [];
      if (releaseIds.length > 0) {
        const releases = await Promise.all(
          releaseIds.map((rid) => fetchRelease(rid).catch(() => null)),
        );
        for (let i = 0; i < releaseIds.length; i++) {
          const rel = releases[i];
          const rid = releaseIds[i]!;
          if (rel) {
            releaseList.push({
              id: rid,
              releaseId: rid,
              title: rel.title,
              releaseType: rel.releaseType,
              artistName: undefined,
            });
          }
        }
      }
      setLinkedReleases(releaseList);

      // EPIC-202A — load all performance roles (join table first, track doc fallback)
      const [originalRows, primaryRows, featuredRows, remixRows] = await Promise.all([
        getArtistsByRole(trackId, 'ORIGINAL_ARTIST'),
        getArtistsByRole(trackId, 'PRIMARY_ARTIST'),
        getArtistsByRole(trackId, 'FEATURED_ARTIST'),
        getArtistsByRole(trackId, 'REMIX_ARTIST'),
      ]);

      const originalIds =
        originalRows.length > 0
          ? originalRows.map((r) => r.artistId)
          : primaryRows.length > 0
            ? primaryRows.map((r) => r.artistId)
            : (track.originalArtistIds?.length
                ? track.originalArtistIds
                : [
                    track.primaryArtistId,
                    track.originalArtistId,
                  ].filter((id): id is string => Boolean(id)));

      const featuredIds =
        featuredRows.length > 0
          ? featuredRows.map((r) => r.artistId)
          : (track.featuredArtistIds ?? []);

      const remixIds =
        remixRows.length > 0
          ? remixRows.map((r) => r.artistId)
          : (track.remixArtistIds?.length
              ? track.remixArtistIds
              : track.remixerArtistId
                ? [track.remixerArtistId]
                : []);

      const [original, featured, remix] = await Promise.all([
        resolveArtistEntries(activeOrgId, originalIds),
        resolveArtistEntries(activeOrgId, featuredIds),
        resolveArtistEntries(activeOrgId, remixIds),
      ]);

      setArtistCredits({ original, featured, remix });
    } catch {
      setArtistCredits(EMPTY_ARTIST_CREDITS);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, trackId, track]);

  useEffect(() => { load(); }, [load, reloadToken]);

  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      if (!trackId || !activeOrgId) { setActivitiesLoaded(true); return; }
      try {
        const data = await getActivityByEntity(activeOrgId, 'track', trackId);
        if (!cancelled) setActivities(data);
      } catch {
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setActivitiesLoaded(true);
      }
    }
    void loadActivity();
    return () => { cancelled = true; };
  }, [trackId, activeOrgId, reloadToken]);

  async function handleSaveCredits(newCredits: TrackCredit[]) {
    await setTrackCredits(trackId, newCredits);
    await load();
  }

  async function handleArchive() {
    try {
      await archiveTrackById(trackId);
      toast.success('Track archived.');
      const first = linkedReleases[0];
      router.push(first ? `/releases/${first.releaseId}` : '/tracks');
    } catch (error) {
      console.error(error);
      toast.error('Unable to archive track.');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this track permanently?')) return;
    await removeTrack(trackId, activeOrgId ?? undefined, user?.uid);
    toast.success('Track deleted.');
    const first = linkedReleases[0];
    router.push(first ? `/releases/${first.releaseId}` : '/tracks');
  }

  async function handleDuplicate() {
    if (!user) return;
    const newId = await duplicateTrack(trackId, user.uid);
    router.push(`/tracks/${newId}`);
  }

  // EPIC-202A — Artists ready only when originals valid; remix requires remix artists; featured optional but listed must be valid
  const hasArtists = useMemo(() => {
    return areTrackArtistsReady({
      originalArtistIds: artistCredits.original.map((a) => a.id),
      featuredArtistIds: artistCredits.featured.map((a) => a.id),
      remixArtistIds: artistCredits.remix.map((a) => a.id),
      isRemix: recordingType === 'remix',
    });
  }, [artistCredits, recordingType]);

  const displayTitle = useMemo(
    () =>
      resolveTrackDisplayTitle({
        title: track.title,
        displayTitle: track.displayTitle,
        displayTitleEdited: track.displayTitleEdited,
        originalArtistNames: artistCredits.original.map((a) => a.name),
        featuredArtistNames: artistCredits.featured.map((a) => a.name),
        remixArtistNames: artistCredits.remix.map((a) => a.name),
        isRemix: recordingType === 'remix',
        includeOriginalPrefix: false,
      }),
    [track, artistCredits, recordingType],
  );

  const readinessCategories = useMemo(() => [
    { label: 'Credits', done: credits.length > 0 },
    { label: 'Artists', done: hasArtists },
    { label: 'Publishing', done: !!(track.isrc || track.explicit) },
    { label: 'Metadata', done: !!(track.title) },
    { label: 'Audio', done: false },
    { label: 'Lyrics', done: false },
  ], [credits, hasArtists, track]);

  const readinessPct = useMemo(() => {
    const done = readinessCategories.filter((c) => c.done).length;
    return Math.round((done / readinessCategories.length) * 100);
  }, [readinessCategories]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  const readinessColor = readinessPct >= 80 ? 'bg-success-500' : readinessPct >= 50 ? 'bg-warning-500' : 'bg-danger-500';

  return (
    <div className="px-5 sm:px-8 py-8 max-w-6xl mx-auto page-transition">

      {/* Back navigation */}
      <div className="mb-6">
        <Link href="/tracks" className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tracks
        </Link>
      </div>

      {/* Hero */}
      <section className="mb-8" aria-label="Track overview">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-24 h-24 lg:w-[120px] lg:h-[120px] rounded-xl bg-surface-200 shrink-0 flex items-center justify-center">
            <svg className="h-10 w-10 text-content-label" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-content-primary tracking-tight leading-tight">{track.title}</h1>
                {displayTitle && displayTitle !== track.title ? (
                  <p className="text-sm text-content-secondary mt-0.5 truncate" title={displayTitle}>
                    {displayTitle}
                  </p>
                ) : null}
                {track.version ? <p className="text-sm text-content-secondary mt-0.5">{track.version}</p> : null}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge
                    label={recordingTypeLabel(recordingType, true)}
                    color={RECORDING_TYPE_BADGES[recordingType] ?? 'bg-surface-100 text-content-secondary'}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="primary" onClick={() => setTab('edit')}>Edit Track</Button>
                <EntityOverflowMenu
                  aria-label="More track actions"
                  items={[
                    { id: 'duplicate', label: 'Duplicate', onClick: handleDuplicate },
                    { id: 'link-separator', label: '', separatorBefore: true },
                    { id: 'link-release', label: 'Link to Release...', onClick: () => setLinkDialogOpen(true) },
                    { id: 'archive-separator', label: '', separatorBefore: true },
                    { id: 'archive', label: 'Archive', variant: 'secondary', onClick: handleArchive },
                    { id: 'delete', label: 'Delete', variant: 'danger', separatorBefore: true, onClick: handleDelete },
                  ]}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-content-secondary">Recording Type:</span>
                <span className="text-content-primary">{recordingTypeLabel(recordingType)}</span>
              </div>
              {linkedReleases.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setTab('edit')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <span className="text-content-secondary">Linked Releases:</span>
                  <span className="text-content-primary font-medium">{linkedReleases.length} {linkedReleases.length === 1 ? 'Release' : 'Releases'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setLinkDialogOpen(true)}
                  className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
                >
                  <span className="text-content-secondary">Linked Releases:</span>
                  <span>Link Release</span>
                </button>
              )}
              {track.isrc && (
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary">ISRC:</span>
                  <span className="text-content-primary font-mono text-xs">{track.isrc}</span>
                </div>
              )}
              {track.duration && (
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary">Duration:</span>
                  <span className="text-content-primary">{formatDuration(track.duration)}</span>
                </div>
              )}
            </div>

            {/* BUILD-011 — Original Work (remix only), before remix recording metadata */}
            {recordingType === 'remix' && track.originalWork ? (
              <div className="mt-4 rounded-xl border border-surface-200 bg-layer-1 p-4 space-y-3">
                <p className="text-[10px] font-semibold text-content-label uppercase tracking-wider">
                  Original Work
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-content-secondary text-xs mb-0.5">Original Song</dt>
                    <dd className="text-content-primary font-medium">
                      {track.originalWork.title || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-content-secondary text-xs mb-0.5">Original Artist</dt>
                    <dd className="text-content-primary font-medium">
                      {track.originalWork.primaryArtistId ? (
                        <Link
                          href={`/artists/${track.originalWork.primaryArtistId}`}
                          className="hover:text-primary-500 transition-colors"
                        >
                          <OriginalWorkArtistName
                            artistId={track.originalWork.primaryArtistId}
                            organizationId={activeOrgId}
                          />
                        </Link>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-content-secondary text-xs mb-0.5">Original Featured Artists</dt>
                    <dd className="text-content-primary font-medium">
                      {(track.originalWork.featuredArtistIds?.length ?? 0) > 0 ? (
                        <ul className="space-y-0.5">
                          {track.originalWork.featuredArtistIds.map((id) => (
                            <li key={id}>
                              <Link
                                href={`/artists/${id}`}
                                className="hover:text-primary-500 transition-colors"
                              >
                                <OriginalWorkArtistName artistId={id} organizationId={activeOrgId} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {/* EPIC-202A — structured artist credits in track header (remix recording metadata) */}
            {(artistCredits.original.length > 0 ||
              artistCredits.featured.length > 0 ||
              artistCredits.remix.length > 0) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {artistCredits.original.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-label uppercase tracking-wider mb-1">
                      Original Artist{artistCredits.original.length > 1 ? 's' : ''}
                    </p>
                    <ul className="space-y-0.5">
                      {artistCredits.original.map((a) => (
                        <li key={a.id}>
                          <Link
                            href={`/artists/${a.id}`}
                            className="text-sm text-content-primary hover:text-primary-500 transition-colors"
                          >
                            {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {artistCredits.featured.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-label uppercase tracking-wider mb-1">
                      Featured Artist{artistCredits.featured.length > 1 ? 's' : ''}
                    </p>
                    <ul className="space-y-0.5">
                      {artistCredits.featured.map((a) => (
                        <li key={a.id}>
                          <Link
                            href={`/artists/${a.id}`}
                            className="text-sm text-content-primary hover:text-primary-500 transition-colors"
                          >
                            {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {artistCredits.remix.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-label uppercase tracking-wider mb-1">
                      Remix Artist{artistCredits.remix.length > 1 ? 's' : ''}
                    </p>
                    <ul className="space-y-0.5">
                      {artistCredits.remix.map((a) => (
                        <li key={a.id}>
                          <Link
                            href={`/artists/${a.id}`}
                            className="text-sm text-content-primary hover:text-primary-500 transition-colors"
                          >
                            {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Track Readiness */}
      <section className="mb-8" aria-label="Track Readiness">
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">Track Readiness</h3>
            <span className={`text-sm font-semibold tabular-nums ${readinessPct >= 80 ? 'text-success-500' : readinessPct >= 50 ? 'text-warning-500' : 'text-danger-500'}`}>
              {readinessPct}%
            </span>
          </div>
          <div className="mb-4">
            <ProgressBar value={readinessPct} max={100} color={readinessColor} size="sm" />
          </div>
          <ul className="space-y-2">
            {readinessCategories.map((cat) => (
              <li key={cat.label} className="flex items-center gap-2 text-xs">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cat.done ? 'bg-success-500' : 'bg-surface-300'}`} />
                <span className={cat.done ? 'text-content-primary' : 'text-content-label'}>{cat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tabs */}
      <Tabs
        tabs={TAB_IDS.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
        activeTab={tab}
        onChange={(v) => setTab(v as TabId)}
        variant="underline"
        className="mb-8"
      />

      {/* ── Overview Tab ─────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* EPIC-202A — Artist Credits card */}
          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col sm:col-span-2 lg:col-span-1">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Artist Credits</h3>
            {artistCredits.original.length === 0 &&
            artistCredits.featured.length === 0 &&
            artistCredits.remix.length === 0 ? (
              <div className="flex-1 flex flex-col">
                <p className="text-xs text-content-label">No artist credits yet.</p>
                <button
                  type="button"
                  onClick={() => setTab('edit')}
                  className="mt-3 text-xs font-medium text-primary-500 hover:text-primary-600 text-left"
                >
                  Add artists →
                </button>
              </div>
            ) : (
              <div className="space-y-3 flex-1 text-sm">
                {artistCredits.original.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-label uppercase tracking-wider mb-1">
                      Original Artists
                    </p>
                    <ul className="space-y-1">
                      {artistCredits.original.map((a) => (
                        <li key={a.id}>
                          <Link href={`/artists/${a.id}`} className="text-content-primary hover:text-primary-500">
                            • {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {artistCredits.featured.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-label uppercase tracking-wider mb-1">
                      Featured Artists
                    </p>
                    <ul className="space-y-1">
                      {artistCredits.featured.map((a) => (
                        <li key={a.id}>
                          <Link href={`/artists/${a.id}`} className="text-content-primary hover:text-primary-500">
                            • {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {artistCredits.remix.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-label uppercase tracking-wider mb-1">
                      Remix Artists
                    </p>
                    <ul className="space-y-1">
                      {artistCredits.remix.map((a) => (
                        <li key={a.id}>
                          <Link href={`/artists/${a.id}`} className="text-content-primary hover:text-primary-500">
                            • {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Recording Metadata
            </h3>
            <dl className="space-y-2 text-sm flex-1">
              <div className="flex justify-between">
                <dt className="text-content-secondary">Duration</dt>
                <dd className="text-content-primary font-medium">{formatDuration(track.duration)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-content-secondary">Preview Start Time</dt>
                <dd className="text-content-primary font-medium">
                  {track.previewStartTime != null && track.previewStartTime >= 0
                    ? formatDuration(track.previewStartTime)
                    : '—'}
                </dd>
              </div>
              {track.genre ? (
                <div className="flex justify-between">
                  <dt className="text-content-secondary">Genre</dt>
                  <dd className="text-content-primary">{track.genre}</dd>
                </div>
              ) : null}
            </dl>
            {!track.duration && track.previewStartTime == null && !track.genre ? (
              <p className="text-xs text-content-label mt-3 pt-3 border-t border-surface-100">
                No recording details yet. Add duration and technical specs.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Publishing</h3>
            <dl className="space-y-2 text-sm flex-1">
              <div className="flex justify-between">
                <dt className="text-content-secondary">ISRC</dt>
                <dd className="text-content-primary font-medium font-mono text-xs">{track.isrc ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-content-secondary">Explicit</dt>
                <dd className="text-content-primary font-medium">{track.explicit ? 'Yes' : 'No'}</dd>
              </div>
              {track.language ? (
                <div className="flex justify-between">
                  <dt className="text-content-secondary">Language</dt>
                  <dd className="text-content-primary">{track.language}</dd>
                </div>
              ) : null}
              {track.genre ? (
                <div className="flex justify-between">
                  <dt className="text-content-secondary">Genre</dt>
                  <dd className="text-content-primary">{track.genre}</dd>
                </div>
              ) : null}
            </dl>
            {!track.isrc && !track.genre && !track.language ? (
              <p className="text-xs text-content-label mt-3 pt-3 border-t border-surface-100">
                No publishing information yet. Add ISRC, genre and language.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Release</h3>
            {linkedReleases.length > 0 ? (
              <dl className="space-y-2 text-sm flex-1">
                {linkedReleases.map((rl) => (
                  <div key={rl.releaseId} className="flex justify-between items-center">
                    <dt className="text-content-secondary truncate max-w-[120px]" title={rl.title}>{rl.title}</dt>
                    <dd>
                      <Link href={`/releases/${rl.releaseId}`} className="text-xs font-medium text-primary-500 hover:text-primary-600">
                        View →
                      </Link>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="flex-1 flex flex-col">
                <p className="text-xs text-content-label">No releases linked.</p>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-surface-100">
              <button
                type="button"
                onClick={() => setLinkDialogOpen(true)}
                className="text-xs font-medium text-primary-500 hover:text-primary-600"
              >
                {linkedReleases.length > 0 ? '+ Link Release' : 'Link Release'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Credits Tab ──────────────────────────────────────────────── */}
      {tab === 'credits' && (
        <CreditsSection
          credits={credits}
          artistCredits={artistCredits}
          onSave={handleSaveCredits}
          onEditArtists={() => setTab('edit')}
        />
      )}

      {/* ── Publishing Tab ───────────────────────────────────────────── */}
      {tab === 'publishing' && (
        <PublishingSection track={track} credits={credits} organizationId={activeOrgId} />
      )}

      {/* ── Assignments Tab ──────────────────────────────────────────── */}
      {tab === 'assignments' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-content-secondary">Assignments for this track.</p>
            <Button size="sm" variant="primary" onClick={() => setCreateAssignmentOpen(true)}>
              + Create Assignment
            </Button>
          </div>
          <AssignmentsSection entityType="track" entityId={trackId} />
          {activeOrgId && user?.uid && (
            <AssignmentDialog
              open={createAssignmentOpen}
              onClose={() => setCreateAssignmentOpen(false)}
              onCreated={() => setReloadToken((n) => n + 1)}
              entityType="track"
              entityId={trackId}
              organizationId={activeOrgId}
              actorId={user.uid}
            />
          )}
        </div>
      )}

      {/* ── Activity Tab ─────────────────────────────────────────────── */}
      {tab === 'activity' && (
        <ActivitySection activities={activities} loaded={activitiesLoaded} />
      )}

      {/* ── Edit Tab ─────────────────────────────────────────────────── */}
      {tab === 'edit' && (
        <EditPanel
          track={track}
          linkedReleases={linkedReleases}
          activeOrgId={activeOrgId}
          userId={user?.uid ?? ''}
          artistCredits={artistCredits}
          onSaved={() => { onRefresh(); setReloadToken((n) => n + 1); }}
          onLinkRelease={() => setLinkDialogOpen(true)}
        />
      )}

      {/* Link to Release Dialog */}
      <MultiLinkReleaseDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        trackId={trackId}
        activeOrgId={activeOrgId}
        linkedReleases={linkedReleases}
        onLinked={() => {
          setLinkDialogOpen(false);
          setReloadToken((n) => n + 1);
        }}
      />
    </div>
  );
}

/* ─── Multi-Release Link Dialog ──────────────────────────────────── */

function MultiLinkReleaseDialog({
  open,
  onClose,
  trackId,
  activeOrgId,
  linkedReleases,
  onLinked,
}: {
  open: boolean;
  onClose: () => void;
  trackId: string;
  activeOrgId: string | null;
  linkedReleases: LinkedRelease[];
  onLinked: () => void;
}) {
  const [releases, setReleases] = useState<{ id: string; title: string; releaseType: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState<{ releaseId: string; title: string } | null>(null);

  const linkedIds = new Set(linkedReleases.map((r) => r.releaseId));

  useEffect(() => {
    if (!open || !activeOrgId) return;
    setLoading(true);
    setSearch('');
    setConfirmUnlink(null);
    import('@/lib/release-service').then(({ fetchReleasesByOrg }) =>
      fetchReleasesByOrg(activeOrgId).then((data) => {
        setReleases(data.map((r) => ({ id: r.id, title: r.title ?? r.displayTitle ?? 'Untitled', releaseType: r.releaseType })));
        setLoading(false);
      }).catch(() => { setReleases([]); setLoading(false); }),
    );
  }, [open, activeOrgId]);

  const filtered = search.trim()
    ? releases.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : releases;

    async function handleLink(releaseId: string) {
    if (!activeOrgId) return;
    setLinking(true);
    try {
      const position = await getNextPosition(releaseId);
      await addTrackToRelease(releaseId, trackId, position);
      onLinked();
    } catch {
      toast.error('Failed to link release.');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(releaseId: string) {
    if (!activeOrgId) return;
    setLinking(true);
    try {
      const recordId = await getReleaseTrackRecordId(trackId, releaseId);
      if (recordId) {
        await removeTrackFromRelease(recordId);
      }
      setConfirmUnlink(null);
      onLinked();
    } catch {
      toast.error('Failed to unlink release.');
    } finally {
      setLinking(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-modal space-y-4">
        <h2 className="text-base font-semibold text-content-primary">Manage Release Links</h2>

        {linkedReleases.length > 0 && (
          <div>
            <p className="text-xs font-medium text-content-label uppercase tracking-wider mb-2">Currently Linked</p>
            <div className="space-y-2">
              {linkedReleases.map((rl) => (
                <div key={rl.releaseId} className="flex items-center justify-between rounded-lg border border-surface-700 bg-surface-800 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-content-primary truncate">{rl.title}</p>
                    <p className="text-xs text-content-label">{RELEASE_TYPE_LABELS[rl.releaseType] ?? rl.releaseType}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Link href={`/releases/${rl.releaseId}`} className="text-xs font-medium text-primary-500 hover:text-primary-600">
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmUnlink({ releaseId: rl.releaseId, title: rl.title })}
                      className="text-xs font-medium text-danger-500 hover:text-danger-600"
                    >
                      Unlink
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-content-label uppercase tracking-wider mb-2">Link Another Release</p>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search releases..."
            className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-800 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none mb-2"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {loading ? (
              <p className="text-sm text-content-label text-center py-4">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-content-label text-center py-4">No releases found.</p>
            ) : (
              filtered.map((r) => {
                const alreadyLinked = linkedIds.has(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={alreadyLinked || linking}
                    onClick={() => !alreadyLinked && handleLink(r.id)}
                    className={`w-full text-left flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                      alreadyLinked
                        ? 'border-surface-700 bg-surface-800/50 text-content-label cursor-not-allowed'
                        : 'border-surface-700 bg-surface-800 text-content-primary hover:border-primary-500'
                    }`}
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="text-xs text-content-label shrink-0 ml-2">
                      {alreadyLinked ? 'Linked' : (RELEASE_TYPE_LABELS[r.releaseType] ?? r.releaseType)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Done</Button>
        </div>

        {confirmUnlink && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-surface-900/80" onClick={() => setConfirmUnlink(null)} aria-label="Cancel" />
            <div className="relative z-10 w-full max-w-sm rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-modal text-center space-y-4">
              <p className="text-sm text-content-primary">Unlink &ldquo;{confirmUnlink.title}&rdquo;?</p>
              <p className="text-xs text-content-label">The track will be removed from this release. The release itself will not be affected.</p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setConfirmUnlink(null)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={() => handleUnlink(confirmUnlink.releaseId)} disabled={linking}>
                  {linking ? 'Unlinking...' : 'Unlink'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Credits Section ─────────────────────────────────────────────── */

const CREDIT_ROLE_GROUPS: { label: string; matchRoles: string[] }[] = [
  { label: 'Producer', matchRoles: ['Producer', 'producer'] },
  { label: 'Mix Engineer', matchRoles: ['Mix Engineer', 'mix engineer', 'mix_engineer'] },
  { label: 'Mastering', matchRoles: ['Mastering', 'mastering engineer', 'mastering_engineer'] },
  { label: 'Composer', matchRoles: ['Composer', 'composer'] },
  { label: 'Writer', matchRoles: ['Writer', 'writer', 'Lyricist', 'lyricist', 'Songwriter', 'songwriter'] },
];

function CreditsSection({
  credits,
  artistCredits,
  onSave,
  onEditArtists,
}: {
  credits: TrackCredit[];
  artistCredits: ArtistCreditsState;
  onSave: (credits: TrackCredit[]) => void;
  onEditArtists: () => void;
}) {
  const [localCredits, setLocalCredits] = useState<TrackCredit[]>(credits);
  const [saving, setSaving] = useState(false);
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { setLocalCredits(credits); }, [credits]);

  const hasChanges = useMemo(() => {
    const a = localCredits.filter((c) => c.name.trim());
    const b = credits.filter((c) => c.name.trim());
    if (a.length !== b.length) return true;
    return a.some((c, i) => c.name !== b[i]?.name || c.role !== b[i]?.role);
  }, [localCredits, credits]);

  function getEntries(roleGroup: string) {
    const group = CREDIT_ROLE_GROUPS.find((g) => g.label === roleGroup);
    if (!group) return [];
    return localCredits
      .map((c, i) => ({ ...c, index: i }))
      .filter((c) => group.matchRoles.some((r) => c.role.toLowerCase() === r.toLowerCase()));
  }

  function startAdd(role: string) {
    setEditingIndex(null);
    setEditName('');
    setAddingRole(role);
    setNewName('');
  }

  function cancelAdd() {
    setAddingRole(null);
    setNewName('');
  }

  function confirmAdd() {
    if (!newName.trim() || !addingRole) return;
    setLocalCredits((prev) => [...prev, { role: addingRole, name: newName.trim() }]);
    setAddingRole(null);
    setNewName('');
  }

  function startEdit(index: number, currentName: string) {
    setAddingRole(null);
    setNewName('');
    setEditingIndex(index);
    setEditName(currentName);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditName('');
  }

  function confirmEdit() {
    if (editingIndex === null) return;
    const trimmed = editName.trim();
    if (trimmed) {
      setLocalCredits((prev) => prev.map((c, i) => (i === editingIndex ? { ...c, name: trimmed } : c)));
    }
    setEditingIndex(null);
    setEditName('');
  }

  function removeEntry(index: number) {
    if (editingIndex === index) { setEditingIndex(null); setEditName(''); }
    setLocalCredits((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(localCredits.filter((c) => c.name.trim()));
    setSaving(false);
  }

  function renderRoleGroup(label: string) {
    const entries = getEntries(label);
    return (
      <div key={label} className="rounded-lg border border-surface-200 bg-layer-2 shadow-sm p-4 flex flex-col">
        <h3 className="text-sm font-semibold text-content-secondary">{label}</h3>
        <hr className="border-surface-200 my-3" />
        <div className="flex-1">
          {entries.length === 0 && addingRole !== label ? (
            <p className="text-sm text-content-label mb-3">No {label.toLowerCase()} credited yet.</p>
          ) : (
            <div className="space-y-1 mb-3">
              {entries.map((entry) => (
                <div key={entry.index} className="flex items-center justify-between py-1 min-h-8 gap-2">
                  {editingIndex === entry.index ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      className="block flex-1 h-8 rounded-lg border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(entry.index, entry.name)}
                      className="text-sm text-content-primary hover:text-primary-500 transition-colors text-left truncate"
                      title="Click to edit"
                    >
                      {entry.name}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.index)}
                    className="text-content-label hover:text-danger-500 transition-colors text-sm leading-none px-1 py-0.5 shrink-0"
                    aria-label={`Remove ${entry.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {addingRole === label ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmAdd(); if (e.key === 'Escape') cancelAdd(); }}
              placeholder={`Enter ${label.toLowerCase()} name...`}
              className="block flex-1 h-9 rounded-lg border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
              autoFocus
            />
            <Button variant="primary" size="sm" onClick={confirmAdd} disabled={!newName.trim()}>Save</Button>
            <button type="button" onClick={cancelAdd} className="text-sm text-content-label hover:text-content-primary transition-colors shrink-0">Cancel</button>
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={() => startAdd(label)}>+ Add {label}</Button>
        )}
      </div>
    );
  }

  const hasAnyArtist =
    artistCredits.original.length > 0 ||
    artistCredits.featured.length > 0 ||
    artistCredits.remix.length > 0;

  function renderArtistCreditGroup(label: string, entries: ArtistCreditEntry[]) {
    if (entries.length === 0) return null;
    return (
      <div key={label}>
        <p className="text-xs font-semibold text-content-label uppercase tracking-wider mb-1.5">{label}</p>
        <ul className="space-y-1 mb-3">
          {entries.map((a) => (
            <li key={a.id}>
              <Link
                href={`/artists/${a.id}`}
                className="text-sm text-content-primary hover:text-primary-500 transition-colors"
              >
                {a.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* EPIC-202A — canonical performance credits */}
        <div className="rounded-lg border border-surface-200 bg-layer-2 shadow-sm p-4 flex flex-col sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-content-secondary">Artist Credits</h3>
            <button
              type="button"
              onClick={onEditArtists}
              className="text-xs font-medium text-primary-500 hover:text-primary-600"
            >
              Edit artists
            </button>
          </div>
          <hr className="border-surface-200 my-3" />
          {hasAnyArtist ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {renderArtistCreditGroup('Original Artists', artistCredits.original)}
              {renderArtistCreditGroup('Featured Artists', artistCredits.featured)}
              {renderArtistCreditGroup('Remix Artists', artistCredits.remix)}
            </div>
          ) : (
            <p className="text-sm text-content-label">
              No performance artists yet. Add Original, Featured, or Remix artists on the Edit tab.
            </p>
          )}
        </div>

        {CREDIT_ROLE_GROUPS.map((g) => renderRoleGroup(g.label))}
      </div>

      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-layer-2 border-t border-surface-200 px-5 sm:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
          <span className="text-sm text-content-label">Unsaved changes</span>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Publishing Section ─────────────────────────────────────────── */

function PublishingSection({
  track,
  credits,
  organizationId,
}: {
  track: TrackRecord;
  credits: TrackCredit[];
  organizationId: string | null;
}) {
  const publisherNames = credits.filter((c) => c.role.toLowerCase() === 'publisher').map((c) => c.name);
  const legacyWriterNames = credits.filter((c) => ['writer', 'lyricist', 'songwriter'].includes(c.role.toLowerCase())).map((c) => c.name);
  const legacyComposerNames = credits.filter((c) => c.role.toLowerCase() === 'composer').map((c) => c.name);
  const composerIds =
    track.originalWork?.composerArtistIds ?? track.composerArtistIds ?? [];
  const lyricistIds =
    track.originalWork?.lyricistArtistIds ?? track.lyricistArtistIds ?? [];
  const iswc = track.originalWork?.iswc;

  const hasIdentifiers = !!track.isrc;
  const hasRights = !!(track.explicit || track.language);
  const hasPerformance = !!track.trackNumber;
  const hasSongwriting =
    composerIds.length > 0 || lyricistIds.length > 0 || legacyComposerNames.length > 0 || legacyWriterNames.length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Identifiers</h3>
        <dl className="space-y-2 text-sm flex-1">
          <div className="flex justify-between">
            <dt className="text-content-secondary">ISRC</dt>
            <dd className="text-content-primary font-medium font-mono text-xs">{track.isrc ?? '—'}</dd>
          </div>
        </dl>
        {!hasIdentifiers ? (
          <p className="text-xs text-content-label mt-3 pt-3 border-t border-surface-100">
            No identifiers yet. Add ISRC to enable tracking and royalties.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Rights</h3>
        <dl className="space-y-2 text-sm flex-1">
          <div className="flex justify-between">
            <dt className="text-content-secondary">Explicit</dt>
            <dd className="text-content-primary font-medium">{track.explicit ? 'Yes' : 'No'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-secondary">Language</dt>
            <dd className="text-content-primary">{track.language ?? '—'}</dd>
          </div>
        </dl>
        {!hasRights ? (
          <p className="text-xs text-content-label mt-3 pt-3 border-t border-surface-100">
            No rights information yet. Set explicit content flag and language.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Performance</h3>
        <dl className="space-y-2 text-sm flex-1">
          <div className="flex justify-between">
            <dt className="text-content-secondary">Track Number</dt>
            <dd className="text-content-primary">{track.trackNumber?.toString() ?? '—'}</dd>
          </div>
        </dl>
        {!hasPerformance ? (
          <p className="text-xs text-content-label mt-3 pt-3 border-t border-surface-100">
            No performance data yet. Add track number.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
          Original Work Songwriters
        </h3>
        <dl className="space-y-2 text-sm flex-1">
          <div className="flex justify-between gap-3">
            <dt className="text-content-secondary shrink-0">Composer(s)</dt>
            <dd className="text-content-primary text-right">
              {composerIds.length > 0
                ? composerIds.map((id) => (
                    <span key={id} className="block">
                      <OriginalWorkArtistName artistId={id} organizationId={organizationId} />
                    </span>
                  ))
                : (legacyComposerNames.join(', ') || '—')}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-content-secondary shrink-0">Lyricist(s)</dt>
            <dd className="text-content-primary text-right">
              {lyricistIds.length > 0
                ? lyricistIds.map((id) => (
                    <span key={id} className="block">
                      <OriginalWorkArtistName artistId={id} organizationId={organizationId} />
                    </span>
                  ))
                : (legacyWriterNames.join(', ') || '—')}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-secondary">ISWC</dt>
            <dd className="text-content-primary font-mono text-xs">{iswc || '—'}</dd>
          </div>
          {publisherNames.length > 0 ? (
            <div className="flex justify-between">
              <dt className="text-content-secondary">Publisher</dt>
              <dd className="text-content-primary">{publisherNames.join(', ')}</dd>
            </div>
          ) : null}
        </dl>
        {!hasSongwriting && !iswc ? (
          <p className="text-xs text-content-label mt-3 pt-3 border-t border-surface-100">
            No composition credits yet. Add composers, lyricists, and ISWC under Original Work.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Activity Section ───────────────────────────────────────────── */

function ActivitySection({ activities, loaded }: { activities: ActivityEventRecord[]; loaded: boolean }) {
  if (!loaded) {
    return <div className="flex justify-center py-10"><LoadingState text="Loading activity…" /></div>;
  }

  const TECHNICAL_ACTIONS = new Set([
    'firestore.write', 'hook.refresh', 'system.sync', 'system.recalculate',
  ]);
  const meaningful = activities.filter((ev) => !TECHNICAL_ACTIONS.has(ev.action));

  if (meaningful.length === 0) {
    return (
      <EmptyState
        title="No activity yet."
        description="Activity will appear as your team works on this track."
      />
    );
  }

  function timeAgo(ts: unknown): string {
    if (!ts) return '';
    let d: Date;
    if (ts instanceof Date) d = ts;
    else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) d = new Date((ts as { seconds: number }).seconds * 1000);
    else if (typeof ts === 'string') d = new Date(ts);
    else return '';
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function humaniseAction(ev: ActivityEventRecord): string | null {
    const meta = ev.metadata as Record<string, unknown> | null | undefined;
    const artistName = typeof meta?.artistName === 'string' ? meta.artistName : null;
    const details = typeof meta?.details === 'string' ? meta.details : null;

    if (ev.action === 'track.featured_artist_added') {
      return artistName
        ? `added ${artistName} as Featured Artist`
        : (details ?? 'added a Featured Artist');
    }
    if (ev.action === 'track.featured_artist_removed') {
      return artistName
        ? `removed ${artistName} as Featured Artist`
        : (details ?? 'removed a Featured Artist');
    }
    if (ev.action === 'track.featured_artists_reordered') {
      return 'reordered Featured Artists';
    }

    const labels: Record<string, string> = {
      'track.created': 'created this track',
      'track.updated': 'updated track details',
      'track.archived': 'archived track',
      'track.restored': 'restored track',
      'credits.updated': 'updated credits',
      'artwork.linked': 'linked artwork',
      'track.published': 'published track',
      'assignment.completed': 'completed an assignment',
      'task.created': `created task "${ev.metadata?.title ?? ''}"`,
      'task.completed': 'completed a task',
      'task.assigned': 'assigned a task',
      'comment.added': 'left a comment',
      'deliverable.created': 'added a deliverable',
      'deliverable.approved': 'approved a deliverable',
      'deliverable.rejected': 'rejected a deliverable',
      'approval.requested': 'requested an approval',
      'approval.approved': 'approved',
      'approval.rejected': 'rejected an approval',
    };
    return labels[ev.action] ?? details ?? ev.action.replace(/[._]/g, ' ');
  }

  return (
    <div className="space-y-0 rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden">
      {meaningful.map((ev, i) => {
        const label = humaniseAction(ev);
        return (
          <div key={ev.id} className={`flex items-start gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-surface-100' : ''}`}>
            <div className="h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0 text-caption font-semibold text-content-primary mt-0.5">
              {(ev.actorId ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-content-secondary">
                <span className="font-medium text-content-primary">{ev.actorId}</span>{' '}{label}
              </p>
              <p className="text-xs text-content-label mt-0.5">{timeAgo(ev.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function entriesFromCredits(entries: ArtistCreditEntry[]): RepeatableArtistEntry[] {
  return entries.map((a) => ({ id: a.id, artistId: a.id }));
}

function EditPanel({
  track,
  linkedReleases,
  activeOrgId,
  userId,
  artistCredits,
  onSaved,
  onLinkRelease,
}: {
  track: TrackRecord;
  linkedReleases: LinkedRelease[];
  activeOrgId: string | null;
  userId: string;
  artistCredits: ArtistCreditsState;
  onSaved: () => void;
  onLinkRelease: () => void;
}) {
  const { artistOptions, pickerCardModels, refresh: refreshArtists } = useArtists();
  const [title, setTitle] = useState(track.title);
  const [version, setVersion] = useState(track.version ?? '');
  const [subtitle, setSubtitle] = useState(track.subtitle ?? '');
  const [recordingType, setRecordingType] = useState<string>(track.recordingType ?? 'original');
  const [genre, setGenre] = useState(track.genre ?? '');
  const [subgenre, setSubgenre] = useState(track.genre ?? '');
  const [language, setLanguage] = useState(track.language ?? '');
  const [explicit, setExplicit] = useState(track.explicit ? 'true' : 'false');
  const [isrc, setIsrc] = useState(track.isrc ?? '');
  const [trackNumber, setTrackNumber] = useState(track.trackNumber?.toString() ?? '');
  const [durationStr, setDurationStr] = useState(fmtDurationDisplay(track.duration));
  const [durationError, setDurationError] = useState('');
  const [previewStartStr, setPreviewStartStr] = useState(
    track.previewStartTime != null && track.previewStartTime >= 0
      ? fmtDurationDisplay(track.previewStartTime) || '0:00'
      : '',
  );
  const [previewStartError, setPreviewStartError] = useState('');
  const [saving, setSaving] = useState(false);

  // BUILD-011 — Original Work (in-memory retained when switching away from remix)
  const [originalWorkTitle, setOriginalWorkTitle] = useState(track.originalWork?.title ?? '');
  const [originalWorkPrimaryArtistId, setOriginalWorkPrimaryArtistId] = useState(
    track.originalWork?.primaryArtistId ?? '',
  );
  const [originalWorkFeaturedEntries, setOriginalWorkFeaturedEntries] = useState<RepeatableArtistEntry[]>(() =>
    (track.originalWork?.featuredArtistIds ?? []).map((id) => ({ id, artistId: id })),
  );

  // EPIC-202A — shared ArtistRelationshipList state
  const [originalEntries, setOriginalEntries] = useState<RepeatableArtistEntry[]>(() =>
    entriesFromCredits(artistCredits.original),
  );
  const [featuredEntries, setFeaturedEntries] = useState<RepeatableArtistEntry[]>(() =>
    entriesFromCredits(artistCredits.featured),
  );
  const [remixEntries, setRemixEntries] = useState<RepeatableArtistEntry[]>(() =>
    entriesFromCredits(artistCredits.remix),
  );
  const [displayTitle, setDisplayTitle] = useState(track.displayTitle ?? '');
  const [displayTitleEdited, setDisplayTitleEdited] = useState(track.displayTitleEdited ?? false);
  // BUILD-012D — Original Work songwriters (Artist catalogue)
  const [originalWorkComposerEntries, setOriginalWorkComposerEntries] = useState<RepeatableArtistEntry[]>(() =>
    (track.originalWork?.composerArtistIds ?? track.composerArtistIds ?? []).map((id) => ({ id, artistId: id })),
  );
  const [originalWorkLyricistEntries, setOriginalWorkLyricistEntries] = useState<RepeatableArtistEntry[]>(() =>
    (track.originalWork?.lyricistArtistIds ?? track.lyricistArtistIds ?? []).map((id) => ({ id, artistId: id })),
  );
  const [originalWorkIswc, setOriginalWorkIswc] = useState(track.originalWork?.iswc ?? '');
  const [artistError, setArtistError] = useState('');
  const [extraArtists, setExtraArtists] = useState<ArtistOption[]>([]);

  const artists = useMemo(() => {
    const map = new Map<string, ArtistOption>();
    for (const a of artistOptions) map.set(a.id, a);
    for (const a of extraArtists) map.set(a.id, a);
    for (const group of [artistCredits.original, artistCredits.featured, artistCredits.remix]) {
      for (const a of group) {
        if (!map.has(a.id)) map.set(a.id, { id: a.id, name: a.name });
      }
    }
    return Array.from(map.values());
  }, [artistOptions, extraArtists, artistCredits]);

  const nameOf = useCallback(
    (id: string) => artists.find((a) => a.id === id)?.name ?? id,
    [artists],
  );

  const suggestedDisplayTitle = useMemo(
    () =>
      generateSuggestedDisplayTitle({
        trackTitle: title,
        originalArtistNames: originalEntries.map((e) => nameOf(e.artistId)),
        featuredArtistNames: featuredEntries.map((e) => nameOf(e.artistId)),
        remixArtistNames: remixEntries.map((e) => nameOf(e.artistId)),
        isRemix: recordingType === 'remix',
      }),
    [title, originalEntries, featuredEntries, remixEntries, recordingType, nameOf],
  );

  useEffect(() => {
    setTitle(track.title);
    setVersion(track.version ?? '');
    setSubtitle(track.subtitle ?? '');
    setRecordingType(track.recordingType ?? 'original');
    setGenre(track.genre ?? '');
    setSubgenre(track.genre ?? '');
    setLanguage(track.language ?? '');
    setExplicit(track.explicit ? 'true' : 'false');
    setIsrc(track.isrc ?? '');
    setTrackNumber(track.trackNumber?.toString() ?? '');
    setDurationStr(fmtDurationDisplay(track.duration));
    setDurationError('');
    setPreviewStartStr(
      track.previewStartTime != null && track.previewStartTime >= 0
        ? fmtDurationDisplay(track.previewStartTime) || '0:00'
        : '',
    );
    setPreviewStartError('');
    setDisplayTitle(track.displayTitle ?? '');
    setDisplayTitleEdited(track.displayTitleEdited ?? false);
    setOriginalWorkTitle(track.originalWork?.title ?? '');
    setOriginalWorkPrimaryArtistId(track.originalWork?.primaryArtistId ?? '');
    setOriginalWorkFeaturedEntries(
      (track.originalWork?.featuredArtistIds ?? []).map((id) => ({ id, artistId: id })),
    );
    setOriginalWorkComposerEntries(
      (track.originalWork?.composerArtistIds ?? track.composerArtistIds ?? []).map((id) => ({
        id,
        artistId: id,
      })),
    );
    setOriginalWorkLyricistEntries(
      (track.originalWork?.lyricistArtistIds ?? track.lyricistArtistIds ?? []).map((id) => ({
        id,
        artistId: id,
      })),
    );
    setOriginalWorkIswc(track.originalWork?.iswc ?? '');
  }, [track]);

  useEffect(() => {
    setOriginalEntries(entriesFromCredits(artistCredits.original));
    setFeaturedEntries(entriesFromCredits(artistCredits.featured));
    setRemixEntries(entriesFromCredits(artistCredits.remix));
  }, [artistCredits]);

  // Auto-suggest display title unless user edited it
  useEffect(() => {
    if (!displayTitleEdited) {
      setDisplayTitle(suggestedDisplayTitle);
    }
  }, [suggestedDisplayTitle, displayTitleEdited]);

  function handleDurationChange(val: string) {
    setDurationStr(val);
    if (!val.trim()) { setDurationError(''); return; }
    const parsed = parseDurationInput(val);
    if (parsed === null) {
      setDurationError('Use mm:ss (e.g. 3:45)');
    } else {
      setDurationError('');
    }
  }

  function addOriginal(artistId: string) {
    const ids = originalEntries.map((e) => e.artistId);
    if (ids.includes(artistId) || findDuplicateArtistId([...ids, artistId])) {
      setArtistError('This artist is already listed as an Original Artist.');
      return;
    }
    setArtistError('');
    setOriginalEntries((prev) => [...prev, { id: artistId, artistId }]);
  }

  function addFeatured(artistId: string) {
    const ids = featuredEntries.map((e) => e.artistId);
    if (ids.includes(artistId) || findDuplicateArtistId([...ids, artistId])) {
      setArtistError('This artist is already listed as a Featured Artist.');
      return;
    }
    setArtistError('');
    setFeaturedEntries((prev) => [...prev, { id: artistId, artistId }]);
  }

  function addRemix(artistId: string) {
    const ids = remixEntries.map((e) => e.artistId);
    if (ids.includes(artistId) || findDuplicateArtistId([...ids, artistId])) {
      setArtistError('This artist is already listed as a Remix Artist.');
      return;
    }
    setArtistError('');
    setRemixEntries((prev) => [...prev, { id: artistId, artistId }]);
  }

  async function handleSave() {
    if (!title.trim()) return;
    if (originalEntries.filter((e) => e.artistId).length === 0) {
      setArtistError('At least one Original Artist is required.');
      return;
    }
    if (recordingType === 'remix' && remixEntries.filter((e) => e.artistId).length === 0) {
      setArtistError('Remix tracks require at least one Remix Artist.');
      return;
    }
    // BUILD-011 — Original Work required only for remix
    if (recordingType === 'remix') {
      if (!originalWorkTitle.trim()) {
        setArtistError('Original Song Title is required for remix tracks.');
        return;
      }
      if (!originalWorkPrimaryArtistId.trim()) {
        setArtistError('Original Primary Artist is required for remix tracks.');
        return;
      }
    }
    let durationSeconds: number | null = null;
    if (durationStr.trim()) {
      const parsed = parseDurationInput(durationStr);
      if (parsed === null) { setDurationError('Invalid duration format. Use mm:ss (e.g. 3:45)'); return; }
      durationSeconds = parsed;
    }
    let previewSeconds: number | null = null;
    if (previewStartStr.trim()) {
      const parsed = parseTimeInputLocal(previewStartStr);
      if (parsed === null) {
        setPreviewStartError('Invalid time format. Use mm:ss (e.g. 1:18)');
        return;
      }
      if (durationSeconds != null && parsed >= durationSeconds) {
        setPreviewStartError('Preview start time must be earlier than the track duration.');
        return;
      }
      previewSeconds = parsed;
    }
    setSaving(true);
    setArtistError('');
    try {
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
        duration: durationSeconds,
        previewStartTime: previewSeconds,
        originalWork: recordingType === 'remix'
          ? {
              title: originalWorkTitle.trim(),
              primaryArtistId: originalWorkPrimaryArtistId,
              featuredArtistIds: originalWorkFeaturedEntries.map((e) => e.artistId).filter(Boolean),
              composerArtistIds: originalWorkComposerEntries.map((e) => e.artistId).filter(Boolean),
              lyricistArtistIds: originalWorkLyricistEntries.map((e) => e.artistId).filter(Boolean),
              iswc: originalWorkIswc.trim() || null,
            }
          : null,
      });

      if (activeOrgId && userId) {
        const nameMap: Record<string, string> = {};
        for (const a of artists) nameMap[a.id] = a.name;
        await syncTrackArtistCredits(
          track.id,
          {
            originalArtistIds: originalEntries.map((e) => e.artistId).filter(Boolean),
            featuredArtistIds: featuredEntries.map((e) => e.artistId).filter(Boolean),
            remixArtistIds: remixEntries.map((e) => e.artistId).filter(Boolean),
            composerArtistIds:
              recordingType === 'remix'
                ? originalWorkComposerEntries.map((e) => e.artistId).filter(Boolean)
                : [],
            lyricistArtistIds:
              recordingType === 'remix'
                ? originalWorkLyricistEntries.map((e) => e.artistId).filter(Boolean)
                : [],
          },
          {
            organizationId: activeOrgId,
            actorId: userId,
            artistNames: nameMap,
            trackTitle: title.trim(),
            displayTitle: displayTitle.trim() || null,
            displayTitleEdited,
            isRemix: recordingType === 'remix',
            originalArtistNames: originalEntries.map((e) => nameOf(e.artistId)),
            featuredArtistNames: featuredEntries.map((e) => nameOf(e.artistId)),
            remixArtistNames: remixEntries.map((e) => nameOf(e.artistId)),
          },
        );
      }
      toast.success('Track saved.');
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to save track.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-6 space-y-8">
      <p className="text-sm font-semibold text-content-primary">Edit Track</p>

      {/* Identity */}
      <div>
        <p className="text-xs font-semibold text-content-label uppercase tracking-wider mb-3">Identity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Track Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Track Title"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. Radio Edit"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Recording Type</label>
            <select
              value={recordingType}
              onChange={(e) => setRecordingType(e.target.value)}
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="original">Original</option>
              <option value="remix">Remix</option>
            </select>
          </div>
        </div>
      </div>

      {/* BUILD-011 — Original Work via shared TrackEditor section (only when Recording Type = Remix) */}
      {recordingType === 'remix' ? (
        <OriginalWorkSection
          instanceId={`edit-${track.id}`}
          value={emptyTrackEditorValue({
            originalWorkTitle,
            originalWorkPrimaryArtistId,
            originalWorkFeaturedArtists: originalWorkFeaturedEntries,
            originalWorkComposers: originalWorkComposerEntries,
            originalWorkLyricists: originalWorkLyricistEntries,
            originalWorkIswc,
          })}
          onChange={(patch) => {
            if (patch.originalWorkTitle !== undefined) setOriginalWorkTitle(patch.originalWorkTitle);
            if (patch.originalWorkPrimaryArtistId !== undefined) {
              setOriginalWorkPrimaryArtistId(patch.originalWorkPrimaryArtistId);
            }
            if (patch.originalWorkFeaturedArtists !== undefined) {
              setOriginalWorkFeaturedEntries(patch.originalWorkFeaturedArtists);
            }
            if (patch.originalWorkComposers !== undefined) {
              setOriginalWorkComposerEntries(patch.originalWorkComposers);
            }
            if (patch.originalWorkLyricists !== undefined) {
              setOriginalWorkLyricistEntries(patch.originalWorkLyricists);
            }
            if (patch.originalWorkIswc !== undefined) setOriginalWorkIswc(patch.originalWorkIswc);
          }}
          artists={artists}
          cardModels={pickerCardModels}
          organizationId={activeOrgId}
          onArtistCreated={(a) => {
            setExtraArtists((prev) => [...prev, a]);
            void refreshArtists();
          }}
          variant="light"
        />
      ) : null}

      {/* EPIC-202A — Artist Relationships (same component as wizard / create) */}
      <div>
        <p className="text-xs font-semibold text-content-label uppercase tracking-wider mb-3">Artist Relationships</p>
        <div className="space-y-5">
          <ArtistRelationshipList
            instanceId={`edit-${track.id}-original`}
            role="original"
            entries={originalEntries}
            artists={artists}
            cardModels={pickerCardModels}
            organizationId={activeOrgId}
            onAdd={addOriginal}
            onRemove={(entryId) => setOriginalEntries((prev) => prev.filter((e) => e.id !== entryId))}
            onReorder={setOriginalEntries}
            onArtistCreated={(a) => {
              setExtraArtists((prev) => [...prev, a]);
              void refreshArtists();
            }}
          />
          <ArtistRelationshipList
            instanceId={`edit-${track.id}-featured`}
            role="featured"
            entries={featuredEntries}
            artists={artists}
            cardModels={pickerCardModels}
            organizationId={activeOrgId}
            onAdd={addFeatured}
            onRemove={(entryId) => setFeaturedEntries((prev) => prev.filter((e) => e.id !== entryId))}
            onReorder={setFeaturedEntries}
            onArtistCreated={(a) => {
              setExtraArtists((prev) => [...prev, a]);
              void refreshArtists();
            }}
          />
          {(recordingType === 'remix' || remixEntries.length > 0) && (
            <ArtistRelationshipList
              instanceId={`edit-${track.id}-remix`}
              role="remix"
              entries={remixEntries}
              artists={artists}
              cardModels={pickerCardModels}
              organizationId={activeOrgId}
              onAdd={addRemix}
              onRemove={(entryId) => setRemixEntries((prev) => prev.filter((e) => e.id !== entryId))}
              onReorder={setRemixEntries}
              onArtistCreated={(a) => {
                setExtraArtists((prev) => [...prev, a]);
                void refreshArtists();
              }}
            />
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Display Title</label>
            <input
              type="text"
              value={displayTitle}
              onChange={(e) => {
                setDisplayTitle(e.target.value);
                setDisplayTitleEdited(true);
              }}
              placeholder={suggestedDisplayTitle || 'Suggested display title'}
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
            />
            <p className="text-xs text-content-label">
              Suggested: {suggestedDisplayTitle || '—'}
              {displayTitleEdited ? (
                <button
                  type="button"
                  className="ml-2 text-primary-500 hover:text-primary-600"
                  onClick={() => {
                    setDisplayTitleEdited(false);
                    setDisplayTitle(suggestedDisplayTitle);
                  }}
                >
                  Reset to suggested
                </button>
              ) : null}
            </p>
          </div>
          {artistError ? <p className="text-xs text-danger-500">{artistError}</p> : null}
        </div>
      </div>

      {/* Recording Identifiers — ISRC for the sound recording (BUILD-012D) */}
      <div>
        <p className="text-xs font-semibold text-content-label uppercase tracking-wider mb-1">
          Recording Identifiers
        </p>
        <p className="text-xs text-content-label mb-3">
          Identifiers for this sound recording.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">ISRC</label>
            <input
              type="text"
              value={isrc}
              onChange={(e) => setIsrc(e.target.value)}
              placeholder="e.g. USABC1234567"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Duration (mm:ss)</label>
            <input
              type="text"
              value={durationStr}
              onChange={(e) => handleDurationChange(e.target.value)}
              placeholder="e.g. 3:45"
              className={`block w-full h-10 rounded-xl border px-3 text-sm text-content-primary placeholder:text-content-label focus:outline-none ${
                durationError ? 'border-danger-500 focus:border-danger-500' : 'border-surface-200 focus:border-primary-500'
              }`}
            />
            {durationError ? <p className="text-xs text-danger-500 mt-0.5">{durationError}</p> : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Track Preview Start Time</label>
            <p className="text-xs text-content-label">
              Preferred starting point for DSP audio previews. Leave blank to use the distributor or DSP default.
            </p>
            <input
              type="text"
              value={previewStartStr}
              onChange={(e) => {
                setPreviewStartStr(e.target.value);
                setPreviewStartError('');
              }}
              placeholder="MM:SS"
              className={`block w-full h-10 rounded-xl border px-3 text-sm text-content-primary placeholder:text-content-label focus:outline-none ${
                previewStartError
                  ? 'border-danger-500 focus:border-danger-500'
                  : 'border-surface-200 focus:border-primary-500'
              }`}
            />
            {previewStartError ? (
              <p className="text-xs text-danger-500 mt-0.5">{previewStartError}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Track Number</label>
            <input
              type="number"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              placeholder="Track Number"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Explicit</label>
            <select
              value={explicit}
              onChange={(e) => setExplicit(e.target.value)}
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="false">Not Explicit</option>
              <option value="true">Explicit</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-label">Language</label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. English"
              className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div>
        <p className="text-xs font-semibold text-content-label uppercase tracking-wider mb-3">Metadata</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <SearchableGenreSelect
            value={genre}
            onChange={setGenre}
            orgId={activeOrgId}
            userId={userId}
            presets={GENRE_PRESETS}
            placeholder="Search or create genre"
            label="Genre"
          />
          <SearchableGenreSelect
            value={subgenre}
            onChange={setSubgenre}
            orgId={activeOrgId}
            userId={userId}
            presets={[]}
            placeholder="Search or create subgenre"
            label="Subgenre"
          />
        </div>
      </div>

      {/* Release Links */}
      <div>
        <p className="text-xs font-semibold text-content-label uppercase tracking-wider mb-3">Release Links</p>
        {linkedReleases.length === 0 ? (
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 text-center">
            <p className="text-sm text-content-label mb-3">
              This track is not linked to any release. Link the track to one or more releases.
            </p>
            <Button size="sm" variant="primary" onClick={onLinkRelease}>Link Release</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedReleases.map((rl) => (
              <div key={rl.releaseId} className="flex items-center justify-between rounded-xl border border-surface-200 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-content-primary truncate">{rl.title}</p>
                  <p className="text-xs text-content-label">{RELEASE_TYPE_LABELS[rl.releaseType] ?? rl.releaseType}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <Link href={`/releases/${rl.releaseId}`} className="text-xs font-medium text-primary-500 hover:text-primary-600">View</Link>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onLinkRelease}
              className="w-full text-left rounded-xl border border-dashed border-surface-300 px-4 py-3 text-sm text-content-label hover:text-primary-500 hover:border-primary-300 transition-colors"
            >
              + Link Release
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-surface-200">
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
