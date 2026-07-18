'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useArtist } from '@/hooks/useArtist';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/stores/toast-store';
import {
  editArtist, archiveArtist, restoreArtist, removeArtist,
  validateDeleteArtist, linkArtistToRelease, unlinkArtistFromRelease,
} from '@/lib/artist-service';
import { uploadArtistImage, removeArtistImage } from '@/lib/artist-media-service';
import { addArtistToTrack, removeArtistFromTrack } from '@/lib/track-artist-repository';
import { fetchReleasesByArtist, fetchReleasesByOrg } from '@/lib/release-service';
import { fetchTracksByArtist, fetchTracksByOrg } from '@/lib/track-service';
import type { Release } from '@/app/(app)/types';
import {
  Avatar, Button, Card, EmptyState, LoadingState, Input, StatusBadge, TextArea, Select, Tabs,
  ConfirmationDialog,
} from '@releaseflow/ui';
import { EntityOverflowMenu, type EntityOverflowMenuItem } from '@/components/entity-overflow-menu';
import { TrackRow, TrackList } from '@/components/shared/track-row';
import { ReleaseCard } from '@/components/release/cards/ReleaseCard';
import { ArtworkPlaceholder } from '@/components/release/artwork-display';
import { SearchableGenreSelect } from '@/components/shared/searchable-genre-select';
import { AssignmentsSection } from '@/components/assignments-section';
import { AssignmentDialog } from '@/components/assignment-dialog';

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

const creditRoleLabels: Record<string, string> = {
  PRIMARY_ARTIST: 'Primary Artist',
  FEATURED_ARTIST: 'Featured Artist',
  ORIGINAL_ARTIST: 'Original Artist',
  REMIX_ARTIST: 'Remixer',
  PRODUCER: 'Producer',
  WRITER: 'Writer',
  COMPOSER: 'Composer',
  MIX_ENGINEER: 'Mix Engineer',
  MASTERING_ENGINEER: 'Mastering Engineer',
};

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

type TabId = 'overview' | 'discography' | 'credits' | 'assignments' | 'activity' | 'edit';

export default function ArtistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const {
    artist, releases, credits, tracks,
    discography, activities, activitiesLoading, loading, refresh,
  } = useArtist(id);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [tab, setTab] = useState<TabId>('overview');
  const [editName, setEditName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editLegalName, setEditLegalName] = useState('');
  const [editArtistType, setEditArtistType] = useState('original_artist');
  const [editBio, setEditBio] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editSubgenre, setEditSubgenre] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editIsni, setEditIsni] = useState('');
  const [editIpi, setEditIpi] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editSocialLinks, setEditSocialLinks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [archiveDialog, setArchiveDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; canDelete: boolean; message: string }>({ open: false, canDelete: false, message: '' });
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Relationship management (Discography + Edit tabs)
  const [linkedReleases, setLinkedReleases] = useState<Release[]>([]);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [linkReleaseOpen, setLinkReleaseOpen] = useState(false);
  const [releaseSearch, setReleaseSearch] = useState('');
  const [linkReleaseBusy, setLinkReleaseBusy] = useState(false);

  const [linkedTracks, setLinkedTracks] = useState<{ id: string; title: string; version?: string | null; status: string }[]>([]);
  const [trackLoading, setTrackLoading] = useState(false);
  const [linkTrackOpen, setLinkTrackOpen] = useState(false);
  const [trackSearch, setTrackSearch] = useState('');
  const [linkTrackBusy, setLinkTrackBusy] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('edit') === '1') setTab('edit');
  }, [searchParams]);

  useEffect(() => {
    if (artist) {
      setEditName(artist.name ?? '');
      setEditDisplayName(artist.stageName ?? '');
      setEditLegalName(artist.legalName ?? '');
      setEditArtistType(artist.artistType ?? 'original_artist');
      setEditBio(artist.bio ?? '');
      setEditCountry(artist.country ?? '');
      setEditLanguage((artist as { language?: string }).language ?? '');
      setEditWebsite((artist.socialLinks?.website as string) ?? '');
      setEditGenre((artist.genres ?? [])[0] ?? '');
      setEditSubgenre((artist.genres ?? [])[1] ?? '');
      setEditContact(artist.contact ?? '');
      setEditIsni(artist.isni ?? '');
      setEditIpi(artist.ipi ?? '');
      setEditStatus(artist.status ?? 'active');
      setEditSocialLinks(artist.socialLinks ?? {});
    }
  }, [artist]);

  const loadRelationships = useCallback(async () => {
    if (!activeOrgId) return;
    setReleaseLoading(true);
    setTrackLoading(true);
    try {
      const [rels, trks] = await Promise.all([
        fetchReleasesByArtist(activeOrgId, id),
        fetchTracksByArtist(activeOrgId, id),
      ]);
      setLinkedReleases(rels);
      setLinkedTracks(trks.map((t) => ({ id: t.id, title: t.title, version: t.version ?? null, status: t.status })));
    } catch {
      // silent
    } finally {
      setReleaseLoading(false);
      setTrackLoading(false);
    }
  }, [activeOrgId, id]);

  useEffect(() => {
    if (artist) void loadRelationships();
  }, [artist, loadRelationships]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    setSaving(true);
    try {
      const genres: string[] = [];
      if (editGenre.trim()) genres.push(editGenre.trim());
      if (editSubgenre.trim()) genres.push(editSubgenre.trim());
      const socialLinks = { ...editSocialLinks };
      if (editWebsite.trim()) socialLinks.website = editWebsite.trim();
      else delete socialLinks.website;
      await editArtist(activeOrgId, id, {
        name: editName.trim() || undefined,
        stageName: editDisplayName.trim() || null,
        legalName: editLegalName.trim() || null,
        artistType: editArtistType,
        bio: editBio.trim() || null,
        country: editCountry.trim() || null,
        genres: genres.length > 0 ? genres : null,
        contact: editContact.trim() || null,
        isni: editIsni.trim() || null,
        ipi: editIpi.trim() || null,
        status: editStatus,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      });
      toast.success('Artist updated.');
      await refresh();
      setTab('overview');
    } catch (err) {
      toast.error('Save failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
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
      setArchiveDialog(false);
      await refresh();
      toast.success('Artist archived.');
    } catch {
      toast.error('Unable to archive artist.');
    } finally {
      setActionLoading(false);
    }
  }, [activeOrgId, id, refresh]);

  const handleRestore = useCallback(async () => {
    if (!activeOrgId) return;
    setActionLoading(true);
    try {
      await restoreArtist(activeOrgId, id);
      setRestoreDialog(false);
      await refresh();
      toast.success('Artist restored.');
    } catch {
      toast.error('Unable to restore artist.');
    } finally {
      setActionLoading(false);
    }
  }, [activeOrgId, id, refresh]);

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
      router.push('/artists');
    } catch {
      toast.error('Unable to delete artist.');
    } finally {
      setActionLoading(false);
    }
  }, [activeOrgId, id, router]);

  const handleLinkRelease = useCallback(async (releaseId: string) => {
    if (!activeOrgId) return;
    setLinkReleaseBusy(true);
    try {
      await linkArtistToRelease(releaseId, id, 'primary', true);
      setLinkReleaseOpen(false);
      setReleaseSearch('');
      await loadRelationships();
      toast.success('Release linked.');
    } catch {
      toast.error('Unable to link release.');
    } finally {
      setLinkReleaseBusy(false);
    }
  }, [activeOrgId, id, loadRelationships]);

  const handleUnlinkRelease = useCallback(async (releaseId: string) => {
    if (!activeOrgId) return;
    try {
      await unlinkArtistFromRelease(releaseId, id);
      await loadRelationships();
      toast.success('Release link removed.');
    } catch {
      toast.error('Unable to remove link.');
    }
  }, [activeOrgId, id, loadRelationships]);

  const handleLinkTrack = useCallback(async (trackId: string) => {
    if (!activeOrgId) return;
    setLinkTrackBusy(true);
    try {
      await addArtistToTrack({ trackId, artistId: id, role: 'PRIMARY_ARTIST', position: 0, isPrimary: true });
      setLinkTrackOpen(false);
      setTrackSearch('');
      await loadRelationships();
      toast.success('Track linked.');
    } catch {
      toast.error('Unable to link track.');
    } finally {
      setLinkTrackBusy(false);
    }
  }, [activeOrgId, id, loadRelationships]);

  const handleUnlinkTrack = useCallback(async (recordId: string) => {
    if (!activeOrgId) return;
    try {
      await removeArtistFromTrack(recordId);
      await loadRelationships();
      toast.success('Track link removed.');
    } catch {
      toast.error('Unable to remove link.');
    }
  }, [activeOrgId, loadRelationships]);

  const overflowMenuItems: EntityOverflowMenuItem[] = [
    { id: 'open', label: 'Open Artist', onClick: () => router.push(`/artists/${id}`) },
    { id: 'edit', label: 'Edit Artist', onClick: () => setTab('edit') },
    { id: 'archive-separator', label: '', separatorBefore: true },
    ...(artist && artist.status === 'archived'
      ? [{ id: 'restore', label: 'Restore Artist', variant: 'secondary' as const, onClick: () => setRestoreDialog(true) }]
      : [{ id: 'archive', label: 'Archive Artist', variant: 'secondary' as const, onClick: () => setArchiveDialog(true) }]
    ),
    { id: 'delete', label: 'Delete Artist', variant: 'danger' as const, separatorBefore: true, onClick: handleDeleteClick },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'discography', label: 'Discography', count: discography?.all.length },
    { id: 'credits', label: 'Credits', count: credits.length },
    { id: 'assignments', label: 'Assignments' },
    { id: 'activity', label: 'Activity' },
    { id: 'edit', label: 'Edit' },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 sm:px-7 py-8">
        <div className="flex items-center justify-center py-32"><LoadingState /></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="mx-auto max-w-5xl px-5 sm:px-7 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/artists" className="text-sm text-text-400 hover:text-surface-50 inline-block">&larr; Artists</Link>
        </div>
        <EmptyState title="Artist not found" description="This artist may have been deleted or belongs to another organization." action={{ label: 'Back to Artists', onClick: () => router.push('/artists') }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-center justify-between mb-6">
        <Link href="/artists" className="text-sm text-text-400 hover:text-surface-50 inline-block">&larr; Artists</Link>
        <EntityOverflowMenu items={overflowMenuItems} aria-label="Artist actions" />
      </div>

      {/* ===== Workspace Header ===== */}
      <header className="mb-8">
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
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-display-md font-semibold text-content-primary tracking-tight">{artist.name}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="text-sm text-content-secondary">{typeLabels[artist.artistType] ?? artist.artistType}</span>
                  <StatusBadge status={artist.status} />
                  {artist.genres && artist.genres.length > 0 && (
                    <span className="text-sm text-content-secondary">&middot; {artist.genres[0]}</span>
                  )}
                  {artist.country && <span className="text-sm text-content-secondary">&middot; {artist.country}</span>}
                </div>
                <div className="flex items-center gap-x-4 gap-y-1 mt-2">
                  <span className="text-xs text-content-label">{releases.length} Releases</span>
                  <span className="text-xs text-content-label">{tracks.length} Tracks</span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => setTab('edit')}>Edit Artist</Button>
              </div>
            </div>
            {(artist.socialLinks?.instagram || artist.socialLinks?.spotify || artist.socialLinks?.website) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
                {artist.socialLinks?.instagram && <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-content-label hover:text-surface-100 underline">Instagram</a>}
                {artist.socialLinks?.spotify && <a href={artist.socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="text-xs text-content-label hover:text-surface-100 underline">Spotify</a>}
                {artist.socialLinks?.website && <a href={artist.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-xs text-content-label hover:text-surface-100 underline">Website</a>}
              </div>
            )}
          </div>
        </div>
      </header>

      <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-8" />

      {/* ===== Overview ===== */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-semibold text-content-primary mb-4">Identity</h2>
            <Card padding="lg">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-content-label">Artist Name</p><p className="text-sm text-content-primary">{artist.name}</p></div>
                {artist.stageName && <div><p className="text-xs text-content-label">Display Name</p><p className="text-sm text-content-primary">{artist.stageName}</p></div>}
                {artist.legalName && <div><p className="text-xs text-content-label">Legal Name</p><p className="text-sm text-content-primary">{artist.legalName}</p></div>}
                <div><p className="text-xs text-content-label">Artist Type</p><p className="text-sm text-content-primary">{typeLabels[artist.artistType] ?? artist.artistType}</p></div>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="text-base font-semibold text-content-primary mb-4">Profile</h2>
            <Card padding="lg">
              <div className="space-y-4">
                {artist.bio && <div><p className="text-xs text-content-label mb-1">Biography</p><p className="text-sm text-content-primary whitespace-pre-wrap">{artist.bio}</p></div>}
                <div className="grid grid-cols-2 gap-4">
                  {artist.country && <div><p className="text-xs text-content-label">Country</p><p className="text-sm text-content-primary">{artist.country}</p></div>}
                  {(artist as { language?: string }).language && <div><p className="text-xs text-content-label">Language</p><p className="text-sm text-content-primary">{(artist as { language?: string }).language}</p></div>}
                  {artist.socialLinks?.website && <div><p className="text-xs text-content-label">Website</p><p className="text-sm text-content-primary">{artist.socialLinks.website}</p></div>}
                </div>
                {artist.socialLinks && Object.keys(artist.socialLinks).filter((k) => artist.socialLinks?.[k]).length > 0 && (
                  <div>
                    <p className="text-xs text-content-label mb-1">Social Links</p>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(artist.socialLinks).filter(([, v]) => v).map(([k, v]) => (
                        <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-400 hover:text-primary-300 underline capitalize">{k}</a>
                      ))}
                    </div>
                  </div>
                )}
                {!artist.bio && !artist.country && !artist.socialLinks?.website && !(artist.socialLinks && Object.values(artist.socialLinks).some(Boolean)) && (
                  <p className="text-sm text-content-label">No profile details yet.</p>
                )}
              </div>
            </Card>
          </section>

          <section>
            <h2 className="text-base font-semibold text-content-primary mb-4">Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
                <p className="text-2xl font-semibold text-content-primary leading-none">{tracks.length}</p>
                <p className="text-xs text-content-label mt-2 uppercase tracking-wider">Tracks</p>
              </div>
              <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
                <p className="text-2xl font-semibold text-content-primary leading-none">{releases.length}</p>
                <p className="text-xs text-content-label mt-2 uppercase tracking-wider">Releases</p>
              </div>
              <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
                <p className="text-2xl font-semibold text-content-primary leading-none">{credits.length}</p>
                <p className="text-xs text-content-label mt-2 uppercase tracking-wider">Credits</p>
              </div>
              <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
                <p className="text-2xl font-semibold text-content-primary leading-none">{releases.length > 0 || credits.length > 0 ? releases.length + credits.length : 0}</p>
                <p className="text-xs text-content-label mt-2 uppercase tracking-wider">Collaborations</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ===== Discography ===== */}
      {tab === 'discography' && (
        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-content-primary">Releases ({linkedReleases.length})</h2>
              <Button variant="secondary" size="sm" onClick={() => setLinkReleaseOpen(true)}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0H9" /></svg>
                Link Release
              </Button>
            </div>
            {releaseLoading ? (
              <div className="text-sm text-content-label py-4">Loading releases...</div>
            ) : linkedReleases.length === 0 ? (
              <EmptyState title="No linked releases" description="Link releases to build this artist's discography." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedReleases.map((r) => (
                  <div key={r.id} className="relative">
                    <ReleaseCard release={r} />
                    <button
                      type="button"
                      onClick={() => handleUnlinkRelease(r.id)}
                      className="absolute top-2 left-2 z-10 h-7 w-7 rounded-full bg-surface-900/90 border border-surface-700 flex items-center justify-center hover:bg-danger-600/20 transition-colors"
                      title="Remove link"
                    >
                      <svg className="h-3.5 w-3.5 text-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-content-primary">
                Tracks ({tracks.length || linkedTracks.length})
              </h2>
              <Button variant="secondary" size="sm" onClick={() => setLinkTrackOpen(true)}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0H9" /></svg>
                Link Track
              </Button>
            </div>
            {trackLoading ? (
              <div className="text-sm text-content-label py-4">Loading tracks...</div>
            ) : tracks.length === 0 && linkedTracks.length === 0 ? (
              <EmptyState title="No linked tracks" description="Link tracks to associate them with this artist." />
            ) : tracks.length > 0 ? (
              /* EPIC-202 — group by Original / Featured / Remix role */
              <div className="space-y-6">
                {(
                  [
                    {
                      key: 'original',
                      label: 'Original Artist',
                      roles: ['ORIGINAL_ARTIST', 'PRIMARY_ARTIST'] as string[],
                    },
                    {
                      key: 'featured',
                      label: 'Featured Artist',
                      roles: ['FEATURED_ARTIST'] as string[],
                    },
                    {
                      key: 'remix',
                      label: 'Remix Artist',
                      roles: ['REMIX_ARTIST'] as string[],
                    },
                  ]
                ).map((group) => {
                  const groupTracks = tracks.filter((t) => group.roles.includes(t.role));
                  if (groupTracks.length === 0) return null;
                  return (
                    <div key={group.key}>
                      <p className="text-xs font-semibold text-content-label uppercase tracking-wider mb-2">
                        {group.label}
                      </p>
                      <TrackList>
                        {groupTracks.map((t) => (
                          <TrackRow key={`${t.id}-${t.role}`} onClick={() => router.push(`/tracks/${t.trackId}`)}>
                            <div className="shrink-0">
                              <ArtworkPlaceholder title={t.trackTitle ?? 'Untitled'} size="sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-content-primary truncate group-hover:text-primary-400 transition-colors">
                                {t.trackTitle ?? 'Untitled'}
                              </p>
                              <p className="text-xs text-content-secondary mt-0.5">
                                {creditRoleLabels[t.role] ?? t.role}
                              </p>
                            </div>
                          </TrackRow>
                        ))}
                      </TrackList>
                    </div>
                  );
                })}
              </div>
            ) : (
              <TrackList>
                {linkedTracks.map((t) => (
                  <TrackRow key={t.id} onClick={() => router.push(`/tracks/${t.id}`)}>
                    <div className="shrink-0"><ArtworkPlaceholder title={t.title} size="sm" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content-primary truncate group-hover:text-primary-400 transition-colors">{t.title}</p>
                      {t.version ? <p className="text-xs text-content-secondary mt-0.5">{t.version}</p> : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={t.status} />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleUnlinkTrack(t.id); }}
                        className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-danger-600/20 transition-colors"
                        title="Remove link"
                      >
                        <svg className="h-3.5 w-3.5 text-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </TrackRow>
                ))}
              </TrackList>
            )}
          </section>
        </div>
      )}

      {/* ===== Credits ===== */}
      {tab === 'credits' && (
        <section>
          <h2 className="text-base font-semibold text-content-primary mb-4">Credits ({credits.length})</h2>
          {credits.length === 0 ? (
            <EmptyState title="No credits" description="Credits will appear when this artist is linked to tracks." />
          ) : (
            <TrackList>
              {credits.map((c) => (
                <TrackRow key={c.id} onClick={() => router.push(`/tracks/${c.trackId}`)}>
                  <div className="shrink-0"><ArtworkPlaceholder title={c.trackTitle ?? 'Untitled'} size="sm" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate group-hover:text-primary-400 transition-colors">{c.trackTitle ?? 'Untitled Track'}</p>
                    <p className="text-xs text-content-secondary mt-0.5">{creditRoleLabels[c.role] ?? c.role}</p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status="active" />
                  </div>
                </TrackRow>
              ))}
            </TrackList>
          )}
        </section>
      )}

      {/* ===== Assignments ===== */}
      {tab === 'assignments' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-content-primary">Assignments</h2>
            <Button variant="primary" size="sm" onClick={() => setCreateAssignmentOpen(true)}>+ Create Assignment</Button>
          </div>
          <AssignmentsSection entityType="artist" entityId={id} />
        </section>
      )}

      {/* ===== Activity ===== */}
      {tab === 'activity' && (
        <section>
          <h2 className="text-base font-semibold text-content-primary mb-4">Activity</h2>
          {activitiesLoading ? (
            <div className="text-sm text-content-label py-4">Loading...</div>
          ) : activities.length === 0 ? (
            <EmptyState title="No activity" description="Activity will appear when this artist is updated." />
          ) : (
            <div className="space-y-1">
              {activities.slice(0, 20).map((a) => (
                <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                  <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                  <div>
                    <p className="text-sm text-content-primary capitalize">{a.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-content-label">{a.actorId} &middot; {formatDate(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== Edit ===== */}
      {tab === 'edit' && (
        <section>
          <h2 className="text-base font-semibold text-content-primary mb-4">Edit Artist</h2>
          <form onSubmit={handleSave} className="space-y-8">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-content-primary mb-4">Identity</h3>
              <div className="space-y-3">
                <Input label="Artist Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Display Name" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} />
                  <Input label="Legal Name" value={editLegalName} onChange={(e) => setEditLegalName(e.target.value)} />
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-sm font-semibold text-content-primary mb-4">Profile</h3>
              <div className="space-y-3">
                <Input label="Artist Image URL" value={artist.imageUrl ?? ''} onChange={() => {}} disabled placeholder="Use the image button on the header to upload" />
                <TextArea label="Biography" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Country" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
                  <Input label="Language" value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} />
                </div>
                <Input label="Website" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://..." />
                <details className="group">
                  <summary className="text-sm font-medium text-content-secondary hover:text-content-primary cursor-pointer">Social Links</summary>
                  <div className="mt-3 space-y-3 pl-2">
                    <Input label="Instagram" value={editSocialLinks.instagram ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, instagram: e.target.value }))} />
                    <Input label="Spotify" value={editSocialLinks.spotify ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, spotify: e.target.value }))} />
                    <Input label="Website" value={editSocialLinks.website ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, website: e.target.value }))} />
                    <Input label="SoundCloud" value={editSocialLinks.soundcloud ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, soundcloud: e.target.value }))} />
                    <Input label="Twitter" value={editSocialLinks.twitter ?? ''} onChange={(e) => setEditSocialLinks((s) => ({ ...s, twitter: e.target.value }))} />
                  </div>
                </details>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-sm font-semibold text-content-primary mb-4">Classification</h3>
              <div className="space-y-3">
                <SearchableGenreSelect
                  label="Genre"
                  placeholder="Search or create a genre"
                  value={editGenre}
                  onChange={setEditGenre}
                  orgId={activeOrgId}
                  userId={user?.uid ?? ''}
                  presets={[]}
                />
                <SearchableGenreSelect
                  label="Subgenre"
                  placeholder="Search or create a subgenre"
                  value={editSubgenre}
                  onChange={setEditSubgenre}
                  orgId={activeOrgId}
                  userId={user?.uid ?? ''}
                  presets={[]}
                />
                <Select label="Artist Type" options={artistTypeOptions} value={editArtistType} onChange={(v) => setEditArtistType(v)} />
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-sm font-semibold text-content-primary mb-4">Relationships</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-content-label uppercase tracking-wider">Linked Releases ({linkedReleases.length})</p>
                    <Button variant="ghost" size="sm" onClick={() => setLinkReleaseOpen(true)}>+ Link</Button>
                  </div>
                  {linkedReleases.length === 0 ? (
                    <p className="text-sm text-content-label">No linked releases.</p>
                  ) : (
                    <div className="space-y-2">
                      {linkedReleases.map((r) => (
                        <div key={r.id} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-2">
                          <span className="text-sm text-content-primary truncate flex-1 min-w-0">{r.title}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleUnlinkRelease(r.id)}>Delink</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-content-label uppercase tracking-wider">Linked Tracks ({linkedTracks.length})</p>
                    <Button variant="ghost" size="sm" onClick={() => setLinkTrackOpen(true)}>+ Link</Button>
                  </div>
                  {linkedTracks.length === 0 ? (
                    <p className="text-sm text-content-label">No linked tracks.</p>
                  ) : (
                    <div className="space-y-2">
                      {linkedTracks.map((t) => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-2">
                          <span className="text-sm text-content-primary truncate flex-1 min-w-0">{t.title}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleUnlinkTrack(t.id)}>Delink</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-sm font-semibold text-content-primary mb-4">Status</h3>
              <Select label="Status" options={statusOptions} value={editStatus} onChange={(v) => setEditStatus(v)} />
            </Card>

            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={saving} disabled={saving || !editName.trim()}>Save Changes</Button>
              <Button variant="ghost" size="sm" onClick={() => setTab('overview')}>Cancel</Button>
            </div>
          </form>
        </section>
      )}

      <ConfirmationDialog open={archiveDialog} onClose={() => setArchiveDialog(false)} onConfirm={handleArchive} title="Archive Artist" message="Archived artists will not appear in normal pickers but remain historically referenced." confirmLabel="Archive" loading={actionLoading} />
      <ConfirmationDialog open={restoreDialog} onClose={() => setRestoreDialog(false)} onConfirm={handleRestore} title="Restore Artist" message="Restore this artist to active status." confirmLabel="Restore" variant="default" loading={actionLoading} />
      <ConfirmationDialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, canDelete: false, message: '' })} onConfirm={confirmDelete} title={deleteDialog.canDelete ? 'Delete Artist' : 'Cannot Delete Artist'} message={deleteDialog.message} confirmLabel={deleteDialog.canDelete ? 'Delete' : 'OK'} variant={deleteDialog.canDelete ? 'danger' : 'default'} loading={actionLoading} />

      {linkReleaseOpen && (
        <RelationshipPicker
          title="Link Release"
          placeholder="Search releases..."
          loadOptions={async () => {
            if (!activeOrgId) return [];
            const all = await fetchReleasesByOrg(activeOrgId);
            const linked = new Set(linkedReleases.map((r) => r.id));
            return all.filter((r) => !linked.has(r.id)).map((r) => ({ value: r.id, label: r.title }));
          }}
          search={releaseSearch}
          onSearch={setReleaseSearch}
          onSelect={handleLinkRelease}
          onClose={() => { setLinkReleaseOpen(false); setReleaseSearch(''); }}
          busy={linkReleaseBusy}
        />
      )}

      {linkTrackOpen && (
        <RelationshipPicker
          title="Link Track"
          placeholder="Search tracks..."
          loadOptions={async () => {
            if (!activeOrgId) return [];
            const all = await fetchTracksByOrg(activeOrgId);
            const linked = new Set(linkedTracks.map((t) => t.id));
            return all.filter((t) => !linked.has(t.id)).map((t) => ({ value: t.id, label: t.title }));
          }}
          search={trackSearch}
          onSearch={setTrackSearch}
          onSelect={handleLinkTrack}
          onClose={() => { setLinkTrackOpen(false); setTrackSearch(''); }}
          busy={linkTrackBusy}
        />
      )}

      {activeOrgId && user?.uid && (
        <AssignmentDialog
          open={createAssignmentOpen}
          onClose={() => setCreateAssignmentOpen(false)}
          onCreated={() => {}}
          entityType="artist"
          entityId={id}
          organizationId={activeOrgId}
          actorId={user.uid}
        />
      )}
    </div>
  );
}

interface RelationshipPickerOption { value: string; label: string; }

function RelationshipPicker({
  title, placeholder, loadOptions, search, onSearch, onSelect, onClose, busy,
}: {
  title: string;
  placeholder: string;
  loadOptions: () => Promise<RelationshipPickerOption[]>;
  search: string;
  onSearch: (v: string) => void;
  onSelect: (value: string) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [options, setOptions] = useState<RelationshipPickerOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadOptions().then((o) => { if (!cancelled) setOptions(o); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadOptions]);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md bg-layer-2 rounded-lg shadow-modal border border-surface-200 flex flex-col max-h-[80vh]">
        <div className="px-5 pt-5 pb-3 border-b border-divider">
          <h2 className="text-base font-semibold text-content-primary">{title}</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="mt-3 block w-full h-10 rounded-xl border border-surface-700 px-4 text-sm text-content-primary placeholder:text-content-label bg-layer-3 focus:border-primary-500/60 focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-divider">
          {loading ? (
            <div className="p-8 text-center text-sm text-content-label">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-content-label">{search ? 'No matches.' : 'Nothing available to link.'}</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={busy}
                onClick={() => onSelect(o.value)}
                className="w-full text-left px-5 py-3 text-sm text-content-primary hover:bg-layer-3 transition-colors disabled:opacity-50"
              >
                {o.label}
              </button>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-divider flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}


