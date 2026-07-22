'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  removeRelease,
  deleteReleaseDraft,
  duplicateDraft,
  renameReleaseDraft,
} from '@/lib/release-service';
import { toast } from '@/stores/toast-store';
import { fmtDate } from '@/lib/utils';
import { StatusBadge, Badge, ConfirmationDialog, ProgressBar } from '@releaseflow/ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import { RELEASE_STATUS_CONFIG, RELEASE_TYPE_LABELS } from '../status/release-status-config';
import type { Release } from '@/app/(app)/types';
import type { WizardDraftData } from '@/components/release/wizard/release-wizard-types';

/**
 * BUG-008B — Canonical Release summary presentation.
 *
 * Every Release summary in the application must render through this component.
 * Modes change layout only; they do not fork presentation ownership.
 *
 * Pipeline: Repository → Service → Workspace Builder → Section → ReleaseCard → DOM
 */
export type ReleaseCardVariant = 'draft' | 'active' | 'archived' | 'released';

/** Layout-only. Prefer `table` over `table-row` (alias kept for back-compat). */
export type ReleaseCardMode =
  | 'workspace'
  | 'compact'
  | 'table'
  | 'table-row'
  | 'detailed'
  | 'search';

function getDraftCompletion(wizardData: Record<string, unknown> | null | undefined): number {
  if (!wizardData) return 0;
  const wd = wizardData as Partial<WizardDraftData>;
  let completed = 0;
  const total = 7;
  if (wd.releaseTitle?.trim()) completed++;
  if (wd.hasArtwork !== null || wd.commissionArtwork !== null) completed++;
  if (wd.tracks?.some((t: { title: string }) => t.title.trim())) completed++;
  if (wd.primaryArtist || wd.featuredArtists?.length) completed++;
  if (wd.recordLabel || wd.upc || wd.primaryGenre) completed++;
  if (wd.promoAssets?.length || wd.socialRows?.some((r: { url: string }) => r.url)) completed++;
  if (wd.hasEmail !== null) completed++;
  return Math.round((completed / total) * 100);
}

function getDraftStepLabel(wizardData: Record<string, unknown> | null | undefined): string {
  if (!wizardData) return 'Draft';
  const wd = wizardData as Partial<WizardDraftData>;
  const idx = typeof wd.currentStep === 'number' ? wd.currentStep : 0;
  const keys = ['type', 'details', 'artwork', 'tracks', 'release_info', 'promotion', 'email', 'review'];
  const labels: Record<string, string> = {
    type: 'Release Type',
    details: 'Details',
    artwork: 'Artwork',
    tracks: 'Tracks',
    release_info: 'Release Info',
    promotion: 'Promotion',
    email: 'Email',
    review: 'Review',
  };
  return labels[keys[idx] ?? ''] ?? 'Draft';
}

interface ReleaseCardProps {
  release: Release;
  trackCount?: number;
  view?: 'grid' | 'list';
  variant?: ReleaseCardVariant;
  mode?: ReleaseCardMode;
  onRenamed?: () => void;
  /** Called with the deleted release id after a successful delete (BUILD-014G). */
  onDeleted?: (releaseId: string) => void;
  onDuplicated?: () => void;
}

export function ReleaseCard({ release, trackCount, view = 'grid', variant = 'active', mode = 'workspace', onRenamed, onDeleted, onDuplicated }: ReleaseCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(release.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const isDraft = variant === 'draft' || release.lifecycle === 'draft';
  const draftPct = isDraft ? getDraftCompletion(release.wizardData) : 0;
  const stepLabel = isDraft ? getDraftStepLabel(release.wizardData) : '';
  const statusMeta = !isDraft ? RELEASE_STATUS_CONFIG[release.status] : undefined;
  // Modes: layout only. `table` / `table-row` / `search` are layout aliases of existing shells.
  const isCompact = mode === 'compact' || mode === 'search';
  const isTableRow = mode === 'table' || mode === 'table-row';
  const isDetailed = mode === 'detailed';

  function openDeleteDialog() {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ReleaseCard] delete dialog opened', { releaseId: release.id, isDraft });
    }
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!user || deleting) return;
    if (process.env.NODE_ENV === 'development') {
      console.log('[ReleaseCard] delete confirmed', { releaseId: release.id, isDraft });
    }
    setDeleting(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ReleaseCard] delete request started', { releaseId: release.id });
      }
      if (isDraft) {
        // BUILD-014G — drafts use dedicated draft deletion, not removeRelease()
        await deleteReleaseDraft(release.id, user.uid);
      } else {
        await removeRelease(release.id, user.uid, release.organizationId);
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('[ReleaseCard] delete completed', { releaseId: release.id });
      }
      toast.success(isDraft ? 'Draft deleted.' : 'Release deleted.');
      setDeleteOpen(false);
      onDeleted?.(release.id);
      if (!isDraft) {
        router.refresh();
      }
    } catch (err) {
      console.error('[ReleaseCard] delete failed', err);
      const reason = err instanceof Error ? err.message : String(err);
      toast.error(
        isDraft ? 'Could not delete draft.' : 'Could not delete release.',
        reason,
      );
      // Keep dialog open on failure (BUILD-014G)
    } finally {
      setDeleting(false);
    }
  }

  async function handleArchive() {
    if (!user) return;
    setArchiving(true);
    try {
      const { editRelease } = await import('@/lib/release-service');
      await editRelease(release.id, { status: 'archived' }, user.uid);
      toast.success('Release archived.');
      router.refresh();
    } catch {
      toast.error('Could not archive release.');
    } finally {
      setArchiving(false);
    }
  }

  async function handleRename() {
    if (!user) return;
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === release.title) {
      setIsEditingTitle(false);
      setNewTitle(release.title);
      return;
    }
    setRenaming(true);
    try {
      await renameReleaseDraft(release.id, trimmed, user.uid);
      toast.success(isDraft ? 'Draft renamed.' : 'Release renamed.');
      onRenamed?.();
      setIsEditingTitle(false);
      router.refresh();
    } catch {
      toast.error(isDraft ? 'Could not rename draft.' : 'Could not rename release.');
    } finally {
      setRenaming(false);
    }
  }

  async function handleDuplicate() {
    if (!user) return;
    try {
      await duplicateDraft(release.id, user.uid);
      toast.success('Draft duplicated.');
      onDuplicated?.();
      router.refresh();
    } catch {
      toast.error('Could not duplicate draft.');
    }
  }

  const getOverflowItems = () => {
    if (isDraft) {
      return [
        {
          id: 'edit',
          label: 'Continue Editing',
          onClick: () => router.push(`/releases/${release.id}`),
          disabled: deleting,
        },
        {
          id: 'duplicate',
          label: 'Duplicate Draft',
          onClick: handleDuplicate,
          disabled: deleting,
        },
        {
          id: 'rename',
          label: 'Rename Draft',
          onClick: () => setIsEditingTitle(true),
          disabled: deleting,
        },
        {
          id: 'delete',
          label: deleting ? 'Deleting...' : 'Delete Draft',
          variant: 'danger' as const,
          separatorBefore: true,
          onClick: openDeleteDialog,
          disabled: deleting,
        },
      ];
    }
    return [
      { id: 'open', label: 'Open Release', onClick: () => router.push(`/releases/${release.id}`) },
      { id: 'edit', label: 'Edit Release', onClick: () => router.push(`/releases/${release.id}/edit`) },
      ...(release.status === 'archived'
        ? [{ id: 'restore', label: 'Restore release', onClick: () => router.push(`/releases/${release.id}`) }]
        : [{ id: 'archive', label: archiving ? 'Archiving...' : 'Archive Release', variant: 'secondary' as const, onClick: handleArchive, disabled: archiving }]),
      {
        id: 'delete',
        label: deleting ? 'Deleting...' : 'Delete Release',
        variant: 'danger' as const,
        separatorBefore: true,
        onClick: openDeleteDialog,
        disabled: deleting,
      },
    ];
  };

  const deleteDialog = (
    <ConfirmationDialog
      open={deleteOpen}
      onClose={() => {
        if (!deleting) setDeleteOpen(false);
      }}
      onConfirm={() => {
        void handleDelete();
      }}
      title={isDraft ? 'Delete Draft?' : 'Delete Release'}
      message={
        isDraft
          ? 'This draft release will be permanently deleted. This action cannot be undone.'
          : `Are you sure you want to delete "${release.title}"? This action cannot be undone.`
      }
      confirmLabel={
        deleting
          ? (isDraft ? 'Deleting...' : 'Deleting...')
          : (isDraft ? 'Delete Draft' : 'Delete Release')
      }
      variant="danger"
      loading={deleting}
    />
  );

  const cardBase = isDraft ? 'border-2 border-dashed border-surface-600/60 bg-surface-900 hover:border-primary-500/40' : 'border border-surface-200 bg-layer-2 shadow-card hover:shadow-card-hover';

  const renderCompactCard = () => (
    <div className={`group relative rounded-xl ${cardBase} transition-all duration-200 overflow-hidden`}>
      <Link href={`/releases/${release.id}`} className="block">
        <div className="flex items-center gap-3 p-3">
          <ArtworkDisplay artwork={release.artwork} releaseTitle={release.title} size="sm" />
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') { setIsEditingTitle(false); setNewTitle(release.title); }
                }}
                className="text-sm font-semibold text-primary-400 bg-transparent border-b border-primary-500/40 outline-none px-1 py-0.5"
                autoFocus
                disabled={renaming}
              />
            ) : (
              <p className="text-sm font-semibold text-primary-400 truncate">{release.title}</p>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              {isDraft ? (
                <Badge label={`${draftPct}%`} color="bg-surface-100 text-text-500" size="sm" />
              ) : statusMeta ? (
                <StatusBadge status={release.status} />
              ) : null}
              {isDraft && stepLabel !== 'Draft' && (
                <span className="text-xs text-text-400">{stepLabel}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <EntityOverflowMenu items={getOverflowItems()} />
    </div>
  );

  const renderTableRow = () => (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-surface-50/80 transition-colors group border-b border-surface-100 last:border-b-0">
      <Link href={`/releases/${release.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <ArtworkDisplay artwork={release.artwork} releaseTitle={release.title} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingTitle ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') { setIsEditingTitle(false); setNewTitle(release.title); }
                }}
                className="text-sm font-semibold text-primary-400 bg-transparent border-b border-primary-500/40 outline-none px-1 py-0.5"
                autoFocus
                disabled={renaming}
              />
            ) : (
              <span className="font-semibold text-primary-400 truncate">{release.title}</span>
            )}
            {isDraft ? (
              <Badge label={`Draft ${draftPct}%`} color="bg-surface-100 text-text-500" size="sm" />
            ) : statusMeta ? (
              <StatusBadge status={release.status} />
            ) : null}
            {trackCount !== undefined && (
              <span className="text-xs text-text-400">{trackCount} track{trackCount !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-500 capitalize">{RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType}</span>
            {isDraft && stepLabel !== 'Draft' && (
              <>
                <span className="text-text-300">·</span>
                <span className="text-xs text-text-400">{stepLabel}</span>
              </>
            )}
            <span className="text-text-300">·</span>
            <span className="text-xs text-text-400">Last saved {fmtDate(release.updatedAt)}</span>
            {release.targetReleaseDate && !isDraft ? (
              <>
                <span className="text-text-300">·</span>
                <span className="text-xs text-text-400">{fmtDate(release.targetReleaseDate)}</span>
              </>
            ) : null}
          </div>
        </div>
      </Link>
      <EntityOverflowMenu items={getOverflowItems()} />
    </div>
  );

  const renderDetailedCard = () => (
    <div className={`group relative rounded-xl ${cardBase} transition-all duration-200 overflow-hidden`}>
      <Link href={`/releases/${release.id}`} className="block">
        <div className="relative overflow-hidden">
          <ArtworkDisplay artwork={release.artwork} releaseTitle={release.title} size="lg" />
          <div className="absolute top-3 left-3">
            {isDraft ? (
              <Badge label={`DRAFT ${draftPct}%`} color="bg-warning-500/20 text-warning-600 border border-warning-500/30" size="sm" />
            ) : (
              <Badge label={RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType} color="bg-black/30 text-surface-50" size="sm" />
            )}
          </div>
          {!isDraft && release.releaseType && (
            <div className="absolute top-3 right-3">
              <StatusBadge status={release.status} />
            </div>
          )}
          {isDraft && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <EntityOverflowMenu align="right" items={getOverflowItems()} />
            </div>
          )}
        </div>
        <div className="p-5 space-y-3">
          {isEditingTitle ? (
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') { setIsEditingTitle(false); setNewTitle(release.title); }
              }}
              className="w-full text-base font-semibold text-primary-400 bg-transparent border-b border-primary-500/40 outline-none px-1 py-0.5"
              autoFocus
              disabled={renaming}
            />
          ) : (
            <h3 className="font-semibold text-primary-400 truncate leading-snug" onDoubleClick={isDraft ? () => setIsEditingTitle(true) : undefined} title={isDraft ? 'Double-click to rename' : undefined}>
              {release.title}
            </h3>
          )}
          <div className="flex items-center gap-2 text-xs text-text-400">
            {isDraft ? (
              <>
                <span className="capitalize">{stepLabel}</span>
                <span className="text-text-300">·</span>
                <span>Last saved {fmtDate(release.updatedAt)}</span>
              </>
            ) : (
              <>
                {trackCount !== undefined && <span>{trackCount} track{trackCount !== 1 ? 's' : ''}</span>}
                {release.targetReleaseDate && (
                  <>
                    {trackCount !== undefined && <span className="text-text-300">·</span>}
                    <span>{fmtDate(release.targetReleaseDate)}</span>
                  </>
                )}
              </>
            )}
          </div>
          {isDraft && release.estimatedReleaseDate != null && (
            <p className="text-xs text-text-500">
              Est. {fmtDate(release.estimatedReleaseDate)}
            </p>
          )}
          {isDetailed && (
            <div className="space-y-2 pt-2 border-t border-surface-100">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-500">Type</span>
                  <p className="text-text-600 font-medium capitalize">{release.releaseType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <span className="text-text-500">Lifecycle</span>
                  <p className="text-text-600 font-medium capitalize">{release.lifecycle.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <span className="text-text-500">Created</span>
                  <p className="text-text-600 font-medium">{fmtDate(release.createdAt)}</p>
                </div>
                <div>
                  <span className="text-text-500">Updated</span>
                  <p className="text-text-600 font-medium">{fmtDate(release.updatedAt)}</p>
                </div>
                {release.upc && (
                  <div>
                    <span className="text-text-500">UPC</span>
                    <p className="text-text-600 font-medium">{release.upc}</p>
                  </div>
                )}
                {release.catalogNumber && (
                  <div>
                    <span className="text-text-500">Catalog #</span>
                    <p className="text-text-600 font-medium">{release.catalogNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-400">Progress</span>
              <span className="font-medium text-text-600">{draftPct}%</span>
            </div>
            <ProgressBar value={draftPct} />
          </div>
        </div>
      </Link>
      {!isDraft && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <EntityOverflowMenu align="right" items={getOverflowItems()} />
        </div>
      )}
    </div>
  );

  const renderWorkspaceCard = () => {
    if (isCompact) return renderCompactCard();
    if (isTableRow) return renderTableRow();
    if (isDetailed) return renderDetailedCard();

    const cardBorder = isDraft ? 'border-2 border-dashed border-surface-600/60 bg-surface-900 hover:border-primary-500/40' : 'border border-surface-200 bg-layer-2 shadow-card hover:shadow-card-hover';

    return (
      <>
        <div className={`group relative rounded-xl ${cardBorder} transition-all duration-200 overflow-hidden`}>
          <Link href={`/releases/${release.id}`} className="block">
            <div className="relative overflow-hidden">
              <ArtworkDisplay artwork={release.artwork} releaseTitle={release.title} size="lg" />
              <div className="absolute top-3 left-3">
                {isDraft ? (
                  <Badge label={`DRAFT ${draftPct}%`} color="bg-warning-500/20 text-warning-600 border border-warning-500/30" size="sm" />
                ) : (
                  <Badge label={RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType} color="bg-black/30 text-surface-50" size="sm" />
                )}
              </div>
              {!isDraft && release.releaseType && (
                <div className="absolute top-3 right-3">
                  <StatusBadge status={release.status} />
                </div>
              )}
              {isDraft && (
                <div className={`absolute top-3 right-3 ${view === 'grid' ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-200' : ''}`}>
                  <EntityOverflowMenu align="right" items={getOverflowItems()} />
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') { setIsEditingTitle(false); setNewTitle(release.title); }
                  }}
                  className="w-full text-sm font-semibold text-primary-400 bg-transparent border-b border-primary-500/40 outline-none px-1 py-0.5"
                  autoFocus
                  disabled={renaming}
                />
              ) : (
                <h3 className={`font-semibold text-primary-400 truncate leading-snug ${isDraft ? 'cursor-pointer' : ''}`} onDoubleClick={isDraft ? () => setIsEditingTitle(true) : undefined} title={isDraft ? 'Double-click to rename' : undefined}>
                  {release.title}
                </h3>
              )}
              <div className="flex items-center gap-2 text-xs text-text-400">
                {isDraft ? (
                  <>
                    <span className="capitalize">{stepLabel}</span>
                    <span className="text-text-300">·</span>
                    <span>Last saved {fmtDate(release.updatedAt)}</span>
                  </>
                ) : (
                  <>
                    {trackCount !== undefined && <span>{trackCount} track{trackCount !== 1 ? 's' : ''}</span>}
                    {release.targetReleaseDate && (
                      <>
                        {trackCount !== undefined && <span className="text-text-300">·</span>}
                        <span>{fmtDate(release.targetReleaseDate)}</span>
                      </>
                    )}
                  </>
                )}
              </div>
              {isDraft && release.estimatedReleaseDate != null && (
                <p className="text-xs text-text-500">
                  Est. {fmtDate(release.estimatedReleaseDate)}
                </p>
              )}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-400">Progress</span>
                  <span className="font-medium text-text-600">{draftPct}%</span>
                </div>
                <ProgressBar value={draftPct} />
              </div>
            </div>
          </Link>

          {!isDraft && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <EntityOverflowMenu align="right" items={getOverflowItems()} />
            </div>
          )}
        </div>
      </>
    );
  };

  // Never return null — every variant/mode mounts a visible summary.
  // BUILD-014G: ConfirmationDialog is always mounted at the component root
  // so compact/table modes can open delete confirm (not only full workspace).
  if (view === 'list' || isTableRow) {
    return (
      <div data-release-card data-release-id={release.id} data-mode={isTableRow ? 'table' : mode} data-variant={variant}>
        {renderTableRow()}
        {deleteDialog}
      </div>
    );
  }

  return (
    <div data-release-card data-release-id={release.id} data-mode={mode} data-variant={variant}>
      {renderWorkspaceCard()}
      {deleteDialog}
    </div>
  );
}
