'use client';

/**
 * RW-001 — Release Workspace Consolidation
 * Single vertically scrolling execution page (no Overview/Workflow/Settings tabs).
 */

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { usePermissions } from '@/hooks/usePermissions';
import { PersonPickerDialog } from '@/components/person-picker-dialog';
import { fetchRelease, removeRelease, editRelease } from '@/lib/release-service';
import { uploadArtwork, getArtworkByRelease } from '@/lib/artwork/artwork-service';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { toast } from '@/stores/toast-store';
import { RichTextEditor } from '@/components/rich-text/RichTextEditor';
import { RichTextRenderer } from '@/components/rich-text/RichTextRenderer';
import type { RichTextDocument } from '@/lib/rich-text';
import {
  emptyRichTextDocument,
  isRichTextEmpty,
  normalizeRichText,
} from '@/lib/rich-text';
import {
  canExportLinerNotesPdf,
  downloadLinerNotesPdf,
} from '@/lib/release-liner-notes-pdf';
import { getDeliverablesByRelease } from '@/lib/deliverable-service';
import { getTracksByRelease } from '@/lib/release-track-repository';
import { getArtistsByRole } from '@/lib/track-artist-repository';
import { getActivityByEntity } from '@/lib/activity-service';
import { fmtDate } from '@/lib/utils';
import { formatReleaseMetadata } from '@/lib/release-metadata';
import { RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import {
  Button,
  StatusBadge,
  Skeleton,
  EmptyState,
  LoadingState,
  ConfirmationDialog,
  Input,
} from '@releaseflow/ui';
import { ReleaseArtwork, type UploadState } from '@/components/release/ReleaseArtwork';
import { ReadinessCard } from '@/components/release/workspace/ReadinessCard';
import { SectionHeader } from '@/components/release/workspace/SectionHeader';
import type { Release, Deliverable } from '../../types';
import type { ReleaseTrackRecord } from '@/lib/release-track-repository';
import type { TrackRecord } from '@/lib/track-repository';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { resolveRecordingType, recordingTypeLabel } from '@/lib/recording-type';
import type { Artwork } from '@/lib/artwork/artwork-types';
import { AssignmentsSection } from '@/components/assignments-section';
import { TasksSection } from '@/components/tasks/tasks-section';
import { TrackRow, TrackList } from '@/components/shared/track-row';

/* ─── helpers ────────────────────────────────────────────────────────────── */

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

function tsToDateString(ts: unknown): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts.slice(0, 10);
  const obj = ts as { toDate?: () => Date; seconds?: number };
  if (obj.toDate) return obj.toDate().toISOString().split('T')[0] ?? '';
  if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000).toISOString().split('T')[0] ?? '';
  return '';
}

/* ─── activity event label ───────────────────────────────────────────────── */

const TECHNICAL_ACTIONS = new Set([
  'firestore.write', 'hook.refresh', 'system.sync', 'system.recalculate',
  'workflow.generated',
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
    'assignment.created': `created assignment "${ev.metadata?.title ?? ''}"`,
    assigned: `created assignment "${ev.metadata?.title ?? ''}"`,
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

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function ReleaseWorkspacePage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const params = useParams();
  const releaseId = params.id as string;
  const perms = usePermissions();

  const [release, setRelease] = useState<Release | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tracks, setTracks] = useState<(ReleaseTrackRecord & { track: TrackRecord | null })[]>([]);
  const [trackArtistMeta, setTrackArtistMeta] = useState<Record<string, {
    original?: string;
    remixer?: string;
    featured?: string;
    displayTitle?: string;
  }>>({});
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateValueInput, setDateValueInput] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [artistsUnavailable, setArtistsUnavailable] = useState(false);
  const [workspaceReloadToken, setWorkspaceReloadToken] = useState(0);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  // BUILD-013 — Liner Notes
  const [linerNotes, setLinerNotes] = useState<RichTextDocument | null>(null);
  const [linerNotesEditing, setLinerNotesEditing] = useState(false);
  const [linerNotesDraft, setLinerNotesDraft] = useState<RichTextDocument | null>(null);
  const [linerNotesSaving, setLinerNotesSaving] = useState(false);

  /* Load core data — fault-tolerant, always clears loading */
  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setLoadError(false);
      setForbidden(false);
      setRelease(null);
      setDeliverables([]);
      setTracks([]);

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

      if (!cancelled) {
        setRelease(rel as unknown as Release);
        setLinerNotes(normalizeRichText((rel as { linerNotes?: unknown }).linerNotes) ?? null);
        setLinerNotesEditing(false);
      }

      const [del, trk, art] = await Promise.all([
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
      const { resolveTrackDisplayTitle } = await import('@/lib/display-title');
      const meta: Record<string, {
        original?: string;
        remixer?: string;
        featured?: string;
        displayTitle?: string;
      }> = {};
      let anyArtistFailed = false;

      for (const rt of tracks) {
        const t = rt.track;
        if (!t) continue;

        let originalNames: string[] = [];
        let remixerNames: string[] = [];
        let featuredNames: string[] = [];

        try {
          const [originalRecs, primaryRecs, remixRecs, featuredRecs] = await Promise.all([
            getArtistsByRole(t.id, 'ORIGINAL_ARTIST'),
            getArtistsByRole(t.id, 'PRIMARY_ARTIST'),
            getArtistsByRole(t.id, 'REMIX_ARTIST'),
            getArtistsByRole(t.id, 'FEATURED_ARTIST'),
          ]);

          const originalIds =
            originalRecs.length > 0
              ? originalRecs.map((r) => r.artistId)
              : primaryRecs.length > 0
                ? primaryRecs.map((r) => r.artistId)
                : ([t.primaryArtistId, t.originalArtistId, ...(t.originalArtistIds ?? [])].filter(Boolean) as string[]);

          const remixIds =
            remixRecs.length > 0
              ? remixRecs.map((r) => r.artistId)
              : ([t.remixerArtistId, ...(t.remixArtistIds ?? [])].filter(Boolean) as string[]);

          const featuredIds =
            featuredRecs.length > 0
              ? featuredRecs.map((r) => r.artistId)
              : (t.featuredArtistIds ?? []);

          originalNames = (await Promise.all(
            originalIds.map((id) => fetchArtist(activeOrgId, id)),
          )).filter(Boolean).map((a) => a!.name);

          remixerNames = (await Promise.all(
            remixIds.map((id) => fetchArtist(activeOrgId, id)),
          )).filter(Boolean).map((a) => a!.name);

          featuredNames = (await Promise.all(
            featuredIds.map((id) => fetchArtist(activeOrgId, id)),
          )).filter(Boolean).map((a) => a!.name);
        } catch (error) {
          anyArtistFailed = true;
          console.error('[Workspace] loadArtists failed', t.id, error);
        }

        const isRemix = resolveRecordingType(t.recordingType) === 'remix';
        meta[t.id] = {
          original: originalNames.join(', ') || undefined,
          remixer: remixerNames.join(', ') || undefined,
          featured: featuredNames.join(', ') || undefined,
          displayTitle: resolveTrackDisplayTitle({
            title: t.title,
            displayTitle: t.displayTitle,
            displayTitleEdited: t.displayTitleEdited,
            originalArtistNames: originalNames,
            featuredArtistNames: featuredNames,
            remixArtistNames: remixerNames,
            isRemix,
            includeOriginalPrefix: false,
          }),
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

  const handleSaveLinerNotes = useCallback(async () => {
    if (!user || !releaseId || !linerNotesDraft) return;
    setLinerNotesSaving(true);
    try {
      const next = isRichTextEmpty(linerNotesDraft) ? null : linerNotesDraft;
      await editRelease(releaseId, { linerNotes: next }, user.uid);
      setLinerNotes(next);
      setLinerNotesEditing(false);
      toast.success('Liner notes saved.');
    } catch (err) {
      toast.error(
        'Could not save liner notes',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setLinerNotesSaving(false);
    }
  }, [user, releaseId, linerNotesDraft]);

  const handleDownloadLinerNotesPdf = useCallback(async () => {
    if (!canExportLinerNotesPdf(linerNotes)) {
      toast.error('Add liner notes before exporting a PDF.');
      return;
    }
    try {
      const typeLabel =
        RELEASE_TYPE_LABELS[(release?.releaseType as keyof typeof RELEASE_TYPE_LABELS) ?? 'single'] ??
        release?.releaseType ??
        '';
      let releaseDate: string | null = null;
      const trd = release?.targetReleaseDate;
      if (trd) {
        if (typeof trd === 'object' && trd !== null && 'seconds' in trd) {
          releaseDate = new Date((trd as { seconds: number }).seconds * 1000).toLocaleDateString(
            'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' },
          );
        } else if (typeof trd === 'string') {
          releaseDate = new Date(trd).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      }
      await downloadLinerNotesPdf({
        releaseTitle: release?.title ?? 'Release',
        primaryArtist: (release as { primaryArtist?: string } | null)?.primaryArtist ?? '',
        releaseType: typeLabel,
        releaseDate,
        copyrightYear: (release as { copyrightYear?: string } | null)?.copyrightYear ?? null,
        artworkUrl: artwork?.secureUrl ?? null,
        linerNotes,
      });
    } catch (err) {
      toast.error(
        'PDF export failed',
        err instanceof Error ? err.message : 'Please try again.',
      );
    }
  }, [linerNotes, release, artwork]);

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

  const openCreateAssignment = useCallback(() => {
    if (!perms.canManageAssignments) {
      toast.error('You do not have permission to create assignments.');
      return;
    }
    router.push(`/assignments/new?releaseId=${encodeURIComponent(releaseId)}&lockRelease=1&from=release`);
  }, [perms.canManageAssignments, releaseId, router]);

  const openCreateTask = useCallback(() => {
    if (!perms.canManageAssignments) {
      toast.error('You do not have permission to create tasks.');
      return;
    }
    router.push(`/tasks/new?releaseId=${encodeURIComponent(releaseId)}&lockRelease=1&from=release`);
  }, [perms.canManageAssignments, releaseId, router]);

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
      await editRelease(releaseId, { lifecycle: 'draft' }, user.uid);
      toast.success('Release restored.');
      window.location.reload();
    } catch {
      toast.error('Could not restore release.', 'Please try again.');
      setRestoring(false);
      setRestoreOpen(false);
    }
  }

  async function handleSaveReleaseDate() {
    if (!user || !dateValueInput) {
      toast.error('Choose a release date.');
      return;
    }
    setSavingDate(true);
    try {
      await editRelease(
        releaseId,
        { targetReleaseDate: new Date(dateValueInput) },
        user.uid,
      );
      toast.success('Release date updated.');
      setDateOpen(false);
      setWorkspaceReloadToken((n) => n + 1);
    } catch {
      toast.error('Could not update release date.', 'Please try again.');
    } finally {
      setSavingDate(false);
    }
  }

  /* ─── Readiness calculation ─────────────────────────────────────────── */
  const readinessMap: Record<ReadinessCat, boolean> = {
    Audio:        deliverables.some((d) => d.type === 'audio'    && d.status === 'approved'),
    Artwork:      Boolean(artwork),
    Metadata:     !!(release?.upc),
    Rights:       false,
    Distribution: false,
    Marketing:    deliverables.some((d) => d.type === 'other'    && d.status === 'approved'),
  };
  const readyCount   = Object.values(readinessMap).filter(Boolean).length;
  const readinessPct = Math.round((readyCount / READINESS_CATS.length) * 100);

  const overflowItems = useMemo(() => {
    if (!release) return [];
    const items: {
      id: string;
      label: string;
      onClick?: () => void;
      disabled?: boolean;
      secondaryLabel?: string;
      variant?: 'secondary' | 'danger';
      separatorBefore?: boolean;
    }[] = [];

    if (perms.canEditRelease) {
      items.push({
        id: 'edit',
        label: 'Edit release details',
        onClick: () => router.push(`/releases/${releaseId}/edit`),
      });
      items.push({
        id: 'change-date',
        label: 'Change release date',
        onClick: () => {
          setDateValueInput(tsToDateString(release.targetReleaseDate ?? release.estimatedReleaseDate));
          setDateOpen(true);
        },
      });
    }

    if (perms.canEditRelease) {
      if (release.status === 'archived') {
        items.push({
          id: 'restore',
          label: 'Restore release',
          onClick: () => setRestoreOpen(true),
        });
      } else {
        items.push({
          id: 'archive',
          label: 'Archive release',
          variant: 'secondary',
          onClick: () => setArchiveOpen(true),
        });
      }
    }

    if (perms.canDeleteRelease) {
      items.push({
        id: 'delete',
        label: 'Delete release',
        variant: 'danger',
        separatorBefore: true,
        onClick: () => setDeleteOpen(true),
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'no-actions',
        label: 'No administrative actions',
        disabled: true,
        secondaryLabel: 'Insufficient permissions',
      });
    }

    return items;
  }, [release, perms.canEditRelease, perms.canDeleteRelease, releaseId, router]);

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
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>
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
        <p className="text-sm text-content-label mb-5">You don&apos;t have access to this release.</p>
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

   if (release.lifecycle === 'draft') {
     router.replace(`/releases/new?draftId=${releaseId}`);
     return (
       <div className="flex items-center justify-center min-h-96">
         <LoadingState text="Opening draft in wizard..." />
       </div>
     );
   }

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

      {/* ── 1. Release header ─────────────────────────────────────────── */}
      <section className="mb-10" aria-label="Release header">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-64 shrink-0">
            <ReleaseArtwork
              artwork={artwork}
              releaseTitle={release.title}
              uploadState={uploadState}
              onUpload={handleArtworkUpload}
              onUploadStateChange={setUploadState}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold text-content-primary tracking-tight leading-tight">
                {release.title}
              </h1>
              <EntityOverflowMenu
                aria-label="Release administrative actions"
                items={overflowItems}
              />
            </div>

            <p className="text-sm text-content-primary">{artistName}</p>

            {(() => {
              const metadataStr = formatReleaseMetadata(release);
              if (!metadataStr) return null;
              return <div className="flex items-center gap-1.5 text-sm text-content-primary">{metadataStr}</div>;
            })()}

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={displayStatus(release.status)} />
              <span className="text-xs text-content-secondary">
                {RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType}
              </span>
              {release.targetReleaseDate ? (
                <span className="text-xs text-content-secondary">
                  · Target {fmtDate(release.targetReleaseDate)}
                </span>
              ) : null}
            </div>

            {/* Compact identity cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4">
                <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">Release</h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-content-secondary">Type</dt>
                    <dd className="text-content-primary font-medium text-right">
                      {RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType}
                    </dd>
                  </div>
                  {release.label ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-content-secondary">Label</dt>
                      <dd className="text-content-primary text-right">{release.label}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4">
                <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">Publishing</h3>
                <dl className="space-y-1.5 text-sm">
                  {release.upc ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-content-secondary">UPC</dt>
                      <dd className="text-content-primary font-medium">{release.upc}</dd>
                    </div>
                  ) : (
                    <p className="text-content-label text-xs">No UPC yet</p>
                  )}
                  {release.catalogNumber ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-content-secondary">Cat. No.</dt>
                      <dd className="text-content-primary">{release.catalogNumber}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4">
                <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">Team</h3>
                <p className="text-sm text-content-label mb-2">Invite collaborators to this release.</p>
                <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                  Invite Person
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Liner Notes (BUILD-013) ─────────────────────────────────── */}
      <section aria-label="Liner Notes" className="mb-10">
        <SectionHeader
          title="Liner Notes"
          description="Editorial notes, acknowledgements, and the story behind this release."
        />
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4 sm:p-6 space-y-4">
          {linerNotesEditing ? (
            <>
              <RichTextEditor
                value={linerNotesDraft ?? emptyRichTextDocument()}
                onChange={setLinerNotesDraft}
                placeholder="Write liner notes…"
                minHeightClass="min-h-[220px]"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleSaveLinerNotes()}
                  disabled={linerNotesSaving}
                >
                  {linerNotesSaving ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLinerNotesEditing(false);
                    setLinerNotesDraft(null);
                  }}
                  disabled={linerNotesSaving}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <RichTextRenderer value={linerNotes} emptyLabel="No liner notes yet." />
              <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLinerNotesDraft(linerNotes ?? emptyRichTextDocument());
                    setLinerNotesEditing(true);
                  }}
                >
                  Edit
                </Button>
                {canExportLinerNotesPdf(linerNotes) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDownloadLinerNotesPdf()}
                  >
                    Export PDF
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    title="Add liner notes before exporting a PDF"
                  >
                    Export PDF
                  </Button>
                )}
              </div>
              {!canExportLinerNotesPdf(linerNotes) ? (
                <p className="text-xs text-content-label">
                  Add liner notes before exporting a PDF.
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* ── 3. Release readiness ──────────────────────────────────────── */}
      <section aria-label="Release readiness" className="mb-10">
        <SectionHeader
          title="Release readiness"
          description="Track completion across audio, artwork, metadata, and distribution."
          action={{
            label: 'Open readiness workspace',
            onClick: () => router.push(`/releases/${releaseId}/readiness`),
          }}
        />
        <ReadinessCard
          pct={readinessPct}
          categories={READINESS_CATS.map((cat) => ({
            label: cat,
            done: readinessMap[cat],
          }))}
        />
      </section>

      {/* ── 3. Assignments (AW-001) ───────────────────────────────────── */}
      <section aria-label="Assignments" className="mb-10">
        <SectionHeader
          title="Assignments"
          description="Work assigned to collaborators on this release."
          action={
            perms.canManageAssignments
              ? { label: 'Create Assignment', onClick: openCreateAssignment }
              : undefined
          }
        />
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4 sm:p-6">
          <AssignmentsSection
            entityType="release"
            entityId={releaseId}
          />
          {perms.canManageAssignments ? (
            <div className="mt-4 pt-4 border-t border-surface-100">
              <Button size="sm" variant="primary" onClick={openCreateAssignment}>
                + Create Assignment
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 3b. Tasks (BUILD-014) ──────────────────────────────────────── */}
      <section aria-label="Tasks" className="mb-10">
        <SectionHeader
          title="Tasks"
          description="Units of work linked to this release. Ownership lives on Assignment."
          action={
            perms.canManageAssignments
              ? { label: 'New Task', onClick: openCreateTask }
              : undefined
          }
        />
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4 sm:p-6">
          <TasksSection releaseId={releaseId} />
          {perms.canManageAssignments ? (
            <div className="mt-4 pt-4 border-t border-surface-100">
              <Button size="sm" variant="primary" onClick={openCreateTask}>
                + New Task
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 4. Workflow (orchestration only) ARS-004.1 ─ */}
      <section aria-label="Workflow" className="mb-10">
        <SectionHeader
          title="Workflow"
          description="Stage orchestration and release progression. Work execution lives in Assignments."
        />
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 space-y-4">
          <p className="text-sm text-content-secondary">
            Workflow stages track progression. Contributor work is managed exclusively as{' '}
            <strong className="text-content-primary">Assignments</strong> above.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {READINESS_CATS.map((cat) => {
              const done = readinessMap[cat];
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-lg border border-surface-100 px-3 py-2.5"
                >
                  <span className="text-sm text-content-primary">{cat}</span>
                  <span
                    className={`text-xs font-medium ${
                      done ? 'text-success-500' : 'text-content-label'
                    }`}
                  >
                    {done ? 'Complete' : 'In progress'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/releases/${releaseId}/readiness`)}
            >
              Open readiness workspace
            </Button>
            {perms.canManageAssignments ? (
              <Button size="sm" variant="primary" onClick={openCreateAssignment}>
                Create assignment
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── 5. Activity ───────────────────────────────────────────────── */}
      <section aria-label="Recent Activity" className="mb-10">
        <SectionHeader title="Activity" description="A log of actions and updates on this release." />

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

      {/* ── 6. Future deliverables (tracks + deliverables) ─────────────── */}
      <section aria-label="Deliverables" className="mb-10">
        <SectionHeader
          title="Deliverables"
          description="Tracks and assets for this release."
          action={{ label: '+ Add Track', onClick: () => router.push(`/tracks/new?releaseId=${releaseId}`) }}
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-content-primary mb-3">
              Tracks
              <span className="ml-2 text-xs font-normal text-content-label">
                {tracks.length} track{tracks.length !== 1 ? 's' : ''}
                {artistsUnavailable ? ' · Artists unavailable' : ''}
              </span>
            </h3>
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
                        <span className="text-sm font-medium text-content-primary truncate block">
                          {(t && trackArtistMeta[t.id]?.displayTitle) || t?.title || '—'}
                        </span>
                        <span className="text-xs text-content-secondary mt-0.5 block">
                          {t ? (
                            <>
                              {recordingTypeLabel(resolveRecordingType(t.recordingType), true)}
                              {trackArtistMeta[t.id]?.featured ? (
                                <> · feat. {trackArtistMeta[t.id]?.featured}</>
                              ) : null}
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
          </div>

          <div>
            <h3 className="text-sm font-semibold text-content-primary mb-3">
              Assets
              <span className="ml-2 text-xs font-normal text-content-label">
                {deliverables.length} item{deliverables.length !== 1 ? 's' : ''}
              </span>
            </h3>
            {deliverables.length === 0 ? (
              <EmptyState
                title="No deliverable assets yet."
                description="Audio masters, artwork files, and marketing assets will appear here."
              />
            ) : (
              <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card divide-y divide-surface-100">
                {deliverables.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-content-primary truncate">{d.title}</p>
                      <p className="text-xs text-content-label capitalize">{d.type}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

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

      {/* Change release date (admin action from overflow) */}
      {dateOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <button
            className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
            onClick={() => { if (!savingDate) setDateOpen(false); }}
            aria-label="Close"
          />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-xl border border-surface-700 bg-surface-900 p-5 sm:p-6 shadow-modal space-y-4">
            <h2 className="text-base font-semibold text-content-primary">Change release date</h2>
            <Input
              label="Target release date"
              type="date"
              value={dateValueInput}
              onChange={(e) => setDateValueInput(e.target.value)}
              className="min-h-[48px] sm:min-h-0"
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setDateOpen(false)}
                disabled={savingDate}
                className="min-h-[48px] sm:min-h-0"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveReleaseDate()}
                loading={savingDate}
                className="min-h-[48px] sm:min-h-0"
              >
                Save date
              </Button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
