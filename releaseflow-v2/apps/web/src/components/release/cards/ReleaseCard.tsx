'use client';

/**
 * BUILD-015 — Canonical Release Card
 *
 * One component, one layout. Contexts only vary size (compact | standard | large).
 * Never fork Dashboard / Draft / Workspace / List layouts.
 *
 * Layout (reference):
 *   Artwork (square) + status badge TL + overflow menu TR
 *   Title (max 2 lines)
 *   Metadata (stage · last saved / released date)
 *   Progress (always)
 */

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
import { Badge, ConfirmationDialog, ProgressBar } from '@releaseflow/ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import type { Release } from '@/app/(app)/types';
import type { WizardDraftData } from '@/components/release/wizard/release-wizard-types';

export type ReleaseCardVariant = 'draft' | 'active' | 'archived' | 'released';

/** BUILD-015 size variants — dimensions only, identical hierarchy. */
export type ReleaseCardSize = 'compact' | 'standard' | 'large';

/**
 * @deprecated Prefer `ReleaseCardSize`. Kept as aliases for callers/tests.
 * compact/search → compact; everything else → standard.
 */
export type ReleaseCardMode =
  | 'workspace'
  | 'compact'
  | 'standard'
  | 'large'
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

function resolveSize(size?: ReleaseCardSize, mode?: ReleaseCardMode): ReleaseCardSize {
  if (size === 'compact' || size === 'standard' || size === 'large') return size;
  if (mode === 'compact' || mode === 'search') return 'compact';
  if (mode === 'large') return 'large';
  return 'standard';
}

function releaseProgress(release: Release, isDraft: boolean, draftPct: number): number {
  if (isDraft) return draftPct;
  if (release.status === 'released' || release.lifecycle === 'archived') return 100;
  if (release.status === 'cancelled') return 0;
  const map: Record<string, number> = {
    planning: 15,
    in_production: 45,
    on_hold: 40,
    ready_for_distribution: 85,
    released: 100,
    archived: 100,
  };
  return map[release.status] ?? 50;
}

function statusBadgeLabel(variant: ReleaseCardVariant, isDraft: boolean): string {
  if (isDraft || variant === 'draft') return 'DRAFT';
  if (variant === 'archived') return 'ARCHIVED';
  if (variant === 'released') return 'RELEASED';
  return 'ACTIVE';
}

function statusBadgeColor(isDraft: boolean, variant: ReleaseCardVariant): string {
  if (isDraft || variant === 'draft') {
    return 'bg-warning-500/20 text-warning-600 border border-warning-500/30';
  }
  if (variant === 'archived') return 'bg-surface-800/90 text-text-300 border border-surface-600/50';
  if (variant === 'released') return 'bg-success-500/20 text-success-600 border border-success-500/30';
  return 'bg-primary-500/20 text-primary-300 border border-primary-500/30';
}

function metadataLine(release: Release, isDraft: boolean, stepLabel: string): string {
  if (isDraft) {
    return `${stepLabel} · Last saved ${fmtDate(release.updatedAt)}`;
  }
  if (release.status === 'released') {
    const d = release.targetReleaseDate ?? release.updatedAt;
    return d ? `Released · ${fmtDate(d)}` : 'Released';
  }
  if (release.lifecycle === 'archived') {
    return `Archived · ${fmtDate(release.updatedAt)}`;
  }
  const stage = release.status.replace(/_/g, ' ');
  const d = release.targetReleaseDate
    ? ` · ${fmtDate(release.targetReleaseDate)}`
    : ` · Updated ${fmtDate(release.updatedAt)}`;
  return `${stage.charAt(0).toUpperCase()}${stage.slice(1)}${d}`;
}

const SIZE_STYLES: Record<
  ReleaseCardSize,
  {
    pad: string;
    title: string;
    meta: string;
    progressLabel: string;
    menuAlways: boolean;
  }
> = {
  compact: {
    pad: 'p-3 space-y-1.5',
    title: 'text-sm font-semibold leading-snug line-clamp-2',
    meta: 'text-[11px] text-text-400 truncate',
    progressLabel: 'text-[11px]',
    menuAlways: true,
  },
  standard: {
    pad: 'p-4 space-y-2',
    title: 'text-sm sm:text-base font-semibold leading-snug line-clamp-2',
    meta: 'text-xs text-text-400 truncate',
    progressLabel: 'text-xs',
    menuAlways: true,
  },
  large: {
    pad: 'p-5 space-y-3',
    title: 'text-base sm:text-lg font-semibold leading-snug line-clamp-2',
    meta: 'text-sm text-text-400 truncate',
    progressLabel: 'text-xs',
    menuAlways: true,
  },
};

export interface ReleaseCardProps {
  release: Release;
  /** Preferred BUILD-015 API */
  size?: ReleaseCardSize;
  /**
   * @deprecated Use `size`. Mapped: compact/search→compact; else→standard.
   */
  mode?: ReleaseCardMode;
  /** @deprecated Ignored for layout; kept for call-site compatibility */
  view?: 'grid' | 'list';
  variant?: ReleaseCardVariant;
  trackCount?: number;
  showProgress?: boolean;
  showMenu?: boolean;
  onRenamed?: () => void;
  onDeleted?: (releaseId: string) => void;
  onDuplicated?: () => void;
}

export function ReleaseCard({
  release,
  size: sizeProp,
  mode,
  view: _view = 'grid',
  variant = 'active',
  trackCount: _trackCount,
  showProgress = true,
  showMenu = true,
  onRenamed,
  onDeleted,
  onDuplicated,
}: ReleaseCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(release.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const size = resolveSize(sizeProp, mode);
  const styles = SIZE_STYLES[size];
  const isDraft = variant === 'draft' || release.lifecycle === 'draft';
  const draftPct = isDraft ? getDraftCompletion(release.wizardData) : 0;
  const stepLabel = isDraft ? getDraftStepLabel(release.wizardData) : '';
  const progress = releaseProgress(release, isDraft, draftPct);
  const meta = metadataLine(release, isDraft, stepLabel);
  const badgeLabel = statusBadgeLabel(variant, isDraft);
  const badgeColor = statusBadgeColor(isDraft, variant);

  const cardBorder = isDraft
    ? 'border-2 border-dashed border-surface-600/60 bg-surface-900 hover:border-primary-500/40'
    : 'border border-surface-200 bg-layer-2 shadow-card hover:shadow-card-hover';

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
      if (!isDraft) router.refresh();
    } catch (err) {
      console.error('[ReleaseCard] delete failed', err);
      const reason = err instanceof Error ? err.message : String(err);
      toast.error(
        isDraft ? 'Could not delete draft.' : 'Could not delete release.',
        reason,
      );
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

  const overflowItems = isDraft
    ? [
        {
          id: 'edit',
          label: 'Continue Editing',
          onClick: () => router.push(`/releases/${release.id}`),
          disabled: deleting,
        },
        {
          id: 'duplicate',
          label: 'Duplicate',
          onClick: () => void handleDuplicate(),
          disabled: deleting,
        },
        {
          id: 'rename',
          label: 'Rename',
          onClick: () => setIsEditingTitle(true),
          disabled: deleting,
        },
        {
          id: 'delete',
          label: deleting ? 'Deleting...' : 'Delete',
          variant: 'danger' as const,
          separatorBefore: true,
          onClick: openDeleteDialog,
          disabled: deleting,
        },
      ]
    : [
        {
          id: 'open',
          label: 'Open Release',
          onClick: () => router.push(`/releases/${release.id}`),
        },
        {
          id: 'edit',
          label: 'Edit Release',
          onClick: () => router.push(`/releases/${release.id}/edit`),
        },
        ...(release.status === 'archived'
          ? [{
              id: 'restore',
              label: 'Restore release',
              onClick: () => router.push(`/releases/${release.id}`),
            }]
          : [{
              id: 'archive',
              label: archiving ? 'Archiving...' : 'Archive Release',
              variant: 'secondary' as const,
              onClick: () => void handleArchive(),
              disabled: archiving,
            }]),
        {
          id: 'delete',
          label: deleting ? 'Deleting...' : 'Delete',
          variant: 'danger' as const,
          separatorBefore: true,
          onClick: openDeleteDialog,
          disabled: deleting,
        },
      ];

  return (
    <div
      data-release-card
      data-release-id={release.id}
      data-size={size}
      data-mode={size}
      data-variant={variant}
      className={`group relative rounded-xl ${cardBorder} transition-all duration-200 overflow-hidden`}
    >
      {/* Artwork — always full-width square */}
      <div className="relative w-full overflow-hidden">
        <Link href={`/releases/${release.id}`} className="block">
          <ArtworkDisplay
            artwork={release.artwork}
            releaseTitle={release.title}
            size="lg"
            className="rounded-none rounded-t-xl"
          />
        </Link>

        {/* Status badge — top-left (fixed) */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <Badge label={badgeLabel} color={badgeColor} size="sm" />
        </div>

        {/* Overflow menu — top-right (fixed position all pages) */}
        {showMenu ? (
          <div
            className={`absolute top-3 right-3 z-10 ${
              styles.menuAlways
                ? ''
                : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
            }`}
          >
            <EntityOverflowMenu align="right" items={overflowItems} />
          </div>
        ) : null}
      </div>

      {/* Body — identical hierarchy for all sizes */}
      <div className={styles.pad}>
        {isEditingTitle ? (
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={() => void handleRename()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleRename();
              if (e.key === 'Escape') {
                setIsEditingTitle(false);
                setNewTitle(release.title);
              }
            }}
            className={`w-full ${styles.title} text-primary-400 bg-transparent border-b border-primary-500/40 outline-none px-0.5 py-0.5`}
            autoFocus
            disabled={renaming}
          />
        ) : (
          <Link href={`/releases/${release.id}`} className="block min-w-0">
            <h3
              className={`${styles.title} text-primary-400 ${isDraft ? 'cursor-pointer' : ''}`}
              onDoubleClick={
                isDraft
                  ? (e) => {
                      e.preventDefault();
                      setIsEditingTitle(true);
                    }
                  : undefined
              }
              title={release.title}
            >
              {release.title}
            </h3>
          </Link>
        )}

        <p className={styles.meta} title={meta}>
          {meta}
        </p>

        {showProgress ? (
          <div className="pt-0.5">
            <div className={`flex items-center justify-between mb-1 ${styles.progressLabel}`}>
              <span className="text-text-400">Progress</span>
              <span className="font-medium text-text-600">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        ) : null}
      </div>

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
            ? 'Deleting...'
            : isDraft
              ? 'Delete Draft'
              : 'Delete Release'
        }
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
