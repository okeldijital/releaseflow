import { getReleasesByTrack } from './release-track-repository';
import {
  getTracksByArtist,
  getTracksAsOriginalArtist,
  getTracksAsFeaturedArtist,
  getTracksAsRemixArtist,
  getAllArtistTracks,
  type TrackArtistRecord,
} from './track-artist-repository';
import {
  createTrack, updateTrack, getTrack, getTracksByOrg, archiveTrack, deleteTrack,
} from './track-repository';
import type {
  CreateTrackFields, UpdateTrackFields, TrackRecord,
} from './track-repository';

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
    featuredArtistIds: original.featuredArtistIds,
    displayTitle: original.displayTitle,
    displayTitleEdited: original.displayTitleEdited,
    credits: original.credits,
  });
  return track.id;
}
