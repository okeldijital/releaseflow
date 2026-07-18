import { fetchRelease } from '@/lib/release-service';
import { getTracksByRelease } from '@/lib/release-track-repository';
import { getArtistsByRelease } from '@/lib/artist-repository';

export interface AssignmentReleaseContext {
  releaseId: string;
  releaseTitle: string;
  artistName: string;
  artwork: { secureUrl?: string } | null;
  trackTitle?: string | null;
  trackPosition?: number | null;
  /** EPIC-202A — structured performance credits for track-linked assignments */
  trackDisplayTitle?: string | null;
  originalArtistNames?: string[];
  featuredArtistNames?: string[];
  remixArtistNames?: string[];
}

export async function fetchAssignmentReleaseContext(
  entityType: string,
  entityId: string,
): Promise<AssignmentReleaseContext | null> {
  if (entityType === 'release') return fetchContextForRelease(entityId);
  if (entityType === 'track') return fetchContextForTrack(entityId);
  return null;
}

async function resolveArtistNames(linkRecords: { artistId: string }[]): Promise<string> {
  if (linkRecords.length === 0) return 'Unknown Artist';
  const { getArtist } = await import('./artist-repository');
  const names = await Promise.all(
    linkRecords.map(async (link) => {
      try {
        const artist = await getArtist('', link.artistId);
        return artist?.name ?? 'Unknown Artist';
      } catch {
        return 'Unknown Artist';
      }
    }),
  );
  return names.join(', ');
}

async function fetchContextForRelease(releaseId: string): Promise<AssignmentReleaseContext | null> {
  const release = await fetchRelease(releaseId);
  if (!release) return null;

  const artistLinks = await getArtistsByRelease(releaseId);
  const artistName = await resolveArtistNames(artistLinks);

  return {
    releaseId: release.id,
    releaseTitle: release.title,
    artistName,
    artwork: release.artwork ? { secureUrl: release.artwork.secureUrl } : null,
  };
}

async function fetchContextForTrack(trackId: string): Promise<AssignmentReleaseContext | null> {
  const { getTrack } = await import('./track-repository');
  const track = await getTrack(trackId);
  if (!track) return null;

  const { getReleasesByTrack } = await import('./release-track-repository');
  const releaseIds = await getReleasesByTrack(trackId);

  // EPIC-202A — resolve track performance credits even without a linked release
  const { getArtistsByRole } = await import('./track-artist-repository');
  const { getArtist } = await import('./artist-repository');
  const { resolveTrackDisplayTitle } = await import('./display-title');
  const { resolveRecordingType } = await import('./recording-type');

  async function namesForIds(ids: string[]): Promise<string[]> {
    const names = await Promise.all(
      ids.map(async (id) => {
        try {
          const a = await getArtist('', id);
          return a?.name ?? null;
        } catch {
          return null;
        }
      }),
    );
    return names.filter((n): n is string => Boolean(n));
  }

  const [origRows, primaryRows, featRows, remixRows] = await Promise.all([
    getArtistsByRole(trackId, 'ORIGINAL_ARTIST'),
    getArtistsByRole(trackId, 'PRIMARY_ARTIST'),
    getArtistsByRole(trackId, 'FEATURED_ARTIST'),
    getArtistsByRole(trackId, 'REMIX_ARTIST'),
  ]);

  const originalIds =
    origRows.length > 0
      ? origRows.map((r) => r.artistId)
      : primaryRows.length > 0
        ? primaryRows.map((r) => r.artistId)
        : ([track.primaryArtistId, track.originalArtistId, ...(track.originalArtistIds ?? [])].filter(Boolean) as string[]);

  const featuredIds =
    featRows.length > 0 ? featRows.map((r) => r.artistId) : (track.featuredArtistIds ?? []);

  const remixIds =
    remixRows.length > 0
      ? remixRows.map((r) => r.artistId)
      : ([track.remixerArtistId, ...(track.remixArtistIds ?? [])].filter(Boolean) as string[]);

  const [originalArtistNames, featuredArtistNames, remixArtistNames] = await Promise.all([
    namesForIds(originalIds),
    namesForIds(featuredIds),
    namesForIds(remixIds),
  ]);

  const isRemix = resolveRecordingType(track.recordingType) === 'remix';
  const trackDisplayTitle = resolveTrackDisplayTitle({
    title: track.title,
    displayTitle: track.displayTitle,
    displayTitleEdited: track.displayTitleEdited,
    originalArtistNames,
    featuredArtistNames,
    remixArtistNames,
    isRemix,
    includeOriginalPrefix: false,
  });

  if (releaseIds.length === 0) {
    return {
      releaseId: '',
      releaseTitle: '',
      artistName: originalArtistNames.join(', ') || 'Unknown Artist',
      artwork: null,
      trackTitle: track.title,
      trackPosition: null,
      trackDisplayTitle,
      originalArtistNames,
      featuredArtistNames,
      remixArtistNames,
    };
  }

  const releaseId = releaseIds[0]!;
  const release = await fetchRelease(releaseId);
  if (!release) {
    return {
      releaseId: '',
      releaseTitle: '',
      artistName: originalArtistNames.join(', ') || 'Unknown Artist',
      artwork: null,
      trackTitle: track.title,
      trackPosition: null,
      trackDisplayTitle,
      originalArtistNames,
      featuredArtistNames,
      remixArtistNames,
    };
  }

  const artistLinks = await getArtistsByRelease(releaseId);
  const artistName = await resolveArtistNames(artistLinks);

  const allTracks = await getTracksByRelease(releaseId);
  const trackEntry = allTracks.find((t) => t.trackId === trackId);

  return {
    releaseId: release.id,
    releaseTitle: release.title,
    artistName: originalArtistNames.join(', ') || artistName,
    artwork: release.artwork ? { secureUrl: release.artwork.secureUrl } : null,
    trackTitle: track.title,
    trackPosition: trackEntry?.position ?? null,
    trackDisplayTitle,
    originalArtistNames,
    featuredArtistNames,
    remixArtistNames,
  };
}
