'use client';

/**
 * EPIC-202 — Shared artist relationship list for Original / Featured / Remix.
 * Single implementation used by Release Wizard, standalone Track create, and Track edit.
 */

import {
  RepeatableArtistPicker,
  type ArtistOption,
  type RepeatableArtistEntry,
} from '@/components/artist-field-picker';
import type { ArtistCardModel } from '@/lib/artist-card-model';

export type ArtistRelationshipRole = 'original' | 'featured' | 'remix';

const ROLE_LABELS: Record<ArtistRelationshipRole, { label: string; addLabel: string }> = {
  original: { label: 'Original Artists', addLabel: '+ Add Original Artist' },
  featured: { label: 'Featured Artists', addLabel: '+ Add Featured Artist' },
  remix: { label: 'Remix Artists', addLabel: '+ Add Remix Artist' },
};

export interface ArtistRelationshipListProps {
  instanceId: string;
  role: ArtistRelationshipRole;
  entries: RepeatableArtistEntry[];
  artists: ArtistOption[];
  /** BUILD-016 — canonical card models for search results */
  cardModels?: ArtistCardModel[];
  organizationId: string | null;
  onAdd: (artistId: string) => void;
  onRemove: (entryId: string) => void;
  onReorder: (entries: RepeatableArtistEntry[]) => void;
  onArtistCreated?: (artist: ArtistOption) => void;
  /** Artists already selected in other roles (optional exclusion) — EPIC allows multi-role, so default empty */
  excludeIds?: string[];
  error?: string;
  /** When true, block duplicate within this list only (always enforced in onAdd by parent) */
  label?: string;
  addLabel?: string;
}

export function ArtistRelationshipList({
  instanceId,
  role,
  entries,
  artists,
  cardModels,
  organizationId,
  onAdd,
  onRemove,
  onReorder,
  onArtistCreated,
  excludeIds = [],
  error,
  label,
  addLabel,
}: ArtistRelationshipListProps) {
  const defaults = ROLE_LABELS[role];
  return (
    <RepeatableArtistPicker
      instanceId={instanceId}
      label={label ?? defaults.label}
      addLabel={addLabel ?? defaults.addLabel}
      entries={entries}
      artists={artists}
      cardModels={cardModels}
      organizationId={organizationId}
      onAdd={onAdd}
      onRemove={onRemove}
      onReorder={onReorder}
      onArtistCreated={onArtistCreated}
      excludeIds={excludeIds}
      error={error}
    />
  );
}

export type { RepeatableArtistEntry, ArtistOption };
