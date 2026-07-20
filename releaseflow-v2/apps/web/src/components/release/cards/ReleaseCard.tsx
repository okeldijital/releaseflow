'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { removeRelease, duplicateDraft, renameReleaseDraft } from '@/lib/release-service';
import { toast } from '@/stores/toast-store';
import { fmtDate } from '@/lib/utils';
import { StatusBadge, Badge, ConfirmationDialog, ProgressBar } from '@releaseflow/ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import { RELEASE_STATUS_CONFIG, RELEASE_TYPE_LABELS } from '../status/release-status-config';
import type { Release } from '@/app/(app)/types';
import type { WizardDraftData } from '@/components/release/wizard/release-wizard-types';

export type ReleaseCardVariant = 'draft' | 'active' | 'archived' | 'released';

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
  onRenamed?: () => void;
  onDeleted?: () => void;
  onDuplicated?: () => void;
}

export function ReleaseCard({ release, trackCount, view = 'grid', variant = 'active', onRenamed, onDeleted, onDuplicated }: ReleaseCardProps) {
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

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      await removeRelease(release.id, user.uid, release.organizationId);
      toast.success(isDraft ? 'Draft deleted.' : 'Release deleted.');
      onDeleted?.();
      router.refresh();
    } catch {
      toast.error(isDraft ? 'Could not delete draft.' : 'Could not delete release.');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
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
        { id: 'edit', label: 'Continue Editing', onClick: () => router.push(`/releases/${release.id}`) },
        { id: 'duplicate', label: 'Duplicate Draft', onClick: handleDuplicate },
        { id: 'rename', label: 'Rename Draft', onClick: () => setIsEditingTitle(true) },
        { id: 'delete', label: 'Delete Draft', variant: 'danger' as const, separatorBefore: true, onClick: () => setDeleteOpen(true) },
      ];
    }
    return [
      { id: 'open', label: 'Open Release', onClick: () => router.push(`/releases/${release.id}`) },
      { id: 'edit', label: 'Edit Release', onClick: () => router.push(`/releases/${release.id}/edit`) },
      ...(release.status === 'archived'
        ? [{ id: 'restore', label: 'Restore release', onClick: () => router.push(`/releases/${release.id}`) }]
        : [{ id: 'archive', label: archiving ? 'Archiving...' : 'Archive Release', variant: 'secondary' as const, onClick: handleArchive, disabled: archiving }]),
      { id: 'delete', label: 'Delete Release', variant: 'danger' as const, separatorBefore: true, onClick: () => setDeleteOpen(true) },
    ];
  };

  if (view === 'list') {
    return (
      <>
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
                {isDraft && (
                  <>
                    <span className="text-text-300">·</span>
                    <span className="text-xs text-text-400">Last saved {fmtDate(release.updatedAt)}</span>
                  </>
                )}
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
        <ConfirmationDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title={isDraft ? 'Delete Draft' : 'Delete Release'}
          message={`Are you sure you want to delete "${release.title}"? This action cannot be undone.`}
          confirmLabel={isDraft ? 'Delete Draft' : 'Delete Release'}
          variant="danger"
          loading={deleting}
        />
      </>
    );
  }

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
                <EntityOverflowMenu
                  align="right"
                  items={getOverflowItems()}
                />
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
            <EntityOverflowMenu
              align="right"
              items={getOverflowItems()}
            />
          </div>
        )}
      </div>
      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={isDraft ? 'Delete Draft' : 'Delete Release'}
        message={`Are you sure you want to delete "${release.title}"? This action cannot be undone.`}
        confirmLabel={isDraft ? 'Delete Draft' : 'Delete Release'}
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
