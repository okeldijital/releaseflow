'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useWork } from '@/hooks/useWork';
import {
  editWork, archiveWork as serviceArchive, restoreWork as serviceRestore,
  addWorkWriter, removeWorkWriter,
  addWorkPublisher, removeWorkPublisher,
  linkTrackToWork, unlinkTrackFromWork,
} from '@/lib/work-service';
import {
  Avatar, Badge, Button, Card, EmptyState, Input, StatusBadge, TextArea, Select, Tabs,
  WorkspaceLayout, Skeleton, ConfirmationDialog,
} from '@releaseflow/ui';
import {
  OperationalSummary, ReadinessStack, ContextRail, HealthRing,
} from '@releaseflow/domain-ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { toast } from '@/stores/toast-store';

const genreOptions = [
  { value: '', label: 'Select genre...' },
  { value: 'pop', label: 'Pop' }, { value: 'rock', label: 'Rock' }, { value: 'hip_hop', label: 'Hip Hop' },
  { value: 'r&b', label: 'R&B' }, { value: 'electronic', label: 'Electronic' }, { value: 'dance', label: 'Dance' },
  { value: 'jazz', label: 'Jazz' }, { value: 'classical', label: 'Classical' }, { value: 'folk', label: 'Folk' },
  { value: 'afrobeat', label: 'Afrobeat' }, { value: 'amapiano', label: 'Amapiano' }, { value: 'gospel', label: 'Gospel' },
  { value: 'other', label: 'Other' },
];

const proOptions = [
  { value: '', label: 'Select PRO...' },
  { value: 'ASCAP', label: 'ASCAP' }, { value: 'BMI', label: 'BMI' }, { value: 'SESAC', label: 'SESAC' },
  { value: 'SOCAN', label: 'SOCAN' }, { value: 'PRS', label: 'PRS' }, { value: 'GEMA', label: 'GEMA' },
  { value: 'APRA', label: 'APRA' }, { value: 'CAPASSO', label: 'CAPASSO' }, { value: 'COMPASS', label: 'COMPASS' },
  { value: 'other', label: 'Other' },
];

const registrationStatusOptions = [
  { value: 'unregistered', label: 'Unregistered' },
  { value: 'pending', label: 'Pending' },
  { value: 'registered', label: 'Registered' },
  { value: 'public_domain', label: 'Public Domain' },
];

const writerRoleOptions = [
  { value: 'songwriter', label: 'Songwriter' },
  { value: 'composer', label: 'Composer' },
  { value: 'lyricist', label: 'Lyricist' },
  { value: 'arranger', label: 'Arranger' },
  { value: 'producer', label: 'Producer' },
  { value: 'beatmaker', label: 'Beatmaker' },
  { value: 'topliner', label: 'Topliner' },
];

type TabId = 'overview' | 'writers' | 'publishers' | 'recordings' | 'activity';

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    const obj = value as { seconds?: number; toDate?(): Date };
    if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000).toLocaleDateString();
    if (typeof obj.toDate === 'function') return obj.toDate().toLocaleDateString();
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  } catch {
    return '';
  }
}

export default function WorkDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    work, writers, publishers, linkedTracks, activities, readiness,
    loading, refresh,
  } = useWork(id);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAltTitle, setEditAltTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIswc, setEditIswc] = useState('');
  const [editPro, setEditPro] = useState('');
  const [editCopyrightYear, setEditCopyrightYear] = useState('');
  const [editCopyrightOwner, setEditCopyrightOwner] = useState('');
  const [editRegStatus, setEditRegStatus] = useState('unregistered');

  const [tab, setTab] = useState<TabId>('overview');
  const [archiveDialog, setArchiveDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showAddWriter, setShowAddWriter] = useState(false);
  const [newWriterPersonId, setNewWriterPersonId] = useState('');
  const [newWriterRole, setNewWriterRole] = useState('songwriter');
  const [newWriterShare, setNewWriterShare] = useState('');

  const [showAddPublisher, setShowAddPublisher] = useState(false);
  const [newPubPublisherId, setNewPubPublisherId] = useState('');
  const [newPubTerritory, setNewPubTerritory] = useState('');
  const [newPubShare, setNewPubShare] = useState('');
  const [newPubAdminType, setNewPubAdminType] = useState('');

  const [linkTrackId, setLinkTrackId] = useState('');
  const [showLinkTrack, setShowLinkTrack] = useState(false);

  useEffect(() => {
    if (work) {
      setEditTitle(work.title ?? '');
      setEditAltTitle(work.alternativeTitle ?? '');
      setEditSubtitle(work.subtitle ?? '');
      setEditLanguage(work.language ?? '');
      setEditGenre(work.genre ?? '');
      setEditDuration(work.duration?.toString() ?? '');
      setEditDescription(work.description ?? '');
      setEditIswc(work.iswc ?? '');
      setEditPro(work.pro ?? '');
      setEditCopyrightYear(work.copyrightYear?.toString() ?? '');
      setEditCopyrightOwner(work.copyrightOwner ?? '');
      setEditRegStatus(work.registrationStatus);
    }
  }, [work]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    await editWork(id, {
      title: editTitle.trim() || undefined,
      alternativeTitle: editAltTitle.trim() || null,
      subtitle: editSubtitle.trim() || null,
      language: editLanguage.trim() || null,
      genre: editGenre || null,
      duration: editDuration ? parseInt(editDuration, 10) : null,
      description: editDescription.trim() || null,
      iswc: editIswc.trim() || null,
      pro: editPro || null,
      copyrightYear: editCopyrightYear ? parseInt(editCopyrightYear, 10) : null,
      copyrightOwner: editCopyrightOwner.trim() || null,
      registrationStatus: editRegStatus as 'unregistered' | 'pending' | 'registered' | 'public_domain',
    });
    setEditing(false);
    await refresh();
  }

  const handleArchive = useCallback(async () => {
    setActionLoading(true);
    try {
      await serviceArchive(id);
      setArchiveDialog(false);
      await refresh();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }, [id, refresh]);

  const handleRestore = useCallback(async () => {
    setActionLoading(true);
    try {
      await serviceRestore(id);
      setRestoreDialog(false);
      await refresh();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }, [id, refresh]);

  async function handleAddWriter() {
    if (!newWriterPersonId.trim() || !newWriterShare) return;
    try {
      await addWorkWriter(id, {
        personId: newWriterPersonId.trim(),
        role: newWriterRole,
        ownershipShare: parseFloat(newWriterShare),
        isPrimary: writers.length === 0,
      });
      toast.success('Writer added');
      setShowAddWriter(false);
      setNewWriterPersonId('');
      setNewWriterShare('');
      await refresh();
    } catch (err) {
      toast.error('Failed', (err as Error).message);
    }
  }

  async function handleRemoveWriter(splitId: string) {
    try {
      await removeWorkWriter(splitId);
      toast.success('Writer removed');
      await refresh();
    } catch (err) {
      toast.error('Failed', (err as Error).message);
    }
  }

  async function handleAddPublisher() {
    if (!newPubPublisherId.trim() || !newPubShare) return;
    try {
      await addWorkPublisher(id, {
        publisherId: newPubPublisherId.trim(),
        territory: newPubTerritory.trim() || null,
        share: parseFloat(newPubShare),
        administrationType: newPubAdminType.trim() || null,
      });
      toast.success('Publisher added');
      setShowAddPublisher(false);
      setNewPubPublisherId('');
      setNewPubTerritory('');
      setNewPubShare('');
      setNewPubAdminType('');
      await refresh();
    } catch (err) {
      toast.error('Failed', (err as Error).message);
    }
  }

  async function handleRemovePublisher(pubId: string) {
    try {
      await removeWorkPublisher(pubId);
      toast.success('Publisher removed');
      await refresh();
    } catch (err) {
      toast.error('Failed', (err as Error).message);
    }
  }

  async function handleLinkTrack() {
    if (!linkTrackId.trim()) return;
    try {
      await linkTrackToWork(id, linkTrackId.trim());
      toast.success('Track linked');
      setShowLinkTrack(false);
      setLinkTrackId('');
      await refresh();
    } catch (err) {
      toast.error('Failed', (err as Error).message);
    }
  }

  async function handleUnlinkTrack(trackId: string) {
    try {
      await unlinkTrackFromWork(id, trackId);
      toast.success('Track unlinked');
      await refresh();
    } catch (err) {
      toast.error('Failed', (err as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <div className="flex-1 max-w-6xl mx-auto px-6 py-8">
          <Skeleton className="h-4 w-24 mb-6" />
          <div className="flex items-start gap-6 mb-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-64" /></div>
          </div>
          <Skeleton variant="card" className="h-40" />
        </div>
      </div>
    );
  }

  if (!work) {
    return <div className="flex items-center justify-center py-20"><p className="text-text-400">Work not found.</p></div>;
  }

  const readinessItems = [
    { id: 'title', category: 'Title', status: (work.title ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: work.title || 'Missing' },
    { id: 'iswc', category: 'ISWC', status: (work.iswc ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: work.iswc || 'Not assigned' },
    { id: 'writers', category: 'Writers', status: (writers.length > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: writers.length > 0 ? `${writers.length} writer(s)` : 'None' },
    { id: 'splits', category: 'Split Validation', status: (readiness?.splitValid ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: readiness?.splitValid ? '100% complete' : 'Needs attention' },
    { id: 'publishers', category: 'Publishers', status: (publishers.length > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: publishers.length > 0 ? `${publishers.length} publisher(s)` : 'None' },
    { id: 'recordings', category: 'Recordings', status: (linkedTracks.length > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: `${linkedTracks.length} linked` },
  ];

  const readinessCategories: Record<string, { status: 'ready' | 'not-ready'; description?: string; guidance?: string }> = {};
  for (const item of readinessItems) {
    readinessCategories[item.category] = { status: item.status, description: item.description };
  }

  const healthPct = readiness?.percentage ?? Math.round(
    (readinessItems.filter((i) => i.status === 'ready').length / Math.max(1, readinessItems.length)) * 100,
  );

  const overflowMenuItems = [
    { id: 'edit', label: 'Edit', onClick: () => setEditing(true) },
    ...(work.status === 'archived'
      ? [{ id: 'restore', label: 'Restore', onClick: () => setRestoreDialog(true) }]
      : [{ id: 'archive', label: 'Archive', onClick: () => setArchiveDialog(true) }]
    ),
    { id: 'delete', label: 'Delete', variant: 'danger' as const, onClick: () => setDeleteDialog(true), separatorBefore: true },
  ];

  const contextRailContent = (
    <div className="p-4 space-y-6">
      <HealthRing size="md" health={healthPct} readiness={healthPct} timelineConfidence={100} workflowCompletion={healthPct} currentStage={work.status} />
      <ReadinessStack categories={readinessCategories} />
      <ContextRail releaseName={work.title} releaseType="Work" currentStage={work.registrationStatus} releaseDate={work.pro ?? 'No PRO'} health={healthPct}       attentionItems={readiness?.missing.map((m, i) => ({ id: `missing-${i}`, label: m, type: 'deadline' as const })) ?? []} />
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'writers', label: 'Writers', count: writers.length },
    { id: 'publishers', label: 'Publishers', count: publishers.length },
    { id: 'recordings', label: 'Recordings', count: linkedTracks.length },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <WorkspaceLayout contextRail={contextRailContent}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/works" className="text-sm text-text-400 hover:text-surface-50 inline-block">&larr; Back to works</Link>
          <EntityOverflowMenu items={overflowMenuItems} aria-label="Work actions" />
        </div>

        {/* ===== Hero ===== */}
        <header className="mb-12">
          <div className="flex items-start gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">{work.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    {work.iswc && <Badge label={work.iswc} color="bg-primary-500/10 text-primary-400" size="sm" />}
                    {work.pro && <span className="text-sm text-text-400">{work.pro}</span>}
                    <StatusBadge status={work.status} />
                    <Badge label={work.registrationStatus.replace(/_/g, ' ')} color={
                      work.registrationStatus === 'registered' ? 'bg-success-500/10 text-success-600' :
                      work.registrationStatus === 'pending' ? 'bg-warning-500/10 text-warning-600' :
                      work.registrationStatus === 'public_domain' ? 'bg-surface-800 text-text-500' :
                      'bg-surface-800 text-text-500'
                    } size="sm" />
                  </div>
                  {work.subtitle && <p className="text-sm text-text-400 mt-1">{work.subtitle}</p>}
                </div>
                <div className="shrink-0">
                  <Button variant="primary" size="md" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                <span className={`text-xs font-medium ${healthPct >= 80 ? 'text-success-600' : healthPct >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                  {healthPct >= 80 ? 'Complete' : healthPct >= 50 ? 'In Progress' : 'Needs Work'} &middot; {healthPct}%
                </span>
                <span className="text-xs text-text-500">
                  {writers.length} writer{writers.length !== 1 ? 's' : ''} &middot; {publishers.length} publisher{publishers.length !== 1 ? 's' : ''} &middot; {linkedTracks.length} recording{linkedTracks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ===== Health ===== */}
        <div className="mb-14">
          <OperationalSummary healthScore={healthPct} currentStage={work.registrationStatus} completedStages={linkedTracks.length} totalStages={Math.max(1, linkedTracks.length || 1)} readyItems={readinessItems.filter((i) => i.status === 'ready').length} totalItems={readinessItems.length} pendingApprovals={0} blockers={0} daysUntilRelease={0} />
        </div>

        <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-8" />

        {/* ===== Overview Tab ===== */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-primary-400">Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
              </div>
              {editing ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Alternative Title" value={editAltTitle} onChange={(e) => setEditAltTitle(e.target.value)} />
                    <Input label="Subtitle" value={editSubtitle} onChange={(e) => setEditSubtitle(e.target.value)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Language" value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} />
                    <Select label="Genre" options={genreOptions} value={editGenre} onChange={(v) => setEditGenre(v)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Duration (seconds)" type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} />
                    <Input label="ISWC" value={editIswc} onChange={(e) => setEditIswc(e.target.value)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select label="PRO" options={proOptions} value={editPro} onChange={(v) => setEditPro(v)} />
                    <Select label="Registration Status" options={registrationStatusOptions} value={editRegStatus} onChange={(v) => setEditRegStatus(v)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Copyright Year" type="number" value={editCopyrightYear} onChange={(e) => setEditCopyrightYear(e.target.value)} />
                    <Input label="Copyright Owner" value={editCopyrightOwner} onChange={(e) => setEditCopyrightOwner(e.target.value)} />
                  </div>
                  <TextArea label="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm">Save Changes</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <Card>
                  <div className="space-y-4">
                    {work.description && <div><p className="text-sm text-text-400 mb-1">Description</p><p className="text-sm text-surface-100 whitespace-pre-wrap">{work.description}</p></div>}
                    <div className="grid grid-cols-2 gap-4">
                      {work.alternativeTitle && <div><p className="text-xs text-text-400">Alternative Title</p><p className="text-sm text-surface-100">{work.alternativeTitle}</p></div>}
                      {work.subtitle && <div><p className="text-xs text-text-400">Subtitle</p><p className="text-sm text-surface-100">{work.subtitle}</p></div>}
                      {work.language && <div><p className="text-xs text-text-400">Language</p><p className="text-sm text-surface-100">{work.language}</p></div>}
                      {work.genre && <div><p className="text-xs text-text-400">Genre</p><p className="text-sm text-surface-100 capitalize">{work.genre.replace(/_/g, ' ')}</p></div>}
                      {work.duration && <div><p className="text-xs text-text-400">Duration</p><p className="text-sm text-surface-100">{Math.floor(work.duration / 60)}:{String(work.duration % 60).padStart(2, '0')}</p></div>}
                      {work.iswc && <div><p className="text-xs text-text-400">ISWC</p><p className="text-sm text-surface-100">{work.iswc}</p></div>}
                      {work.pro && <div><p className="text-xs text-text-400">PRO</p><p className="text-sm text-surface-100">{work.pro}</p></div>}
                      {work.copyrightYear && <div><p className="text-xs text-text-400">Copyright Year</p><p className="text-sm text-surface-100">{work.copyrightYear}</p></div>}
                      {work.copyrightOwner && <div><p className="text-xs text-text-400">Copyright Owner</p><p className="text-sm text-surface-100">{work.copyrightOwner}</p></div>}
                      <div><p className="text-xs text-text-400">Registration Status</p><p className="text-sm text-surface-100 capitalize">{work.registrationStatus.replace(/_/g, ' ')}</p></div>
                    </div>
                    {!work.description && !work.alternativeTitle && !work.subtitle && !work.language && !work.genre && !work.iswc && !work.pro && (
                      <p className="text-sm text-text-500">No details yet. Click Edit to add metadata.</p>
                    )}
                  </div>
                </Card>
              )}
            </section>
          </div>
        )}

        {/* ===== Writers Tab ===== */}
        {tab === 'writers' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-primary-400">Writers ({writers.length})</h2>
              <Button variant="secondary" size="sm" onClick={() => setShowAddWriter(!showAddWriter)}>Add Writer</Button>
            </div>

            {showAddWriter && (
              <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-4 space-y-3 mb-6">
                <Input label="Person ID" value={newWriterPersonId} onChange={(e) => setNewWriterPersonId(e.target.value)} placeholder="Enter the person ID" />
                <Select label="Role" options={writerRoleOptions} value={newWriterRole} onChange={(v) => setNewWriterRole(v)} />
                <Input label="Ownership Share (%)" type="number" value={newWriterShare} onChange={(e) => setNewWriterShare(e.target.value)} placeholder="e.g. 50" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddWriter} disabled={!newWriterPersonId.trim() || !newWriterShare}>Add</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowAddWriter(false); setNewWriterPersonId(''); setNewWriterShare(''); }}>Cancel</Button>
                </div>
              </div>
            )}

            {writers.length === 0 ? (
              <EmptyState title="No writers" description="Add songwriters, composers, and lyricists to this work." />
            ) : (
              <div className="space-y-2">
                {writers.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={w.personId} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-primary-400">
                          {w.personId}
                          {w.isPrimary && <Badge label="Primary" color="bg-primary-500/10 text-primary-400" size="sm" />}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-500">
                          <span className="capitalize">{w.role}</span>
                          <span>&middot; {w.ownershipShare}%</span>
                          {w.pro && <><span>&middot;</span><span>{w.pro}</span></>}
                          {w.ipi && <><span>&middot;</span><span>IPI: {w.ipi}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-500">C: {w.collectionShare}% P: {w.publisherShare}% A: {w.administrationShare}%</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveWriter(w.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
                <Card className="mt-4">
                  <p className="text-xs text-text-400">
                    Total ownership: {writers.reduce((s, w) => s + w.ownershipShare, 0)}%
                    {writers.reduce((s, w) => s + w.ownershipShare, 0) === 100
                      ? <span className="text-success-600 ml-1">&checkmark; Valid</span>
                      : <span className="text-danger-600 ml-1">&times; Must equal 100%</span>}
                  </p>
                </Card>
              </div>
            )}
          </section>
        )}

        {/* ===== Publishers Tab ===== */}
        {tab === 'publishers' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-primary-400">Publishers ({publishers.length})</h2>
              <Button variant="secondary" size="sm" onClick={() => setShowAddPublisher(!showAddPublisher)}>Add Publisher</Button>
            </div>

            {showAddPublisher && (
              <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-4 space-y-3 mb-6">
                <Input label="Publisher ID" value={newPubPublisherId} onChange={(e) => setNewPubPublisherId(e.target.value)} placeholder="Enter publisher ID" />
                <Input label="Territory" value={newPubTerritory} onChange={(e) => setNewPubTerritory(e.target.value)} placeholder="e.g. Worldwide, USA" />
                <Input label="Share (%)" type="number" value={newPubShare} onChange={(e) => setNewPubShare(e.target.value)} placeholder="e.g. 100" />
                <Input label="Administration Type" value={newPubAdminType} onChange={(e) => setNewPubAdminType(e.target.value)} placeholder="e.g. Exclusive, Sub-publishing" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddPublisher} disabled={!newPubPublisherId.trim() || !newPubShare}>Add</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowAddPublisher(false); setNewPubPublisherId(''); setNewPubShare(''); }}>Cancel</Button>
                </div>
              </div>
            )}

            {publishers.length === 0 ? (
              <EmptyState title="No publishers" description="Add publishing administrators for this work." />
            ) : (
              <div className="space-y-2">
                {publishers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-primary-400">{p.publisherId}</p>
                      <div className="flex items-center gap-2 text-xs text-text-500">
                        {p.territory && <span>{p.territory}</span>}
                        <span>&middot; {p.share}%</span>
                        {p.administrationType && <><span>&middot;</span><span>{p.administrationType}</span></>}
                        {p.startDate ? <><span>&middot;</span><span>From: {formatDate(p.startDate)}</span></> : null}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemovePublisher(p.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== Recordings Tab ===== */}
        {tab === 'recordings' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-primary-400">Linked Recordings ({linkedTracks.length})</h2>
              <Button variant="secondary" size="sm" onClick={() => setShowLinkTrack(!showLinkTrack)}>Link Track</Button>
            </div>

            {showLinkTrack && (
              <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-4 space-y-3 mb-6">
                <Input label="Track ID" value={linkTrackId} onChange={(e) => setLinkTrackId(e.target.value)} placeholder="Enter track ID to link" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleLinkTrack} disabled={!linkTrackId.trim()}>Link</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowLinkTrack(false); setLinkTrackId(''); }}>Cancel</Button>
                </div>
              </div>
            )}

            {linkedTracks.length === 0 ? (
              <EmptyState title="No recordings linked" description="Link tracks (recordings) that are based on this composition." />
            ) : (
              <div className="space-y-2">
                {linkedTracks.map((t) => (
                  <div key={t.trackId} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-semibold text-primary-400 shrink-0">T</span>
                      <div>
                        <p className="text-sm font-medium text-primary-400">{t.trackId}</p>
                        <p className="text-xs text-text-500">Linked {formatDate(t.linkedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/tracks/${t.trackId}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleUnlinkTrack(t.trackId)}>Unlink</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== Activity Tab ===== */}
        {tab === 'activity' && (
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Activity</h2>
            {activities.length === 0 ? (
              <EmptyState title="No activity" description="Activity will appear when this work is updated." />
            ) : (
              <div className="space-y-1">
                {activities.slice(0, 20).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                    <div>
                      <p className="text-sm text-surface-100 capitalize">{a.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-500">{a.actorId} &middot; {formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <ConfirmationDialog open={archiveDialog} onClose={() => setArchiveDialog(false)} onConfirm={handleArchive} title="Archive Work" message="Archived works will not appear in normal pickers but remain historically referenced." confirmLabel="Archive" loading={actionLoading} />
      <ConfirmationDialog open={restoreDialog} onClose={() => setRestoreDialog(false)} onConfirm={handleRestore} title="Restore Work" message="Restore this work to active status." confirmLabel="Restore" variant="default" loading={actionLoading} />
      <ConfirmationDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={() => {}} title="Delete Work" message="Use Archive instead. Works with linked recordings cannot be deleted." confirmLabel="OK" variant="default" loading={actionLoading} />
    </WorkspaceLayout>
  );
}
