'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { TrackRecord } from '@/lib/track-repository';
import type { Task } from '@/app/(app)/types';
import type { TrackAsset } from '@/lib/asset-lifecycle-service';
import type { CreditRecord } from '@/lib/credit-repository';
import type { ActivityEventRecord } from '@/lib/activity-service';
import type { AssignmentRecord } from '@/lib/assignment-repository';
import type { ProductionDeliverableRecord } from '@/lib/deliverable-management-repository';
import type { TrackRightRecord } from '@/lib/rights-repository';
import { editTrack, removeTrack, archiveTrackById, duplicateTrack } from '@/lib/track-service';
import { toast } from '@/stores/toast-store';
import { fetchRelease } from '@/lib/release-service';
import { getReleasesByTrack } from '@/lib/release-track-repository';
import { getAssignmentsByEntity, deleteAssignment } from '@/lib/assignment-repository';
import { getPeopleByTrack, removePersonFromTrack } from '@/lib/track-person-repository';
import { getTasksByEntity } from '@/lib/task-service';
import {
  getAssetsByTrack,
  createRequestedAsset,
  assignAsset,
  deliverAsset,
} from '@/lib/asset-lifecycle-service';
import { getDeliverablesByTrack } from '@/lib/deliverable-management-repository';
import { getCreditsByTrack, createCredit, deleteCredit } from '@/lib/credit-repository';
import { getRightsByTrack } from '@/lib/rights-repository';
import { getActivityByEntity } from '@/lib/activity-service';

import { fetchArtist } from '@/lib/artist-service';
import { getPerson } from '@/lib/people-repository';
import { resolveRecordingType, recordingTypeLabel } from '@/lib/recording-type';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { PersonAssigner } from '@/components/person-assigner';
import { Button, Badge, StatusBadge, EmptyState, LoadingState, Tabs, ConfirmationDialog } from '@releaseflow/ui';

const TAB_IDS = ['overview', 'production', 'deliverables', 'credits', 'rights', 'activity', 'settings'] as const;
type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  production: 'Production',
  deliverables: 'Deliverables',
  credits: 'Credits',
  rights: 'Rights',
  activity: 'Activity',
  settings: 'Settings',
};

const READINESS_CATS = ['Audio', 'Artwork', 'Metadata', 'Rights', 'Credits', 'Deliverables'] as const;

const EXPECTED_DELIVERABLES = [
  { id: 'master-wav', label: 'Master WAV', pattern: /master/i },
  { id: 'session-files', label: 'Session Files', pattern: /session/i },
  { id: 'lyrics', label: 'Lyrics', pattern: /lyric/i },
  { id: 'instrumental', label: 'Instrumental', pattern: /instrumental/i },
  { id: 'clean-version', label: 'Clean Version', pattern: /clean/i },
  { id: 'reference-mix', label: 'Reference Mix', pattern: /reference/i },
] as const;

const ROLE_GROUPS = [
  { key: 'producer', label: 'Producer', roles: ['Producer', 'producer'] },
  { key: 'mix', label: 'Mix Engineer', roles: ['Mix Engineer', 'Mixing Engineer'] },
  { key: 'master', label: 'Mastering Engineer', roles: ['Mastering Engineer'] },
  { key: 'artwork', label: 'Artwork', roles: ['Artwork', 'Graphic Designer', 'Designer'] },
] as const;

const CREDIT_TYPES = ['Producer', 'Composer', 'Lyricist', 'Songwriter', 'Publisher', 'Performer'] as const;

const TECHNICAL_ACTIONS = new Set(['entity.viewed', 'page.loaded', 'session.started']);

const ARTWORK_COLORS = ['bg-primary-600', 'bg-purple-600', 'bg-teal-600', 'bg-pink-600', 'bg-amber-600'];

function isAssetReceived(asset?: TrackAsset | null) {
  if (!asset) return false;
  return asset.lifecycleState === 'delivered' || asset.lifecycleState === 'approved' || asset.lifecycleState === 'attached';
}

function isProdReceived(d?: ProductionDeliverableRecord | null) {
  if (!d) return false;
  return d.status === 'approved' || d.status === 'submitted';
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
  if (hrs < 24) return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function relativeDue(ts: unknown): string {
  if (!ts) return 'No due date';
  let d: Date;
  if (ts instanceof Date) d = ts;
  else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) d = new Date((ts as { seconds: number }).seconds * 1000);
  else if (typeof ts === 'string') d = new Date(ts);
  else return 'No due date';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  if (diff === -1) return 'Yesterday';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function humaniseTrackActivity(ev: ActivityEventRecord): string | null {
  if (TECHNICAL_ACTIONS.has(ev.action)) return null;
  const labels: Record<string, string> = {
    'asset.uploaded': 'uploaded a file',
    'asset.delivered': 'delivered a file',
    'asset.approved': 'approved a deliverable',
    'task.created': 'created a task',
    'task.completed': 'completed a task',
    'task.assigned': 'assigned a task',
    'credit.added': 'added a credit',
    'person.invited': 'invited a collaborator',
    'engineer.invited': 'invited an engineer',
    'mix.approved': 'approved the mix',
    'master.uploaded': 'uploaded the master',
    'master.approved': 'approved the master',
    'deliverable.submitted': 'submitted a deliverable',
    'deliverable.approved': 'approved a deliverable',
  };
  if (labels[ev.action]) return labels[ev.action]!;
  if (ev.action.includes('upload')) return ev.details ?? 'uploaded a file';
  if (ev.action.includes('approv')) return ev.details ?? 'approved work';
  if (ev.action.includes('invit')) return 'invited a collaborator';
  if (ev.details) return ev.details;
  return null;
}

function inferProductionStage(assets: TrackAsset[]): string {
  const master = assets.find((a) => /master/i.test(a.name) && isAssetReceived(a));
  if (master) return 'Mastered';
  const mix = assets.find((a) => /mix/i.test(a.name) && isAssetReceived(a));
  if (mix) return 'Mixed';
  const any = assets.find((a) => isAssetReceived(a));
  if (any) return 'Editing';
  return 'Planning';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assets, setAssets] = useState<TrackAsset[]>([]);
  const [prodDeliverables, setProdDeliverables] = useState<ProductionDeliverableRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [trackPeople, setTrackPeople] = useState<{ id: string; personId: string; primaryRole: string; name: string }[]>([]);
  const [credits, setCredits] = useState<(CreditRecord & { personName: string })[]>([]);
  const [rights, setRights] = useState<TrackRightRecord[]>([]);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [releaseName, setReleaseName] = useState<string | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [artistSummary, setArtistSummary] = useState<string>('—');
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assignerOpen, setAssignerOpen] = useState(false);
  const [assignerLabel, setAssignerLabel] = useState('');
  const [assignerRole, setAssignerRole] = useState('');
  const [assignerCallback, setAssignerCallback] = useState<((r: { personId?: string }) => void) | null>(null);
  const [orgPeople, setOrgPeople] = useState<{ id: string; displayName: string }[]>([]);
  const [creditPicker, setCreditPicker] = useState<Record<string, string>>({});

  const recordingType = resolveRecordingType(track.recordingType);
  const productionStage = inferProductionStage(assets);

  const load = useCallback(async () => {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [
        taskData,
        assetData,
        prodData,
        assignmentData,
        peopleData,
        creditData,
        rightsData,
        activityData,
        releaseIds,
      ] = await Promise.all([
        getTasksByEntity('track', trackId),
        getAssetsByTrack(trackId),
        getDeliverablesByTrack(trackId),
        getAssignmentsByEntity('track', trackId),
        getPeopleByTrack(trackId),
        getCreditsByTrack(trackId),
        getRightsByTrack(trackId),
        getActivityByEntity('track', trackId),
        getReleasesByTrack(trackId),
      ]);

      setTasks(taskData as Task[]);
      setAssets(assetData);
      setProdDeliverables(prodData);
      setAssignments(assignmentData);
      setRights(rightsData);
      setActivities(activityData);

      const peopleResolved = await Promise.all(
        peopleData.map(async (p) => {
          const person = await getPerson(p.personId);
          return { id: p.id, personId: p.personId, primaryRole: p.primaryRole, name: person?.displayName ?? p.personId };
        }),
      );
      setTrackPeople(peopleResolved);

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
      } else {
        setReleaseId(null);
        setReleaseName(null);
      }

      if (recordingType === 'remix') {
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

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'done').slice(0, 6),
    [tasks],
  );

  const deliverableRows = useMemo(() => EXPECTED_DELIVERABLES.map((def) => {
    const asset = assets.find((a) => def.pattern.test(a.name));
    const prod = prodDeliverables.find((d) => def.pattern.test(d.deliverableType) || def.pattern.test(d.filename ?? ''));
    const received = isAssetReceived(asset) || isProdReceived(prod);
    return { ...def, asset, prod, received, previewUrl: asset?.url ?? prod?.fileUrl ?? null };
  }), [assets, prodDeliverables]);

  const readinessMap = useMemo(() => {
    const audio = deliverableRows.find((d) => d.id === 'master-wav')?.received ?? false;
    const artwork = assets.some((a) => a.type === 'artwork' && isAssetReceived(a));
    const metadata = !!(track.isrc?.trim() && track.genre?.trim() && track.language?.trim());
    const rightsOk = rights.length > 0;
    const creditsOk = credits.length > 0;
    const deliverablesOk = deliverableRows.filter((d) => d.received).length >= 2;
    return {
      Audio: audio,
      Artwork: artwork,
      Metadata: metadata,
      Rights: rightsOk,
      Credits: creditsOk,
      Deliverables: deliverablesOk,
    } satisfies Record<typeof READINESS_CATS[number], boolean>;
  }, [deliverableRows, assets, track, rights, credits]);

  const readinessPct = Math.round(
    (READINESS_CATS.filter((c) => readinessMap[c]).length / READINESS_CATS.length) * 100,
  );

  const meaningfulActivities = activities
    .map((ev) => ({ ev, label: humaniseTrackActivity(ev) }))
    .filter((x) => x.label !== null)
    .slice(0, 12);

  const artworkAsset = assets.find((a) => a.type === 'artwork' && isAssetReceived(a));
  const artworkColor = ARTWORK_COLORS[(track.title.charCodeAt(0) ?? 0) % ARTWORK_COLORS.length];

  function openAssigner(label: string, role: string, cb: (r: { personId?: string }) => void) {
    setAssignerLabel(label);
    setAssignerRole(role);
    setAssignerCallback(() => cb);
    setAssignerOpen(true);
  }

  async function handleRequestAsset(name: string, type: 'audio' | 'document' | 'artwork' = 'audio') {
    if (!activeOrgId) return;
    await createRequestedAsset(trackId, activeOrgId, name, type);
    await load();
  }

  async function handleUploadAsset(name: string, file: File) {
    if (!activeOrgId) return;
    const assetId = await createRequestedAsset(trackId, activeOrgId, name, 'audio');
    const url = URL.createObjectURL(file);
    try {
      const assignee = assignments[0]?.personId ?? orgPeople[0]?.id;
      if (assignee) await assignAsset(assetId, assignee);
    } catch { /* best effort */ }
    try {
      const { startAssetWork } = await import('@/lib/asset-lifecycle-service');
      await startAssetWork(assetId);
      await deliverAsset(assetId, url, file.name, file.type, file.size);
    } catch { /* lifecycle may need manual steps */ }
    await load();
    onRefresh();
  }

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
    setDeleting(true);
    try {
      await removeTrack(trackId);
      toast.success('Track deleted.');
      router.push(releaseId ? `/releases/${releaseId}` : '/tracks');
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      toast.error(message);
      setDeleting(false);
      setDeleteOpen(false);

      throw error;
    }
  }

  async function handleDuplicate() {
    if (!user) return;
    const newId = await duplicateTrack(trackId, user.uid);
    router.push(`/tracks/${newId}`);
  }

  const visibleTabs = TAB_IDS.filter((id) => {
    if (id === 'rights') return rights.length > 0 || tab === 'rights';
    if (id === 'activity') return meaningfulActivities.length > 0 || tab === 'activity';
    return true;
  });

  function resolveRoleAssignment(roleLabels: readonly string[]) {
    const assignment = assignments.find((a) => roleLabels.some((r) => a.primaryRole.toLowerCase().includes(r.toLowerCase())));
    const person = trackPeople.find((p) => roleLabels.some((r) => p.primaryRole.toLowerCase().includes(r.toLowerCase())));
    if (assignment) {
      const name = orgPeople.find((p) => p.id === assignment.personId)?.displayName ?? assignment.personId;
      return { name, assignmentId: assignment.id, personLinkId: null as string | null };
    }
    if (person) return { name: person.name, assignmentId: null as string | null, personLinkId: person.id };
    return { name: null as string | null, assignmentId: null as string | null, personLinkId: null as string | null };
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
          <Button size="sm" variant="outline" onClick={() => openAssigner('Invite Person', 'Contributor', () => {})}>Invite Person</Button>
          <Button size="sm" variant="primary" onClick={() => setTab('settings')}>Edit Track</Button>
          <EntityOverflowMenu
            aria-label="More track actions"
            items={[
              { id: 'duplicate', label: 'Duplicate', onClick: handleDuplicate },
              { id: 'archive', label: 'Archive', onClick: handleArchive },
              { id: 'delete', label: 'Delete', variant: 'danger', separatorBefore: true, onClick: () => setDeleteOpen(true) },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-6 mb-8" aria-label="Track overview">
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-3 flex flex-col gap-3">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-wider px-1">Artwork</p>
          <div className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden shadow-card ${artworkAsset?.url ? 'bg-surface-950' : artworkColor}`}>
            {artworkAsset?.url ? (
              <img src={artworkAsset.url} alt={`${track.title} artwork`} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <span className="text-white text-6xl font-bold select-none block">{track.title.charAt(0).toUpperCase()}</span>
                <span className="text-white/50 text-xs mt-2 block">Waveform</span>
              </div>
            )}
          </div>
          {artworkAsset ? (
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setTab('deliverables')}>Replace</Button>
              <Button size="sm" variant="outline" className="text-xs" disabled={!artworkAsset.url} onClick={() => artworkAsset.url && window.open(artworkAsset.url, '_blank')}>Preview</Button>
              <label className="text-xs">
                <span className="sr-only">Upload artwork</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadAsset('Artwork', f);
                }} />
                <span className="inline-flex h-8 w-full items-center justify-center rounded-md border border-surface-200 text-text-600 cursor-pointer hover:bg-surface-50">Upload</span>
              </label>
            </div>
          ) : (
            <div className="space-y-2 px-1">
              <p className="text-sm text-text-500">No artwork uploaded.</p>
              <label className="flex h-8 w-full cursor-pointer items-center justify-center rounded-md bg-primary-500 text-xs font-semibold text-white hover:bg-primary-400">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadAsset('Artwork', f);
                }} />
                Upload Artwork
              </label>
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => openAssigner('Assign Designer', 'Graphic Designer', () => {})}>Assign Designer</Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <h1 className="text-2xl font-semibold text-text-900 tracking-tight leading-tight">{track.title}</h1>
            {track.version ? <p className="text-sm text-text-500 mt-0.5">{track.version}</p> : null}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                label={recordingTypeLabel(recordingType, true)}
                color={recordingType === 'remix' ? 'bg-purple-500/15 text-purple-600' : 'bg-surface-100 text-text-600'}
              />
              <Badge label={productionStage} color="bg-info-50 text-info-600" />
              <StatusBadge status={track.status} />
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-text-400">Recording Type</dt>
            <dd className="text-text-700">{recordingTypeLabel(recordingType)}</dd>
            <dt className="text-text-400">Release</dt>
            <dd className="text-text-700 truncate">
              {releaseId && releaseName ? (
                <Link href={`/releases/${releaseId}`} className="text-primary-600 hover:text-primary-700">{releaseName}</Link>
              ) : 'Not linked'}
            </dd>
            <dt className="text-text-400">{recordingType === 'remix' ? 'Original · Remixer' : 'Artists'}</dt>
            <dd className="text-text-700 truncate">{artistSummary}</dd>
            <dt className="text-text-400">Stage</dt>
            <dd className="text-text-700">{productionStage}</dd>
            <dt className="text-text-400">Status</dt>
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
                    if (cat === 'Deliverables') setTab('deliverables');
                    else if (cat === 'Credits') setTab('credits');
                    else if (cat === 'Rights') setTab('rights');
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
        tabs={visibleTabs.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
        activeTab={tab}
        onChange={(v) => setTab(v as TabId)}
        variant="underline"
        className="mb-8"
      />

      {tab === 'overview' && (
        <div className="space-y-8">
          <section aria-label="Pending Tasks">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider">Pending Tasks</h2>
              {tasks.filter((t) => t.status !== 'done').length > 6 ? (
                <button type="button" onClick={() => setTab('production')} className="text-xs text-primary-500 font-medium">View All</button>
              ) : null}
            </div>
            {pendingTasks.length === 0 ? (
              <EmptyState title="Everything is up to date." description="No pending work." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4 flex flex-col gap-2">
                    <p className="text-sm font-medium text-text-900">{task.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={task.status} />
                      <span className="text-xs text-text-500 capitalize">{task.priority ?? 'normal'}</span>
                    </div>
                    <p className="text-xs text-text-500">
                      {task.assigneeId ? <>Assigned · <span className="text-text-700">{task.assigneeId}</span></> : 'Unassigned'}
                    </p>
                    <p className="text-xs text-text-500">{relativeDue(task.dueDate)}</p>
                    <Button
                      size="sm"
                      variant={task.assigneeId ? 'outline' : 'primary'}
                      className="self-start mt-1"
                      onClick={() => openAssigner(task.title, 'Contributor', () => {})}
                    >
                      {task.assigneeId ? 'Open' : 'Assign'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-label="Production Deliverables">
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-4">Production Deliverables</h2>
            <DeliverablesList
              rows={deliverableRows}
              onUpload={(label) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.onchange = () => {
                  const f = input.files?.[0];
                  if (f) handleUploadAsset(label, f);
                };
                input.click();
              }}
              onAssign={(label, role) => openAssigner(`Assign ${label}`, role, () => {})}
              onInvite={(label) => openAssigner(`Invite for ${label}`, 'Contributor', () => {})}
              onRequest={(label) => handleRequestAsset(label)}
            />
          </section>

          <section aria-label="Assigned People">
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-4">Assigned People</h2>
            <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden divide-y divide-surface-100">
              {ROLE_GROUPS.map((group) => {
                const resolved = resolveRoleAssignment(group.roles);
                return (
                  <div key={group.key} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-xs text-text-400 uppercase tracking-wider">{group.label}</p>
                      <p className="text-sm font-medium text-text-900">{resolved.name ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {resolved.name ? (
                        <>
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => setTab('production')}>View</Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={async () => {
                              if (resolved.assignmentId) await deleteAssignment(resolved.assignmentId);
                              if (resolved.personLinkId) await removePersonFromTrack(resolved.personLinkId);
                              await load();
                            }}
                          >
                            Unassign
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => openAssigner(group.label, group.label, () => load())}>Assign</Button>
                          <Button size="sm" variant="primary" className="text-xs" onClick={() => openAssigner(group.label, group.label, () => load())}>Invite</Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-label="Credits">
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-4">Credits</h2>
            <CreditsTable
              credits={credits}
              people={orgPeople}
              creditPicker={creditPicker}
              setCreditPicker={setCreditPicker}
              onAdd={handleAddCredit}
              onRemove={async (id) => { await deleteCredit(id); await load(); }}
            />
          </section>

          <section aria-label="Metadata">
            <button
              type="button"
              onClick={() => setMetadataOpen((v) => !v)}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider">Metadata</h2>
              <span className="text-xs text-text-500">{metadataOpen ? 'Collapse' : 'Expand'}</span>
            </button>
            {metadataOpen ? (
              <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-4 grid gap-3 sm:grid-cols-2 text-sm">
                <MetaField label="ISRC" value={track.isrc ?? '—'} />
                <MetaField label="Language" value={track.language ?? '—'} />
                <MetaField label="Genre" value={track.genre ?? '—'} />
                <MetaField label="Explicit" value={track.explicit ? 'Yes' : 'No'} />
                <MetaField label="Recording Type" value={recordingTypeLabel(recordingType)} />
                <MetaField label="Duration" value={track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : 'Derived from audio'} />
              </div>
            ) : null}
          </section>

          <section aria-label="Activity">
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-4">Activity</h2>
            {meaningfulActivities.length === 0 ? (
              <EmptyState title="No activity yet." />
            ) : (
              <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden divide-y divide-surface-100">
                {meaningfulActivities.map(({ ev, label }) => (
                  <div key={ev.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0 text-[11px] font-semibold text-primary-700">
                      {(ev.actorId ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-text-700"><span className="font-medium text-text-900">{label}</span></p>
                      <p className="text-xs text-text-400 mt-0.5">{timeAgo(ev.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'production' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-4">Production Status</h2>
            <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5">
              <p className="text-sm text-text-700">Current stage: <span className="font-semibold text-text-900">{productionStage}</span></p>
              <p className="text-xs text-text-500 mt-2">{pendingTasks.length} pending task{pendingTasks.length === 1 ? '' : 's'}</p>
            </div>
          </section>
          <section aria-label="Pending Tasks">
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-4">All Pending Tasks</h2>
            {tasks.filter((t) => t.status !== 'done').length === 0 ? (
              <EmptyState title="No pending tasks." />
            ) : (
              <div className="space-y-2">
                {tasks.filter((t) => t.status !== 'done').map((task) => (
                  <div key={task.id} className="rounded-xl border border-surface-200 bg-layer-2 shadow-card px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-900">{task.title}</p>
                      <p className="text-xs text-text-500">{relativeDue(task.dueDate)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openAssigner(task.title, 'Contributor', () => {})}>
                      {task.assigneeId ? 'Open' : 'Assign'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'deliverables' && (
        <DeliverablesList
          rows={deliverableRows}
          onUpload={(label) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = () => {
              const f = input.files?.[0];
              if (f) handleUploadAsset(label, f);
            };
            input.click();
          }}
          onAssign={(label, role) => openAssigner(`Assign ${label}`, role, () => {})}
          onInvite={(label) => openAssigner(`Invite for ${label}`, 'Contributor', () => {})}
          onRequest={(label) => handleRequestAsset(label)}
        />
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

      {tab === 'rights' && (
        <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden divide-y divide-surface-100">
          {rights.length === 0 ? (
            <div className="p-6"><EmptyState title="No rights registered." description="Rights will appear here once added." /></div>
          ) : rights.map((r) => (
            <div key={r.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-900 capitalize">{r.rightType.replace(/_/g, ' ')}</p>
                <p className="text-xs text-text-500">{r.territory ?? 'Worldwide'} · {r.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        meaningfulActivities.length === 0 ? (
          <EmptyState title="No activity yet." />
        ) : (
          <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden divide-y divide-surface-100">
            {meaningfulActivities.map(({ ev, label }) => (
              <div key={ev.id} className="px-4 py-3">
                <p className="text-sm text-text-700 font-medium">{label}</p>
                <p className="text-xs text-text-400 mt-0.5">{timeAgo(ev.createdAt)}</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'settings' && (
        <SettingsPanel
          track={track}
          onSaved={() => { onRefresh(); load(); }}
        />
      )}

      <PersonAssigner
        open={assignerOpen}
        onClose={() => setAssignerOpen(false)}
        onAssign={(r) => { assignerCallback?.(r); setAssignerOpen(false); }}
        contextLabel={assignerLabel}
        contextRole={assignerRole}
        organizationId={activeOrgId}
        currentUserId={user?.uid ?? ''}
      />

      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => { if (!deleting) setDeleteOpen(false); }}
        onConfirm={handleDelete}
        title="Delete Track"
        message="This will permanently delete the track and all related data. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-text-900 mt-0.5">{value}</p>
    </div>
  );
}

function DeliverablesList({
  rows,
  onUpload,
  onAssign,
  onInvite,
  onRequest,
}: {
  rows: { id: string; label: string; received: boolean; previewUrl?: string | null }[];
  onUpload: (label: string) => void;
  onAssign: (label: string, role: string) => void;
  onInvite: (label: string) => void;
  onRequest: (label: string) => void;
}) {
  return (
    <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden">
      {rows.map((row, i) => (
        <div key={row.id} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-surface-100' : ''}`}>
          {row.received
            ? <svg className="h-4 w-4 text-success-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
            : <span className="h-4 w-4 rounded-full border-2 border-surface-300 shrink-0 inline-block" />}
          <span className="flex-1 min-w-0">
            <span className="text-sm font-medium text-text-900 block">{row.label}</span>
            <span className="text-xs text-text-400">{row.received ? 'Received' : 'Outstanding'}</span>
          </span>
          {row.received ? (
            <Button size="sm" variant="outline" className="text-xs shrink-0" disabled={!row.previewUrl} onClick={() => row.previewUrl && window.open(row.previewUrl, '_blank')}>
              Preview
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              <Button size="sm" variant="primary" className="text-xs" onClick={() => onUpload(row.label)}>Upload</Button>
              {row.label === 'Master WAV' ? (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => onAssign(row.label, 'Mixing Engineer')}>Assign</Button>
              ) : null}
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onInvite(row.label)}>Invite</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onRequest(row.label)}>Request</Button>
            </div>
          )}
        </div>
      ))}
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
      <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-surface-100 bg-surface-50 text-[11px] font-semibold text-text-400 uppercase tracking-wider">
        <span>Role</span><span>Person</span><span />
      </div>
      {CREDIT_TYPES.map((type) => {
        const typeCredits = credits.filter((c) => c.creditType.toLowerCase() === type.toLowerCase());
        return (
          <div key={type} className="border-t border-surface-100 first:border-t-0 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider sm:hidden">{type}</p>
            {typeCredits.length === 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-text-400 hidden sm:inline w-28 shrink-0">{type}</span>
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