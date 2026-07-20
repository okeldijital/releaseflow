'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { removeRelease } from '@/lib/release-service';
import { toast } from '@/stores/toast-store';
import { fmtDate } from '@/lib/utils';
import { Badge, ConfirmationDialog, ProgressBar } from '@releaseflow/ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import { RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import type { ReleaseRecord } from '@/lib/release-repository';
import type { WizardDraftData } from '@/components/release/wizard/release-wizard-types';

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

interface DraftCardProps {
  release: ReleaseRecord;
  view?: 'grid' | 'list';
  onRenamed?: () => void;
  onDeleted?: () => void;
  onDuplicated?: () => void;
}

export function DraftCard({ release, view = 'grid', onRenamed, onDeleted, onDuplicated }: DraftCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(release.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const draftPct = getDraftCompletion(release.wizardData);
  const stepLabel = getDraftStepLabel(release.wizardData);

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      await removeRelease(release.id, user.uid, release.organizationId);
      toast.success('Draft deleted.');
      onDeleted?.();
      router.refresh();
    } catch {
      toast.error('Could not delete draft.');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
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
      const { renameReleaseDraft } = await import('@/lib/release-service');
      await renameReleaseDraft(release.id, trimmed, user.uid);
      toast.success('Draft renamed.');
      onRenamed?.();
      setIsEditingTitle(false);
      router.refresh();
    } catch {
      toast.error('Could not rename draft.');
    } finally {
      setRenaming(false);
    }
  }

  async function handleDuplicate() {
    if (!user) return;
    try {
      const { duplicateDraft } = await import('@/lib/release-service');
      await duplicateDraft(release.id, user.uid);
      toast.success('Draft duplicated.');
      onDuplicated?.();
      router.refresh();
    } catch {
      toast.error('Could not duplicate draft.');
    }
  }

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
                  <span
                    className="font-semibold text-primary-400 truncate cursor-pointer hover:underline"
                    onDoubleClick={() => setIsEditingTitle(true)}
                    title="Double-click to rename"
                  >
                    {release.title}
                  </span>
                )}
                <Badge label={`Draft ${draftPct}%`} color="bg-surface-100 text-text-500" size="sm" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-text-500 capitalize">{RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType}</span>
                <span className="text-text-300">·</span>
                <span className="text-xs text-text-400">{stepLabel}</span>
                <span className="text-text-300">·</span>
                <span className="text-xs text-text-400">Last saved {fmtDate(release.updatedAt)}</span>
              </div>
            </div>
          </Link>
          <EntityOverflowMenu
            items={[
              { id: 'open', label: 'Open Draft', onClick: () => router.push(`/releases/${release.id}`) },
              { id: 'edit', label: 'Continue Editing', onClick: () => router.push(`/releases/${release.id}`) },
              { id: 'duplicate', label: 'Duplicate Draft', onClick: handleDuplicate },
              { id: 'rename', label: 'Rename Draft', onClick: () => setIsEditingTitle(true) },
              { id: 'delete', label: 'Delete Draft', variant: 'danger', separatorBefore: true, onClick: () => setDeleteOpen(true) },
            ]}
          />
        </div>
        <ConfirmationDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Draft"
          message={`Are you sure you want to delete "${release.title}"? This action cannot be undone.`}
          confirmLabel="Delete Draft"
          variant="danger"
          loading={deleting}
        />
      </>
    );
  }

  return (
    <>
      <div className="group relative rounded-xl border-2 border-dashed border-surface-600/60 bg-surface-900 hover:border-primary-500/40 transition-all duration-200 overflow-hidden">
        <Link href={`/releases/${release.id}`} className="block">
          <div className="relative overflow-hidden">
            <ArtworkDisplay artwork={release.artwork} releaseTitle={release.title} size="lg" />
            <div className="absolute top-3 left-3">
              <Badge label={`DRAFT ${draftPct}%`} color="bg-warning-500/20 text-warning-600 border border-warning-500/30" size="sm" />
            </div>
            <div className="absolute top-3 right-3">
              <Badge label={RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType} color="bg-black/30 text-surface-50" size="sm" />
            </div>
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
              <h3
                className="font-semibold text-primary-400 truncate leading-snug cursor-pointer"
                onDoubleClick={() => setIsEditingTitle(true)}
                title="Double-click to rename"
              >
                {release.title}
              </h3>
            )}
            <div className="flex items-center gap-2 text-xs text-text-400">
              <span className="capitalize">{stepLabel}</span>
              <span className="text-text-300">·</span>
              <span>Last saved {fmtDate(release.updatedAt)}</span>
            </div>
            {release.estimatedReleaseDate != null && (
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

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <EntityOverflowMenu
            align="right"
            items={[
              { id: 'open', label: 'Open Draft', onClick: () => router.push(`/releases/${release.id}`) },
              { id: 'edit', label: 'Continue Editing', onClick: () => router.push(`/releases/${release.id}`) },
              { id: 'duplicate', label: 'Duplicate Draft', onClick: handleDuplicate },
              { id: 'rename', label: 'Rename Draft', onClick: () => setIsEditingTitle(true) },
              { id: 'delete', label: 'Delete Draft', variant: 'danger', separatorBefore: true, onClick: () => setDeleteOpen(true) },
            ]}
          />
        </div>
      </div>
      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Draft"
        message={`Are you sure you want to delete "${release.title}"? This action cannot be undone.`}
        confirmLabel="Delete Draft"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
