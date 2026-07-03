'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { PersonAssigner } from '@/components/person-assigner';
import { fetchRelease } from '@/lib/release-service';
import { getDeliverablesByRelease } from '@/lib/deliverable-service';
import { getTracksByRelease } from '@/lib/release-track-repository';
import { getTasksByEntity } from '@/lib/task-service';
import { getActivityByEntity } from '@/lib/activity-service';
import { fmtDate } from '@/lib/utils';
import { Button, Badge, StatusBadge, Skeleton, EmptyState, LoadingState, Tabs } from '@releaseflow/ui';
import type { Release, Deliverable, Task } from '../../types';
import type { ReleaseTrackRecord } from '@/lib/release-track-repository';
import type { TrackRecord } from '@/lib/track-repository';
import type { ActivityEventRecord } from '@/lib/activity-service';

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

function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

const EXPECTED_ASSETS = [
  { id: 'cover-artwork', label: 'Cover Artwork', types: ['artwork'], missingAction: 'Upload' },
  { id: 'master-wav', label: 'Master WAV', types: ['audio'], missingAction: 'Upload' },
  { id: 'instrumental', label: 'Instrumental', types: ['audio'], match: ['instrumental'], missingAction: 'Upload' },
  { id: 'lyrics', label: 'Lyrics', types: ['document', 'metadata'], match: ['lyric'], missingAction: 'Assign Copywriter' },
  { id: 'story-artwork', label: 'Story Artwork', types: ['artwork'], match: ['story'], missingAction: 'Assign Designer' },
  { id: 'press-kit', label: 'Press Kit', types: ['document', 'other'], match: ['press kit', 'epk'], missingAction: 'Invite Designer' },
  { id: 'email-banner', label: 'Email Banner', types: ['artwork', 'other'], match: ['email', 'banner'], missingAction: 'Assign Designer' },
  { id: 'tiktok-video', label: 'TikTok Video', types: ['video'], match: ['tiktok', 'tik tok'], missingAction: 'Invite Videographer' },
] as const;

/* ─── Main Page ──────────────────────────────────────────────────────────── */

type TabId = 'overview' | 'workflow' | 'campaign' | 'rights' | 'budget' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',  label: 'Overview'  },
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<(typeof INVITE_ROLES)[number]>('Graphic Designer');
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
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

  /* Load core data immediately */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const rel = await fetchRelease(releaseId);
      if (!rel) { setLoading(false); return; }
      if (activeOrgId && rel.organizationId && rel.organizationId !== activeOrgId) {
        setForbidden(true); setLoading(false); return;
      }
      setRelease(rel as unknown as Release);

      const [del, trk, tsk] = await Promise.all([
        getDeliverablesByRelease(releaseId),
        getTracksByRelease(releaseId),
        getTasksByEntity('release', releaseId),
      ]);
      setDeliverables(del);
      setTracks(trk);
      setTasks(tsk);
      setLoading(false);
    }
    load();
  }, [releaseId, activeOrgId]);

  /* Lazy-load activity */
  useEffect(() => {
    if (!releaseId) return;
    getActivityByEntity('release', releaseId).then((data) => {
      setActivities(data);
      setActivitiesLoaded(true);
    });
  }, [releaseId]);

  const handleTabChange = useCallback((id: string) => {
    setTab(id as TabId);
    localStorage.setItem(`rf-tab-release-${releaseId}`, id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [releaseId]);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) setTab('overview');
  }, [tab, visibleTabs]);

  /* ─── Readiness calculation ─────────────────────────────────────────── */
  const readinessMap: Record<ReadinessCat, boolean> = {
    Audio:        deliverables.some((d) => d.type === 'audio'    && d.status === 'approved'),
    Artwork:      deliverables.some((d) => d.type === 'artwork'  && d.status === 'approved'),
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
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 mb-8">
          <Skeleton className="h-[200px] rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-[200px] rounded-xl" />
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

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 px-6 py-20">
        <p className="text-base font-semibold text-text-900 mb-1">Access Denied</p>
        <p className="text-sm text-text-500 mb-5">You don't have access to this release.</p>
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

  /* ─── Artwork placeholder colour ─────────────────────────────────────── */
  const artworkColors = ['bg-primary-600','bg-purple-600','bg-teal-600','bg-pink-600','bg-amber-600'];
  const artworkColor  = artworkColors[(release.title.charCodeAt(0) ?? 0) % artworkColors.length];
  const artworkAsset  = deliverables.find((d) => d.type === 'artwork' && d.status === 'approved');
  const artworkUrl = (artworkAsset as unknown as { url?: string } | undefined)?.url;
  const artistName = fieldValue(release, ['artistName', 'artist', 'primaryArtist']) ?? 'Artist not linked';
  const companyName = release.label ?? fieldValue(release, ['company', 'companyName']) ?? 'Company not set';
  const meaningfulActivities = activities.filter((ev) => humaniseActivity(ev) !== null);
  const assetChecklist = EXPECTED_ASSETS.map((asset) => {
    const match = deliverables.find((d) => {
      const title = d.title.toLowerCase();
      const typeMatch = (asset.types as readonly string[]).includes(d.type);
      const titleMatch =
        title.toLowerCase().includes(asset.label.toLowerCase());
      return titleMatch || (typeMatch && asset.id === 'cover-artwork' && d.type === 'artwork') || (typeMatch && asset.id === 'master-wav' && d.type === 'audio');
    });
    return { ...asset, deliverable: match, received: match?.status === 'approved' };
  });

  return (
    <div className="px-5 sm:px-8 py-8 max-w-6xl mx-auto page-transition">

      {/* ── Back navigation + action bar ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <Link href="/releases" className="inline-flex items-center gap-1.5 text-sm text-text-400 hover:text-text-700 transition-colors duration-150">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Releases
        </Link>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button size="sm" variant="outline" onClick={() => setRolePickerOpen(true)}>Invite Person</Button>
          <Button size="sm" variant="primary" onClick={() => router.push(`/releases/${releaseId}/edit`)}>Edit Release</Button>
          <Button size="sm" variant="outline" aria-label="More release actions">•••</Button>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-6 mb-8" aria-label="Release overview">

        {/* Artwork */}
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-3 flex flex-col gap-3">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-wider px-1">Artwork</p>
          <div className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden shadow-card ring-1 ring-white/10 ${artworkAsset ? 'bg-surface-950' : artworkColor}`}>
            {artworkAsset ? (
              <img src={artworkUrl ?? ''} alt={`${release.title} artwork`} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).classList.add(artworkColor ?? 'bg-orange-600'); }} />
            ) : (
              <span className="text-white text-6xl font-bold select-none">{release.title.charAt(0).toUpperCase()}</span>
            )}
          </div>
          {artworkAsset ? (
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleTabChange('workflow')}>Replace</Button>
              <Button size="sm" variant="outline" className="text-xs" disabled={!artworkUrl} onClick={() => artworkUrl && window.open(artworkUrl, '_blank')}>Download</Button>
              <Button size="sm" variant="outline" className="text-xs" disabled={!artworkUrl} onClick={() => artworkUrl && window.open(artworkUrl, '_blank')}>Preview</Button>
            </div>
          ) : (
            <div className="space-y-3 px-1 pb-1">
              <p className="text-sm text-text-500">No artwork uploaded.</p>
              <Button size="sm" variant="primary" className="w-full text-xs" onClick={() => handleTabChange('workflow')}>Upload Artwork</Button>
            </div>
          )}
        </div>

        {/* Release info */}
        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <h1 className="text-2xl font-semibold text-text-900 tracking-tight leading-tight">{release.title}</h1>
            <p className="text-sm text-text-500 mt-1">{artistName}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge label={titleCase(release.releaseType)} color="bg-surface-100 text-text-600" />
              <StatusBadge status={release.status} />
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-text-400 whitespace-nowrap">Type</dt>            <dd className="text-text-700 truncate">{titleCase(release.releaseType)}</dd>
            <dt className="text-text-400 whitespace-nowrap">Company</dt>         <dd className="text-text-700 truncate">{companyName}</dd>
            <dt className="text-text-400 whitespace-nowrap">Catalog</dt>         <dd className="text-text-700 truncate">{release.catalogNumber ?? 'Not assigned'}</dd>
            <dt className="text-text-400 whitespace-nowrap">Release Date</dt>    <dd className="text-text-700">{release.targetReleaseDate ? fmtDate(release.targetReleaseDate) : 'Not scheduled'}</dd>
            <dt className="text-text-400 whitespace-nowrap">Genre</dt>           <dd className="text-text-700 truncate">{release.genre ?? 'Not set'}</dd>
            <dt className="text-text-400 whitespace-nowrap">Language</dt>        <dd className="text-text-700">{release.language ?? 'Not set'}</dd>
            <dt className="text-text-400 whitespace-nowrap">Status</dt>          <dd><StatusBadge status={release.status} /></dd>
          </dl>
        </div>

        {/* Readiness card */}
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Release Readiness</p>
            <span className={`text-2xl font-semibold tabular-nums ${readinessPct >= 80 ? 'text-success-600' : readinessPct >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>{readinessPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${readinessPct >= 80 ? 'bg-success-500' : readinessPct >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`} style={{ width: `${readinessPct}%` }} />
          </div>
          <ul className="space-y-1.5">
            {READINESS_CATS.map((cat) => (
              <li key={cat} className="flex items-center gap-2 text-xs">
                {readinessMap[cat]
                  ? <svg className="h-3.5 w-3.5 text-success-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
                  : <span className="h-3.5 w-3.5 rounded-full border-2 border-surface-300 shrink-0 inline-block" />}
                <span className={readinessMap[cat] ? 'text-text-700' : 'text-text-400'}>{cat}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => handleTabChange('workflow')} className="text-xs text-primary-500 hover:text-primary-600 font-medium text-left mt-auto transition-colors">View Checklist →</button>
        </div>
      </section>

      {/* ── Overview workspace ───────────────────────────────────────── */}
      <div className="space-y-8">

          {/* § Pending Tasks */}
          <section aria-label="Pending Tasks">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider">Pending Tasks</h2>
              {pendingTasks.length > 6 && (
                <button onClick={() => handleTabChange('workflow')} className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors">View All Tasks</button>
              )}
            </div>
            {pendingTasks.length === 0 ? (
              <EmptyState title="Everything is up to date." description="No pending work." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pendingTasks.slice(0, 6).map((task) => {
                  const overdue = isOverdue(task.dueDate);
                  const priorityColors: Record<string, string> = { critical: 'bg-danger-50 text-danger-600', high: 'bg-warning-50 text-warning-600', medium: 'bg-info-50 text-info-600', low: 'bg-surface-100 text-text-500' };
                  return (
                    <div key={task.id} className="rounded-xl border border-surface-200 bg-white shadow-card p-4 flex flex-col gap-2 text-left">
                      <p className="text-sm font-medium text-text-900 leading-snug">{task.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={task.status} />
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${priorityColors[task.priority] ?? 'bg-surface-100 text-text-500'}`}>{task.priority}</span>
                      </div>
                      <p className="text-xs text-text-500 truncate">
                        {isInvitationPending(task)
                          ? 'Invitation Pending'
                          : task.assigneeId
                            ? <>Assigned to <span className="text-text-700">{task.assigneeId}</span></>
                            : 'Unassigned'}
                      </p>
                      <p className={`text-xs font-medium ${overdue ? 'text-danger-500' : 'text-text-500'}`}>{task.dueDate ? relativeDate(task.dueDate) : 'No due date'}</p>
                      <Button size="sm" variant={task.assigneeId ? 'outline' : 'primary'} className="mt-2 self-start" onClick={() => handleTabChange('workflow')}>
                        {taskActionLabel(task)}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* § Assets / Deliverables */}
          <section aria-label="Assets">
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-4">Assets</h2>
            {assetChecklist.length === 0 ? (
              <EmptyState title="No assets have been added to this release yet." action={{ label: 'Upload Asset', onClick: () => handleTabChange('workflow') }} />
            ) : (
              <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
                {assetChecklist.map((asset, i) => {
                  const d = asset.deliverable;
                  const received = asset.received;
                  const hasUrl = !!(d as unknown as { url?: string } | undefined)?.url;
                  return (
                    <div
                      key={asset.id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors duration-100 cursor-pointer ${i > 0 ? 'border-t border-surface-100' : ''}`}
                      onClick={() => { if (!hasUrl) return; window.open((d as unknown as { url: string }).url, '_blank'); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (hasUrl) window.open((d as unknown as { url: string }).url, '_blank'); } }}
                      aria-label={`${asset.label} — ${received ? 'received' : 'outstanding'}`}
                    >
                      {received
                        ? <svg className="h-4 w-4 text-success-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
                        : <span className="h-4 w-4 rounded-full border-2 border-surface-300 inline-block shrink-0" />}
                      <span className="flex-1 min-w-0">
                        <span className={`text-sm font-medium truncate block ${received ? 'text-text-800' : 'text-text-500'}`}>{asset.label}</span>
                        <span className="text-xs text-text-400 capitalize">{d?.status?.replace(/_/g, ' ') ?? 'Not received'}</span>
                      </span>
                      {received ? (
                        <span className="text-xs font-medium shrink-0 text-success-600">Received</span>
                      ) : (
                        <Button
                          size="sm"
                          variant={asset.missingAction.startsWith('Upload') ? 'primary' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (asset.missingAction.startsWith('Invite')) router.push('/people');
                            else handleTabChange('workflow');
                          }}
                        >
                          {asset.missingAction}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* § Tracks */}
          <section aria-label="Tracks">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider">Tracks</h2>
              <Button size="sm" variant="outline" onClick={() => router.push(`/releases/${releaseId}/tracks/new`)}>+ Add Track</Button>
            </div>
            {tracks.length === 0 ? (
              <EmptyState title="No tracks have been added." action={{ label: 'Add First Track', onClick: () => router.push(`/releases/${releaseId}/tracks/new`) }} />
            ) : (
              <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
                <div className="hidden sm:grid grid-cols-[2rem_1fr_4rem_6rem_6rem_6rem] gap-x-4 px-4 py-2.5 border-b border-surface-100 bg-surface-50">
                  <span className="text-[11px] font-semibold text-text-400 uppercase tracking-wider">#</span>
                  <span className="text-[11px] font-semibold text-text-400 uppercase tracking-wider">Title</span>
                  <span className="text-[11px] font-semibold text-text-400 uppercase tracking-wider text-right">Dur.</span>
                  <span className="text-[11px] font-semibold text-text-400 uppercase tracking-wider">Mix</span>
                  <span className="text-[11px] font-semibold text-text-400 uppercase tracking-wider">Master</span>
                  <span className="text-[11px] font-semibold text-text-400 uppercase tracking-wider">Publishing</span>
                </div>
                {tracks.map((rt, i) => {
                  const t = rt.track;
                  return (
                    <button
                      key={rt.id}
                      className={`w-full text-left flex sm:grid sm:grid-cols-[2rem_1fr_4rem_6rem_6rem_6rem] items-center gap-x-4 px-4 py-3.5 hover:bg-surface-50 transition-colors duration-100 ${i > 0 ? 'border-t border-surface-100' : ''}`}
                      onClick={() => t && router.push(`/tracks/${t.id}`)}
                      aria-label={t?.title ?? `Track ${rt.position}`}
                    >
                      <span className="text-sm text-text-400 font-mono w-8 shrink-0">{rt.position}</span>
                      <span className="text-sm font-medium text-text-900 truncate flex-1">{t?.title ?? '—'}</span>
                      <span className="text-xs text-text-500 text-right hidden sm:block">{fmtDuration(t?.duration)}</span>
                      <span className="hidden sm:block"><StatusBadge status={(t as unknown as { mixStatus?: string })?.mixStatus ?? (t?.status === 'active' ? 'in_progress' : 'draft')} /></span>
                      <span className="hidden sm:block"><StatusBadge status={(t as unknown as { masterStatus?: string })?.masterStatus ?? (t?.isrc ? 'ready' : 'draft')} /></span>
                      <span className="hidden sm:block"><StatusBadge status={(t as unknown as { publishingStatus?: string })?.publishingStatus ?? (t?.isrc ? 'ready' : 'draft')} /></span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* § Activity */}
          <section aria-label="Activity">
            <h2 className="text-xs font-semibold text-text-400 uppercase tracking-wider mb-4">Activity</h2>
            {!activitiesLoaded ? (
              <div className="flex justify-center py-10"><LoadingState text="Loading activity…" /></div>
            ) : meaningfulActivities.length === 0 ? (
              <EmptyState title="No activity on this release yet." />
            ) : (
              <div className="space-y-0 rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
                {meaningfulActivities.slice(0, 12).map((ev, i) => {
                  const label = humaniseActivity(ev);
                  return (
                    <div key={ev.id} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-surface-100' : ''}`}>
                      <div className="h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0 text-[11px] font-semibold text-primary-700 mt-0.5">
                        {(ev.actorId ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-700">
                          <span className="font-medium text-text-900">{ev.actorId}</span>{' '}{label}
                        </p>
                        <p className="text-xs text-text-400 mt-0.5">{timeAgo(ev.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

      </div>

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
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-8 text-center">
          <p className="text-sm font-medium text-text-700 mb-1">Workflow</p>
          <p className="text-sm text-text-400">Full workflow management coming soon. Use the Pending Tasks section on Overview to action work.</p>
        </div>
      )}

      {tab === 'campaign' && (
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-8 text-center">
          <EmptyState title="No campaigns yet" description="Campaigns will appear here once they are created for this release." />
        </div>
      )}

      {tab === 'rights' && (
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-8 text-center">
          <EmptyState title="No rights records" description="Rights and ownership information will appear here once configured." />
        </div>
      )}

      {tab === 'budget' && (
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-8 text-center">
          <EmptyState title="No budget entries" description="Budget and cost information will appear here once entries are added." />
        </div>
      )}

      {tab === 'settings' && (
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-6 max-w-lg">
          <h2 className="text-base font-semibold text-text-900 mb-4">Release Settings</h2>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push(`/releases/${releaseId}/edit`)}>Edit Release</Button>
          </div>
        </div>
      )}

      {rolePickerOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
            onClick={() => setRolePickerOpen(false)}
            aria-label="Close invite role picker"
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-modal">
            <h2 className="text-base font-semibold text-surface-50">Invite Person</h2>
            <p className="mt-1 text-sm text-text-400">Choose the role this person should fill in the release workspace.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {INVITE_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setInviteRole(role)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    inviteRole === role
                      ? 'border-primary-500/60 bg-primary-500/10 text-primary-300'
                      : 'border-surface-700 bg-surface-800 text-text-300 hover:border-surface-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setRolePickerOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setRolePickerOpen(false);
                  setInviteOpen(true);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <PersonAssigner
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onAssign={() => setInviteOpen(false)}
        contextLabel={`Invite ${inviteRole}`}
        contextRole={inviteRole}
        organizationId={activeOrgId}
        currentUserId={user?.uid ?? 'unknown'}
      />

    </div>
  );
}
