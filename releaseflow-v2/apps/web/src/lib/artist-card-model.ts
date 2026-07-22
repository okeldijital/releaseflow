/**
 * BUILD-016 — Canonical ArtistCard view model + mapper.
 *
 * Firestore → Artist Service → toArtistCardModels() → ArtistCardModel → ArtistCard
 * No page-level mapping.
 */
import type { ArtistRecord } from './artist-repository';
import { getArtistLinkCounts } from './artist-repository';
import { MediaUrlService } from '@releaseflow/firebase/cloudinary';

/** Human labels for known artistType values — never invent unknown types. */
export const ARTIST_TYPE_LABELS: Record<string, string> = {
  original_artist: 'Original Artist',
  remix_artist: 'Remix Artist',
  cover_artist: 'Cover Artist',
  producer: 'Producer',
  dj: 'DJ',
  band: 'Band',
  collective: 'Collective',
  solo: 'Solo Artist',
  label: 'Label',
  featured_artist: 'Featured Artist',
  composer: 'Composer',
  lyricist: 'Lyricist',
};

/** Overflow menu actions prepared by the mapper (card never invents them). */
export type ArtistCardMenuAction = 'view' | 'edit' | 'duplicate' | 'archive' | 'restore' | 'delete';

export interface ArtistCardModel {
  id: string;
  organizationId: string;
  name: string;
  /** Resolved display image URL (MediaUrlService or stored imageUrl) */
  image: string | null;
  imagePublicId: string | null;
  /** Metadata line — type label only when known */
  subtitle: string;
  artistType: string;
  status: string;
  releaseCount: number | null;
  trackCount: number | null;
  genres: string[] | null;
  /** Canonical menu actions for this artist */
  menuActions: ArtistCardMenuAction[];
  /** Search helpers (not rendered on the card) */
  stageName: string | null;
  legalName: string | null;
  updatedAt?: unknown;
}

function resolveArtistImage(artist: ArtistRecord): string | null {
  if (artist.imagePublicId) {
    try {
      return MediaUrlService.artist(artist.imagePublicId, 400);
    } catch {
      // Public cloud name missing — fall through to stored URL
    }
  }
  return artist.imageUrl ?? null;
}

function resolveSubtitle(artist: ArtistRecord): string {
  const known = ARTIST_TYPE_LABELS[artist.artistType];
  if (known) return known;
  // Do not invent labels — show raw type only if present
  return artist.artistType?.trim() || '';
}

function resolveMenuActions(artist: ArtistRecord): ArtistCardMenuAction[] {
  const actions: ArtistCardMenuAction[] = ['view', 'edit'];
  // Duplicate reserved for future
  if (artist.status === 'archived') {
    actions.push('restore');
  } else {
    actions.push('archive');
  }
  actions.push('delete');
  return actions;
}

/**
 * Map a single artist + optional counts into the card model (no I/O).
 */
export function toArtistCardModel(
  artist: ArtistRecord,
  counts?: { releases?: number; tracks?: number } | null,
): ArtistCardModel {
  return {
    id: artist.id,
    organizationId: artist.organizationId,
    name: artist.name,
    image: resolveArtistImage(artist),
    imagePublicId: artist.imagePublicId ?? null,
    subtitle: resolveSubtitle(artist),
    artistType: artist.artistType,
    status: artist.status,
    releaseCount: counts?.releases ?? null,
    trackCount: counts?.tracks ?? null,
    genres: artist.genres ?? null,
    menuActions: resolveMenuActions(artist),
    stageName: artist.stageName ?? null,
    legalName: artist.legalName ?? null,
    updatedAt: artist.updatedAt,
  };
}

/**
 * Batch enrichment: link counts once, map all artists.
 * Artwork/image resolution is done per model via MediaUrlService (no N+1 network).
 */
export async function toArtistCardModels(
  organizationId: string,
  artists: ArtistRecord[],
  opts?: { includeCounts?: boolean },
): Promise<ArtistCardModel[]> {
  if (artists.length === 0) return [];
  const includeCounts = opts?.includeCounts !== false;
  let counts: Record<string, { releases: number; tracks: number }> = {};
  if (includeCounts) {
    try {
      counts = await getArtistLinkCounts(organizationId);
    } catch {
      counts = {};
    }
  }
  return artists.map((a) => toArtistCardModel(a, counts[a.id] ?? null));
}
