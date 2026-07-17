'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { PersonPickerDialog } from '@/components/person-picker-dialog';
import { fetchRelease, removeRelease, editRelease } from '@/lib/release-service';
import { uploadArtwork, getArtworkByRelease } from '@/lib/artwork/artwork-service';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { toast } from '@/stores/toast-store';
import { getDeliverablesByRelease } from '@/lib/deliverable-service';
import { getTracksByRelease } from '@/lib/release-track-repository';
import { getArtistsByRole } from '@/lib/track-artist-repository';
import { getTasksByEntity } from '@/lib/task-service';
import { getActivityByEntity } from '@/lib/activity-service';
import { fmtDate } from '@/lib/utils';
import { formatReleaseMetadata } from '@/lib/release-metadata';
import { RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import { Button, StatusBadge, Skeleton, EmptyState, LoadingState, Tabs, ConfirmationDialog } from '@releaseflow/ui';
import { ReleaseArtwork, type UploadState } from '@/components/release/ReleaseArtwork';
import { ReadinessCard } from '@/components/release/workspace/ReadinessCard';
import { SectionHeader } from '@/components/release/workspace/SectionHeader';
import type { Release, Deliverable, Task } from '../../types';
import type { ReleaseTrackRecord } from '@/lib/release-track-repository';
import type { TrackRecord } from '@/lib/track-repository';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { resolveRecordingType, recordingTypeLabel } from '@/lib/recording-type';
import type { Artwork } from '@/lib/artwork/artwork-types';
import { AssignmentsSection } from '@/components/assignments-section';
import { TrackRow, TrackList } from '@/components/shared/track-row';

/* ─── helpers ────────────────────────────────────────────────────────────── */

function relativeDate(ts: unknown): string {
  if (!ts) return '';
  let d: Date;
  if (ts instanceof Date) { d = ts; }
  else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) { d = new Date((ts as { seconds: number }).seconds * 1000); }
  else if (typeof ts === 'string') { d = new Date(ts); }
  else { return ''; }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === -1) return 'Yesterday (overdue)';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(ts: unknown): boolean {
  if (!ts) return false;
  let d: Date;
  if (ts instanceof Date) { d = ts; }
  else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) { d = new Date((ts as { seconds: number }).seconds * 1000); }
  else if (typeof ts === 'string') { d = new Date(ts); }
  else return false;
  return d < new Date();
}

function dateValue(ts: unknown): number {
  if (!ts) return Infinity;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts) return (ts as { seconds: number }).seconds * 1000;
  if (typeof ts === 'string') {
    const time = new Date(ts).getTime();
    return Number.isNaN(time) ? Infinity : time;
  }
  return Infinity;
}

function taskDateBucket(ts: unknown): number {
  const value = dateValue(ts);
  if (value === Infinity) return 4;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(value);
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetDay.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 0;
  if (diffDays === 0) return 1;
  if (diffDays === 1) return 2;
  return 3;
}

function timeAgo(ts: unknown): string {
  if (!ts) return '';
  let d: Date;
  if (ts instanceof Date) { d = ts; }
  else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) { d = new Date((ts as { seconds: number }).seconds * 1000); }
  else if (typeof ts === 'string') { d = new Date(ts); }
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

function fmtDuration(secs: number | undefined): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function displayStatus(status: string): string {
  return status.replace(/^(?:deleted:)+/, '');
}

function fieldValue(record: unknown, keys: string[]): string | undefined {
  if (!record || typeof record !== 'object') return undefined;
  const source = record as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function isInvitationPending(task: Task): boolean {
  return Boolean(fieldValue(task, ['invitationId', 'invitationEmail', 'pendingInvitationId']));
}

function taskActionLabel(task: Task): string {
  if (isInvitationPending(task)) return 'View Invitation';
  if (!task.assigneeId) return 'Assign';
  return 'Open Task';
}

/* ─── activity event label ───────────────────────────────────────────────── */

const TECHNICAL_ACTIONS = new Set([
  'firestore.write', 'hook.refresh', 'system.sync', 'system.recalculate',
  'workflow.generated', // internal
]);

function humaniseActivity(ev: ActivityEventRecord): string | null {
  if (TECHNICAL_ACTIONS.has(ev.action)) return null;
  const labels: Record<string, string> = {
    'release.created': 'created this release',
    'stage.started': `started stage ${ev.metadata?.stageName ?? ''}`,
    'stage.completed': `completed stage ${ev.metadata?.stageName ?? ''}`,
    'task.created': `created task "${ev.metadata?.title ?? ''}"`,
    'task.completed': `completed a task`,
    'task.assigned': `assigned a task`,
    'deliverable.created': `added deliverable "${ev.metadata?.title ?? ''}"`,
    'deliverable.approved': `approved a deliverable`,
    'deliverable.rejected': `rejected a deliverable`,
    'deliverable.updated': `updated a deliverable`,
    'approval.requested': `requested an approval`,
    'approval.approved': `approved`,
    'approval.rejected': `rejected an approval`,
    'comment.added': `left a comment`,
    'release.status.changed': `changed status to ${ev.metadata?.newStatus ?? ''}`,
    'campaign.created': `created a campaign`,
  };
  return labels[ev.action] ?? ev.action.replace(/[._]/g, ' ');
}

/* ─── readiness categories ───────────────────────────────────────────────── */

const READINESS_CATS = ['Audio', 'Artwork', 'Metadata', 'Rights', 'Distribution', 'Marketing'] as const;
type ReadinessCat = typeof READINESS_CATS[number];

/* ─── Main Page ──────────────────────────────────────────────────────────── */

type TabId = 'overview' | 'assignments' | 'workflow' | 'campaign' | 'rights' | 'budget' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'assignments',  label: 'Assignments'  },
  { id: 'workflow',  label: 'Workflow'  },
  { id: 'campaign',  label: 'Campaign'  },
  { id: 'rights',    label: 'Rights'    },
  { id: 'budget',    label: 'Budget'    },
  { id: 'settings',  label: 'Settings'  },
];

const INVITE_ROLES = [
  'Mixing Engineer',
  'Mastering Engineer',
  'Graphic Designer',
  'Marketing Manager',
  'Photographer',
  'Videographer',
  'Copywriter',
  'Social Media Manager',
  'Producer',
  'Artist',
] as const;

export default function ReleaseWorkspacePage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const params = useParams();
  const releaseId = params.id as string;

  const [release, setRelease] = useState<Release | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tracks, setTracks] = useState<(ReleaseTrackRecord & { track: TrackRecord | null })[]>([]);
  const [trackArtistMeta, setTrackArtistMeta] = useState<Record<string, { original?: string; remixer?: string }>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [artistsUnavailable, setArtistsUnavailable] = useState(false);
  const [workspaceReloadToken, setWorkspaceReloadToken] = useState(0);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`rf-tab-release-${releaseId}`);
      if (saved && TABS.some((t) => t.id === saved)) return saved as TabId;
    }
    return 'overview';
  });

  const visibleTabs = useMemo(() => TABS.filter((t) => (
    t.id === 'overview' ||
    t.id === 'workflow' ||
    t.id === 'settings' ||
    (t.id === 'campaign' && deliverables.some((d) => d.type === 'video' || d.type === 'other')) ||
    (t.id === 'rights' && Boolean(release?.copyright || release?.pLine || release?.cLine)) ||
    (t.id === 'budget' && false)
  )), [deliverables, release?.cLine, release?.copyright, release?.pLine]);

  /* Load core data — fault-tolerant, always clears loading */
  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setLoadError(false);
      setForbidden(false);
      setRelease(null);
      setDeliverables([]);
      setTracks([]);
      setTasks([]);

      let rel: Awaited<ReturnType<typeof fetchRelease>> | null;
      try {
        rel = await fetchRelease(releaseId);
      } catch (error) {
        console.error('[Workspace] Release load failed', error);
        if (!cancelled) setLoadError(true);
        return;
      }

      if (!rel) {
        if (!cancelled) setRelease(null);
        return;
      }

      if (activeOrgId && rel.organizationId && rel.organizationId !== activeOrgId) {
        if (!cancelled) setForbidden(true);
        return;
      }

      if (!cancelled) setRelease(rel as unknown as Release);

      const [del, trk, tsk, art] = await Promise.all([
        (async () => {
          try {
            return await getDeliverablesByRelease(releaseId);
          } catch (error) {
            console.error('[Workspace] Deliverables load failed', error);
            return [] as Deliverable[];
          }
        })(),
        (async () => {
          try {
            return await getTracksByRelease(releaseId);
          } catch (error) {
            console.error('[Workspace] Track load failed', error);
            return [] as (ReleaseTrackRecord & { track: TrackRecord | null })[];
          }
        })(),
        (async () => {
          try {
            return await getTasksByEntity('release', releaseId);
          } catch (error) {
            console.error('[Workspace] Assignment load failed', error);
            return [] as Task[];
          }
        })(),
        (async () => {
          try {
            if (activeOrgId) return await getArtworkByRelease(activeOrgId, releaseId);
            return null;
          } catch (error) {
            console.error('[Workspace] Artwork load failed', error);
            return null;
          }
        })(),
      ]);

      if (!cancelled) {
        setDeliverables(del);
        setTracks(trk);
        setTasks(tsk);
        setArtwork(art);
      }
    }

    void (async () => {
      setLoading(true);
      try {
        await loadWorkspace();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [releaseId, activeOrgId, workspaceReloadToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadTrackArtistMeta() {
      if (!activeOrgId) {
        setTrackArtistMeta({});
        setArtistsUnavailable(false);
        return;
      }

      const { fetchArtist } = await import('@/lib/artist-service');
      const meta: Record<string, { original?: string; remixer?: string }> = {};
      let anyArtistFailed = false;

      for (const rt of tracks) {
        const t = rt.track;
        if (!t || resolveRecordingType(t.recordingType) !== 'remix') continue;

        let originalNames: string[] = [];
        let remixerNames: string[] = [];

        try {
          const originalRecs = await getArtistsByRole(t.id, 'ORIGINAL_ARTIST');
          const remixRecs = await getArtistsByRole(t.id, 'REMIX_ARTIST');

          if (originalRecs.length > 0) {
            originalNames = (await Promise.all(
              originalRecs.map((r) => fetchArtist(activeOrgId, r.artistId)),
            )).filter(Boolean).map((a) => a!.name);
          } else if (t.originalArtistId) {
            const a = await fetchArtist(activeOrgId, t.originalArtistId);
            if (a) originalNames = [a.name];
          }

          if (remixRecs.length > 0) {
            remixerNames = (await Promise.all(
              remixRecs.map((r) => fetchArtist(activeOrgId, r.artistId)),
            )).filter(Boolean).map((a) => a!.name);
          } else if (t.remixerArtistId) {
            const a = await fetchArtist(activeOrgId, t.remixerArtistId);
            if (a) remixerNames = [a.name];
          }
        } catch (error) {
          anyArtistFailed = true;
          console.error('[Workspace] loadArtists failed', t.id, error);
        }

        meta[t.id] = {
          original: originalNames.join(', '),
          remixer: remixerNames.join(', '),
        };
      }

      if (!cancelled) {
        setTrackArtistMeta(meta);
        setArtistsUnavailable(anyArtistFailed);
      }
    }

    if (tracks.length > 0) void loadTrackArtistMeta();
    else {
      setTrackArtistMeta({});
      setArtistsUnavailable(false);
    }

    return () => { cancelled = true; };
  }, [tracks, activeOrgId]);

  /* Lazy-load activity */
  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      setActivitiesLoaded(false);
      if (!releaseId || !activeOrgId) {
        if (!cancelled) setActivitiesLoaded(true);
        return;
      }
      try {
        const data = await getActivityByEntity(activeOrgId, 'release', releaseId);
        if (!cancelled) setActivities(data);
      } catch (error) {
        console.error('[Workspace] Activity load failed', error);
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setActivitiesLoaded(true);
      }
    }

    void loadActivity();
    return () => { cancelled = true; };
  }, [releaseId, activeOrgId, workspaceReloadToken]);

  const handleTabChange = useCallback((id: string) => {
    setTab(id as TabId);
    localStorage.setItem(`rf-tab-release-${releaseId}`, id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [releaseId]);

  const handleArtworkUpload = useCallback(async (file: File) => {
    if (!user || !activeOrgId) {
      toast.error('Cannot upload artwork', 'You must be signed in to an organisation.');
      setUploadState('idle');
      return;
    }
    setUploadState('uploading');
    try {
      const result = await uploadArtwork(file, releaseId, activeOrgId, user.uid);
      setArtwork(result);
      setUploadState('complete');
      toast.success('Artwork uploaded successfully.');
    } catch (err) {
      setUploadState('idle');
      toast.error('Artwork upload failed', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [user, activeOrgId, releaseId]);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) setTab('overview');
  }, [tab, visibleTabs]);

  async function handleDeleteRelease() {
    if (!user) return;
    setDeleting(true);
    try {
      await removeRelease(releaseId, user.uid, activeOrgId ?? undefined);
      toast.success('Release deleted.');
      router.push('/releases');
    } catch {
      toast.error('Could not delete release.', 'Please try again.');
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function handleArchive() {
    if (!user) return;
    setArchiving(true);
    try {
      await editRelease(releaseId, { status: 'archived' }, user.uid);
      toast.success('Release archived.');
      window.location.reload();
    } catch {
      toast.error('Could not archive release.', 'Please try again.');
      setArchiving(false);
      setArchiveOpen(false);
    }
  }

  async function handleRestore() {
    if (!user) return;
    setRestoring(true);
    try {
      await editRelease(releaseId, { status: 'draft' }, user.uid);
      toast.success('Release restored.');
      window.location.reload();
    } catch {
      toast.error('Could not restore release.', 'Please try again.');
      setRestoring(false);
      setRestoreOpen(false);
    }
  }

  /* ─── Readiness calculation ─────────────────────────────────────────── */
  const readinessMap: Record<ReadinessCat, boolean> = {
    Audio:        deliverables.some((d) => d.type === 'audio'    && d.status === 'approved'),
    Artwork:      Boolean(artwork),
    Metadata:     !!(release?.upc),
    Rights:       false, // resolved by rights service — default safe
    Distribution: false, // resolved by dist service — default safe
    Marketing:    deliverables.some((d) => d.type === 'other'    && d.status === 'approved'),
  };
  const readyCount   = Object.values(readinessMap).filter(Boolean).length;
  const readinessPct = Math.round((readyCount / READINESS_CATS.length) * 100);

  /* ─── Task priority sort ─────────────────────────────────────────────── */
  const pendingTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const bucketDiff = taskDateBucket(a.dueDate) - taskDateBucket(b.dueDate);
      if (bucketDiff !== 0) return bucketDiff;
      return dateValue(a.dueDate) - dateValue(b.dueDate);
    });

  /* ─── Loading skeleton ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="px-5 sm:px-8 py-8 max-w-6xl mx-auto animate-fade-in">
        <Skeleton className="h-4 w-28 mb-8" />
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <Skeleton className="h-[200px] w-full lg:w-64 rounded-xl shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-40" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 px-6 py-20">
        <p className="text-base font-semibold text-content-primary mb-1">Unable to load release.</p>
        <p className="text-sm text-content-label mb-5 text-center max-w-sm">Something went wrong while loading this release. You can retry or return to the releases list.</p>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="primary" onClick={() => setWorkspaceReloadToken((n) => n + 1)}>Retry</Button>
          <Link href="/releases" className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">Back to Releases</Link>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 px-6 py-20">
        <p className="text-base font-semibold text-content-primary mb-1">Access Denied</p>
        <p className="text-sm text-content-label mb-5">You don't have access to this release.</p>
        <Link href="/releases" className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">← Back to Releases</Link>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <EmptyState title="Release not found" description="This release doesn't exist or has been removed." action={{ label: 'Back to Releases', onClick: () => router.push('/releases') }} />
      </div>
    );
  }
  /* ─── Artwork ──────────────────────────────────────────────────────────── */
  const artistName = fieldValue(release, ['artistName', 'artist', 'primaryArtist']) ?? 'No primary artist';
  const meaningfulActivities = activities.filter((ev) => humaniseActivity(ev) !== null);

  return (
    <div className="px-5 sm:px-8 py-8 max-w-6xl mx-auto page-transition">

      {/* ── Back navigation ─────────────────────────────────────────── */}
      <div className="mb-6">
        <Link href="/releases" className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors duration-150">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Releases
        </Link>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mb-10" aria-label="Release overview">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column — Artwork */}
          <div className="w-full lg:w-64 shrink-0">
            <ReleaseArtwork
              artwork={artwork}
              releaseTitle={release.title}
              uploadState={uploadState}
              onUpload={handleArtworkUpload}
              onUploadStateChange={setUploadState}
            />
          </div>

          {/* Right Column — Details */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Title */}
            <h1 className="text-3xl font-bold text-content-primary tracking-tight leading-tight">{release.title}</h1>

            {/* Primary Artist */}
            <p className="text-sm text-content-primary">{artistName}</p>

            {/* Metadata Row */}
            {(() => {
              const metadataStr = formatReleaseMetadata(release);
              if (!metadataStr) return null;
              return <div className="flex items-center gap-1.5 text-sm text-content-primary">{metadataStr}</div>;
            })()}

            {/* Status */}
            <StatusBadge status={displayStatus(release.status)} />

            {/* Release Readiness */}
            <ReadinessCard
              pct={readinessPct}
              categories={READINESS_CATS.map((cat) => ({
                label: cat,
                done: readinessMap[cat],
              }))}
            />

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" variant="primary" onClick={() => router.push(`/releases/${releaseId}/edit`)}>Edit Release</Button>
              <EntityOverflowMenu
                aria-label="More release actions"
                items={[
                  {
                    id: 'duplicate',
                    label: 'Duplicate Release',
                    disabled: true,
                    secondaryLabel: 'Coming Soon',
                  },
                  ...(release.status === 'archived'
                    ? [{
                        id: 'restore',
                        label: 'Restore Release',
                        onClick: () => setRestoreOpen(true),
                      }]
                     : [{
                          id: 'archive',
                          label: 'Archive Release',
                          variant: 'secondary' as const,
                          onClick: () => setArchiveOpen(true),
                       }]
                  ),
                  {
                    id: 'delete',
                    label: 'Delete Release',
                    variant: 'danger' as const,
                    separatorBefore: true,
                    onClick: () => setDeleteOpen(true),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Overview ────────────────────────────────────────────────────── */}
      <section aria-label="Overview" className="mb-10">
        <SectionHeader title="Overview" description="Core release details and identifiers." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Release Information Card */}
          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Release Information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-content-secondary">Release Type</dt><dd className="text-content-primary font-medium">{RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType}</dd></div>
              {release.targetReleaseDate ? <div className="flex justify-between"><dt className="text-content-secondary">Estimated Release Date</dt><dd className="text-content-primary">{fmtDate(release.targetReleaseDate)}</dd></div> : null}
              {release.estimatedReleaseDate ? <div className="flex justify-between"><dt className="text-content-secondary">Digital Release Date</dt><dd className="text-content-primary">{fmtDate(release.estimatedReleaseDate)}</dd></div> : null}
            </dl>
          </div>

          {/* Publishing Card */}
          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Publishing</h3>
            <dl className="space-y-2 text-sm">
              {release.upc ? <div className="flex justify-between"><dt className="text-content-secondary">UPC</dt><dd className="text-content-primary font-medium">{release.upc}</dd></div> : null}
              {release.catalogNumber ? <div className="flex justify-between"><dt className="text-content-secondary">Catalogue Number</dt><dd className="text-content-primary">{release.catalogNumber}</dd></div> : null}
              {release.explicit ? <div className="flex justify-between"><dt className="text-content-secondary">Explicit</dt><dd className="text-content-primary">Yes</dd></div> : null}
              {release.releaseLink ? (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-content-secondary">Release Link</dt>
                  <dd>
                    <a
                      href={release.releaseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-medium"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5h5v5m0-5L10 14M9 5H5v14h14v-4" />
                      </svg>
                      Open Release
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* Label Card */}
          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5">
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">Label</h3>
            <p className="text-sm font-medium text-content-primary">{release.label || 'No label assigned'}</p>
          </div>

        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────────────────── */}
      <section aria-label="Team" className="mb-10">
        <SectionHeader title="Team" description="People contributing to this release." />

        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-6">
          <div className="flex flex-col items-center text-center py-6">
            <p className="text-sm font-medium text-content-primary mb-1">No collaborators yet.</p>
            <p className="text-sm text-content-label mb-4">Invite producers, engineers and designers to collaborate.</p>
            <Button size="sm" variant="primary" onClick={() => setInviteOpen(true)}>Invite Person</Button>
          </div>
        </div>
      </section>

      {/* ── Tracks ─────────────────────────────────────────────────────── */}
      <section aria-label="Tracks" className="mb-10">
        <SectionHeader
          title="Tracks"
          description={`${tracks.length} track${tracks.length !== 1 ? 's' : ''} on this release.${artistsUnavailable ? ' Artists unavailable.' : ''}`}
          action={{ label: '+ Add Track', onClick: () => router.push(`/tracks/new?releaseId=${releaseId}`) }}
        />
        {tracks.length === 0 ? (
          <EmptyState
            title="No tracks added."
            description="Add the first track to begin production."
            action={{ label: 'Add Track', onClick: () => router.push(`/tracks/new?releaseId=${releaseId}`) }}
          />
        ) : (
          <TrackList>
            {tracks.map((rt) => {
              const t = rt.track;
              return (
                <TrackRow
                  key={rt.id}
                  onClick={() => t && router.push(`/tracks/${t.id}`)}
                  aria-label={t?.title ? `Open track ${t.title}` : 'Open track'}
                >
                  <span className="text-sm text-content-secondary font-mono w-6 shrink-0 text-right">{rt.position}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-content-primary truncate block">{t?.title ?? '—'}</span>
                    <span className="text-xs text-content-secondary mt-0.5 block">
                      {t ? (
                        <>
                          {recordingTypeLabel(resolveRecordingType(t.recordingType), true)}
                          {resolveRecordingType(t.recordingType) === 'remix' && trackArtistMeta[t.id]?.original && (
                            <> · {trackArtistMeta[t.id]?.original}{trackArtistMeta[t.id]?.remixer ? ` × ${trackArtistMeta[t.id]?.remixer}` : ''}</>
                          )}
                        </>
                      ) : 'Track not found'}
                    </span>
                  </div>
                  <span className="text-xs text-content-secondary hidden sm:block">{fmtDuration(t?.duration)}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`h-2 w-2 rounded-full ${
                      (t as unknown as { mixStatus?: string })?.mixStatus === 'completed' ? 'bg-success-500' : 'bg-surface-300'
                    }`} title="Mix" />
                    <span className={`h-2 w-2 rounded-full ${
                      (t as unknown as { masterStatus?: string })?.masterStatus === 'completed' ? 'bg-success-500' : 'bg-surface-300'
                    }`} title="Master" />
                    <span className={`h-2 w-2 rounded-full ${
                      (t as unknown as { publishingStatus?: string })?.publishingStatus === 'completed' ? 'bg-success-500' : 'bg-surface-300'
                    }`} title="Publishing" />
                  </div>
                  <svg className="h-4 w-4 text-content-label group-hover:text-content-secondary transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </TrackRow>
              );
            })}
          </TrackList>
        )}
      </section>

      {/* ── Assignments ───────────────────────────────────────────────── */}
      <section aria-label="Assignments" className="mb-10">
        <SectionHeader
          title="Assignments"
          description="Tasks and responsibilities for this release."
          action={
            pendingTasks.length > 6
              ? { label: 'View All Tasks', onClick: () => handleTabChange('workflow') }
              : undefined
          }
        />
        {pendingTasks.length === 0 ? (
          <EmptyState
            title="No assignments yet."
            description="Assignments help coordinate work across your release."
            action={{ label: 'Create Assignment', onClick: () => handleTabChange('workflow') }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingTasks.slice(0, 6).map((task) => {
              const overdue = isOverdue(task.dueDate);
              const priorityColors: Record<string, string> = { critical: 'bg-danger-50 text-danger-600', high: 'bg-warning-50 text-warning-600', medium: 'bg-info-50 text-info-600', low: 'bg-surface-100 text-content-secondary' };
              return (
                <div key={task.id} className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 flex flex-col gap-2.5 text-left">
                  <p className="text-sm font-medium text-content-primary leading-snug">{task.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={task.status} />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium capitalize ${priorityColors[task.priority] ?? 'bg-surface-100 text-content-secondary'}`}>{task.priority}</span>
                  </div>
                  <p className="text-xs text-content-label truncate">
                    {isInvitationPending(task)
                      ? 'Invitation Pending'
                      : task.assigneeId
                        ? <>Assigned to <span className="text-content-secondary">{task.assigneeId}</span></>
                        : 'Unassigned'}
                  </p>
                  <p className={`text-xs font-medium ${overdue ? 'text-danger-500' : 'text-content-label'}`}>{task.dueDate ? relativeDate(task.dueDate) : 'No due date'}</p>
                  <Button size="sm" variant={task.assigneeId ? 'outline' : 'primary'} className="mt-1 self-start" onClick={() => handleTabChange('workflow')}>
                    {taskActionLabel(task)}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Recent Activity ───────────────────────────────────────────── */}
      <section aria-label="Recent Activity" className="mb-10">
        <SectionHeader title="Recent Activity" description="A log of actions and updates on this release." />

        {!activitiesLoaded ? (
          <div className="flex justify-center py-10"><LoadingState text="Loading activity…" /></div>
        ) : meaningfulActivities.length === 0 ? (
          <EmptyState
            title="No activity yet."
            description="Activity will appear as your team works on this release."
          />
        ) : (
          <div className="space-y-0 rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden">
            {meaningfulActivities.slice(0, 12).map((ev, i) => {
              const label = humaniseActivity(ev);
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
        )}
      </section>

      {/* ── Workspace Tabs ─────────────────────────────────────────────── */}
      <Tabs
        tabs={visibleTabs}
        activeTab={tab}
        onChange={handleTabChange}
        variant="underline"
        className="mt-10 mb-8"
      />

      {/* ── Non-overview placeholder tabs ─────────────────────────────── */}
      {tab === 'workflow' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-8 text-center">
          <p className="text-sm font-medium text-content-primary mb-1">Workflow</p>
          <p className="text-sm text-content-label">Full workflow management coming soon. Use the Assignments section on Overview to action work.</p>
        </div>
      )}

      {tab === 'campaign' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-8 text-center">
          <EmptyState title="No campaigns yet" description="Campaigns will appear here once they are created for this release." />
        </div>
      )}

      {tab === 'rights' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-8 text-center">
          <EmptyState title="No rights records" description="Rights and ownership information will appear here once configured." />
        </div>
      )}

      {tab === 'budget' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-8 text-center">
          <EmptyState title="No budget entries" description="Budget and cost information will appear here once entries are added." />
        </div>
      )}

      {tab === 'assignments' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-6">
          <AssignmentsSection entityType="release" entityId={releaseId} />
        </div>
      )}

      {tab === 'settings' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-6 max-w-lg">
          <h2 className="text-base font-semibold text-content-primary mb-4">Release Settings</h2>
        </div>
      )}

      <PersonPickerDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        organizationId={activeOrgId}
        currentUserId={user?.uid ?? 'unknown'}
        contextLabel={`Invite ${INVITE_ROLES[0]}`}
        contextRole={INVITE_ROLES[0]}
        roles={INVITE_ROLES}
      />

      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => { if (!deleting) setDeleteOpen(false); }}
        onConfirm={handleDeleteRelease}
        title="Delete Release"
        message={`Are you sure you want to delete "${release.title}"? This action cannot be undone.`}
        confirmLabel="Delete Release"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
      />

      <ConfirmationDialog
        open={archiveOpen}
        onClose={() => { if (!archiving) setArchiveOpen(false); }}
        onConfirm={handleArchive}
        title="Archive Release"
        message={`Are you sure you want to archive "${release.title}"? Archived releases can be restored later.`}
        confirmLabel="Archive Release"
        cancelLabel="Cancel"
        loading={archiving}
      />

      <ConfirmationDialog
        open={restoreOpen}
        onClose={() => { if (!restoring) setRestoreOpen(false); }}
        onConfirm={handleRestore}
        title="Restore Release"
        message={`Are you sure you want to restore "${release.title}"? It will be set back to draft status.`}
        confirmLabel="Restore Release"
        cancelLabel="Cancel"
        loading={restoring}
      />

    </div>
  );
}
