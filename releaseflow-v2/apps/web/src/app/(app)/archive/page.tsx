'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  getDeletedReleases, getDeletedTracks, getDeletedArtists,
  getDeletedLabels, getDeletedPeople, getDeletedMediaAssets,
} from '@/lib/retention/recovery-repository';
import { restore, purge } from '@/lib/retention/lifecycle-service';
import { ENTITY_DISPLAY_NAMES } from '@/lib/retention/retention-types';
import type { EntityType, RestorableEntity } from '@/lib/retention/retention-types';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/stores/toast-store';
import { Button, Tabs, EmptyState, LoadingState, ConfirmationDialog, StatusBadge } from '@releaseflow/ui';

type ArchiveTab = 'all' | 'release' | 'track' | 'artist' | 'label' | 'person' | 'media_asset';

interface TabDef {
  id: ArchiveTab;
  label: string;
  count?: number;
}

const TABS: TabDef[] = [
  { id: 'all', label: 'All' },
  { id: 'release', label: 'Releases' },
  { id: 'track', label: 'Tracks' },
  { id: 'artist', label: 'Artists' },
  { id: 'label', label: 'Labels' },
  { id: 'person', label: 'People' },
  { id: 'media_asset', label: 'Media' },
];

async function fetchDeleted(orgId: string): Promise<Record<ArchiveTab, RestorableEntity[]>> {
  const [allReleases, allTracks, allArtists, allLabels, allPeople, allMedia] = await Promise.all([
    getDeletedReleases(orgId),
    getDeletedTracks(orgId),
    getDeletedArtists(orgId),
    getDeletedLabels(orgId),
    getDeletedPeople(orgId),
    getDeletedMediaAssets(orgId),
  ]);

  return {
    all: [...allReleases, ...allTracks, ...allArtists, ...allLabels, ...allPeople, ...allMedia],
    release: allReleases,
    track: allTracks,
    artist: allArtists,
    label: allLabels,
    person: allPeople,
    media_asset: allMedia,
  };
}

function formatTimestamp(ts: unknown): string {
  if (!ts) return '-';
  if (typeof ts === 'object' && ts !== null) {
    const d = ts as { seconds?: number; toDate?: () => Date };
    if (typeof d.toDate === 'function') return d.toDate().toLocaleDateString();
    if (typeof d.seconds === 'number') return new Date(d.seconds * 1000).toLocaleDateString();
  }
  return '-';
}

function getEntityLink(entity: RestorableEntity): string {
  switch (entity.entityType) {
    case 'release': return `/releases/${entity.id}`;
    case 'track': return `/tracks/${entity.id}`;
    case 'artist': return `/artists/${entity.id}`;
    case 'label': return `/labels/${entity.id}`;
    case 'person': return `/people/${entity.id}`;
    case 'media_asset': return `/media/${entity.id}`;
    default: return '#';
  }
}

export default function ArchivePage() {
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const [tab, setTab] = useState<ArchiveTab>('all');
  const [data, setData] = useState<Record<ArchiveTab, RestorableEntity[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionEntity, setActionEntity] = useState<RestorableEntity | null>(null);
  const [actionType, setActionType] = useState<'restore' | 'purge' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDeleted(activeOrgId);
      setData(result);
    } catch (e) {
      setError((e as Error).message || 'Failed to load deleted entities');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    if (activeOrgId) refresh();
    else setLoading(false);
  }, [activeOrgId, refresh]);

  const handleRestore = useCallback(async () => {
    if (!actionEntity || !activeOrgId || !user) return;
    setActionLoading(true);
    try {
      await restore({
        entityType: actionEntity.entityType,
        entityId: actionEntity.id,
        organizationId: activeOrgId,
        actorId: user.uid,
        previousStatus: actionEntity.originalStatus,
      });
      toast.success(`${ENTITY_DISPLAY_NAMES[actionEntity.entityType]} restored`);
      setActionEntity(null);
      setActionType(null);
      refresh();
    } catch (e) {
      toast.error('Restore failed', (e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }, [actionEntity, activeOrgId, user, refresh]);

  const handlePurge = useCallback(async () => {
    if (!actionEntity || !activeOrgId || !user) return;
    setActionLoading(true);
    try {
      await purge({
        entityType: actionEntity.entityType,
        entityId: actionEntity.id,
        organizationId: activeOrgId,
        actorId: user.uid,
        force: false,
      });
      toast.success(`${ENTITY_DISPLAY_NAMES[actionEntity.entityType]} permanently deleted`);
      setActionEntity(null);
      setActionType(null);
      refresh();
    } catch (e) {
      toast.error('Purge failed', (e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }, [actionEntity, activeOrgId, user, refresh]);

  const currentList = data ? data[tab] : [];
  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count: data ? data[t.id].length : undefined,
  }));

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">Recovery Center</h1>
            <p className="mt-1 text-sm text-text-400">Restore or permanently delete archived items.</p>
          </div>
        </div>
        <EmptyState title="No organisation selected" description="Select an organisation from the top bar to view its archive." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">Recovery Center</h1>
          <p className="mt-1 text-sm text-text-400">
            {data
              ? `${currentList.length} item${currentList.length !== 1 ? 's' : ''} in trash`
              : 'Restore or permanently delete archived items.'}
          </p>
        </div>
        {data && (
          <Button variant="secondary" size="sm" onClick={refresh}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        )}
      </div>

      <Tabs
        tabs={tabsWithCounts.map((t) => ({ id: t.id, label: t.label, count: t.count }))}
        activeTab={tab}
        onChange={(t) => setTab(t as ArchiveTab)}
        variant="underline"
        className="mb-8"
      />

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <LoadingState />
        </div>
      ) : error ? (
        <EmptyState title="Failed to load archive" description={error} action={{ label: 'Retry', onClick: refresh }} />
      ) : currentList.length === 0 ? (
        <EmptyState
          title="Trash is empty"
          description="Deleted items will appear here so you can restore or permanently delete them."
          className="py-20"
        />
      ) : (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700/80 bg-layer-2 dark:bg-surface-900 overflow-hidden divide-y divide-surface-100 dark:divide-surface-800">
          {currentList.map((entity) => (
            <div
              key={`${entity.entityType}-${entity.id}`}
              className="flex items-center gap-4 px-5 py-4 group hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-text-400 uppercase tracking-wider">
                    {ENTITY_DISPLAY_NAMES[entity.entityType]}
                  </span>
                  <StatusBadge status={entity.originalStatus ?? 'deleted'} />
                </div>
                <p className="text-sm font-medium text-text-700 dark:text-text-200 truncate">
                  {entity.title}
                </p>
                <p className="text-xs text-text-400 mt-0.5">
                  Deleted {formatTimestamp(entity.deletedAt)}
                  {entity.deleteReason ? ` — ${entity.deleteReason}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setActionEntity(entity); setActionType('restore'); }}
                >
                  Restore
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { setActionEntity(entity); setActionType('purge'); }}
                >
                  Delete Forever
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={actionType === 'restore'}
        onClose={() => { if (!actionLoading) { setActionEntity(null); setActionType(null); } }}
        onConfirm={handleRestore}
        title="Restore Item"
        message={`Restore "${actionEntity?.title ?? ''}" to its previous status?`}
        confirmLabel="Restore"
        variant="default"
        loading={actionLoading}
      />

      <ConfirmationDialog
        open={actionType === 'purge'}
        onClose={() => { if (!actionLoading) { setActionEntity(null); setActionType(null); } }}
        onConfirm={handlePurge}
        title="Permanently Delete"
        message={`Permanently delete "${actionEntity?.title ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete Forever"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
