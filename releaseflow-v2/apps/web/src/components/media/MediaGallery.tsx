'use client';

import { useState } from 'react';
import { Button, EmptyState } from '@releaseflow/ui';
import type { MediaAsset, MediaAssetType } from '@/lib/media/media-types';
import { MEDIA_TYPE_LABELS } from '@/lib/media/media-repository';

interface MediaGalleryProps {
  assets: MediaAsset[];
  onSelect?: (asset: MediaAsset) => void;
  onUpload?: (type: MediaAssetType) => void;
  view?: 'grid' | 'list';
  className?: string;
}

const ASSET_GROUPS: { key: string; label: string; types: MediaAssetType[] }[] = [
  { key: 'cover', label: 'Cover', types: ['cover', 'back_cover'] },
  { key: 'marketing', label: 'Marketing', types: ['promo_banner', 'social_artwork', 'marketing_asset'] },
  { key: 'booklet', label: 'Booklet', types: ['booklet', 'cd_label', 'vinyl_label'] },
  { key: 'press', label: 'Press', types: ['press_image'] },
  { key: 'other', label: 'Other', types: [] },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-success-500/15 text-success-500';
    case 'in_review':
      return 'bg-info-500/15 text-info-500';
    case 'changes_requested':
    case 'rejected':
      return 'bg-danger-500/15 text-danger-500';
    case 'draft':
      return 'bg-surface-200 text-text-500';
    case 'archived':
      return 'bg-surface-200 text-text-400';
    default:
      return 'bg-surface-200 text-text-500';
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function getGroupForType(assetType: MediaAssetType): string {
  for (const group of ASSET_GROUPS) {
    if (group.types.includes(assetType)) return group.key;
  }
  return 'other';
}

function assetPlaceholder(type: MediaAssetType): string {
  if (type === 'cover' || type === 'back_cover') return '🎵';
  if (type === 'booklet') return '📖';
  if (type === 'cd_label' || type === 'vinyl_label') return '💿';
  if (type === 'promo_banner' || type === 'marketing_asset') return '📢';
  if (type === 'social_artwork') return '📱';
  if (type === 'press_image') return '📸';
  return '📄';
}

export function MediaGallery({
  assets,
  onSelect,
  onUpload,
  view: initialView = 'grid',
  className = '',
}: MediaGalleryProps) {
  const [view, setView] = useState<'grid' | 'list'>(initialView);

  const grouped = ASSET_GROUPS.map((group) => {
    const groupAssets = group.key === 'other'
      ? assets.filter((a) => getGroupForType(a.assetType) === 'other')
      : assets.filter((a) => (group.types as MediaAssetType[]).includes(a.assetType));
    return { ...group, assets: groupAssets };
  });

  return (
    <div className={className}>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-text-500">
          {assets.length} asset{assets.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-surface-200 p-0.5 bg-layer-2">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-surface-50 shadow-sm' : 'text-text-400 hover:text-text-600'}`}
            aria-label="Grid view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-surface-50 shadow-sm' : 'text-text-400 hover:text-text-600'}`}
            aria-label="List view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title="No media assets"
          description="Upload artwork, press images, and marketing assets for this release."
          action={onUpload ? { label: 'Upload Asset', onClick: () => onUpload('cover') } : undefined}
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => {
            if (group.assets.length === 0 && group.key !== 'other') return null;

            return (
              <section key={group.key} aria-label={group.label}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-text-400 uppercase tracking-wider">
                    {group.label}
                    <span className="ml-2 font-normal text-text-400 normal-case">
                      {group.assets.length} file{group.assets.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                  {onUpload && group.types.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpload(group.types[0] as MediaAssetType)}
                    >
                      Upload
                    </Button>
                  )}
                </div>

                {group.assets.length === 0 ? (
                  <p className="text-sm text-text-400 py-4 text-center">No assets in this category.</p>
                ) : view === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                    {group.assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => onSelect?.(asset)}
                        className="group relative flex flex-col rounded-xl border border-surface-200 bg-layer-2 overflow-hidden hover:border-primary-500/50 hover:shadow-sm transition-all text-left"
                      >
                        <div className="aspect-[4/3] bg-surface-100 flex items-center justify-center overflow-hidden">
                          {asset.thumbnailUrl ? (
                            <img
                              src={asset.thumbnailUrl}
                              alt={asset.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-2xl">{assetPlaceholder(asset.assetType)}</span>
                          )}
                        </div>
                        <div className="p-2.5 flex flex-col gap-1 min-w-0">
                          <p className="text-xs font-medium text-text-800 truncate">{asset.title}</p>
                          <p className="text-caption text-text-400 truncate">{MEDIA_TYPE_LABELS[asset.assetType]}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-caption text-text-400">{formatSize(asset.fileSize)}</span>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-caption font-medium ${statusColor(asset.status)}`}>
                              {statusLabel(asset.status)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card overflow-hidden">
                    {group.assets.map((asset, i) => (
                      <button
                        key={asset.id}
                        onClick={() => onSelect?.(asset)}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors duration-100 ${
                          i > 0 ? 'border-t border-surface-100' : ''
                        }`}
                      >
                        <div className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {asset.thumbnailUrl ? (
                            <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base">{assetPlaceholder(asset.assetType)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-800 truncate">{asset.title}</p>
                            <p className="text-caption text-text-400">{MEDIA_TYPE_LABELS[asset.assetType]}</p>
                          </div>
                          <span className="text-xs text-text-500 hidden sm:block">{formatSize(asset.fileSize)}</span>
                          <span className="text-xs text-text-500 hidden sm:block">{asset.dimensions ? `${asset.dimensions.width}×${asset.dimensions.height}` : '—'}</span>
                          <span className={`justify-self-end inline-flex items-center rounded-full px-1.5 py-0.5 text-caption font-medium ${statusColor(asset.status)}`}>
                            {statusLabel(asset.status)}
                          </span>
                        </div>
                        <svg className="h-4 w-4 text-text-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
