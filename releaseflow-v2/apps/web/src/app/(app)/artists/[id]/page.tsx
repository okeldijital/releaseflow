'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useArtist, useArtists } from '@/hooks/useArtist';
import { useOrgStore } from '@/stores/org-store';
import { useActivity } from '@/hooks/useWorkflow';
import {
  editArtist, archiveArtist, restoreArtist, removeArtist,
  validateDeleteArtist, mergeArtists,
} from '@/lib/artist-service';
import {
  Avatar, Badge, Button, Card, EmptyState, Input, StatusBadge, TextArea, Select, Tabs,
  WorkspaceLayout, Skeleton, ConfirmationDialog,
} from '@releaseflow/ui';
import {
  OperationalSummary, ReadinessStack, ContextRail, HealthRing,
} from '@releaseflow/domain-ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';

const typeLabels: Record<string, string> = {
  original_artist: 'Original Artist', remix_artist: 'Remix Artist',
  cover_artist: 'Cover Artist', producer: 'Producer', dj: 'DJ',
  band: 'Band', label: 'Label',
};

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const artistTypeOptions = [
  { value: 'original_artist', label: 'Original Artist' },
  { value: 'remix_artist', label: 'Remix Artist' },
  { value: 'cover_artist', label: 'Cover Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'dj', label: 'DJ' },
  { value: 'band', label: 'Band' },
  { value: 'label', label: 'Label' },
];

const TAB_IDS = ['overview', 'releases', 'credits', 'usage', 'activity'] as const;
type TabId = typeof TAB_IDS[number];

export default function ArtistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { activeOrgId } = useOrgStore();
  const { artist, releases, credits, readiness, usage, loading, refresh } = useArtist(id);
  const { bumpArtistCatalogue } = useArtists();
  const { activities, loading: activityLoading } = useActivity(id);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStageName, setEditStageName] = useState('');
  const [editLegalName, setEditLegalName] = useState('');
  const [editArtistType, setEditArtistType] = useState('original_artist');
  const [editBio, setEditBio] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editGenres, setEditGenres] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editIsni, setEditIsni] = useState('');
  const [editIpi, setEditIpi] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editSocialLinks, setEditSocialLinks] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<TabId>('overview');

  const [archiveDialog, setArchiveDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; canDelete: boolean; message: string }>({ open: false, canDelete: false, message: '' });
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [mergeDialog, setMergeDialog] = useState(false);
  const [mergeSource, setMergeSource] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeResult, setMergeResult] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (artist) {
      setEditName(artist.name ?? '');
      setEditStageName(artist.stageName ?? '');
      setEditLegalName(artist.legalName ?? '');
      setEditArtistType(artist.artistType ?? 'original_artist');
      setEditBio(artist.bio ?? '');
      setEditCountry(artist.country ?? '');
      setEditGenres((artist.genres ?? []).join(', '));
      setEditImageUrl(artist.imageUrl ?? '');
      setEditContact(artist.contact ?? '');
      setEditIsni(artist.isni ?? '');
      setEditIpi(artist.ipi ?? '');
      setEditNotes(artist.notes ?? '');
      setEditStatus(artist.status ?? 'active');
      setEditSocialLinks(artist.socialLinks ?? {});
    }
  }, [artist]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    await editArtist(activeOrgId, id, {
      name: editName.trim() || undefined,
      stageName: editStageName.trim() || null,
      legalName: editLegalName.trim() || null,
      artistType: editArtistType,
      bio: editBio.trim() || null,
      country: editCountry.trim() || null,
      genres: editGenres ? editGenres.split(',').map((g) => g.trim()).filter(Boolean) : null,
      imageUrl: editImageUrl.trim() || null,
      contact: editContact.trim() || null,
      isni: editIsni.trim() || null,
      ipi: editIpi.trim() || null,
      notes: editNotes.trim() || null,
      status: editStatus,
      socialLinks: Object.keys(editSocialLinks).length > 0 ? editSocialLinks : null,
    });
    bumpArtistCatalogue();
    setEditing(false);
    await refresh();
  }

  const handleArchive = useCallback(async () => {
    if (!activeOrgId) return;
    setActionLoading(true);
    try {
      await archiveArtist(activeOrgId, id);
      bumpArtistCatalogue();
      setArchiveDialog(false);
      await refresh();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }, [activeOrgId, id, bumpArtistCatalogue, refresh]);

  const handleRestore = useCallback(async () => {
    if (!activeOrgId) return;
    setActionLoading(true);
    try {
      await restoreArtist(activeOrgId, id);
      bumpArtistCatalogue();
      setRestoreDialog(false);
      await refresh();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }, [activeOrgId, id, bumpArtistCatalogue, refresh]);

  const handleDeleteClick = useCallback(async () => {
    if (!activeOrgId) return;
    const result = await validateDeleteArtist(activeOrgId, id);
    if (result.allowed) {
      setDeleteDialog({ open: true, canDelete: true, message: 'This action cannot be undone.' });
    } else {
      const refs = result.references;
      const parts: string[] = [];
      if (refs.tracks > 0) parts.push(`${refs.tracks} Track${refs.tracks !== 1 ? 's' : ''}`);
      if (refs.releases > 0) parts.push(`${refs.releases} Release${refs.releases !== 1 ? 's' : ''}`);
      if (refs.publishingRecords > 0) parts.push(`${refs.publishingRecords} Publishing Record${refs.publishingRecords !== 1 ? 's' : ''}`);
      setDeleteDialog({ open: true, canDelete: false, message: `This artist is used by:\n\n${parts.join('\n')}\n\nDelete is unavailable until these references are removed or reassigned.` });
    }
  }, [activeOrgId, id]);

  const confirmDelete = useCallback(async () => {
    if (!activeOrgId) return;
    setActionLoading(true);
    try {
      await removeArtist(activeOrgId, id);
      bumpArtistCatalogue();
      router.push('/artists');
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }, [activeOrgId, id, bumpArtistCatalogue, router]);

  const handleMerge = useCallback(async () => {
    if (!activeOrgId || !mergeSource) return;
    setMergeLoading(true);
    setMergeResult(null);
    try {
      const result = await mergeArtists(activeOrgId, mergeSource, id);
      setMergeResult(result.message);
      if (result.success) {
        bumpArtistCatalogue();
        setTimeout(() => {
          setMergeDialog(false);
          setMergeSource('');
          setMergeResult(null);
          void refresh();
        }, 1500);
      }
    } catch {
      setMergeResult('Merge failed');
    } finally {
      setMergeLoading(false);
    }
  }, [activeOrgId, mergeSource, id, bumpArtistCatalogue, refresh]);

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

  if (!artist) {
    return <div className="flex items-center justify-center py-20"><p className="text-text-400">Artist not found.</p></div>;
  }

  const activeReleases = releases.filter((r) => r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived');
  const completedReleases = releases.filter((r) => r.status === 'released');

  const readinessItems = [
    { id: 'photo', category: 'Artist Photo', status: (artist.imageUrl ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.imageUrl ? 'Uploaded' : 'Missing' },
    { id: 'bio', category: 'Bio', status: (artist.bio ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.bio ? 'Complete' : 'Missing' },
    { id: 'genres', category: 'Genres', status: ((artist.genres?.length ?? 0) > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.genres ? artist.genres.join(', ') : 'Not specified' },
    { id: 'social', category: 'Social Links', status: (artist.socialLinks?.instagram || artist.socialLinks?.spotify ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.socialLinks?.instagram ? 'Instagram linked' : artist.socialLinks?.spotify ? 'Spotify linked' : 'No links' },
    { id: 'releases', category: 'Releases', status: (releases.length > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: `${releases.length} release${releases.length !== 1 ? 's' : ''}` },
  ];

  const readinessCategories: Record<string, { status: 'ready' | 'not-ready'; description?: string; guidance?: string }> = {};
  for (const item of readinessItems) {
    readinessCategories[item.category] = { status: item.status, description: item.description };
  }

  const healthPct = readiness?.percentage ?? Math.round(
    (readinessItems.filter((i) => i.status === 'ready').length / Math.max(1, readinessItems.length)) * 100
  );

  const overflowMenuItems = [
    { id: 'edit', label: 'Edit', onClick: () => setEditing(true) },
    ...(artist.status === 'archived'
      ? [{ id: 'restore', label: 'Restore', onClick: () => setRestoreDialog(true) }]
      : [{ id: 'archive', label: 'Archive', onClick: () => setArchiveDialog(true) }]
    ),
    { id: 'merge', label: 'Merge Into...', onClick: () => setMergeDialog(true) },
    { id: 'delete', label: 'Delete', variant: 'danger' as const, onClick: handleDeleteClick, separatorBefore: true },
  ];

  const contextRailContent = (
    <div className="p-4 space-y-6">
      <HealthRing size="md" health={healthPct} readiness={healthPct} timelineConfidence={activeReleases.length > 0 ? 70 : 100} workflowCompletion={healthPct} currentStage={artist.status} />
      <ReadinessStack categories={readinessCategories} />
      <ContextRail releaseName={artist.name} releaseType={typeLabels[artist.artistType] ?? artist.artistType} currentStage={artist.status} releaseDate={artist.country ?? 'Unknown'} health={healthPct} attentionItems={readiness?.missing.map((m, i) => ({ id: `missing-${i}`, label: m, type: 'deadline' as const })) ?? []} />
      {usage && (
        <div className="space-y-2 pt-4 border-t border-surface-700/60">
          <p className="text-xs font-semibold text-text-400 uppercase tracking-wider">Usage</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-text-500">Tracks:</span>
            <span className="text-surface-50 text-right">{usage.tracks}</span>
            <span className="text-text-500">Releases:</span>
            <span className="text-surface-50 text-right">{usage.releases}</span>
            <span className="text-text-500">Publishing Credits:</span>
            <span className="text-surface-50 text-right">{usage.publishingCredits}</span>
            <span className="text-text-500">Featured:</span>
            <span className="text-surface-50 text-right">{usage.featuredAppearances}</span>
            <span className="text-text-500">Remixes:</span>
            <span className="text-surface-50 text-right">{usage.remixes}</span>
          </div>
        </div>
      )}
    </div>
  );

  const tabs = TAB_IDS.map((t) => ({
    id: t,
    label: t === 'overview' ? 'Overview' : t.charAt(0).toUpperCase() + t.slice(1),
    count: t === 'releases' ? releases.length : t === 'credits' ? credits.length : undefined,
  }));

  return (
    <WorkspaceLayout contextRail={contextRailContent}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/artists" className="text-sm text-text-400 hover:text-surface-50 inline-block">&larr; Back to artists</Link>
          <EntityOverflowMenu items={overflowMenuItems} aria-label="Artist actions" />
        </div>

        {/* ===== Artist Hero ===== */}
        <header className="mb-12">
          <div className="flex items-start gap-5">
            <Avatar name={artist.name} src={artist.imageUrl ?? undefined} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[1.75rem] font-semibold text-primary-400 tracking-tight">{artist.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="text-sm text-text-400">{typeLabels[artist.artistType] ?? artist.artistType}</span>
                    {artist.country ? <span className="text-sm text-text-500">&middot; {artist.country}</span> : null}
                    <StatusBadge status={artist.status} />
                  </div>
                  {(artist.stageName || artist.legalName) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-500">
                      {artist.stageName && <span>Stage: {artist.stageName}</span>}
                      {artist.legalName && <span>Legal: {artist.legalName}</span>}
                    </div>
                  )}
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
                <span className="text-xs text-text-500">{activeReleases.length} active &middot; {completedReleases.length} completed &middot; {credits.length} credits</span>
              </div>

              <div className="flex gap-3 mt-3">
                {artist.socialLinks?.instagram ? <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Instagram</a> : null}
                {artist.socialLinks?.spotify ? <a href={artist.socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Spotify</a> : null}
                {artist.socialLinks?.website ? <a href={artist.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Website</a> : null}
              </div>
            </div>
          </div>
        </header>

        {/* ===== Artist Health ===== */}
        <div className="mb-14">
          <OperationalSummary healthScore={healthPct} currentStage={artist.status} completedStages={completedReleases.length} totalStages={releases.length} readyItems={readinessItems.filter((i) => i.status === 'ready').length} totalItems={readinessItems.length} pendingApprovals={0} blockers={0} daysUntilRelease={activeReleases.length} />
        </div>

        <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-8" />

        {tab === 'overview' && (
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-primary-400">Profile</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
              </div>
              {editing ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Stage Name" value={editStageName} onChange={(e) => setEditStageName(e.target.value)} />
                    <Input label="Legal Name" value={editLegalName} onChange={(e) => setEditLegalName(e.target.value)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select label="Artist Type" options={artistTypeOptions} value={editArtistType} onChange={(v) => setEditArtistType(v)} />
                    <Select label="Status" options={statusOptions} value={editStatus} onChange={(v) => setEditStatus(v)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Country" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
                    <Input label="Contact" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
                  </div>
                  <Input label="Genres (comma-separated)" value={editGenres} onChange={(e) => setEditGenres(e.target.value)} />
                  <TextArea label="Biography" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
                  <Input label="Image URL" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="ISNI" value={editIsni} onChange={(e) => setEditIsni(e.target.value)} />
                    <Input label="IPI" value={editIpi} onChange={(e) => setEditIpi(e.target.value)} />
                  </div>
                  <TextArea label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
                  <details className="group">
                    <summary className="text-sm font-medium text-text-400 hover:text-surface-50 cursor-pointer">Social Links</summary>
                    <div className="mt-3 space-y-3 pl-2">
                      <Input label="Instagram" value={editSocialLinks.instagram ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, instagram: e.target.value }))} />
                      <Input label="Spotify" value={editSocialLinks.spotify ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, spotify: e.target.value }))} />
                      <Input label="Website" value={editSocialLinks.website ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, website: e.target.value }))} />
                      <Input label="SoundCloud" value={editSocialLinks.soundcloud ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, soundcloud: e.target.value }))} />
                      <Input label="Twitter" value={editSocialLinks.twitter ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, twitter: e.target.value }))} />
                    </div>
                  </details>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm">Save Changes</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <Card>
                  <div className="space-y-4">
                    {artist.bio && <div><p className="text-sm text-text-400 mb-1">Biography</p><p className="text-sm text-surface-100 whitespace-pre-wrap">{artist.bio}</p></div>}
                    <div className="grid grid-cols-2 gap-4">
                      {artist.stageName && <div><p className="text-xs text-text-400">Stage Name</p><p className="text-sm text-surface-100">{artist.stageName}</p></div>}
                      {artist.legalName && <div><p className="text-xs text-text-400">Legal Name</p><p className="text-sm text-surface-100">{artist.legalName}</p></div>}
                      {artist.country && <div><p className="text-xs text-text-400">Country</p><p className="text-sm text-surface-100">{artist.country}</p></div>}
                      {artist.contact && <div><p className="text-xs text-text-400">Contact</p><p className="text-sm text-surface-100">{artist.contact}</p></div>}
                      {artist.isni && <div><p className="text-xs text-text-400">ISNI</p><p className="text-sm text-surface-100">{artist.isni}</p></div>}
                      {artist.ipi && <div><p className="text-xs text-text-400">IPI</p><p className="text-sm text-surface-100">{artist.ipi}</p></div>}
                      {artist.genres && artist.genres.length > 0 && (
                        <div><p className="text-xs text-text-400">Genres</p><p className="text-sm text-surface-100">{artist.genres.join(', ')}</p></div>
                      )}
                    </div>
                    {artist.notes && <div><p className="text-xs text-text-400">Notes</p><p className="text-sm text-surface-100 whitespace-pre-wrap">{artist.notes}</p></div>}
                    {!artist.bio && !artist.stageName && !artist.legalName && !artist.country && !artist.isni && !artist.ipi && !artist.notes && (
                      <p className="text-sm text-text-500">No profile details yet.</p>
                    )}
                  </div>
                </Card>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold text-primary-400 mb-4">Active Releases ({activeReleases.length})</h2>
              {activeReleases.length === 0 ? (
                <EmptyState title="No active releases" description="Active releases will appear here when this artist is linked to a release in progress." />
              ) : (
                <div className="space-y-3">
                  {activeReleases.map((r) => (
                     <Link key={r.id} href={`/releases/${r.id}`} className="block rounded-lg border border-surface-700/60 bg-surface-900 p-4 hover:border-primary-200 hover:shadow-raised transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div><span className="text-base font-semibold text-primary-400">{r.title}</span><Badge label={r.releaseType} color="bg-surface-100 text-text-400" size="sm" className="ml-2" /><span className="text-sm text-text-500 ml-2 capitalize">{r.role.replace(/_/g, ' ')}</span></div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center justify-between"><span className="text-xs text-text-500">Active release</span><span className="text-xs text-primary-500 font-medium">Open Release &rarr;</span></div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {completedReleases.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-primary-400 mb-4">Completed Releases ({completedReleases.length})</h2>
                <div className="space-y-2">
                  {completedReleases.map((r) => (
                    <Link key={r.id} href={`/releases/${r.id}`} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3 hover:bg-surface-50 transition-colors">
                      <div><span className="text-sm font-medium text-primary-400">{r.title}</span><Badge label={r.releaseType} color="bg-surface-100 text-text-400" size="sm" className="ml-2" /></div>
                      <StatusBadge status="completed" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === 'releases' && (
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Discography ({releases.length})</h2>
            {releases.length === 0 ? <EmptyState title="No releases" description="Not linked to any releases yet." /> : (
              <div className="space-y-2">
                {releases.map((r) => (
                  <Link key={r.id} href={`/releases/${r.id}`} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-200 transition-colors">
                    <div><p className="text-sm font-medium text-primary-400 truncate">{r.title}</p><div className="flex items-center gap-2 mt-0.5"><Badge label={r.releaseType} color="bg-surface-100 text-text-400" size="sm" /><span className="text-xs capitalize text-text-500">{r.role.replace(/_/g, ' ')}</span></div></div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'credits' && (
          <section>
              <h2 className="text-base font-semibold text-primary-400 mb-4">Track Credits ({credits.length})</h2>
            {credits.length === 0 ? <EmptyState title="No track credits" description="No track credits recorded yet." /> : (
              <div className="grid gap-2 sm:grid-cols-2">
                {credits.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3">
                    <p className="text-sm text-surface-50 truncate">{c.trackTitle ?? c.trackId}</p>
                    <span className="text-xs capitalize text-text-500 shrink-0 ml-2">{c.role.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'usage' && (
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Usage Summary</h2>
            {usage ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-5">
                  <p className="text-2xl font-bold text-primary-400">{usage.tracks}</p>
                  <p className="text-sm text-text-400 mt-1">Tracks</p>
                </div>
                <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-5">
                  <p className="text-2xl font-bold text-primary-400">{usage.releases}</p>
                  <p className="text-sm text-text-400 mt-1">Releases</p>
                </div>
                <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-5">
                  <p className="text-2xl font-bold text-primary-400">{usage.publishingCredits}</p>
                  <p className="text-sm text-text-400 mt-1">Publishing Credits</p>
                </div>
                <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-5">
                  <p className="text-2xl font-bold text-primary-400">{usage.featuredAppearances}</p>
                  <p className="text-sm text-text-400 mt-1">Featured Appearances</p>
                </div>
                <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-5">
                  <p className="text-2xl font-bold text-primary-400">{usage.remixes}</p>
                  <p className="text-sm text-text-400 mt-1">Remixes</p>
                </div>
              </div>
            ) : (
              <EmptyState title="No usage data" description="Usage statistics will appear when this artist is linked to tracks, releases, and credits." />
            )}
          </section>
        )}

        {tab === 'activity' && (
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Activity</h2>
            {activityLoading ? <div className="text-sm text-text-500 py-4">Loading&hellip;</div> : activities.length === 0 ? <EmptyState title="No activity" description="Activity will appear when this artist&apos;s releases are updated." /> : (
              <div className="space-y-1">
                {activities.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                    <div><p className="text-sm text-surface-100 capitalize">{a.type.replace(/_/g, ' ')}</p><p className="text-xs text-text-500">{a.actorId} &middot; {a.createdAt.toLocaleDateString()}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <ConfirmationDialog
        open={archiveDialog}
        onClose={() => setArchiveDialog(false)}
        onConfirm={handleArchive}
        title="Archive Artist"
        message="Archived artists will not appear in normal pickers but remain historically referenced."
        confirmLabel="Archive"
        loading={actionLoading}
      />

      <ConfirmationDialog
        open={restoreDialog}
        onClose={() => setRestoreDialog(false)}
        onConfirm={handleRestore}
        title="Restore Artist"
        message="Restore this artist to active status."
        confirmLabel="Restore"
        variant="default"
        loading={actionLoading}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, canDelete: false, message: '' })}
        onConfirm={confirmDelete}
        title={deleteDialog.canDelete ? 'Delete Artist' : 'Cannot Delete Artist'}
        message={deleteDialog.message}
        confirmLabel={deleteDialog.canDelete ? 'Delete' : 'OK'}
        variant={deleteDialog.canDelete ? 'danger' : 'default'}
        loading={actionLoading}
      />

      {mergeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => { setMergeDialog(false); setMergeResult(null); }} />
          <div className="relative z-10 w-full max-w-md bg-layer-2 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
            <h2 className="text-base font-semibold text-surface-50 mb-4">
              Merge Artist Into Current
            </h2>
            {mergeResult ? (
              <div>
                <p className={`text-sm ${mergeResult.includes('Successfully') ? 'text-success-500' : 'text-danger-500'}`}>{mergeResult}</p>
                <Button variant="ghost" size="sm" onClick={() => { setMergeDialog(false); setMergeResult(null); setMergeSource(''); }} className="mt-4">
                  Close
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-text-400 mb-4">
                  Move all relationships from another artist into <strong>{artist.name}</strong>. The source artist will be deleted after migration.
                </p>
                <Input
                  label="Source Artist ID"
                  value={mergeSource}
                  onChange={(e) => setMergeSource(e.target.value)}
                  placeholder="Enter the artist ID to merge from"
                />
                <div className="flex items-center gap-2 mt-6">
                  <Button onClick={handleMerge} loading={mergeLoading} disabled={mergeLoading || !mergeSource.trim()}>
                    Merge
                  </Button>
                  <Button variant="ghost" onClick={() => { setMergeDialog(false); setMergeResult(null); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
