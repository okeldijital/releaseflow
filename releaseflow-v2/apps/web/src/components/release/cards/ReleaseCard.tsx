'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { removeRelease } from '@/lib/release-service';
import { toast } from '@/stores/toast-store';
import { fmtDate } from '@/lib/utils';
import { StatusBadge, Badge, ConfirmationDialog, ProgressBar } from '@releaseflow/ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import { RELEASE_STATUS_CONFIG, RELEASE_TYPE_LABELS } from '../status/release-status-config';
import type { Release } from '@/app/(app)/types';

interface ReleaseCardProps {
  release: Release;
  trackCount?: number;
  view?: 'grid' | 'list';
  artworkUrl?: string;
}

export function ReleaseCard({ release, trackCount, view = 'grid', artworkUrl }: ReleaseCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const statusMeta = RELEASE_STATUS_CONFIG[release.status];

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      await removeRelease(release.id, user.uid, release.organizationId);
      toast.success('Release deleted.');
      router.refresh();
    } catch {
      toast.error('Could not delete release.');
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

  if (view === 'list') {
    return (
      <>
        <div className="flex items-center gap-4 px-4 py-3 hover:bg-surface-50/80 dark:hover:bg-surface-800/40 transition-colors group border-b border-surface-100 dark:border-surface-800 last:border-b-0">
          <Link href={`/releases/${release.id}`} className="flex items-center gap-4 flex-1 min-w-0">
            <ArtworkDisplay src={artworkUrl} releaseTitle={release.title} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-primary-400 truncate">{release.title}</span>
                <StatusBadge status={release.status} />
                {trackCount !== undefined && (
                  <span className="text-xs text-text-400">{trackCount} track{trackCount !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-text-500 capitalize">{RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType}</span>
                {release.targetReleaseDate ? (
                  <>
                    <span className="text-text-300">·</span>
                    <span className="text-xs text-text-400">{fmtDate(release.targetReleaseDate)}</span>
                  </>
                ) : null}
              </div>
            </div>
          </Link>
          <EntityOverflowMenu
            items={[
              { id: 'open', label: 'Open Release', onClick: () => router.push(`/releases/${release.id}`) },
              { id: 'edit', label: 'Edit Release', onClick: () => router.push(`/releases/${release.id}/edit`) },
              { id: 'archive', label: archiving ? 'Archiving...' : 'Archive Release', onClick: handleArchive, disabled: archiving },
              { id: 'delete', label: 'Delete Release', variant: 'danger', separatorBefore: true, onClick: () => setDeleteOpen(true) },
            ]}
          />
        </div>
        <ConfirmationDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Release"
          message={`Are you sure you want to delete "${release.title}"? This action cannot be undone.`}
          confirmLabel="Delete Release"
          variant="danger"
          loading={deleting}
        />
      </>
    );
  }

  return (
    <>
      <div className="group relative rounded-xl border border-surface-200 dark:border-surface-700/80 bg-layer-2 dark:bg-surface-900 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
        <Link href={`/releases/${release.id}`} className="block">
          <div className="relative overflow-hidden">
            <ArtworkDisplay src={artworkUrl} releaseTitle={release.title} size="lg" />
            {statusMeta && (
              <div className="absolute top-3 right-3">
                <StatusBadge status={release.status} />
              </div>
            )}
            {release.releaseType && (
              <div className="absolute top-3 left-3">
                <Badge label={RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType} color="bg-black/30 text-surface-50" size="sm" />
              </div>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-primary-400 truncate leading-snug">{release.title}</h3>
            <div className="flex items-center gap-2 text-xs text-text-400">
              {trackCount !== undefined && (
                <span>{trackCount} track{trackCount !== 1 ? 's' : ''}</span>
              )}
              {release.targetReleaseDate ? (
                <>
                  {trackCount !== undefined && <span className="text-text-300">·</span>}
                  <span>{fmtDate(release.targetReleaseDate)}</span>
                </>
              ) : null}
            </div>
            {statusMeta && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-400">Progress</span>
                  <span className="font-medium text-text-600">{statusMeta.progress}%</span>
                </div>
                <ProgressBar value={statusMeta.progress} />
              </div>
            )}
          </div>
        </Link>

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <EntityOverflowMenu
            align="right"
            items={[
              { id: 'open', label: 'Open Release', onClick: () => router.push(`/releases/${release.id}`) },
              { id: 'edit', label: 'Edit Release', onClick: () => router.push(`/releases/${release.id}/edit`) },
              { id: 'archive', label: archiving ? 'Archiving...' : 'Archive Release', onClick: handleArchive, disabled: archiving },
              { id: 'delete', label: 'Delete Release', variant: 'danger', separatorBefore: true, onClick: () => setDeleteOpen(true) },
            ]}
          />
        </div>
      </div>
      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Release"
        message={`Are you sure you want to delete "${release.title}"? This action cannot be undone.`}
        confirmLabel="Delete Release"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
