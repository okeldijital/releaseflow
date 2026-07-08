'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useArtist, useArtists } from '@/hooks/useArtist';
import { useOrgStore } from '@/stores/org-store';
import { useActivity } from '@/hooks/useWorkflow';
import {
  editArtist, archiveArtist, restoreArtist, removeArtist,
  validateDeleteArtist, mergeArtists,
} from '@/lib/artist-service';
import { uploadArtistImage, removeArtistImage } from '@/lib/artist-media-service';
import { addArtistToGroup, removeArtistFromGroup } from '@/lib/artist-membership-repository';
import { DISCOGRAPHY_FILTERS } from '@/lib/artist-discography-service';
import type { DiscographyFilter } from '@/lib/artist-discography-service';
import {
  Avatar, Badge, Button, Card, EmptyState, Input, StatusBadge, TextArea, Select, Tabs,
  WorkspaceLayout, Skeleton, ConfirmationDialog,
} from '@releaseflow/ui';
import {
  OperationalSummary, ReadinessStack, ContextRail, HealthRing,
} from '@releaseflow/domain-ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/stores/toast-store';

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

const membershipRoleOptions = [
  { value: 'member', label: 'Member' },
  { value: 'lead', label: 'Lead' },
  { value: 'founder', label: 'Founder' },
  { value: 'manager', label: 'Manager' },
];

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

type TabId = 'overview' | 'membership' | 'discography' | 'activity';

export default function ArtistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const {
    artist, releases, credits, readiness, usage,
    discography, groups, members, loading, refresh,
  } = useArtist(id);
  const { bumpArtistCatalogue } = useArtists();
  const { activities, loading: activityLoading } = useActivity(id);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStageName, setEditStageName] = useState('');
  const [editLegalName, setEditLegalName] = useState('');
  const [editArtistType, setEditArtistType] = useState('original_artist');
  const [editBio, setEditBio] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editGenres, setEditGenres] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editIsni, setEditIsni] = useState('');
  const [editIpi, setEditIpi] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editAliases, setEditAliases] = useState('');
  const [editSocialLinks, setEditSocialLinks] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<TabId>('overview');
  const [discFilter, setDiscFilter] = useState<DiscographyFilter>('all');

  const [archiveDialog, setArchiveDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; canDelete: boolean; message: string }>({ open: false, canDelete: false, message: '' });
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [mergeDialog, setMergeDialog] = useState(false);
  const [mergeSource, setMergeSource] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeResult, setMergeResult] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add-to-group state
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [groupRoleInput, setGroupRoleInput] = useState('member');

  useEffect(() => {
    if (artist) {
      setEditName(artist.name ?? '');
      setEditStageName(artist.stageName ?? '');
      setEditLegalName(artist.legalName ?? '');
      setEditArtistType(artist.artistType ?? 'original_artist');
      setEditBio(artist.bio ?? '');
      setEditCountry(artist.country ?? '');
      setEditGenres((artist.genres ?? []).join(', '));
      setEditContact(artist.contact ?? '');
      setEditIsni(artist.isni ?? '');
      setEditIpi(artist.ipi ?? '');
      setEditNotes(artist.notes ?? '');
      setEditStatus(artist.status ?? 'active');
      setEditAliases((artist.aliases ?? []).join(', '));
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
      contact: editContact.trim() || null,
      isni: editIsni.trim() || null,
      ipi: editIpi.trim() || null,
      notes: editNotes.trim() || null,
      status: editStatus,
      aliases: editAliases ? editAliases.split(',').map((a) => a.trim()).filter(Boolean) : null,
      socialLinks: Object.keys(editSocialLinks).length > 0 ? editSocialLinks : null,
    });
    bumpArtistCatalogue();
    setEditing(false);
    await refresh();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeOrgId || !artist) return;
    setUploading(true);
    try {
      await uploadArtistImage(activeOrgId, id, file, user?.uid ?? '');
      toast.success('Artist image updated');
      await refresh();
    } catch (err) {
      toast.error('Upload failed', (err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveImage() {
    if (!activeOrgId) return;
    try {
      await removeArtistImage(activeOrgId, id);
      toast.success('Artist image removed');
      await refresh();
    } catch (err) {
      toast.error('Remove failed', (err as Error).message);
    }
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

  async function handleAddToGroup() {
    if (!activeOrgId || !groupIdInput.trim()) return;
    try {
      await addArtistToGroup({
        artistId: id,
        groupArtistId: groupIdInput.trim(),
        role: groupRoleInput,
      });
      toast.success('Added to group');
      setAddGroupOpen(false);
      setGroupIdInput('');
      await refresh();
    } catch (err) {
      toast.error('Failed', (err as Error).message);
    }
  }

  async function handleRemoveMember(membershipId: string) {
    try {
      await removeArtistFromGroup(membershipId);
      toast.success('Member removed');
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

  if (!artist) {
    return <div className="flex items-center justify-center py-20"><p className="text-text-400">Artist not found.</p></div>;
  }

  const activeReleases = releases.filter((r) => r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived');
  const completedReleases = releases.filter((r) => r.status === 'released');
  const isGroup = artist.artistType === 'band';

  const readinessItems = [
    { id: 'photo', category: 'Artist Photo', status: (artist.imageUrl ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.imageUrl ? 'Uploaded' : 'Missing' },
    { id: 'bio', category: 'Bio', status: (artist.bio ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.bio ? 'Complete' : 'Missing' },
    { id: 'genres', category: 'Genres', status: ((artist.genres?.length ?? 0) > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.genres ? artist.genres.join(', ') : 'Not specified' },
    { id: 'social', category: 'Social Links', status: (artist.socialLinks?.instagram || artist.socialLinks?.spotify ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.socialLinks?.instagram ? 'Instagram linked' : artist.socialLinks?.spotify ? 'Spotify linked' : 'No links' },
    { id: 'releases', category: 'Releases', status: ((discography?.all.length ?? 0) > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: `${discography?.all.length ?? 0} entries` },
  ];

  const readinessCategories: Record<string, { status: 'ready' | 'not-ready'; description?: string; guidance?: string }> = {};
  for (const item of readinessItems) {
    readinessCategories[item.category] = { status: item.status, description: item.description };
  }

  const healthPct = readiness?.percentage ?? Math.round(
    (readinessItems.filter((i) => i.status === 'ready').length / Math.max(1, readinessItems.length)) * 100,
  );

  const currentDiscEntries = discography ? (
    discFilter === 'all' ? discography.all : discography[discFilter]
  ) : [];

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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'membership', label: isGroup ? 'Members' : 'Membership', count: isGroup ? members.length : groups.length },
    { id: 'discography', label: 'Discography', count: discography?.all.length },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <WorkspaceLayout contextRail={contextRailContent}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/artists" className="text-sm text-text-400 hover:text-surface-50 inline-block">&larr; Back to artists</Link>
          <EntityOverflowMenu items={overflowMenuItems} aria-label="Artist actions" />
        </div>

        {/* ===== Hero ===== */}
        <header className="mb-12">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <Avatar name={artist.name} src={artist.imageUrl ?? undefined} size="xl" />
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-7 w-7 rounded-full bg-surface-900 border border-surface-700 flex items-center justify-center hover:bg-surface-700 transition-colors"
                  title="Upload image"
                >
                  <svg className="h-3.5 w-3.5 text-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {artist.imageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="h-7 w-7 rounded-full bg-surface-900 border border-surface-700 flex items-center justify-center hover:bg-danger-600/20 transition-colors"
                    title="Remove image"
                  >
                    <svg className="h-3.5 w-3.5 text-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpg,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              {uploading && <div className="absolute inset-0 rounded-full bg-surface-900/60 flex items-center justify-center"><Skeleton className="h-8 w-8 rounded-full" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">{artist.name}</h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="text-sm text-text-400">{typeLabels[artist.artistType] ?? artist.artistType}</span>
                    {artist.country && <span className="text-sm text-text-500">&middot; {artist.country}</span>}
                    <StatusBadge status={artist.status} />
                    {isGroup && <Badge label="Group" color="bg-primary-500/10 text-primary-400" size="sm" />}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-500">
                    {artist.stageName && <span>Stage: <span className="text-surface-100">{artist.stageName}</span></span>}
                    {artist.legalName && <span>Legal: <span className="text-surface-100">{artist.legalName}</span></span>}
                  </div>
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
                  {activeReleases.length} active &middot; {completedReleases.length} completed &middot; {credits.length} credits
                </span>
              </div>
              <div className="flex gap-3 mt-3">
                {artist.socialLinks?.instagram && <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Instagram</a>}
                {artist.socialLinks?.spotify && <a href={artist.socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Spotify</a>}
                {artist.socialLinks?.website && <a href={artist.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Website</a>}
              </div>
            </div>
          </div>
        </header>

        {/* ===== Health ===== */}
        <div className="mb-14">
          <OperationalSummary healthScore={healthPct} currentStage={artist.status} completedStages={completedReleases.length} totalStages={releases.length} readyItems={readinessItems.filter((i) => i.status === 'ready').length} totalItems={readinessItems.length} pendingApprovals={0} blockers={0} daysUntilRelease={activeReleases.length} />
        </div>

        <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-8" />

        {/* ===== Overview Tab ===== */}
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
                  <Input label="Aliases (comma-separated)" value={editAliases} onChange={(e) => setEditAliases(e.target.value)} />
                  <TextArea label="Biography" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
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
                      {artist.aliases && artist.aliases.length > 0 && (
                        <div><p className="text-xs text-text-400">Aliases</p><p className="text-sm text-surface-100">{artist.aliases.join(', ')}</p></div>
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
          </div>
        )}

        {/* ===== Membership Tab ===== */}
        {tab === 'membership' && (
          <div className="space-y-8">
            {isGroup ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-primary-400">Members ({members.length})</h2>
                  <Button variant="secondary" size="sm" onClick={() => setAddGroupOpen(true)}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0H9" /></svg>
                    Add Member
                  </Button>
                </div>
                {members.length === 0 ? (
                  <EmptyState title="No members" description="This group has no members yet." />
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.memberName ?? m.artistId} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-primary-400">{m.memberName ?? 'Unknown'}</p>
                            <p className="text-xs text-text-500 capitalize">{m.role}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(m.id)}>Remove</Button>
                      </div>
                    ))}
                  </div>
                )}
                {addGroupOpen && (
                  <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-4 space-y-3">
                    <Input label="Member Artist ID" value={groupIdInput} onChange={(e) => setGroupIdInput(e.target.value)} placeholder="Enter the artist ID" />
                    <Select label="Role" options={membershipRoleOptions} value={groupRoleInput} onChange={(v) => setGroupRoleInput(v)} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddToGroup}>Add</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setAddGroupOpen(false); setGroupIdInput(''); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-primary-400">Groups ({groups.length})</h2>
                  <Button variant="secondary" size="sm" onClick={() => setAddGroupOpen(true)}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0H9" /></svg>
                    Join Group
                  </Button>
                </div>
                {groups.length === 0 ? (
                  <EmptyState title="Not in any groups" description="This artist is not a member of any group." />
                ) : (
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <Link key={g.id} href={`/artists/${g.groupArtistId}`} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar name={g.groupName ?? g.groupArtistId} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-primary-400">{g.groupName ?? 'Unknown'}</p>
                            <p className="text-xs text-text-500 capitalize">{g.role}</p>
                          </div>
                        </div>
                        <svg className="h-4 w-4 text-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    ))}
                  </div>
                )}
                {addGroupOpen && (
                  <div className="rounded-lg border border-surface-700/60 bg-surface-900 p-4 space-y-3 mt-4">
                    <Input label="Group Artist ID" value={groupIdInput} onChange={(e) => setGroupIdInput(e.target.value)} placeholder="Enter the group artist ID" />
                    <Select label="Role" options={membershipRoleOptions} value={groupRoleInput} onChange={(v) => setGroupRoleInput(v)} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddToGroup}>Join</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setAddGroupOpen(false); setGroupIdInput(''); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ===== Discography Tab ===== */}
        {tab === 'discography' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-primary-400">Discography ({discography?.all.length ?? 0})</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {DISCOGRAPHY_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDiscFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    discFilter === f.id
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                      : 'bg-surface-100 dark:bg-surface-800 text-text-500 border border-transparent hover:border-surface-300 dark:hover:border-surface-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {currentDiscEntries.length === 0 ? (
              <EmptyState title="No entries" description="No discography entries match this filter." />
            ) : (
              <div className="space-y-2">
                {currentDiscEntries.map((entry) => (
                  <div key={`${entry.category}-${entry.id}`} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-200 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-primary-400 truncate">{entry.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge label={entry.releaseType} color="bg-surface-100 text-text-400" size="sm" />
                        <span className="text-xs capitalize text-text-500">{entry.role.replace(/_/g, ' ')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          entry.category === 'solo' ? 'bg-primary-500/10 text-primary-400' :
                          entry.category === 'group' ? 'bg-purple-500/10 text-purple-400' :
                          entry.category === 'appears_on' ? 'bg-amber-500/10 text-amber-400' :
                          entry.category === 'remixes' ? 'bg-cyan-500/10 text-cyan-400' :
                          entry.category === 'writing' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {entry.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    {entry.releaseType !== 'track' ? (
                      <Link href={`/releases/${entry.id}`}>
                        <Button variant="ghost" size="sm">Open</Button>
                      </Link>
                    ) : (
                      <Link href={`/tracks/${entry.id}`}>
                        <Button variant="ghost" size="sm">Open</Button>
                      </Link>
                    )}
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
            {activityLoading ? (
              <div className="text-sm text-text-500 py-4">Loading...</div>
            ) : activities.length === 0 ? (
              <EmptyState title="No activity" description="Activity will appear when this artist's releases are updated." />
            ) : (
              <div className="space-y-1">
                {activities.slice(0, 20).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                    <div>
                      <p className="text-sm text-surface-100 capitalize">{a.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-500">{a.actorId} &middot; {formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <ConfirmationDialog open={archiveDialog} onClose={() => setArchiveDialog(false)} onConfirm={handleArchive} title="Archive Artist" message="Archived artists will not appear in normal pickers but remain historically referenced." confirmLabel="Archive" loading={actionLoading} />
      <ConfirmationDialog open={restoreDialog} onClose={() => setRestoreDialog(false)} onConfirm={handleRestore} title="Restore Artist" message="Restore this artist to active status." confirmLabel="Restore" variant="default" loading={actionLoading} />
      <ConfirmationDialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, canDelete: false, message: '' })} onConfirm={confirmDelete} title={deleteDialog.canDelete ? 'Delete Artist' : 'Cannot Delete Artist'} message={deleteDialog.message} confirmLabel={deleteDialog.canDelete ? 'Delete' : 'OK'} variant={deleteDialog.canDelete ? 'danger' : 'default'} loading={actionLoading} />

      {mergeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => { setMergeDialog(false); setMergeResult(null); }} />
          <div className="relative z-10 w-full max-w-md bg-layer-2 rounded-lg border border-surface-200 dark:border-surface-700 p-6">
            <h2 className="text-base font-semibold text-surface-50 mb-4">Merge Artist Into Current</h2>
            {mergeResult ? (
              <div>
                <p className={`text-sm ${mergeResult.includes('Successfully') ? 'text-success-500' : 'text-danger-500'}`}>{mergeResult}</p>
                <Button variant="ghost" size="sm" onClick={() => { setMergeDialog(false); setMergeResult(null); setMergeSource(''); }} className="mt-4">Close</Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-text-400 mb-4">Move all relationships from another artist into <strong>{artist.name}</strong>. The source artist will be deleted after migration.</p>
                <Input label="Source Artist ID" value={mergeSource} onChange={(e) => setMergeSource(e.target.value)} placeholder="Enter the artist ID to merge from" />
                <div className="flex items-center gap-2 mt-6">
                  <Button onClick={handleMerge} loading={mergeLoading} disabled={mergeLoading || !mergeSource.trim()}>Merge</Button>
                  <Button variant="ghost" onClick={() => { setMergeDialog(false); setMergeResult(null); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
