'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { TrackRecord } from '@/lib/track-repository';
import { editTrack, removeTrack, archiveTrackById, duplicateTrack } from '@/lib/track-service';
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

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  return fmtDurationDisplay(seconds);
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
  const [artistSummary, setArtistSummary] = useState<string>('—');
  const [primaryArtist, setPrimaryArtist] = useState<string | null>(null);
  const [artistsByRole, setArtistsByRole] = useState<Record<string, string[]>>({});
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
          if (originalArtists.length > 0) {
            const origNames = await resolveArtistNames(activeOrgId, originalArtists.map((a) => a.artistId));
            setArtistsByRole((prev) => ({ ...prev, 'Original Artist': origNames }));
          }
          if (remixArtists.length > 0) {
            const remixNames = await resolveArtistNames(activeOrgId, remixArtists.map((a) => a.artistId));
            setArtistsByRole((prev) => ({ ...prev, 'Remix Artist': remixNames }));
          }
          setPrimaryArtist(originalArtists[0] ? (await resolveArtistNames(activeOrgId, [originalArtists[0].artistId]))[0] ?? null : null);
        } else {
          const allNames = await resolveArtistNames(activeOrgId, [
            ...primaryArtists.map((a) => a.artistId),
            ...featuredArtists.map((a) => a.artistId),
          ]);
          setArtistSummary(allNames.join(' · ') || '—');
          if (primaryArtists.length > 0) {
            const pNames = await resolveArtistNames(activeOrgId, primaryArtists.map((a) => a.artistId));
            setArtistsByRole((prev) => ({ ...prev, 'Primary Artist': pNames }));
            setPrimaryArtist(pNames[0] ?? null);
          }
          if (featuredArtists.length > 0) {
            const fNames = await resolveArtistNames(activeOrgId, featuredArtists.map((a) => a.artistId));
            setArtistsByRole((prev) => ({ ...prev, 'Featured Artist': fNames }));
          }
        }
      } else if (recordingType === 'remix') {
        const [orig, rem] = await Promise.all([
          track.originalArtistId ? fetchArtist(activeOrgId, track.originalArtistId) : null,
          track.remixerArtistId ? fetchArtist(activeOrgId, track.remixerArtistId) : null,
        ]);
        setArtistSummary([orig?.name, rem?.name].filter(Boolean).join(' · ') || '—');
        if (orig?.name) setPrimaryArtist(orig.name);
      } else {
        const primary = track.primaryArtistId ? await fetchArtist(activeOrgId, track.primaryArtistId) : null;
        const featured = await Promise.all(
          (track.featuredArtistIds ?? []).map(async (aid) => {
            const a = await fetchArtist(activeOrgId, aid);
            return a?.name;
          }),
        );
        setArtistSummary([primary?.name, ...featured.filter(Boolean)].filter(Boolean).join(' · ') || '—');
        if (primary?.name) setPrimaryArtist(primary.name);
      }
    } catch {
      /* safe defaults */
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, trackId, recordingType, track]);

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

  const hasArtists = useMemo(() => {
    return !!(track.primaryArtistId || (track.featuredArtistIds && track.featuredArtistIds.length > 0) ||
      track.originalArtistId || track.remixerArtistId || artistSummary !== '—');
  }, [track, artistSummary]);

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
              {primaryArtist && (
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary">Primary Artist:</span>
                  <span className="text-content-primary">{primaryArtist}</span>
                </div>
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
          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Recording</h3>
            <dl className="space-y-2 text-sm flex-1">
              <div className="flex justify-between">
                <dt className="text-content-secondary">Duration</dt>
                <dd className="text-content-primary font-medium">{formatDuration(track.duration)}</dd>
              </div>
            </dl>
            {!track.duration ? (
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
          artistsByRole={artistsByRole}
          onSave={handleSaveCredits}
        />
      )}

      {/* ── Publishing Tab ───────────────────────────────────────────── */}
      {tab === 'publishing' && (
        <PublishingSection track={track} credits={credits} />
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
  artistsByRole,
  onSave,
}: {
  credits: TrackCredit[];
  artistsByRole: Record<string, string[]>;
  onSave: (credits: TrackCredit[]) => void;
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

  const hasAnyArtist = Object.values(artistsByRole).some((names) => names.length > 0);

  return (
    <div className="pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-surface-200 bg-layer-2 shadow-sm p-4 flex flex-col sm:col-span-2">
          <h3 className="text-sm font-semibold text-content-secondary">Artists</h3>
          <hr className="border-surface-200 my-3" />
          {hasAnyArtist ? (
            <div className="space-y-2">
              {Object.entries(artistsByRole).map(([role, names]) => (
                <div key={role} className="flex items-center gap-2 text-sm">
                  <span className="text-content-label text-xs w-28 shrink-0">{role}</span>
                  <span className="text-content-primary">{names.join(', ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-content-label">No artists attached yet. Add artists to the track.</p>
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

function PublishingSection({ track, credits }: { track: TrackRecord; credits: TrackCredit[] }) {
  const publisherNames = credits.filter((c) => c.role.toLowerCase() === 'publisher').map((c) => c.name);
  const writerNames = credits.filter((c) => ['writer', 'lyricist', 'songwriter'].includes(c.role.toLowerCase())).map((c) => c.name);
  const composerNames = credits.filter((c) => c.role.toLowerCase() === 'composer').map((c) => c.name);

  const hasIdentifiers = !!track.isrc;
  const hasRights = !!(track.explicit || track.language);
  const hasPerformance = !!track.trackNumber;
  const hasDistribution = false;

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
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Distribution</h3>
        <dl className="space-y-2 text-sm flex-1">
          <div className="flex justify-between">
            <dt className="text-content-secondary">Publisher</dt>
            <dd className="text-content-primary">{publisherNames.join(', ') || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-secondary">Writers</dt>
            <dd className="text-content-primary">{writerNames.join(', ') || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-secondary">Composers</dt>
            <dd className="text-content-primary">{composerNames.join(', ') || '—'}</dd>
          </div>
        </dl>
        {!hasDistribution && !publisherNames.length && !writerNames.length && !composerNames.length ? (
          <p className="text-xs text-content-label mt-3 pt-3 border-t border-surface-100">
            No distribution details yet. Add publisher, writers and composers.
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
    return labels[ev.action] ?? ev.action.replace(/[._]/g, ' ');
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

function EditPanel({
  track,
  linkedReleases,
  activeOrgId,
  userId,
  onSaved,
  onLinkRelease,
}: {
  track: TrackRecord;
  linkedReleases: LinkedRelease[];
  activeOrgId: string | null;
  userId: string;
  onSaved: () => void;
  onLinkRelease: () => void;
}) {
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
  const [saving, setSaving] = useState(false);

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
  }, [track]);

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

  async function handleSave() {
    if (!title.trim()) return;
    let durationSeconds: number | null = null;
    if (durationStr.trim()) {
      const parsed = parseDurationInput(durationStr);
      if (parsed === null) { setDurationError('Invalid duration format. Use mm:ss (e.g. 3:45)'); return; }
      durationSeconds = parsed;
    }
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
      duration: durationSeconds,
    });
    setSaving(false);
    onSaved();
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

      {/* Publishing */}
      <div>
        <p className="text-xs font-semibold text-content-label uppercase tracking-wider mb-3">Publishing</p>
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
