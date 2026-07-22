'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { useArtists } from '@/hooks/useArtist';
import { useOrgStore } from '@/stores/org-store';
import { Button, EmptyState, LoadingState, ConfirmationDialog } from '@releaseflow/ui';
import { ArtistCard } from '@/components/artists/ArtistCard';
import type { ArtistCardModel } from '@/lib/artist-card-model';
import {
  archiveArtist,
  restoreArtist,
  validateDeleteArtist,
  removeArtist,
} from '@/lib/artist-service';
import { toast } from '@/stores/toast-store';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'type', label: 'Artist Type' },
];

const TYPE_FILTERS = [
  { value: '', label: 'All types' },
  { value: 'original_artist', label: 'Original Artist' },
  { value: 'remix_artist', label: 'Remix Artist' },
  { value: 'cover_artist', label: 'Cover Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'dj', label: 'DJ' },
  { value: 'band', label: 'Band' },
  { value: 'label', label: 'Label' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

function sortCardModels(list: ArtistCardModel[], sort: string): ArtistCardModel[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'updated': {
        const at = a.updatedAt ? new Date(a.updatedAt as string | number).getTime() : 0;
        const bt = b.updatedAt ? new Date(b.updatedAt as string | number).getTime() : 0;
        return bt - at;
      }
      case 'type':
        return a.artistType.localeCompare(b.artistType);
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

export default function ArtistsPage() {
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
  const {
    artistCards,
    allArtistCards,
    loading,
    refresh,
    statusFilter,
    setStatusFilter,
    bumpArtistCatalogue,
  } = useArtists();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    artistId: string;
    artistName: string;
    canDelete: boolean;
    message: string;
  }>({ open: false, artistId: '', artistName: '', canDelete: false, message: '' });

  const counts = useMemo(
    () => ({
      all: allArtistCards.length,
      active: allArtistCards.filter((a) => a.status === 'active').length,
      inactive: allArtistCards.filter((a) => a.status === 'inactive').length,
      archived: allArtistCards.filter((a) => a.status === 'archived').length,
    }),
    [allArtistCards],
  );

  const filteredArtists = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? artistCards.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            (a.stageName?.toLowerCase().includes(q) ?? false) ||
            (a.legalName?.toLowerCase().includes(q) ?? false),
        )
      : artistCards;

    const typeFiltered = filterType ? list.filter((a) => a.artistType === filterType) : list;
    return sortCardModels(typeFiltered, sort);
  }, [artistCards, search, filterType, sort]);

  const hasActiveFilters = Boolean(search || filterType || statusFilter !== 'all');

  const handleDeleteClick = useCallback(
    async (artistId: string, artistName: string) => {
      if (!activeOrgId) return;
      const result = await validateDeleteArtist(activeOrgId, artistId);
      if (result.allowed) {
        setDeleteDialog({
          open: true,
          artistId,
          artistName,
          canDelete: true,
          message: 'This action cannot be undone.',
        });
      } else {
        const refs = result.references;
        const parts: string[] = [];
        if (refs.tracks > 0) parts.push(`${refs.tracks} Track${refs.tracks !== 1 ? 's' : ''}`);
        if (refs.releases > 0) parts.push(`${refs.releases} Release${refs.releases !== 1 ? 's' : ''}`);
        if (refs.publishingRecords > 0) {
          parts.push(
            `${refs.publishingRecords} Publishing Record${refs.publishingRecords !== 1 ? 's' : ''}`,
          );
        }
        setDeleteDialog({
          open: true,
          artistId,
          artistName: '',
          canDelete: false,
          message: `This artist is used by:\n\n${parts.join('\n')}\n\nDelete is unavailable until these references are removed or reassigned.`,
        });
      }
    },
    [activeOrgId],
  );

  const confirmDelete = useCallback(async () => {
    if (!activeOrgId || !deleteDialog.artistId) return;
    try {
      await removeArtist(activeOrgId, deleteDialog.artistId);
      bumpArtistCatalogue();
      setDeleteDialog({ open: false, artistId: '', artistName: '', canDelete: false, message: '' });
      await refresh();
      toast.success('Artist deleted.');
    } catch {
      toast.error('Unable to delete artist.');
    }
  }, [activeOrgId, deleteDialog, bumpArtistCatalogue, refresh]);

  const handleArchive = useCallback(
    async (artistId: string) => {
      if (!activeOrgId) return;
      try {
        await archiveArtist(activeOrgId, artistId);
        bumpArtistCatalogue();
        await refresh();
        toast.success('Artist archived.');
      } catch {
        toast.error('Unable to archive artist.');
      }
    },
    [activeOrgId, bumpArtistCatalogue, refresh],
  );

  const handleRestore = useCallback(
    async (artistId: string) => {
      if (!activeOrgId) return;
      try {
        await restoreArtist(activeOrgId, artistId);
        bumpArtistCatalogue();
        await refresh();
        toast.success('Artist restored.');
      } catch {
        toast.error('Unable to restore artist.');
      }
    },
    [activeOrgId, bumpArtistCatalogue, refresh],
  );

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-5xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Artists</p>
          <p className="mt-1 text-sm text-text-400">Manage every artist across your catalogue.</p>
        </div>
        <EmptyState
          title="No organization selected"
          description="Select an organization to manage artists."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Artists</p>
          <p className="mt-1 text-sm text-text-400">Manage every artist across your catalogue.</p>
        </div>
        <div className="flex items-center justify-center py-32">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-display-md font-semibold text-content-primary tracking-tight">Artists</p>
          <p className="mt-1 text-sm text-content-secondary">
            Manage every artist across your catalogue.
          </p>
          <p className="mt-0.5 text-sm text-content-secondary">
            {counts.all} artist{counts.all !== 1 ? 's' : ''} in your catalogue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/artists/new">
            <Button variant="primary" size="sm" className="rounded-xl">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Artist
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
          <p className="text-xs font-medium text-content-label uppercase tracking-wider">
            Total Artists
          </p>
          <p className="text-2xl font-semibold text-content-primary mt-2 leading-none">
            {counts.all}
          </p>
        </div>
        <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
          <p className="text-xs font-medium text-content-label uppercase tracking-wider">Active</p>
          <p className="text-2xl font-semibold text-content-primary mt-2 leading-none">
            {counts.active}
          </p>
        </div>
        <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
          <p className="text-xs font-medium text-content-label uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-semibold text-content-primary mt-2 leading-none">
            {counts.inactive}
          </p>
        </div>
        <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
          <p className="text-xs font-medium text-content-label uppercase tracking-wider">Archived</p>
          <p className="text-2xl font-semibold text-content-primary mt-2 leading-none">
            {counts.archived}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === f.value
                ? 'bg-primary-500 text-surface-50'
                : 'bg-surface-800 text-text-400 hover:text-surface-50'
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-70">({counts[f.value as keyof typeof counts]})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artists..."
            className="block w-full h-10 rounded-xl border border-divider bg-layer-3 px-4 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500/60 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-xl border border-divider bg-layer-3 px-3 text-sm text-content-primary focus:border-primary-500/60 focus:outline-none"
          >
            {TYPE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-xl border border-divider bg-layer-3 px-3 text-sm text-content-primary focus:border-primary-500/60 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-3" />

      {artistCards.length === 0 ? (
        <EmptyState
          title={statusFilter === 'all' ? 'No artists yet' : `No ${statusFilter} artists`}
          description={
            statusFilter === 'all'
              ? 'Add your first artist to connect them to releases.'
              : `No artists with status "${statusFilter}".`
          }
          action={
            statusFilter === 'all'
              ? { label: 'Add Artist', onClick: () => router.push('/artists/new') }
              : undefined
          }
        />
      ) : filteredArtists.length === 0 ? (
        <EmptyState
          title="No artists match your search"
          description="Try adjusting your filters or search terms."
          action={
            hasActiveFilters
              ? {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearch('');
                    setFilterType('');
                    setStatusFilter('all');
                  },
                }
              : undefined
          }
        />
      ) : (
        <div
          data-artist-card-grid
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {filteredArtists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              size="standard"
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDeleteRequest={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({ open: false, artistId: '', artistName: '', canDelete: false, message: '' })
        }
        onConfirm={confirmDelete}
        title={deleteDialog.canDelete ? `Delete ${deleteDialog.artistName}` : 'Cannot Delete Artist'}
        message={deleteDialog.message}
        confirmLabel={deleteDialog.canDelete ? 'Delete' : 'OK'}
        variant={deleteDialog.canDelete ? 'danger' : 'default'}
      />
    </div>
  );
}
