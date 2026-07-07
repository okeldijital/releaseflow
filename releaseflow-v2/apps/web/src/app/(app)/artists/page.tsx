'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useArtists } from '@/hooks/useArtist';
import { archiveArtist, restoreArtist, validateDeleteArtist, removeArtist } from '@/lib/artist-service';
import { useOrgStore } from '@/stores/org-store';
import {
  Avatar, Button, EmptyState, LoadingState, StatusBadge, ConfirmationDialog,
} from '@releaseflow/ui';

const typeLabels: Record<string, string> = {
  original_artist: 'Original Artist', remix_artist: 'Remix Artist',
  cover_artist: 'Cover Artist', producer: 'Producer', dj: 'DJ',
  band: 'Band', label: 'Label',
};

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
] as const;

export default function ArtistsPage() {
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
  const { artists, allArtists, loading, refresh, statusFilter, setStatusFilter, bumpArtistCatalogue } = useArtists();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; artistId: string; artistName: string; canDelete: boolean; message: string }>({ open: false, artistId: '', artistName: '', canDelete: false, message: '' });

  const counts = {
    all: allArtists.length,
    active: allArtists.filter((a) => a.status === 'active').length,
    inactive: allArtists.filter((a) => a.status === 'inactive').length,
    archived: allArtists.filter((a) => a.status === 'archived').length,
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === artists.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(artists.map((a) => a.id)));
    }
  };

  const handleBulkArchive = useCallback(async () => {
    if (!activeOrgId || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => archiveArtist(activeOrgId, id)));
      bumpArtistCatalogue();
      setSelectedIds(new Set());
      await refresh();
    } catch {
      // silent
    } finally {
      setBulkLoading(false);
    }
  }, [activeOrgId, selectedIds, bumpArtistCatalogue, refresh]);

  const handleBulkRestore = useCallback(async () => {
    if (!activeOrgId || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => restoreArtist(activeOrgId, id)));
      bumpArtistCatalogue();
      setSelectedIds(new Set());
      await refresh();
    } catch {
      // silent
    } finally {
      setBulkLoading(false);
    }
  }, [activeOrgId, selectedIds, bumpArtistCatalogue, refresh]);

  const handleDeleteClick = useCallback(async (artistId: string, artistName: string) => {
    if (!activeOrgId) return;
    const result = await validateDeleteArtist(activeOrgId, artistId);
    if (result.allowed) {
      setDeleteDialog({ open: true, artistId, artistName, canDelete: true, message: 'This action cannot be undone.' });
    } else {
      const refs = result.references;
      const parts: string[] = [];
      if (refs.tracks > 0) parts.push(`${refs.tracks} Track${refs.tracks !== 1 ? 's' : ''}`);
      if (refs.releases > 0) parts.push(`${refs.releases} Release${refs.releases !== 1 ? 's' : ''}`);
      if (refs.publishingRecords > 0) parts.push(`${refs.publishingRecords} Publishing Record${refs.publishingRecords !== 1 ? 's' : ''}`);
      setDeleteDialog({ open: true, artistId, artistName: '', canDelete: false, message: `This artist is used by:\n\n${parts.join('\n')}\n\nDelete is unavailable until these references are removed or reassigned.` });
    }
  }, [activeOrgId]);

  const confirmDelete = useCallback(async () => {
    if (!activeOrgId || !deleteDialog.artistId) return;
    try {
      await removeArtist(activeOrgId, deleteDialog.artistId);
      bumpArtistCatalogue();
      setDeleteDialog({ open: false, artistId: '', artistName: '', canDelete: false, message: '' });
      await refresh();
    } catch {
      // silent
    }
  }, [activeOrgId, deleteDialog, bumpArtistCatalogue, refresh]);

  const handleBulkDeleteEligible = useCallback(async () => {
    if (!activeOrgId || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map(async (id) => {
          const check = await validateDeleteArtist(activeOrgId, id);
          return { id, allowed: check.allowed };
        }),
      );
      const eligible = results.filter((r) => r.allowed).map((r) => r.id);
      await Promise.all(eligible.map((id) => removeArtist(activeOrgId, id)));
      bumpArtistCatalogue();
      setSelectedIds(new Set());
      await refresh();
    } catch {
      // silent
    } finally {
      setBulkLoading(false);
    }
  }, [activeOrgId, selectedIds, bumpArtistCatalogue, refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  const selectedActive = selectedIds.size;
  const hasArchivedSelected = selectedIds.size > 0 && Array.from(selectedIds).some((id) => {
    const a = allArtists.find((art) => art.id === id);
    return a?.status === 'archived';
  });
  const hasNonArchivedSelected = selectedIds.size > 0 && Array.from(selectedIds).some((id) => {
    const a = allArtists.find((art) => art.id === id);
    return a?.status !== 'archived';
  });

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[1.75rem] font-semibold text-primary-400 tracking-tight">Artists</p>
          <p className="mt-1 text-sm text-text-400">Artists connected to your catalogue.</p>
        </div>
        <Link href="/artists/new">
          <Button variant="primary" size="md" className="rounded-xl">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Artist
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-surface-800 text-text-400 hover:text-surface-50'
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-70">({counts[f.value as keyof typeof counts]})</span>
          </button>
        ))}
      </div>

      {selectedActive > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-surface-800/60">
          <span className="text-sm text-text-400">{selectedActive} selected</span>
          {hasNonArchivedSelected && (
            <Button variant="ghost" size="sm" onClick={handleBulkArchive} loading={bulkLoading} disabled={bulkLoading}>
              Archive Selected
            </Button>
          )}
          {hasArchivedSelected && (
            <Button variant="ghost" size="sm" onClick={handleBulkRestore} loading={bulkLoading} disabled={bulkLoading}>
              Restore Selected
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleBulkDeleteEligible} loading={bulkLoading} disabled={bulkLoading}>
            Delete Eligible
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {artists.length === 0 ? (
        <EmptyState
          title={statusFilter === 'all' ? 'No artists yet' : `No ${statusFilter} artists`}
          description={statusFilter === 'all' ? 'Add your first artist to connect them to releases.' : `No artists with status "${statusFilter}".`}
          action={statusFilter === 'all' ? { label: 'Add Artist', onClick: () => router.push('/artists/new') } : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-200/80 bg-layer-2 divide-y divide-surface-100/80 dark:bg-surface-900 dark:border-surface-700/80 dark:divide-surface-800">
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-800/40">
            <input
              type="checkbox"
              checked={selectedIds.size === artists.length && artists.length > 0}
              onChange={toggleSelectAll}
              className="rounded"
            />
            <span className="text-xs text-text-500 font-medium">Select all</span>
          </div>
          {artists.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50/80 dark:hover:bg-surface-800/40 transition-colors duration-100 group">
              <input
                type="checkbox"
                checked={selectedIds.has(a.id)}
                onChange={() => toggleSelect(a.id)}
                className="rounded shrink-0"
              />
              <Link href={`/artists/${a.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar name={a.name} src={a.imageUrl ?? undefined} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary-400 truncate">{a.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-text-500">{typeLabels[a.artistType] ?? a.artistType}</span>
                    {a.genres && a.genres.length > 0 ? <span className="text-xs text-text-400">{a.genres.slice(0, 2).join(', ')}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={a.status} />
                  <svg className="h-4 w-4 text-text-300 group-hover:text-text-500 transition-colors duration-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {a.status === 'archived' ? (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); if (activeOrgId) { restoreArtist(activeOrgId, a.id).then(() => { bumpArtistCatalogue(); refresh(); }); } }}>
                    Restore
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); if (activeOrgId) { archiveArtist(activeOrgId, a.id).then(() => { bumpArtistCatalogue(); refresh(); }); } }}>
                    Archive
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); handleDeleteClick(a.id, a.name); }}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, artistId: '', artistName: '', canDelete: false, message: '' })}
        onConfirm={confirmDelete}
        title={deleteDialog.canDelete ? `Delete ${deleteDialog.artistName}` : 'Cannot Delete Artist'}
        message={deleteDialog.message}
        confirmLabel={deleteDialog.canDelete ? 'Delete' : 'OK'}
        variant={deleteDialog.canDelete ? 'danger' : 'default'}
      />
    </div>
  );
}
