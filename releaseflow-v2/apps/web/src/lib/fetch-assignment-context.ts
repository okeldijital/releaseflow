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
  if (releaseIds.length === 0) return null;

  const releaseId = releaseIds[0]!;
  const release = await fetchRelease(releaseId);
  if (!release) return null;

  const artistLinks = await getArtistsByRelease(releaseId);
  const artistName = await resolveArtistNames(artistLinks);

  const allTracks = await getTracksByRelease(releaseId);
  const trackEntry = allTracks.find((t) => t.trackId === trackId);

  return {
    releaseId: release.id,
    releaseTitle: release.title,
    artistName,
    artwork: release.artwork ? { secureUrl: release.artwork.secureUrl } : null,
    trackTitle: track.title,
    trackPosition: trackEntry?.position ?? null,
  };
}
