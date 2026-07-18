import { getReleasesByTrack } from './release-track-repository';
import {
  getTracksByArtist,
  getTracksAsOriginalArtist,
  getTracksAsFeaturedArtist,
  getTracksAsRemixArtist,
  getAllArtistTracks,
  getArtistsByRole,
  removeArtistsFromTrackByRole,
  addArtistToTrack,
  type TrackArtistRecord,
  type TrackArtistRole,
} from './track-artist-repository';
import {
  createTrack, updateTrack, getTrack, getTracksByOrg, archiveTrack, deleteTrack,
} from './track-repository';
import type {
  CreateTrackFields, UpdateTrackFields, TrackRecord,
} from './track-repository';
import { recordActivity } from './activity-service';
import { generateSuggestedDisplayTitle } from './display-title';

export type { TrackRecord, CreateTrackFields, UpdateTrackFields } from './track-repository';
export type { TrackArtistRecord };

export {
  getTracksAsOriginalArtist,
  getTracksAsFeaturedArtist,
  getTracksAsRemixArtist,
  getAllArtistTracks,
};

export async function createNewTrack(fields: CreateTrackFields): Promise<string> {
  if (!fields.title.trim()) throw new Error('Track title is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  if (!fields.createdBy) throw new Error('Creator is required');
  if (!fields.releaseId) throw new Error('Track must belong to a release');
  const track = await createTrack(fields);
  return track.id;
}

export async function editTrack(trackId: string, fields: UpdateTrackFields): Promise<void> {
  return updateTrack(trackId, fields);
}

export async function removeTrack(trackId: string, organizationId?: string, actorId?: string): Promise<void> {
  if (!trackId) throw new Error('Track ID is required');
  await deleteTrack(trackId, organizationId, actorId);
}

export async function archiveTrackById(trackId: string): Promise<void> {
  if (!trackId) throw new Error('Track ID is required');
  return archiveTrack(trackId);
}

export async function fetchTracksByOrg(orgId: string): Promise<TrackRecord[]> {
  return getTracksByOrg(orgId);
}

export async function fetchTracksByArtist(orgId: string, artistId: string): Promise<TrackRecord[]> {
  const links = await getTracksByArtist(artistId);
  if (links.length === 0) return [];
  const all = await getTracksByOrg(orgId);
  const ids = new Set(links.map((l) => l.trackId));
  return all.filter((t) => ids.has(t.id));
}

export interface ArtistTracksByRole {
  original: TrackRecord[];
  featured: TrackRecord[];
  remix: TrackRecord[];
  /** Deduped union preserving first-seen order */
  all: TrackRecord[];
  links: TrackArtistRecord[];
}

/** EPIC-202 — group org tracks by how this artist is credited */
export async function fetchArtistTracksByRole(
  orgId: string,
  artistId: string,
): Promise<ArtistTracksByRole> {
  const [origLinks, featLinks, remixLinks, allLinks] = await Promise.all([
    getTracksAsOriginalArtist(artistId),
    getTracksAsFeaturedArtist(artistId),
    getTracksAsRemixArtist(artistId),
    getAllArtistTracks(artistId),
  ]);
  const allTracks = await getTracksByOrg(orgId);
  const byId = new Map(allTracks.map((t) => [t.id, t]));

  const mapLinks = (links: TrackArtistRecord[]) =>
    links
      .map((l) => byId.get(l.trackId))
      .filter((t): t is TrackRecord => Boolean(t));

  const original = mapLinks(origLinks);
  const featured = mapLinks(featLinks);
  const remix = mapLinks(remixLinks);
  const seen = new Set<string>();
  const all: TrackRecord[] = [];
  for (const t of [...original, ...featured, ...remix, ...mapLinks(allLinks)]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    all.push(t);
  }
  return { original, featured, remix, all, links: allLinks };
}

export async function fetchTrack(trackId: string): Promise<TrackRecord | null> {
  return getTrack(trackId);
}

export async function duplicateTrack(trackId: string, createdBy: string): Promise<string> {
  const original = await getTrack(trackId);
  if (!original) throw new Error('Track not found');
  const releaseIds = await getReleasesByTrack(trackId);
  const track = await createTrack({
    releaseId: releaseIds[0] ?? (() => { throw new Error('Track has no associated release'); })(),
    organizationId: original.organizationId,
    title: `${original.title} (Copy)`,
    createdBy,
    version: original.version,
    subtitle: original.subtitle,
    trackNumber: original.trackNumber,
    discNumber: original.discNumber,
    isrc: original.isrc,
    duration: original.duration,
    language: original.language,
    explicit: original.explicit,
    genre: original.genre,
    bpm: original.bpm,
    musicalKey: original.musicalKey,
    recordingType: original.recordingType,
    originalArtistId: original.originalArtistId,
    remixerArtistId: original.remixerArtistId,
    primaryArtistId: original.primaryArtistId,
    originalArtistIds: original.originalArtistIds,
    featuredArtistIds: original.featuredArtistIds,
    remixArtistIds: original.remixArtistIds,
    displayTitle: original.displayTitle,
    displayTitleEdited: original.displayTitleEdited,
    credits: original.credits,
  });
  return track.id;
}

export interface TrackArtistCreditsInput {
  originalArtistIds: string[];
  featuredArtistIds: string[];
  remixArtistIds: string[];
}

export interface SyncTrackArtistsOptions {
  organizationId: string;
  actorId: string;
  /** When true (default), rewrite track_artists rows for the three performance roles. */
  syncJoinRows?: boolean;
  /** Artist display names for activity messages (id → name). */
  artistNames?: Record<string, string>;
  /** Base title for auto displayTitle when not manually edited. */
  trackTitle?: string;
  displayTitle?: string | null;
  displayTitleEdited?: boolean;
  isRemix?: boolean;
  originalArtistNames?: string[];
  featuredArtistNames?: string[];
  remixArtistNames?: string[];
}

/**
 * EPIC-202A — Persist original / featured / remix relationships on a track.
 * Updates denormalized id arrays on `tracks` and ordered `track_artists` rows.
 * Logs featured-artist activity (added / removed / reordered).
 */
export async function syncTrackArtistCredits(
  trackId: string,
  credits: TrackArtistCreditsInput,
  opts: SyncTrackArtistsOptions,
): Promise<void> {
  const originalIds = credits.originalArtistIds.filter(Boolean);
  const featuredIds = credits.featuredArtistIds.filter(Boolean);
  const remixIds = credits.remixArtistIds.filter(Boolean);

  const previousFeatured = (await getArtistsByRole(trackId, 'FEATURED_ARTIST')).map((r) => r.artistId);
  // Fall back to track doc if join rows empty (legacy)
  const existing = await getTrack(trackId);
  const prevFeatured =
    previousFeatured.length > 0
      ? previousFeatured
      : (existing?.featuredArtistIds ?? []);

  if (opts.syncJoinRows !== false) {
    await replaceTrackArtistsRole(trackId, 'ORIGINAL_ARTIST', originalIds);
    // Keep PRIMARY_ARTIST in sync for original-style first credit (legacy consumers)
    await removeArtistsFromTrackByRole(trackId, 'PRIMARY_ARTIST');
    if (originalIds[0]) {
      await addArtistToTrack({
        trackId,
        artistId: originalIds[0],
        role: 'PRIMARY_ARTIST',
        position: 1,
        isPrimary: true,
      });
    }
    await replaceTrackArtistsRole(trackId, 'FEATURED_ARTIST', featuredIds);
    await replaceTrackArtistsRole(trackId, 'REMIX_ARTIST', remixIds);
  }

  const displayTitle =
    opts.displayTitleEdited && opts.displayTitle?.trim()
      ? opts.displayTitle.trim()
      : opts.trackTitle
        ? generateSuggestedDisplayTitle({
            trackTitle: opts.trackTitle,
            originalArtistNames: opts.originalArtistNames,
            featuredArtistNames: opts.featuredArtistNames,
            remixArtistNames: opts.remixArtistNames,
            isRemix: opts.isRemix,
          })
        : opts.displayTitle ?? undefined;

  await updateTrack(trackId, {
    originalArtistIds: originalIds,
    featuredArtistIds: featuredIds,
    remixArtistIds: remixIds,
    originalArtistId: originalIds[0] ?? null,
    primaryArtistId: originalIds[0] ?? null,
    remixerArtistId: remixIds[0] ?? null,
    ...(displayTitle !== undefined
      ? {
          displayTitle: displayTitle || null,
          displayTitleEdited: opts.displayTitleEdited ?? false,
        }
      : {}),
  });

  await logFeaturedArtistActivity({
    trackId,
    organizationId: opts.organizationId,
    actorId: opts.actorId,
    previous: prevFeatured,
    next: featuredIds,
    artistNames: opts.artistNames ?? {},
  });
}

async function replaceTrackArtistsRole(
  trackId: string,
  role: TrackArtistRole,
  artistIds: string[],
): Promise<void> {
  await removeArtistsFromTrackByRole(trackId, role);
  for (let i = 0; i < artistIds.length; i++) {
    const artistId = artistIds[i];
    if (!artistId) continue;
    await addArtistToTrack({
      trackId,
      artistId,
      role,
      position: i + 1,
      isPrimary: role === 'ORIGINAL_ARTIST' && i === 0 ? true : undefined,
    });
  }
}

async function logFeaturedArtistActivity(args: {
  trackId: string;
  organizationId: string;
  actorId: string;
  previous: string[];
  next: string[];
  artistNames: Record<string, string>;
}): Promise<void> {
  const { trackId, organizationId, actorId, previous, next, artistNames } = args;
  const prevSet = new Set(previous);
  const nextSet = new Set(next);

  const added = next.filter((id) => !prevSet.has(id));
  const removed = previous.filter((id) => !nextSet.has(id));
  const sameMembers =
    previous.length === next.length && previous.every((id, i) => id === next[i]);
  const reordered =
    !sameMembers &&
    previous.length === next.length &&
    previous.every((id) => nextSet.has(id)) &&
    next.every((id) => prevSet.has(id));

  const nameOf = (id: string) => artistNames[id] ?? id;

  for (const id of added) {
    await recordActivity({
      entityType: 'track',
      entityId: trackId,
      organizationId,
      actorId,
      action: 'track.featured_artist_added',
      metadata: {
        artistId: id,
        artistName: nameOf(id),
        role: 'FEATURED_ARTIST',
      },
      details: `added ${nameOf(id)} as Featured Artist`,
    });
  }
  for (const id of removed) {
    await recordActivity({
      entityType: 'track',
      entityId: trackId,
      organizationId,
      actorId,
      action: 'track.featured_artist_removed',
      metadata: {
        artistId: id,
        artistName: nameOf(id),
        role: 'FEATURED_ARTIST',
      },
      details: `removed ${nameOf(id)} as Featured Artist`,
    });
  }
  if (reordered) {
    await recordActivity({
      entityType: 'track',
      entityId: trackId,
      organizationId,
      actorId,
      action: 'track.featured_artists_reordered',
      metadata: {
        previous,
        next,
        role: 'FEATURED_ARTIST',
      },
      details: 'reordered Featured Artists',
    });
  }
}

/** EPIC-202A — readiness: artists complete when originals valid; featured/remix valid when present. */
export function areTrackArtistsReady(input: {
  originalArtistIds: string[];
  featuredArtistIds: string[];
  remixArtistIds: string[];
  isRemix?: boolean;
}): boolean {
  const originals = input.originalArtistIds.filter(Boolean);
  if (originals.length === 0) return false;
  // Featured optional but every listed id must be non-empty (already filtered)
  if (input.isRemix && input.remixArtistIds.filter(Boolean).length === 0) return false;
  return true;
}
