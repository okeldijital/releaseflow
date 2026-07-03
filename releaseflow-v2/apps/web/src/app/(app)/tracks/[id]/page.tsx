'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useTrack } from '@/hooks/useTrack';
import { editTrack, removeTrack } from '@/lib/track-service';
import { fetchArtists } from '@/lib/artist-service';
import { getArtistsByTrack, addArtistToTrack, removeArtistFromTrack } from '@/lib/track-artist-repository';
import { getPeopleByOrg } from '@/lib/people-repository';
import { getPeopleByTrack, addPersonToTrack, removePersonFromTrack } from '@/lib/track-person-repository';
import {
  createRequestedAsset, assignAsset, startAssetWork, deliverAsset,
  approveAsset, attachAsset, rejectAsset,
  getAssetsByTrack,
  getStateLabel,
} from '@/lib/asset-lifecycle-service';
import type { TrackAsset, AssetType } from '@/lib/asset-lifecycle-service';
import { createTask, markTaskDone, getTasksByEntity } from '@/lib/task-service';
import type { Task, TaskPriority } from '@/app/(app)/types';
import { Button, EmptyState, LoadingState, Input, TextArea, Badge, StatusBadge, Tabs, ProgressBar } from '@releaseflow/ui';
import { getTemplate } from '@/lib/specification-engine';
import { generateSpecification } from '@/lib/specification-generator';
import { getSpecificationsByTrack, updateSpecification, type SpecRecord, type SpecType, type SpecStatus } from '@/lib/specification-repository';
import { computeTrackReadiness, type TrackReadiness } from '@/lib/track-intelligence-service';
import { computeRightsReadiness, type TrackRightsReadiness } from '@/lib/rights-intelligence-service';
import { computeCollaborationReadiness, type CollabReadiness } from '@/lib/collaboration-intelligence-service';
import { getDeliverablesByTrack, type ProductionDeliverableRecord } from '@/lib/deliverable-management-repository';
import { getSubmissionsByDeliverable, type SubmissionRecord } from '@/lib/submission-repository';
import { getReviewsByEntity, type ReviewRecord } from '@/lib/review-repository';
import { getChecklistByTrack, type ChecklistRecord } from '@/lib/checklist-repository';
import { computeProductionReadiness, type ProductionReadiness } from '@/lib/production-intelligence-service';
import { getActivityByEntity, type ActivityEventRecord } from '@/lib/activity-service';
import { validateTrackForDistribution, type ValidationResult } from '@/lib/validation-engine';
import {
  getCreditsByTrack, createCredit, deleteCredit,
  type CreditRecord,
} from '@/lib/credit-repository';
import {
  getOwnershipsByEntity, createOwnership, deleteOwnership,
  type OwnershipRecord,
} from '@/lib/ownership-repository';
import {
  getPublishingSplitsByTrack, createPublishingSplit, deletePublishingSplit,
  type PublishingSplitRecord,
} from '@/lib/publishing-repository';
import {
  getRightsByTrack, createTrackRight, deleteTrackRight,
  type TrackRightRecord,
} from '@/lib/rights-repository';
import { getPerson } from '@/lib/people-repository';

const TAB_IDS = ['overview', 'artists', 'people', 'assets', 'tasks', 'specifications', 'production', 'rights', 'credits', 'activity'] as const;
type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview', artists: 'Artists', people: 'People',
  assets: 'Assets', tasks: 'Tasks', specifications: 'Specifications',
  production: 'Production', rights: 'Rights', credits: 'Credits', activity: 'Activity',
};

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const ARTIST_TYPES = [
  { value: 'original_artist', label: 'Original Artist' },
  { value: 'featured_artist', label: 'Featured Artist' },
  { value: 'remixer', label: 'Remixer' },
  { value: 'composer', label: 'Composer' },
  { value: 'producer', label: 'Producer' },
];

export default function TrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
  const id = typeof params.id === 'string' ? params.id : '';
  const { track, loading } = useTrack(id);

  const [tab, setTab] = useState<TabId>('overview');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editISRC, setEditISRC] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editExplicit, setEditExplicit] = useState('false');
  const [editBPM, setEditBPM] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (track) {
      setEditTitle(track.title);
      setEditVersion(track.version ?? '');
      setEditISRC(track.isrc ?? '');
      setEditDuration(track.duration ? String(track.duration) : '');
      setEditGenre(track.genre ?? '');
      setEditExplicit(track.explicit ? 'true' : 'false');
      setEditBPM(track.bpm ? String(track.bpm) : '');
      setEditKey(track.musicalKey ?? '');
      setEditLanguage(track.language ?? '');
    }
  }, [track]);

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    await editTrack(id, {
      title: editTitle.trim(),
      version: editVersion.trim() || undefined,
      isrc: editISRC.trim() || undefined,
      duration: editDuration ? Number(editDuration) : undefined,
      genre: editGenre.trim() || undefined,
      explicit: editExplicit === 'true',
      bpm: editBPM ? Number(editBPM) : undefined,
      musicalKey: editKey.trim() || undefined,
      language: editLanguage.trim() || undefined,
    });
    setEditing(false);
    setSaving(false);
  }

  async function handleArchive() {
    await removeTrack(id);
    router.push('/tracks');
  }

  if (loading) return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  if (!track) return <EmptyState title="Track not found" description="The requested track could not be found." />;

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">{track.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={track.status} />
            {track.version ? <span className="text-sm text-text-400">{track.version}</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>Edit</Button>
          <Button variant="outline" size="sm" onClick={handleArchive}>Archive</Button>
        </div>
      </div>

      {editing && (
        <div className="mb-6 rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4 animate-slide-up">
          <p className="text-sm font-semibold text-surface-50">Edit Track</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <Input label="Version" value={editVersion} onChange={(e) => setEditVersion(e.target.value)} placeholder="e.g. Radio Edit" />
            <Input label="ISRC" value={editISRC} onChange={(e) => setEditISRC(e.target.value)} placeholder="US-ABC-12-34567" />
            <Input label="Duration (seconds)" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="210" />
            <Input label="Genre" value={editGenre} onChange={(e) => setEditGenre(e.target.value)} placeholder="Electronic" />
            <Input label="BPM" value={editBPM} onChange={(e) => setEditBPM(e.target.value)} placeholder="128" />
            <Input label="Key" value={editKey} onChange={(e) => setEditKey(e.target.value)} placeholder="Am" />
            <Input label="Language" value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} placeholder="English" />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-surface-200">
              <span>Explicit</span>
              <select value={editExplicit} onChange={(e) => setEditExplicit(e.target.value)} className="rounded-md border border-surface-700/60 bg-surface-50 px-2 py-1 text-sm">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !editTitle.trim()}>Save</Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <Tabs
        tabs={TAB_IDS.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
        activeTab={tab}
        onChange={(v) => setTab(v as TabId)}
        variant="underline"
        className="mb-6"
      />

      {tab === 'overview' && <OverviewTab track={track} trackId={id} activeOrgId={activeOrgId} />}
      {tab === 'artists' && <ArtistsTab trackId={id} activeOrgId={activeOrgId} />}
      {tab === 'people' && <PeopleTab trackId={id} activeOrgId={activeOrgId} />}
      {tab === 'assets' && <AssetsTab trackId={id} activeOrgId={activeOrgId} />}
      {tab === 'tasks' && <TrackTasksTab trackId={id} activeOrgId={activeOrgId} />}
      {tab === 'specifications' && <SpecificationsTab trackId={id} activeOrgId={activeOrgId} trackTitle={track.title} />}
      {tab === 'production' && <ProductionTab trackId={id} activeOrgId={activeOrgId} trackTitle={track.title} />}
      {tab === 'rights' && <RightsTab trackId={id} activeOrgId={activeOrgId} />}
      {tab === 'credits' && <StubTab title="Credits" description="Contributor credits, roles, and billing information. Scheduled for a future sprint." />}
      {tab === 'activity' && <TrackActivityTab trackId={id} activeOrgId={activeOrgId} />}
    </div>
  );
}

function OverviewTab({ track, trackId, activeOrgId }: { track: { title: string; version?: string | null; isrc?: string | null; duration?: number | null; genre?: string | null; explicit: boolean; bpm?: number | null; musicalKey?: string | null; language?: string | null; status: string }; trackId: string; activeOrgId: string | null }) {
  const [readiness, setReadiness] = useState<TrackReadiness | null>(null);
  const [collabReadiness, setCollabReadiness] = useState<CollabReadiness | null>(null);
  const [artistCount, setArtistCount] = useState(0);
  const [peopleCount, setPeopleCount] = useState(0);
  const [assetRequested, setAssetRequested] = useState(0);
  const [assetAvailable, setAssetAvailable] = useState(0);
  const [taskDone, setTaskDone] = useState(0);
  const [taskTotal, setTaskTotal] = useState(0);
  const [specCount, setSpecCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (!activeOrgId) return;
      try {
        const [r, artists, people, assets, specs, tasks] = await Promise.all([
          computeTrackReadiness(trackId, activeOrgId),
          import('@/lib/track-artist-repository').then((m) => m.getArtistsByTrack(trackId)),
          import('@/lib/track-person-repository').then((m) => m.getPeopleByTrack(trackId)),
          import('@/lib/asset-lifecycle-service').then((m) => m.getAssetsByTrack(trackId)),
          import('@/lib/specification-repository').then((m) => m.getSpecificationsByTrack(trackId)),
          import('@/lib/task-service').then((m) => m.getTasksByEntity('track', trackId)),
        ]);
        setReadiness(r);
        setArtistCount(artists.length);
        setPeopleCount(people.length);
        const avail = assets.filter((a: { lifecycleState: string }) => a.lifecycleState === 'delivered' || a.lifecycleState === 'approved' || a.lifecycleState === 'attached');
        setAssetRequested(assets.length - avail.length);
        setAssetAvailable(avail.length);
        setTaskDone(tasks.filter((t: { status: string }) => t.status === 'done').length);
        setTaskTotal(tasks.length);
        setSpecCount(specs.length);

        computeCollaborationReadiness('track', trackId, activeOrgId).then(setCollabReadiness).catch(() => {});
      } catch { /* safe defaults remain */ }
    }
    load();
  }, [trackId, activeOrgId]);

  const scoreColor = readiness
    ? readiness.percentage >= 80
      ? 'text-success-500'
      : readiness.percentage >= 50
        ? 'text-warning-500'
        : 'text-danger-500'
    : 'text-text-500';

  const ringColor = readiness
    ? readiness.percentage >= 80
      ? 'stroke-success-500'
      : readiness.percentage >= 50
        ? 'stroke-warning-500'
        : 'stroke-danger-500'
    : 'stroke-surface-300';

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - ((readiness?.percentage ?? 0) / 100) * circumference;

  return (
    <div className="space-y-6">
      {readiness && (
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5">
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-200" />
                <circle cx="24" cy="24" r="22" fill="none" strokeWidth="3" strokeLinecap="round" className={ringColor} strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor}`}>{readiness.percentage}%</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-surface-50">Readiness Score</p>
              <p className="text-xs text-text-400 mt-0.5">
                {readiness.missingFields.length > 0
                  ? `Missing: ${readiness.missingFields.join(', ')}`
                  : 'All categories complete'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-surface-50 mb-3">Status Breakdown</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Metadata" status={readiness?.metadataComplete ? 'complete' : 'incomplete'}>
            {track.title?.trim() ? <Check /> : <Cross />} Title
            {track.isrc ? <Check /> : <Cross />} ISRC
            {track.duration ? <Check /> : <Cross />} Duration
          </StatCard>
          <StatCard label="Credits" status={readiness?.creditComplete ? 'complete' : 'incomplete'}>
            <span>{artistCount} artist{artistCount !== 1 ? 's' : ''}</span>
          </StatCard>
          <StatCard label="People" status={peopleCount > 0 ? 'complete' : 'incomplete'}>
            <span>{peopleCount} {peopleCount === 1 ? 'person' : 'people'}</span>
          </StatCard>
          <StatCard label="Assets" status={readiness?.assetsComplete ? 'complete' : 'incomplete'}>
            <span>{assetAvailable} available</span>
            <span>{assetRequested} requested</span>
          </StatCard>
          <StatCard label="Tasks" status={readiness?.tasksComplete ? 'complete' : 'incomplete'}>
            <span>{taskDone} / {taskTotal} done</span>
          </StatCard>
          <StatCard label="Specifications" status={readiness?.specsComplete ? 'complete' : 'incomplete'}>
            <span>{specCount} spec{specCount !== 1 ? 's' : ''}</span>
          </StatCard>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-surface-50 mb-3">Track Details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Version" value={track.version ?? '—'} />
          <DetailRow label="ISRC" value={track.isrc ?? '—'} />
          <DetailRow label="Duration" value={formatDuration(track.duration ?? undefined)} />
          <DetailRow label="Genre" value={track.genre ?? '—'} />
          <DetailRow label="Explicit" value={track.explicit ? 'Yes' : 'No'} />
          <DetailRow label="BPM" value={track.bpm ? String(track.bpm) : '—'} />
          <DetailRow label="Key" value={track.musicalKey ?? '—'} />
          <DetailRow label="Language" value={track.language ?? '—'} />
        </div>
      </div>

      {collabReadiness && (
        <div>
          <p className="text-sm font-semibold text-surface-50 mb-3">Collaboration Status</p>
          <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5">
            <div className="flex items-center gap-5 mb-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-200" />
                  <circle cx="24" cy="24" r="22" fill="none" strokeWidth="3" strokeLinecap="round" className={ringColor} strokeDasharray={circumference} strokeDashoffset={circumference - ((collabReadiness.percentage) / 100) * circumference} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor}`}>{collabReadiness.percentage}%</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-50">Collaboration Health</p>
                <p className="text-xs text-text-400 mt-0.5">
                  {collabReadiness.percentage >= 80 ? 'Minimal action items' : collabReadiness.percentage >= 50 ? 'Some attention needed' : 'Several items pending'}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2.5">
                <span className="text-xs text-surface-200">Awaiting Response</span>
                <span className={`text-xs font-semibold ${collabReadiness.awaitingResponse > 0 ? 'text-warning-600' : 'text-text-500'}`}>{collabReadiness.awaitingResponse}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2.5">
                <span className="text-xs text-surface-200">Pending Approvals</span>
                <span className={`text-xs font-semibold ${collabReadiness.awaitingApproval > 0 ? 'text-warning-600' : 'text-text-500'}`}>{collabReadiness.awaitingApproval}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2.5">
                <span className="text-xs text-surface-200">Overdue Approvals</span>
                <span className={`text-xs font-semibold ${collabReadiness.overdueApprovals > 0 ? 'text-danger-600' : 'text-text-500'}`}>{collabReadiness.overdueApprovals}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2.5">
                <span className="text-xs text-surface-200">Unread Mentions</span>
                <span className={`text-xs font-semibold ${collabReadiness.unreadMentions > 0 ? 'text-info-600' : 'text-text-500'}`}>{collabReadiness.unreadMentions}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2.5">
                <span className="text-xs text-surface-200">Unresolved Comments</span>
                <span className={`text-xs font-semibold ${collabReadiness.unresolvedComments > 0 ? 'text-warning-600' : 'text-text-500'}`}>{collabReadiness.unresolvedComments}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2.5">
                <span className="text-xs text-surface-200">Active Reviewers</span>
                <span className="text-xs font-semibold text-text-400">{collabReadiness.activeReviewers}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3.5">
      <p className="text-xs text-text-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-surface-50">{value}</p>
    </div>
  );
}

function StatCard({ label, status, children }: { label: string; status: 'complete' | 'incomplete'; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-medium text-surface-200 uppercase tracking-wide">{label}</p>
        <span className={`inline-flex items-center rounded-full w-2 h-2 ${status === 'complete' ? 'bg-success-400' : 'bg-surface-300'}`} />
      </div>
      <div className="text-xs text-text-400 space-y-0.5">{children}</div>
    </div>
  );
}

function Check() {
  return (
    <svg className="inline w-3.5 h-3.5 text-success-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Cross() {
  return (
    <svg className="inline w-3.5 h-3.5 text-surface-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrackActivityTab({ trackId, activeOrgId: _activeOrgId }: { trackId: string; activeOrgId: string | null }) {
  const [events, setEvents] = useState<ActivityEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getActivityByEntity('track', trackId);
        setEvents(data);
      } catch { setEvents([]); } finally { setLoading(false); }
    }
    load();
  }, [trackId]);

  if (loading) return <LoadingState />;

  if (events.length === 0) {
    return <EmptyState title="Activity" description="Activity will appear as work begins on this track." />;
  }

  const grouped = new Map<string, ActivityEventRecord[]>();
  for (const event of events) {
    const ts = event.createdAt as { toDate?: () => Date };
    const date = ts?.toDate?.() ?? new Date();
    const key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const list = grouped.get(key) || [];
    list.push(event);
    grouped.set(key, list);
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateLabel, groupEvents]) => (
        <div key={dateLabel}>
          <p className="text-xs font-semibold text-text-500 uppercase tracking-wide mb-3">
            {dateLabel}
          </p>
          <div className="space-y-0">
            {groupEvents.map((event, idx) => {
              const ts = event.createdAt as { toDate?: () => Date };
              const time = ts?.toDate?.()?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) ?? '';
              const isLast = idx === groupEvents.length - 1;
              return (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="h-2 w-2 mt-2 rounded-full bg-primary-400" />
                    {!isLast && <span className="w-px flex-1 bg-surface-200 mt-1" />}
                  </div>
                  <div className={`pb-4 ${isLast ? '' : ''}`}>
                    <p className="text-sm text-surface-100">
                      <span className="font-medium text-surface-50">{event.actorId}</span>
                      {' '}
                      <span className="text-text-400">{event.action.replace(/_/g, ' ')}</span>
                    </p>
                    {event.details ? (
                      <p className="text-xs text-text-500 mt-0.5">{event.details}</p>
                    ) : null}
                    <p className="text-xs text-text-600 mt-0.5">{time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArtistsTab({ trackId, activeOrgId }: { trackId: string; activeOrgId: string | null }) {
  const [artists, setArtists] = useState<{ id: string; name: string; artistType: string; creditName?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [orgArtists, setOrgArtists] = useState<{ id: string; name: string }[]>([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedType, setSelectedType] = useState('original_artist');

  async function load() {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const records = await getArtistsByTrack(trackId);
      const items = await Promise.all(records.map(async (r) => {
        const { getArtist } = await import('@/lib/artist-repository');
        const a = await getArtist(r.artistId);
        return { id: r.id, name: a?.name ?? r.artistId, artistType: r.artistType, creditName: r.creditName };
      }));
      setArtists(items);
    } catch { setArtists([]); } finally { setLoading(false); }
  }

  async function handleOpenAdd() {
    if (!activeOrgId) return;
    const data = await fetchArtists(activeOrgId);
    setOrgArtists(data);
    setShowAdd(true);
  }

  async function handleAdd() {
    if (!selectedArtist) return;
    await addArtistToTrack({ trackId, artistId: selectedArtist, artistType: selectedType as never });
    setShowAdd(false);
    setSelectedArtist('');
    await load();
  }

  useEffect(() => { load(); }, [trackId, activeOrgId]);

  if (loading) return <LoadingState />;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-400">{artists.length} artist{artists.length !== 1 ? 's' : ''}</p>
        <Button variant="outline" size="sm" onClick={handleOpenAdd}>Add Artist</Button>
      </div>
      {artists.length === 0 ? (
        <EmptyState title="No artists linked" description="Add artists who performed on this track." />
      ) : (
        <div className="space-y-1.5">
          {artists.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-surface-50">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge label={ARTIST_TYPES.find((t) => t.value === a.artistType)?.label ?? a.artistType} color="bg-info-50 text-info-600" />
                  {a.creditName ? <span className="text-xs text-text-500">as {a.creditName}</span> : null}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={async () => { await removeArtistFromTrack(a.id); await load(); }}>Remove</Button>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <div className="mt-4 rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4">
          <p className="text-sm font-semibold text-surface-50">Add Artist</p>
          <select value={selectedArtist} onChange={(e) => setSelectedArtist(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
            <option value="">Select artist...</option>
            {orgArtists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
            {ARTIST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!selectedArtist}>Add</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PeopleTab({ trackId, activeOrgId }: { trackId: string; activeOrgId: string | null }) {
  const [people, setPeople] = useState<{ id: string; displayName: string; primaryRole: string; responsibility?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [orgPeople, setOrgPeople] = useState<{ id: string; displayName: string }[]>([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [newRole, setNewRole] = useState('');

  async function load() {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const records = await getPeopleByTrack(trackId);
      const items = await Promise.all(records.map(async (r) => {
        const { getPerson } = await import('@/lib/people-repository');
        const p = await getPerson(r.personId);
        return { id: r.id, displayName: p?.displayName ?? r.personId, primaryRole: r.primaryRole, responsibility: r.responsibility };
      }));
      setPeople(items);
    } catch { setPeople([]); } finally { setLoading(false); }
  }

  async function handleOpenAdd() {
    if (!activeOrgId) return;
    const data = await getPeopleByOrg(activeOrgId);
    setOrgPeople(data);
    setShowAdd(true);
  }

  async function handleAdd() {
    if (!selectedPerson || !newRole.trim()) return;
    await addPersonToTrack({ trackId, personId: selectedPerson, primaryRole: newRole.trim() });
    setShowAdd(false);
    setSelectedPerson('');
    setNewRole('');
    await load();
  }

  useEffect(() => { load(); }, [trackId, activeOrgId]);

  if (loading) return <LoadingState />;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-400">{people.length} {people.length === 1 ? 'person' : 'people'}</p>
        <Button variant="outline" size="sm" onClick={handleOpenAdd}>Add Person</Button>
      </div>
      {people.length === 0 ? (
        <EmptyState title="No people linked" description="Add people who worked on this track." />
      ) : (
        <div className="space-y-1.5">
          {people.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-surface-50">{p.displayName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-400">{p.primaryRole}</span>
                  {p.responsibility ? <span className="text-xs text-text-500">&middot; {p.responsibility}</span> : null}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={async () => { await removePersonFromTrack(p.id); await load(); }}>Remove</Button>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <div className="mt-4 rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4">
          <p className="text-sm font-semibold text-surface-50">Add Person</p>
          <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
            <option value="">Select person...</option>
            {orgPeople.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
          </select>
          <Input label="Primary Role" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Mastering Engineer, Producer" />
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!selectedPerson || !newRole.trim()}>Add</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackTasksTab({ trackId, activeOrgId }: { trackId: string; activeOrgId: string | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [people, setPeople] = useState<{ id: string; displayName: string }[]>([]);
  const [creating, setCreating] = useState(false);

  async function load() {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    try {
      const data = await getTasksByEntity('track', trackId);
      setTasks(data);
    } catch { setError(true); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [trackId, activeOrgId]);

  async function handleOpenForm() {
    if (!activeOrgId) return;
    try {
      const p = await getPeopleByOrg(activeOrgId);
      setPeople(p.filter((x) => x.displayName));
    } catch { setPeople([]); }
    setShowForm(true);
  }

  async function handleCreate() {
    if (!newTitle.trim() || !activeOrgId) return;
    setCreating(true);
    try {
      await createTask('', '', activeOrgId, {
        title: newTitle.trim(),
        priority: newPriority,
        assigneeId: newAssignee || undefined,
        dueDate: newDueDate ? new Date(newDueDate) : undefined,
        entityType: 'track',
        entityId: trackId,
      });
      setShowForm(false);
      setNewTitle('');
      setNewPriority('medium');
      setNewAssignee('');
      setNewDueDate('');
      await load();
    } catch { /* error swallowed */ } finally { setCreating(false); }
  }

  async function handleMarkDone(taskId: string) {
    await markTaskDone(taskId);
    await load();
  }

  const priorityStyles: Record<string, string> = {
    low: 'bg-surface-100 text-text-400',
    medium: 'bg-info-50 text-info-600',
    high: 'bg-warning-50 text-warning-600',
    critical: 'bg-danger-50 text-danger-600',
  };

  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="Could not load tasks" description="An error occurred while loading tasks." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        <Button variant="primary" size="sm" onClick={handleOpenForm}>Create Task</Button>
      </div>

      {tasks.length === 0 && !showForm ? (
        <EmptyState title="No tasks" description="Create tasks for this track to keep work organised." />
      ) : (
        <div className="space-y-1.5">
          {tasks.map((t) => {
            const assigneeName = people.find((p) => p.id === t.assigneeId)?.displayName ?? t.assigneeId;
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                <button
                  onClick={() => handleMarkDone(t.id)}
                  className={`shrink-0 w-4 h-4 rounded border ${t.status === 'done' ? 'bg-primary-500 border-primary-500' : 'border-surface-300 hover:border-primary-500'} flex items-center justify-center`}
                >
                  {t.status === 'done' ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${t.status === 'done' ? 'line-through text-text-500' : 'text-surface-50 font-medium'}`}>{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge label={t.priority} color={priorityStyles[t.priority] ?? 'bg-surface-100 text-text-400'} size="sm" />
                    <span className="text-xs text-text-500 capitalize">{t.status.replace(/_/g, ' ')}</span>
                    {assigneeName ? <span className="text-xs text-text-500">&middot; {assigneeName}</span> : null}
                    {t.dueDate ? <span className="text-xs text-text-500">&middot; {(t.dueDate as unknown as { toDate: () => Date }).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4 animate-slide-up">
          <p className="text-sm font-semibold text-surface-50">Create Task</p>
          <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Send stems for mastering" />
          <div>
            <label className="block text-sm font-medium text-surface-100 mb-1.5">Priority</label>
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-100 mb-1.5">Assignee</label>
            <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              <option value="">Unassigned</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
          </div>
          <Input label="Due Date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} placeholder="YYYY-MM-DD" />
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating || !newTitle.trim()}>Create</Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StubTab({ title, description }: { title: string; description: string }) {
  return (
    <EmptyState title={title} description={description} />
  );
}

function statusLabel(status: SpecStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'active': return 'Active';
    case 'completed': return 'Completed';
    default: return status;
  }
}

function statusColor(status: SpecStatus): string {
  switch (status) {
    case 'draft': return 'bg-surface-100 text-surface-700';
    case 'active': return 'bg-info-50 text-info-600';
    case 'completed': return 'bg-success-50 text-success-600';
    default: return 'bg-surface-100 text-surface-700';
  }
}

function SpecificationsTab({ trackId, activeOrgId, trackTitle }: { trackId: string; activeOrgId: string | null; trackTitle: string }) {
  const [specs, setSpecs] = useState<SpecRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedType, setSelectedType] = useState<SpecType | ''>('');
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [assignedPersonId, setAssignedPersonId] = useState('');
  const [people, setPeople] = useState<{ id: string; displayName: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [dialogSpec, setDialogSpec] = useState<SpecRecord | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getSpecificationsByTrack(trackId);
      setSpecs(data);
    } catch { setSpecs([]); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [trackId, activeOrgId]);

  async function handleSelectType(type: SpecType) {
    const template = getTemplate(type);
    const defaults: Record<string, string> = {};
    template.fields.forEach((f) => { defaults[f.key] = ''; });
    setFormFields(defaults);
    setSelectedType(type);
    setAssignedPersonId('');
    setShowPicker(false);
    setShowForm(true);
    if (activeOrgId) {
      try {
        const p = await getPeopleByOrg(activeOrgId);
        setPeople(p.filter((x) => x.displayName));
      } catch { setPeople([]); }
    }
  }

  async function handleGenerate() {
    if (!selectedType || !activeOrgId) return;
    setGenerating(true);
    try {
      await generateSpecification(trackId, activeOrgId, selectedType as SpecType, formFields, assignedPersonId || undefined);
      setShowForm(false);
      setSelectedType('');
      setFormFields({});
      await load();
    } catch { /* error swallowed */ } finally { setGenerating(false); }
  }

  function openSpec(spec: SpecRecord) {
    setDialogSpec(spec);
    setEditFields({ ...spec.fields });
  }

  async function handleSaveEdit() {
    if (!dialogSpec) return;
    setSaving(true);
    await updateSpecification(dialogSpec.id, { fields: editFields });
    setDialogSpec(null);
    setSaving(false);
    await load();
  }

  async function handleComplete(specId: string) {
    await updateSpecification(specId, { status: 'completed' });
    await load();
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-400">{specs.length} specification{specs.length !== 1 ? 's' : ''}</p>
        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (showPicker) setShowPicker(false);
              else { setShowPicker(true); setShowForm(false); }
            }}
          >
            Generate Specification
          </Button>
          {showPicker && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-surface-700/60 bg-surface-900 shadow-lg py-1 z-30 animate-slide-up">
              {(['mastering', 'mixing', 'artwork'] as SpecType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className="block w-full text-left px-4 py-2 text-sm text-surface-100 hover:bg-surface-50 transition-colors"
                  onClick={() => handleSelectType(type)}
                >
                  {type === 'mastering' ? 'Mastering' : type === 'mixing' ? 'Mixing' : 'Artwork'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && selectedType && (
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4 animate-slide-up">
          <p className="text-sm font-semibold text-surface-50">
            {selectedType === 'mastering' ? 'Mastering' : selectedType === 'mixing' ? 'Mixing' : 'Artwork'} Specification — {trackTitle}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {getTemplate(selectedType as SpecType).fields.map((f) => (
              f.type === 'text' ? (
                <TextArea key={f.key} label={f.label} value={formFields[f.key] ?? ''} onChange={(e) => setFormFields({ ...formFields, [f.key]: e.target.value })} placeholder={f.placeholder} />
              ) : (
                <Input key={f.key} label={f.label} value={formFields[f.key] ?? ''} onChange={(e) => setFormFields({ ...formFields, [f.key]: e.target.value })} placeholder={f.placeholder} />
              )
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-100 mb-1.5">Assign to (optional)</label>
            <select value={assignedPersonId} onChange={(e) => setAssignedPersonId(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              <option value="">Unassigned</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleGenerate} disabled={generating}>Generate</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setSelectedType(''); }}>Cancel</Button>
          </div>
        </div>
      )}

      {specs.length === 0 && !showForm ? (
        <EmptyState title="No specifications" description="Generate a mastering, mixing, or artwork specification for this track." />
      ) : (
        <div className="space-y-1.5">
          {specs.map((spec) => {
            const personLabel = spec.assignedPersonId ? spec.assignedPersonId : 'Unassigned';
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => openSpec(spec)}
                className="w-full text-left rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-surface-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-50">{spec.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${statusColor(spec.status)}`}>
                        {statusLabel(spec.status)}
                      </span>
                      <span className="text-xs text-text-500">{personLabel}</span>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-text-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {dialogSpec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDialogSpec(null)}>
          <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700/60 bg-surface-900 p-6 shadow-xl animate-slide-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-surface-50">{dialogSpec.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${statusColor(dialogSpec.status)}`}>
                    {statusLabel(dialogSpec.status)}
                  </span>
                  <span className="text-xs text-text-500">{dialogSpec.type === 'mastering' ? 'Mastering' : dialogSpec.type === 'mixing' ? 'Mixing' : 'Artwork'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {getTemplate(dialogSpec.type as SpecType).fields.map((f) => (
                <div key={f.key} className="rounded-lg bg-surface-50 px-3 py-2.5">
                  <p className="text-xs text-text-500 mb-0.5">{f.label}</p>
                  {f.type === 'text' ? (
                    <textarea
                      className="w-full min-h-[60px] bg-transparent text-sm text-surface-50 resize-none outline-none"
                      value={String(editFields[f.key] ?? '')}
                      onChange={(e) => setEditFields({ ...editFields, [f.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      className="w-full bg-transparent text-sm text-surface-50 outline-none"
                      value={String(editFields[f.key] ?? '')}
                      onChange={(e) => setEditFields({ ...editFields, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={saving}>Save</Button>
              {dialogSpec.status !== 'completed' && (
                <Button variant="outline" size="sm" onClick={() => { handleComplete(dialogSpec.id); setDialogSpec(null); }}>Complete</Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setDialogSpec(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'audio', label: 'Audio' },
  { value: 'artwork', label: 'Artwork' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
];

function stateBadgeColor(state: string): string {
  switch (state) {
    case 'requested': return 'bg-surface-100 text-surface-700';
    case 'assigned': return 'bg-info-50 text-info-600';
    case 'in_progress': return 'bg-warning-50 text-warning-600';
    case 'delivered': return 'bg-success-50 text-success-600';
    case 'approved': return 'bg-success-50 text-success-700';
    case 'attached': return 'bg-primary-50 text-primary-600';
    default: return 'bg-surface-100 text-surface-700';
  }
}

function AssetsTab({ trackId, activeOrgId }: { trackId: string; activeOrgId: string | null }) {
  const [assets, setAssets] = useState<TrackAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AssetType>('audio');
  const [newNotes, setNewNotes] = useState('');
  const [dialogAsset, setDialogAsset] = useState<TrackAsset | null>(null);
  const [people, setPeople] = useState<{ id: string; displayName: string }[]>([]);
  const [assignPersonId, setAssignPersonId] = useState('');
  const [deliverUrl, setDeliverUrl] = useState('');
  const [deliverFilename, setDeliverFilename] = useState('');
  const [deliverContentType, setDeliverContentType] = useState('');
  const [deliverSizeBytes, setDeliverSizeBytes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [releaseId, setReleaseId] = useState('');
  const [actionError, setActionError] = useState('');

  async function load() {
    if (!activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getAssetsByTrack(trackId);
      setAssets(data);
    } catch { setAssets([]); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [trackId, activeOrgId]);

  async function handleRequestAsset() {
    if (!newName.trim()) return;
    await createRequestedAsset(trackId, activeOrgId!, newName.trim(), newType, newNotes.trim() || undefined);
    setShowRequestForm(false);
    setNewName('');
    setNewType('audio');
    setNewNotes('');
    await load();
  }

  async function openDialog(asset: TrackAsset) {
    setDialogAsset(asset);
    setActionError('');
    setAssignPersonId('');
    setDeliverUrl('');
    setDeliverFilename('');
    setDeliverContentType('');
    setDeliverSizeBytes('');
    setRejectReason('');
    setReleaseId('');

    if (asset.lifecycleState === 'requested') {
      try {
        const { getPeopleByOrg } = await import('@/lib/people-repository');
        const p = await getPeopleByOrg(asset.organizationId);
        setPeople(p.filter((x) => x.displayName));
      } catch { setPeople([]); }
    }
  }

  async function handleAssign() {
    if (!dialogAsset || !assignPersonId) return;
    setActionError('');
    try {
      await assignAsset(dialogAsset.id, assignPersonId);
      setDialogAsset(null);
      await load();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Unknown error'); }
  }

  async function handleStart() {
    if (!dialogAsset) return;
    setActionError('');
    try {
      await startAssetWork(dialogAsset.id);
      setDialogAsset(null);
      await load();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Unknown error'); }
  }

  async function handleDeliver() {
    if (!dialogAsset) return;
    setActionError('');
    try {
      await deliverAsset(
        dialogAsset.id,
        deliverUrl.trim() || undefined,
        deliverFilename.trim() || undefined,
        deliverContentType.trim() || undefined,
        deliverSizeBytes ? Number(deliverSizeBytes) : undefined,
      );
      setDialogAsset(null);
      await load();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Unknown error'); }
  }

  async function handleApprove() {
    if (!dialogAsset) return;
    setActionError('');
    try {
      await approveAsset(dialogAsset.id);
      setDialogAsset(null);
      await load();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Unknown error'); }
  }

  async function handleAttach() {
    if (!dialogAsset || !releaseId.trim()) return;
    setActionError('');
    try {
      await attachAsset(dialogAsset.id, releaseId.trim());
      setDialogAsset(null);
      await load();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Unknown error'); }
  }

  async function handleReject() {
    if (!dialogAsset) return;
    setActionError('');
    try {
      await rejectAsset(dialogAsset.id, rejectReason.trim() || undefined);
      setDialogAsset(null);
      await load();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Unknown error'); }
  }

  const requestedAssets = assets.filter((a) => {
    const s = a.lifecycleState;
    return s === 'requested' || s === 'assigned' || s === 'in_progress';
  });

  const availableAssets = assets.filter((a) => {
    const s = a.lifecycleState;
    return s === 'delivered' || s === 'approved' || s === 'attached';
  });

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-surface-50">Requested Assets</p>
          <Button variant="outline" size="sm" onClick={() => setShowRequestForm(true)}>Request Asset</Button>
        </div>
        {requestedAssets.length === 0 ? (
          <EmptyState title="No requested assets" description="Request assets like audio, artwork, or video for this track." />
        ) : (
          <div className="space-y-1.5">
            {requestedAssets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openDialog(a)}
                className="w-full text-left rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-surface-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-50">{a.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge label={ASSET_TYPES.find((t) => t.value === a.type)?.label ?? a.type} color="bg-surface-100 text-surface-600" />
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${stateBadgeColor(a.lifecycleState)}`}>
                        {getStateLabel(a.lifecycleState)}
                      </span>
                      {a.assignedPersonId ? <span className="text-xs text-text-500">{a.assignedPersonId}</span> : null}
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-text-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-surface-50 mb-4">Available Assets</p>
        {availableAssets.length === 0 ? (
          <EmptyState title="No available assets" description="Completed assets will appear here once delivered." />
        ) : (
          <div className="space-y-1.5">
            {availableAssets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openDialog(a)}
                className="w-full text-left rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-surface-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-50">{a.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge label={ASSET_TYPES.find((t) => t.value === a.type)?.label ?? a.type} color="bg-surface-100 text-surface-600" />
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${stateBadgeColor(a.lifecycleState)}`}>
                        {getStateLabel(a.lifecycleState)}
                      </span>
                      {a.filename ? <span className="text-xs text-text-500">{a.filename}</span> : null}
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-text-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700/60 bg-surface-900 p-6 shadow-xl animate-slide-up">
            <p className="text-sm font-semibold text-surface-50 mb-4">Request Asset</p>
            <div className="space-y-4">
              <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Final Master WAV" />
              <div>
                <label className="block text-sm font-medium text-surface-100 mb-1.5">Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value as AssetType)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
                  {ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <Input label="Notes" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <Button variant="primary" size="sm" onClick={handleRequestAsset} disabled={!newName.trim()}>Request</Button>
              <Button variant="outline" size="sm" onClick={() => setShowRequestForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {dialogAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDialogAsset(null)}>
          <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700/60 bg-surface-900 p-6 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-surface-50 mb-1">{dialogAsset.name}</p>
            <div className="flex items-center gap-2 mb-4">
              <Badge label={ASSET_TYPES.find((t) => t.value === dialogAsset.type)?.label ?? dialogAsset.type} color="bg-surface-100 text-surface-600" />
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${stateBadgeColor(dialogAsset.lifecycleState)}`}>
                {getStateLabel(dialogAsset.lifecycleState)}
              </span>
            </div>

            {(dialogAsset.lifecycleState === 'delivered' || dialogAsset.lifecycleState === 'approved' || dialogAsset.lifecycleState === 'attached') && (
              <div className="mb-4 rounded-lg bg-surface-50 px-3 py-2.5 space-y-1 text-xs text-surface-200">
                {dialogAsset.url && <p><span className="font-medium">URL:</span> {dialogAsset.url}</p>}
                {dialogAsset.filename && <p><span className="font-medium">File:</span> {dialogAsset.filename}</p>}
                {dialogAsset.contentType && <p><span className="font-medium">Type:</span> {dialogAsset.contentType}</p>}
                {dialogAsset.sizeBytes != null && <p><span className="font-medium">Size:</span> {dialogAsset.sizeBytes.toLocaleString()} bytes</p>}
                {dialogAsset.notes && <p><span className="font-medium">Notes:</span> {dialogAsset.notes}</p>}
              </div>
            )}

            {actionError && (
              <p className="mb-3 text-xs text-error-500">{actionError}</p>
            )}

            <div className="space-y-3">
              {dialogAsset.lifecycleState === 'requested' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-surface-100 mb-1.5">Assign to</label>
                    <select value={assignPersonId} onChange={(e) => setAssignPersonId(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
                      <option value="">Select person...</option>
                      {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                    </select>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleAssign} disabled={!assignPersonId}>Assign</Button>
                </>
              )}

              {dialogAsset.lifecycleState === 'assigned' && (
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={handleStart}>Start Work</Button>
                  <Input label="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Optional" />
                  <Button variant="outline" size="sm" onClick={handleReject}>Reject</Button>
                </div>
              )}

              {dialogAsset.lifecycleState === 'in_progress' && (
                <>
                  <Input label="URL" value={deliverUrl} onChange={(e) => setDeliverUrl(e.target.value)} placeholder="https://..." />
                  <Input label="Filename" value={deliverFilename} onChange={(e) => setDeliverFilename(e.target.value)} placeholder="master.wav" />
                  <Input label="Content Type" value={deliverContentType} onChange={(e) => setDeliverContentType(e.target.value)} placeholder="audio/wav" />
                  <Input label="Size (bytes)" value={deliverSizeBytes} onChange={(e) => setDeliverSizeBytes(e.target.value)} placeholder="12345678" />
                  <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" onClick={handleDeliver}>Deliver</Button>
                    <Input label="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Optional" />
                    <Button variant="outline" size="sm" onClick={handleReject}>Reject</Button>
                  </div>
                </>
              )}

              {dialogAsset.lifecycleState === 'delivered' && (
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={handleApprove}>Approve</Button>
                  <Input label="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Optional" />
                  <Button variant="outline" size="sm" onClick={handleReject}>Reject</Button>
                </div>
              )}

              {dialogAsset.lifecycleState === 'approved' && (
                <>
                  <Input label="Release ID" value={releaseId} onChange={(e) => setReleaseId(e.target.value)} placeholder="Enter release ID" />
                  <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" onClick={handleAttach} disabled={!releaseId.trim()}>Attach to Release</Button>
                    <Input label="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Optional" />
                    <Button variant="outline" size="sm" onClick={handleReject}>Reject</Button>
                  </div>
                </>
              )}

              {dialogAsset.lifecycleState === 'attached' && (
                <div className="flex items-center gap-2">
                  <Input label="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Optional" />
                  <Button variant="outline" size="sm" onClick={handleReject}>Reject</Button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-surface-700/60">
              <Button variant="ghost" size="sm" onClick={() => setDialogAsset(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CREDIT_TYPES = [
  'Written By', 'Produced By', 'Mixed By', 'Mastered By',
  'Engineer', 'Recording Engineer', 'Assistant Engineer',
  'Vocal Producer', 'Vocal Arranger', 'Instrumentalist',
  'Guitar', 'Bass', 'Drums', 'Keys', 'Strings', 'Brass',
  'Programming', 'Sound Design', 'Arranger', 'Composer',
  'Lyricist', 'Remixer', 'Featured Artist',
];

const RIGHT_TYPES = [
  'composition', 'sound_recording', 'publishing',
  'mechanical', 'performing', 'neighbouring',
];

const RIGHT_STATUSES = ['active', 'pending', 'expired'];

const OWNERSHIP_TYPES = ['copyright', 'masters'];

function RightsTab({ trackId, activeOrgId }: { trackId: string; activeOrgId: string | null }) {
  const [credits, setCredits] = useState<{ record: CreditRecord; personName: string }[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [ownerships, setOwnerships] = useState<{ record: OwnershipRecord; personName: string }[]>([]);
  const [ownershipLoading, setOwnershipLoading] = useState(true);
  const [splits, setSplits] = useState<{ record: PublishingSplitRecord; personName: string }[]>([]);
  const [splitsLoading, setSplitsLoading] = useState(true);
  const [rights, setRights] = useState<TrackRightRecord[]>([]);
  const [rightsLoading, setRightsLoading] = useState(true);
  const [readiness, setReadiness] = useState<TrackRightsReadiness | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validationLoading, setValidationLoading] = useState(true);

  const [people, setPeople] = useState<{ id: string; displayName: string }[]>([]);

  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditPersonId, setCreditPersonId] = useState('');
  const [creditType, setCreditType] = useState('Written By');
  const [creditName, setCreditName] = useState('');
  const [creditOrder, setCreditOrder] = useState('0');
  const [creditSaving, setCreditSaving] = useState(false);

  const [showOwnershipForm, setShowOwnershipForm] = useState(false);
  const [ownershipPersonId, setOwnershipPersonId] = useState('');
  const [ownershipType, setOwnershipType] = useState('copyright');
  const [ownershipPct, setOwnershipPct] = useState('100');
  const [ownershipSaving, setOwnershipSaving] = useState(false);

  const [showSplitForm, setShowSplitForm] = useState(false);
  const [splitPersonId, setSplitPersonId] = useState('');
  const [splitRole, setSplitRole] = useState<'writer' | 'publisher'>('writer');
  const [splitShare, setSplitShare] = useState('100');
  const [splitIpi, setSplitIpi] = useState('');
  const [splitPro, setSplitPro] = useState('');
  const [splitSaving, setSplitSaving] = useState(false);

  const [showRightForm, setShowRightForm] = useState(false);
  const [rightType, setRightType] = useState('composition');
  const [rightTerritory, setRightTerritory] = useState('');
  const [rightStatus, setRightStatus] = useState('active');
  const [rightEffectiveDate, setRightEffectiveDate] = useState('');
  const [rightExpiryDate, setRightExpiryDate] = useState('');
  const [rightNotes, setRightNotes] = useState('');
  const [rightSaving, setRightSaving] = useState(false);

  async function loadAll() {
    if (!activeOrgId) {
      setCreditsLoading(false);
      setOwnershipLoading(false);
      setSplitsLoading(false);
      setRightsLoading(false);
      setValidationLoading(false);
      return;
    }
    await Promise.all([
      loadCredits(),
      loadOwnerships(),
      loadSplits(),
      loadRights(),
      loadValidation(),
    ]);
  }

  async function loadPeople() {
    if (!activeOrgId) return;
    try {
      const { getPeopleByOrg } = await import('@/lib/people-repository');
      const list = await getPeopleByOrg(activeOrgId);
      setPeople(list.filter((p) => p.displayName));
    } catch { setPeople([]); }
  }

  async function loadCredits() {
    setCreditsLoading(true);
    try {
      const records = await getCreditsByTrack(trackId);
      const items = await Promise.all(
        records.map(async (r) => {
          let personName = r.personId;
          try {
            const p = await getPerson(r.personId);
            if (p?.displayName) personName = p.displayName;
          } catch { /* use id */ }
          return { record: r, personName };
        }),
      );
      setCredits(items);
    } catch { setCredits([]); } finally { setCreditsLoading(false); }
  }

  async function loadOwnerships() {
    setOwnershipLoading(true);
    try {
      const records = await getOwnershipsByEntity('track', trackId);
      const items = await Promise.all(
        records.map(async (r) => {
          let personName = r.personId;
          try {
            const p = await getPerson(r.personId);
            if (p?.displayName) personName = p.displayName;
          } catch { /* use id */ }
          return { record: r, personName };
        }),
      );
      setOwnerships(items);
    } catch { setOwnerships([]); } finally { setOwnershipLoading(false); }
  }

  async function loadSplits() {
    setSplitsLoading(true);
    try {
      const records = await getPublishingSplitsByTrack(trackId);
      const items = await Promise.all(
        records.map(async (r) => {
          let personName = r.personId;
          try {
            const p = await getPerson(r.personId);
            if (p?.displayName) personName = p.displayName;
          } catch { /* use id */ }
          return { record: r, personName };
        }),
      );
      setSplits(items);
    } catch { setSplits([]); } finally { setSplitsLoading(false); }
  }

  async function loadRights() {
    setRightsLoading(true);
    try {
      const records = await getRightsByTrack(trackId);
      setRights(records);
    } catch { setRights([]); } finally { setRightsLoading(false); }
  }

  async function loadValidation() {
    setValidationLoading(true);
    try {
      const [r, v] = await Promise.all([
        computeRightsReadiness(trackId),
        validateTrackForDistribution(trackId),
      ]);
      setReadiness(r);
      setValidation(v);
    } catch { setReadiness(null); setValidation(null); } finally { setValidationLoading(false); }
  }

  async function handleAddCredit() {
    if (!creditPersonId || !activeOrgId) return;
    setCreditSaving(true);
    try {
      await createCredit({
        trackId,
        organizationId: activeOrgId,
        personId: creditPersonId,
        creditType: creditType,
        creditName: creditName.trim() || undefined,
        displayOrder: Number(creditOrder) || 0,
      });
      setShowCreditForm(false);
      setCreditPersonId('');
      setCreditType('Written By');
      setCreditName('');
      setCreditOrder('0');
      await loadCredits();
      await loadValidation();
    } catch { /* ignore */ } finally { setCreditSaving(false); }
  }

  async function handleRemoveCredit(creditId: string) {
    await deleteCredit(creditId);
    await loadCredits();
    await loadValidation();
  }

  async function handleAddOwnership() {
    if (!ownershipPersonId || !activeOrgId) return;
    setOwnershipSaving(true);
    try {
      await createOwnership({
        entityType: 'track',
        entityId: trackId,
        organizationId: activeOrgId,
        personId: ownershipPersonId,
        ownershipType: ownershipType,
        percentage: Number(ownershipPct) || 0,
      });
      setShowOwnershipForm(false);
      setOwnershipPersonId('');
      setOwnershipType('copyright');
      setOwnershipPct('100');
      await loadOwnerships();
      await loadValidation();
    } catch { /* ignore */ } finally { setOwnershipSaving(false); }
  }

  async function handleRemoveOwnership(id: string) {
    await deleteOwnership(id);
    await loadOwnerships();
    await loadValidation();
  }

  async function handleAddSplit() {
    if (!splitPersonId || !activeOrgId) return;
    setSplitSaving(true);
    try {
      await createPublishingSplit({
        trackId,
        organizationId: activeOrgId,
        personId: splitPersonId,
        role: splitRole,
        share: Number(splitShare) || 0,
        ipi: splitIpi.trim() || undefined,
        pro: splitPro.trim() || undefined,
      });
      setShowSplitForm(false);
      setSplitPersonId('');
      setSplitRole('writer');
      setSplitShare('100');
      setSplitIpi('');
      setSplitPro('');
      await loadSplits();
      await loadValidation();
    } catch { /* ignore */ } finally { setSplitSaving(false); }
  }

  async function handleRemoveSplit(id: string) {
    await deletePublishingSplit(id);
    await loadSplits();
    await loadValidation();
  }

  async function handleAddRight() {
    if (!activeOrgId) return;
    setRightSaving(true);
    try {
      await createTrackRight({
        trackId,
        organizationId: activeOrgId,
        rightType: rightType as TrackRightRecord['rightType'],
        territory: rightTerritory.trim() || 'Worldwide',
        status: rightStatus as TrackRightRecord['status'],
        effectiveDate: rightEffectiveDate.trim() || undefined,
        expiryDate: rightExpiryDate.trim() || undefined,
        notes: rightNotes.trim() || undefined,
      });
      setShowRightForm(false);
      setRightType('composition');
      setRightTerritory('');
      setRightStatus('active');
      setRightEffectiveDate('');
      setRightExpiryDate('');
      setRightNotes('');
      await loadRights();
      await loadValidation();
    } catch { /* ignore */ } finally { setRightSaving(false); }
  }

  async function handleRemoveRight(id: string) {
    await deleteTrackRight(id);
    await loadRights();
    await loadValidation();
  }

  useEffect(() => { loadAll(); }, [trackId, activeOrgId]);

  useEffect(() => { if (showCreditForm || showOwnershipForm || showSplitForm) loadPeople(); }, [showCreditForm, showOwnershipForm, showSplitForm]);

  const ownershipTotal = ownerships.reduce((sum, o) => sum + o.record.percentage, 0);
  const writerSplits = splits.filter((s) => s.record.role === 'writer');
  const publisherSplits = splits.filter((s) => s.record.role === 'publisher');
  const writerTotal = writerSplits.reduce((sum, s) => sum + s.record.share, 0);
  const publisherTotal = publisherSplits.reduce((sum, s) => sum + s.record.share, 0);

  return (
    <div className="space-y-8">
      {/* Validation Section */}
      <div>
        <p className="text-sm font-semibold text-surface-50 mb-4">Validation</p>
        {validationLoading ? (
          <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5"><LoadingState /></div>
        ) : readiness ? (
          <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4">
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-200" />
                  <circle
                    cx="24" cy="24" r="22" fill="none" strokeWidth="3" strokeLinecap="round"
                    className={readiness.percentage >= 80 ? 'stroke-success-500' : readiness.percentage >= 50 ? 'stroke-warning-500' : 'stroke-danger-500'}
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={(2 * Math.PI * 22) - ((readiness.percentage / 100) * (2 * Math.PI * 22))}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${readiness.percentage >= 80 ? 'text-success-500' : readiness.percentage >= 50 ? 'text-warning-500' : 'text-danger-500'}`}>
                  {readiness.percentage}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-50">Rights Readiness</p>
                <p className="text-xs text-text-400 mt-0.5">
                  {readiness.warnings.length > 0 ? readiness.warnings.join('; ') : 'All categories complete'}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-xs text-surface-200">
                <span className={`inline-flex w-2 h-2 rounded-full ${readiness.ownershipComplete ? 'bg-success-400' : 'bg-danger-400'}`} />
                Ownership: {readiness.ownershipTotal}%
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-200">
                <span className={`inline-flex w-2 h-2 rounded-full ${readiness.publishingComplete ? 'bg-success-400' : 'bg-danger-400'}`} />
                Publishing: W {readiness.writerShare}% / P {readiness.publisherShare}%
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-200">
                <span className={`inline-flex w-2 h-2 rounded-full ${readiness.creditsComplete ? 'bg-success-400' : 'bg-danger-400'}`} />
                Credits
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-200">
                <span className={`inline-flex w-2 h-2 rounded-full ${readiness.rightsComplete ? 'bg-success-400' : 'bg-danger-400'}`} />
                Rights
              </div>
            </div>

            {validation && validation.blockers.length > 0 && (
              <div className="rounded-lg bg-danger-50 px-3 py-2.5">
                <p className="text-xs font-medium text-danger-600 mb-1">Blockers</p>
                {validation.blockers.map((b, i) => (
                  <p key={i} className="text-xs text-danger-600">{b}</p>
                ))}
              </div>
            )}

            {validation && validation.warnings.length > 0 && (
              <div className="rounded-lg bg-warning-50 px-3 py-2.5">
                <p className="text-xs font-medium text-warning-600 mb-1">Warnings</p>
                {validation.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-warning-600">{w}</p>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Credits Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-surface-50">Credits</p>
          {!creditsLoading && (
            <Button variant="outline" size="sm" onClick={() => { loadPeople(); setShowCreditForm(true); }}>Add Credit</Button>
          )}
        </div>
        {creditsLoading ? <LoadingState /> : credits.length === 0 && !showCreditForm ? (
          <EmptyState title="No credits defined yet." description="Add contributor credits for this track." />
        ) : (
          <div className="space-y-1.5">
            {credits.map((c) => (
              <div key={c.record.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-surface-50">{c.personName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-400">{c.record.creditType}</span>
                    {c.record.creditName ? <span className="text-xs text-text-500">&middot; as {c.record.creditName}</span> : null}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveCredit(c.record.id)}>Remove</Button>
              </div>
            ))}
          </div>
        )}
        {showCreditForm && (
          <div className="mt-4 rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4">
            <p className="text-sm font-semibold text-surface-50">Add Credit</p>
            <select value={creditPersonId} onChange={(e) => setCreditPersonId(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              <option value="">Select person...</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
            <select value={creditType} onChange={(e) => setCreditType(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              {CREDIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input label="Credit Name Override" value={creditName} onChange={(e) => setCreditName(e.target.value)} placeholder="Optional alternate name" />
            <Input label="Display Order" value={creditOrder} onChange={(e) => setCreditOrder(e.target.value)} placeholder="0" />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleAddCredit} disabled={creditSaving || !creditPersonId}>Add</Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreditForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Ownership Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-surface-50">Ownership</p>
          {!ownershipLoading && (
            <Button variant="outline" size="sm" onClick={() => { loadPeople(); setShowOwnershipForm(true); }}>Add Ownership</Button>
          )}
        </div>
        {ownershipLoading ? <LoadingState /> : ownerships.length === 0 && !showOwnershipForm ? (
          <EmptyState title="No ownership defined." description="Define ownership splits for this track." />
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-400">Total Ownership</p>
                <p className={`text-sm font-bold ${ownershipTotal === 100 ? 'text-success-500' : ownershipTotal > 0 ? 'text-warning-500' : 'text-danger-500'}`}>
                  {ownershipTotal}%
                </p>
              </div>
              <ProgressBar
                value={ownershipTotal}
                max={100}
                color={ownershipTotal === 100 ? 'bg-success-500' : ownershipTotal > 0 ? 'bg-warning-500' : 'bg-danger-500'}
              />
            </div>
            <div className="space-y-1.5">
              {ownerships.map((o) => (
                <div key={o.record.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-50">{o.personName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge label={o.record.ownershipType} color="bg-info-50 text-info-600" />
                      <span className="text-xs text-text-400">{o.record.percentage}%</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveOwnership(o.record.id)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {showOwnershipForm && (
          <div className="mt-4 rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4">
            <p className="text-sm font-semibold text-surface-50">Add Ownership</p>
            <select value={ownershipPersonId} onChange={(e) => setOwnershipPersonId(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              <option value="">Select person...</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
            <select value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              {OWNERSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input label="Percentage" value={ownershipPct} onChange={(e) => setOwnershipPct(e.target.value)} placeholder="100" />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleAddOwnership} disabled={ownershipSaving || !ownershipPersonId}>Add</Button>
              <Button variant="outline" size="sm" onClick={() => setShowOwnershipForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Publishing Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-surface-50">Publishing</p>
          {!splitsLoading && (
            <Button variant="outline" size="sm" onClick={() => { loadPeople(); setShowSplitForm(true); }}>Add Split</Button>
          )}
        </div>
        {splitsLoading ? <LoadingState /> : splits.length === 0 && !showSplitForm ? (
          <EmptyState title="No publishing splits defined." description="Add writer and publisher splits for this track." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                <p className="text-xs text-text-400 mb-1">Writer Share</p>
                <p className={`text-lg font-bold ${writerTotal === 100 ? 'text-success-500' : writerTotal > 0 ? 'text-warning-500' : 'text-text-500'}`}>{writerTotal}%</p>
                <ProgressBar value={writerTotal} max={100} color={writerTotal === 100 ? 'bg-success-500' : writerTotal > 0 ? 'bg-warning-500' : 'bg-surface-300'} size="xs" className="mt-1" />
              </div>
              <div className="rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                <p className="text-xs text-text-400 mb-1">Publisher Share</p>
                <p className={`text-lg font-bold ${publisherTotal === 100 ? 'text-success-500' : publisherTotal > 0 ? 'text-warning-500' : 'text-text-500'}`}>{publisherTotal}%</p>
                <ProgressBar value={publisherTotal} max={100} color={publisherTotal === 100 ? 'bg-success-500' : publisherTotal > 0 ? 'bg-warning-500' : 'bg-surface-300'} size="xs" className="mt-1" />
              </div>
            </div>
            <div className="space-y-1.5">
              {splits.map((s) => (
                <div key={s.record.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-50">{s.personName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge label={s.record.role} color="bg-info-50 text-info-600" />
                      <span className="text-xs text-text-400">{s.record.share}%</span>
                      {s.record.ipi ? <span className="text-xs text-text-500">IPI: {s.record.ipi}</span> : null}
                      {s.record.pro ? <span className="text-xs text-text-500">PRO: {s.record.pro}</span> : null}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveSplit(s.record.id)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {showSplitForm && (
          <div className="mt-4 rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4">
            <p className="text-sm font-semibold text-surface-50">Add Split</p>
            <select value={splitPersonId} onChange={(e) => setSplitPersonId(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              <option value="">Select person...</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
            <select value={splitRole} onChange={(e) => setSplitRole(e.target.value as 'writer' | 'publisher')} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              <option value="writer">Writer</option>
              <option value="publisher">Publisher</option>
            </select>
            <Input label="Share Percentage" value={splitShare} onChange={(e) => setSplitShare(e.target.value)} placeholder="100" />
            <Input label="IPI" value={splitIpi} onChange={(e) => setSplitIpi(e.target.value)} placeholder="Interest ID" />
            <Input label="PRO" value={splitPro} onChange={(e) => setSplitPro(e.target.value)} placeholder="e.g. ASCAP, BMI" />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleAddSplit} disabled={splitSaving || !splitPersonId}>Add</Button>
              <Button variant="outline" size="sm" onClick={() => setShowSplitForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Rights Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-surface-50">Rights</p>
          {!rightsLoading && (
            <Button variant="outline" size="sm" onClick={() => setShowRightForm(true)}>Add Right</Button>
          )}
        </div>
        {rightsLoading ? <LoadingState /> : rights.length === 0 && !showRightForm ? (
          <EmptyState title="No rights defined." description="Define territorial rights for this track." />
        ) : (
          <div className="space-y-1.5">
            {rights.map((r) => {
              const statusColor = r.status === 'active' ? 'bg-success-50 text-success-600'
                : r.status === 'pending' ? 'bg-warning-50 text-warning-600'
                : 'bg-surface-100 text-surface-600';
              return (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-50">{r.rightType.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge label={r.status} color={statusColor} />
                      <span className="text-xs text-text-400">{r.territory}</span>
                      {r.effectiveDate ? <span className="text-xs text-text-500">&middot; {r.effectiveDate}</span> : null}
                      {r.notes ? <span className="text-xs text-text-500">&middot; {r.notes}</span> : null}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveRight(r.id)}>Remove</Button>
                </div>
              );
            })}
          </div>
        )}
        {showRightForm && (
          <div className="mt-4 rounded-xl border border-surface-700/60 bg-surface-900 p-5 space-y-4">
            <p className="text-sm font-semibold text-surface-50">Add Right</p>
            <select value={rightType} onChange={(e) => setRightType(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              {RIGHT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={rightStatus} onChange={(e) => setRightStatus(e.target.value)} className="block w-full h-10 rounded-lg border border-surface-700/60 bg-surface-50 px-3 text-sm">
              {RIGHT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input label="Territory" value={rightTerritory} onChange={(e) => setRightTerritory(e.target.value)} placeholder="Worldwide" />
            <Input label="Effective Date" value={rightEffectiveDate} onChange={(e) => setRightEffectiveDate(e.target.value)} placeholder="YYYY-MM-DD" />
            <Input label="Expiry Date" value={rightExpiryDate} onChange={(e) => setRightExpiryDate(e.target.value)} placeholder="YYYY-MM-DD" />
            <Input label="Notes" value={rightNotes} onChange={(e) => setRightNotes(e.target.value)} placeholder="Optional notes" />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleAddRight} disabled={rightSaving}>Add</Button>
              <Button variant="outline" size="sm" onClick={() => setShowRightForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function prodStatusColor(status: string): string {
  switch (status) {
    case 'expected': return 'bg-surface-100 text-surface-700';
    case 'submitted': return 'bg-warning-50 text-warning-600';
    case 'under_review': return 'bg-info-50 text-info-600';
    case 'approved': return 'bg-success-50 text-success-600';
    case 'changes_requested': return 'bg-danger-50 text-danger-600';
    default: return 'bg-surface-100 text-surface-700';
  }
}

function prodStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function deliveryTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    mix: 'Mix', master: 'Master', instrumental: 'Instrumental', cover: 'Cover',
    social: 'Social', banner: 'Banner', lyric_video: 'Lyric Video',
    music_video: 'Music Video', visualizer: 'Visualizer', pdf_booklet: 'PDF Booklet',
  };
  return labels[type] ?? type;
}

function deliveryCategoryLabel(type: string): string {
  const labels: Record<string, string> = {
    audio: 'Audio', artwork: 'Artwork', video: 'Video', document: 'Document', other: 'Other',
  };
  return labels[type] ?? type;
}

function reviewStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-warning-50 text-warning-600';
    case 'in_progress': return 'bg-info-50 text-info-600';
    case 'completed': return 'bg-success-50 text-success-600';
    default: return 'bg-surface-100 text-surface-700';
  }
}

function reviewOutcomeColor(outcome: string): string {
  switch (outcome) {
    case 'approved': return 'bg-success-50 text-success-600';
    case 'changes_requested': return 'bg-danger-50 text-danger-600';
    default: return 'bg-surface-100 text-surface-700';
  }
}

function ProductionTab({ trackId, activeOrgId, trackTitle: _trackTitle }: { trackId: string; activeOrgId: string | null; trackTitle: string }) {
  const [loading, setLoading] = useState(true);
  const [specs, setSpecs] = useState<SpecRecord[]>([]);
  const [deliverables, setDeliverables] = useState<ProductionDeliverableRecord[]>([]);
  const [submissionsByDeliverable, setSubmissionsByDeliverable] = useState<Record<string, SubmissionRecord[]>>({});
  const [reviewsByDeliverable, setReviewsByDeliverable] = useState<Record<string, ReviewRecord[]>>({});
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [readiness, setReadiness] = useState<ProductionReadiness | null>(null);

  useEffect(() => {
    if (!activeOrgId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const [specsData, deliverablesData, checklistsData, readinessData] = await Promise.all([
          getSpecificationsByTrack(trackId),
          getDeliverablesByTrack(trackId),
          getChecklistByTrack(trackId),
          computeProductionReadiness(trackId),
        ]);

        if (cancelled) return;
        setSpecs(specsData);
        setDeliverables(deliverablesData);
        setChecklists(checklistsData);
        setReadiness(readinessData);

        if (deliverablesData.length > 0) {
          const subResults = await Promise.all(
            deliverablesData.map((d) => getSubmissionsByDeliverable(d.id).catch(() => [] as SubmissionRecord[])),
          );
          const revResults = await Promise.all(
            deliverablesData.map((d) => getReviewsByEntity('deliverable', d.id).catch(() => [] as ReviewRecord[])),
          );
          if (cancelled) return;
          const subsMap: Record<string, SubmissionRecord[]> = {};
          const revsMap: Record<string, ReviewRecord[]> = {};
          deliverablesData.forEach((d, i) => {
            subsMap[d.id] = subResults[i] ?? [];
            revsMap[d.id] = revResults[i] ?? [];
          });
          setSubmissionsByDeliverable(subsMap);
          setReviewsByDeliverable(revsMap);
        }
      } catch { /* defaults remain */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [trackId, activeOrgId]);

  if (loading) return <LoadingState />;

  const readinessPct = readiness?.overallReadiness ?? 0;
  const readinessColor = readinessPct >= 80 ? 'text-success-500' : readinessPct >= 50 ? 'text-warning-500' : 'text-danger-500';

  return (
    <div className="space-y-8">
      {readiness && (
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5">
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-200" />
                <circle cx="24" cy="24" r="22" fill="none" strokeWidth="3" strokeLinecap="round" className={
                  readinessPct >= 80 ? 'stroke-success-500' : readinessPct >= 50 ? 'stroke-warning-500' : 'stroke-danger-500'
                } strokeDasharray={2 * Math.PI * 22} strokeDashoffset={(2 * Math.PI * 22) - ((readinessPct / 100) * (2 * Math.PI * 22))} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${readinessColor}`}>{readinessPct}%</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-surface-50">Overall Production Readiness</p>
              <p className="text-xs text-text-400 mt-0.5">
                Specs {readiness.specificationCompletion}% &middot; Deliverables {readiness.deliverableCompletion}% &middot; Checklist {readiness.checklistCompletion}%
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-400">Specifications</span>
                <span className="text-surface-200">{readiness.specificationCompletion}%</span>
              </div>
              <ProgressBar value={readiness.specificationCompletion} max={100} color={readiness.specificationCompletion >= 80 ? 'bg-success-500' : readiness.specificationCompletion >= 50 ? 'bg-warning-500' : 'bg-danger-500'} size="xs" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-400">Deliverables</span>
                <span className="text-surface-200">{readiness.deliverableCompletion}%</span>
              </div>
              <ProgressBar value={readiness.deliverableCompletion} max={100} color={readiness.deliverableCompletion >= 80 ? 'bg-success-500' : readiness.deliverableCompletion >= 50 ? 'bg-warning-500' : 'bg-danger-500'} size="xs" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-400">Checklists</span>
                <span className="text-surface-200">{readiness.checklistCompletion}%</span>
              </div>
              <ProgressBar value={readiness.checklistCompletion} max={100} color={readiness.checklistCompletion >= 80 ? 'bg-success-500' : readiness.checklistCompletion >= 50 ? 'bg-warning-500' : 'bg-danger-500'} size="xs" />
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-surface-50">Specifications</p>
          <span className="text-xs text-text-500">{specs.length} spec{specs.length !== 1 ? 's' : ''}</span>
        </div>
        {specs.length === 0 ? (
          <EmptyState title="No specifications" description="Generate specifications from the Specifications tab to see production status here." />
        ) : (
          <div className="space-y-1.5">
            {specs.map((spec) => (
              <div key={spec.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-surface-50">{spec.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${statusColor(spec.status)}`}>
                      {statusLabel(spec.status)}
                    </span>
                    <span className="text-xs text-text-500">Rev {spec.revisionNumber}</span>
                    {spec.reviewerId ? <span className="text-xs text-text-500">&middot; {spec.reviewerId.slice(0, 10)}...</span> : null}
                    {spec.assignedPersonId ? <span className="text-xs text-text-500">&middot; {spec.assignedPersonId.slice(0, 10)}...</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-surface-50">Deliverables</p>
          <span className="text-xs text-text-500">{deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''}</span>
        </div>
        {deliverables.length === 0 ? (
          <EmptyState title="No production deliverables" description="Deliverables will appear here once they are created for this track." />
        ) : (
          <div className="space-y-1.5">
            {deliverables.map((del) => (
              <div key={del.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-50 truncate">
                    {deliveryTypeLabel(del.deliverableType)} — v{del.version}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge label={deliveryCategoryLabel(del.type)} color="bg-surface-100 text-surface-600" />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${prodStatusColor(del.status)}`}>
                      {prodStatusLabel(del.status)}
                    </span>
                    {del.submittedBy ? <span className="text-xs text-text-500">{del.submittedBy.slice(0, 10)}...</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-surface-50 mb-3">Submissions</p>
        {deliverables.length === 0 ? (
          <EmptyState title="No submissions" description="Submissions are created when deliverables are submitted for review." />
        ) : (
          <div className="space-y-1.5">
            {deliverables.map((del) => {
              const subs = submissionsByDeliverable[del.id] ?? [];
              if (subs.length === 0) {
                return (
                  <div key={del.id} className="text-xs text-text-500 px-1 py-1">
                    {deliveryTypeLabel(del.deliverableType)} v{del.version} — no submissions
                  </div>
                );
              }
              return subs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-50">
                      {deliveryTypeLabel(del.deliverableType)} v{del.version} — Rev {sub.revisionNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${prodStatusColor(sub.status)}`}>
                        {prodStatusLabel(sub.status)}
                      </span>
                      <span className="text-xs text-text-500">{sub.submittedBy.slice(0, 10)}...</span>
                      {sub.submissionNotes ? <span className="text-xs text-text-500">&middot; {sub.submissionNotes.slice(0, 40)}{sub.submissionNotes.length > 40 ? '...' : ''}</span> : null}
                    </div>
                  </div>
                </div>
              ));
            })}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-surface-50 mb-3">Reviews</p>
        {deliverables.length === 0 ? (
          <EmptyState title="No reviews" description="Reviews are created when deliverables are submitted for review." />
        ) : (
          <div className="space-y-1.5">
            {deliverables.flatMap((del) => {
              const revs = reviewsByDeliverable[del.id] ?? [];
              if (revs.length === 0) return null;
              return revs.map((rev) => (
                <div key={rev.id} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-50">
                      {deliveryTypeLabel(del.deliverableType)} v{del.version}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${reviewStatusColor(rev.status)}`}>
                        {rev.status.replace(/_/g, ' ')}
                      </span>
                      {rev.outcome ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${reviewOutcomeColor(rev.outcome)}`}>
                          {rev.outcome.replace(/_/g, ' ')}
                        </span>
                      ) : null}
                      <span className="text-xs text-text-500">{rev.reviewerId.slice(0, 10)}...</span>
                      {rev.reviewerNotes ? <span className="text-xs text-text-500">&middot; {rev.reviewerNotes.slice(0, 40)}{rev.reviewerNotes.length > 40 ? '...' : ''}</span> : null}
                    </div>
                  </div>
                </div>
              ));
            }).filter(Boolean)}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-surface-50 mb-3">Checklists</p>
        {checklists.length === 0 ? (
          <EmptyState title="No checklists" description="Production checklists for this track will appear here." />
        ) : (
          <div className="space-y-4">
            {checklists.map((cl) => {
              const checkedCount = cl.items.filter((i) => i.checked).length;
              const totalCount = cl.items.length;
              const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
              return (
                <div key={cl.id} className="rounded-xl border border-surface-700/60 bg-surface-900 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-surface-50 capitalize">{cl.category}</p>
                      <p className="text-xs text-text-400 mt-0.5">{checkedCount}/{totalCount} complete</p>
                    </div>
                    <Badge label={cl.category} color="bg-info-50 text-info-600" />
                  </div>
                  <ProgressBar value={percent} max={100} color={percent >= 80 ? 'bg-success-500' : percent >= 50 ? 'bg-warning-500' : 'bg-danger-500'} size="xs" className="mb-3" />
                  <div className="space-y-1.5">
                    {cl.items.map((item) => (
                      <div key={item.key} className="flex items-center gap-2 text-sm">
                        <span className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                          item.checked ? 'bg-primary-500 border-primary-500' : 'border-surface-300'
                        }`}>
                          {item.checked ? (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span className={item.checked ? 'text-text-400 line-through' : 'text-surface-100'}>
                          {item.label}
                          {item.required ? <span className="text-danger-400 ml-0.5">*</span> : null}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
