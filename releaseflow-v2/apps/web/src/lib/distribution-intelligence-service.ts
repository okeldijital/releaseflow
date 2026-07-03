import { getReleaseData, getLatestPackage } from './distribution-repository';
import { getDeliveriesByRelease } from './distribution-delivery-repository';
import { getTracksByRelease } from './release-track-repository';
import { getChannelsByRelease } from './distribution-channel-repository';

export interface DistributionReadiness {
  metadataComplete: boolean;
  assetComplete: boolean;
  legalComplete: boolean;
  audioComplete: boolean;
  packageComplete: boolean;
  scheduleComplete: boolean;
  percentage: number;
  warnings: string[];
  blockers: string[];
}

export async function computeDistributionReadiness(
  releaseId: string,
  _orgId: string,
): Promise<DistributionReadiness> {
  const warnings: string[] = [];
  const blockers: string[] = [];

  let metadataComplete = false;
  let assetComplete = false;
  let legalComplete = false;
  let audioComplete = false;
  let packageComplete = false;
  let scheduleComplete = false;

  const release = await getReleaseData(releaseId).catch(() => null) as Record<string, unknown> | null;

  if (release) {
    const title = typeof release.title === 'string' && release.title.trim();
    const type = typeof release.releaseType === 'string' && release.releaseType.trim();
    const releaseDate = release.targetReleaseDate != null;
    const genre = typeof release.genre === 'string' && release.genre.trim();
    metadataComplete = !!(title && type && releaseDate && genre);
  }
  if (!metadataComplete) blockers.push('No metadata');

  try {
    const deliveries = await getDeliveriesByRelease(releaseId);
    assetComplete = deliveries.some((d) => d.status === 'validated');
  } catch { /* ignore */ }

  let trackIds: string[] = [];
  let trackDataList: { id: string; title: string; isrc?: string }[] = [];

  try {
    const releaseTracks = await getTracksByRelease(releaseId);
    const tracks = releaseTracks.filter((rt) => rt.track !== null);
    trackDataList = tracks.map((rt) => ({
      id: rt.track!.id,
      title: rt.track!.title,
      isrc: rt.track!.isrc,
    }));
    trackIds = trackDataList.map((t) => t.id);
  } catch { /* ignore */ }

  if (trackIds.length === 0) {
    blockers.push('No tracks');
  }

  if (trackIds.length > 0) {
    try {
      const { computeRightsReadiness } = await import('./rights-intelligence-service');
      const rightsResults = await Promise.all(trackIds.map((id) => computeRightsReadiness(id)));
      legalComplete = rightsResults.every((r) => r.ownershipComplete && r.rightsComplete);
    } catch { /* ignore */ }
  }

  if (trackIds.length > 0) {
    try {
      const { getDeliveriesByTrack } = await import('./distribution-delivery-repository');
      const audioResults = await Promise.all(
        trackIds.map(async (id) => {
          const deliveries = await getDeliveriesByTrack(id);
          return deliveries.some((d) => d.variant === 'primary_master');
        }),
      );
      audioComplete = audioResults.every(Boolean);
    } catch { /* ignore */ }
  }
  if (trackIds.length > 0 && !audioComplete) {
    blockers.push('No primary master');
  }

  try {
    const pkg = await getLatestPackage(releaseId);
    packageComplete = pkg !== null;
  } catch { /* ignore */ }

  try {
    const { getScheduleByRelease } = await import('./distribution-schedule-repository');
    const schedule = await getScheduleByRelease(releaseId);
    scheduleComplete = !!(schedule?.releaseDate);
  } catch { /* ignore */ }
  if (!scheduleComplete) blockers.push('No schedule');

  if (release && !(release as Record<string, unknown>).coverArt && !(release as Record<string, unknown>).artwork) {
    warnings.push('No artwork');
  }

  const missingISRCs = trackDataList.filter((t) => !t.isrc);
  if (trackDataList.length > 0 && missingISRCs.length > 0) {
    warnings.push('Missing ISRCs');
  }

  try {
    const channels = await getChannelsByRelease(releaseId);
    if (channels.length === 0) warnings.push('No channels defined');
  } catch { /* ignore */ }

  const completed = [metadataComplete, assetComplete, legalComplete, audioComplete, packageComplete, scheduleComplete].filter(Boolean).length;
  const percentage = Math.round((completed / 6) * 100);

  return {
    metadataComplete,
    assetComplete,
    legalComplete,
    audioComplete,
    packageComplete,
    scheduleComplete,
    percentage,
    warnings,
    blockers,
  };
}
