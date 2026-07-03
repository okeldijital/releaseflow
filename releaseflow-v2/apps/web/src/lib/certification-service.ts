import { getReleaseData, getLatestPackage } from './distribution-repository';
import { getTracksByRelease } from './release-track-repository';
import { getTrack } from './track-repository';
import { getDeliveriesByTrack } from './distribution-delivery-repository';
import { getCreditsByTrack } from './credit-repository';
import { getChannelsByRelease } from './distribution-channel-repository';

export type CertificationLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface CertificationResult {
  level: CertificationLevel;
  label: string;
  description: string;
  requirements: { met: boolean; label: string }[];
}

export async function computeCertification(
  releaseId: string,
  _orgId: string,
): Promise<CertificationResult> {
  let releaseExists = false;
  let hasTracks = false;
  let allHavePrimaryMaster = false;
  let allHaveMetadata = false;
  let legalComplete = false;
  let creditsExist = false;
  let scheduleExists = false;
  let channelsConfigured = false;
  let packageGenerated = false;

  const release = await getReleaseData(releaseId).catch(() => null);
  if (release !== null) releaseExists = true;

  let trackIds: string[];
  try {
    const releaseTracks = await getTracksByRelease(releaseId);
    const tracks = releaseTracks.filter((rt) => rt.track !== null);
    if (tracks.length > 0) {
      hasTracks = true;
      trackIds = tracks.map((rt) => rt.track!.id);

      const primaryResults = await Promise.all(
        trackIds.map(async (id) => {
          const deliveries = await getDeliveriesByTrack(id);
          return deliveries.some((d) => d.variant === 'primary_master');
        }),
      );
      allHavePrimaryMaster = primaryResults.every(Boolean);

      const metadataResults = await Promise.all(
        trackIds.map(async (id) => {
          const t = await getTrack(id);
          return !!(t?.isrc && t?.duration);
        }),
      );
      allHaveMetadata = metadataResults.every(Boolean);

      const { computeRightsReadiness } = await import('./rights-intelligence-service');
      const rightsResults = await Promise.all(trackIds.map((id) => computeRightsReadiness(id)));
      legalComplete = rightsResults.every((r) => r.ownershipComplete);

      const creditResults = await Promise.all(
        trackIds.map(async (id) => {
          const credits = await getCreditsByTrack(id);
          return credits.length > 0;
        }),
      );
      creditsExist = creditResults.every(Boolean);
    }
  } catch { /* ignore */ }

  try {
    const { getScheduleByRelease } = await import('./distribution-schedule-repository');
    const schedule = await getScheduleByRelease(releaseId);
    scheduleExists = !!(schedule?.releaseDate);
  } catch { /* ignore */ }

  try {
    const channels = await getChannelsByRelease(releaseId);
    channelsConfigured = channels.length > 0;
  } catch { /* ignore */ }

  try {
    const pkg = await getLatestPackage(releaseId);
    packageGenerated = pkg !== null;
  } catch { /* ignore */ }

  const bronzeReq = { met: releaseExists && hasTracks, label: 'Release exists and has tracks' };
  const silverReq = { met: allHavePrimaryMaster && allHaveMetadata, label: 'All tracks have primary masters and metadata' };
  const goldReq = { met: legalComplete && creditsExist, label: 'Ownership is 100% for all tracks and credits exist' };
  const platinumReq = { met: scheduleExists && channelsConfigured && packageGenerated, label: 'Schedule, channels, and package are ready' };

  let level: CertificationLevel = 'none';
  let label = 'None';
  let description = 'No certification requirements met';

  if (platinumReq.met) {
    level = 'platinum';
    label = 'Platinum';
    description = 'Release is fully ready for distribution';
  } else if (goldReq.met) {
    level = 'gold';
    label = 'Gold';
    description = 'Legal and credits are complete';
  } else if (silverReq.met) {
    level = 'silver';
    label = 'Silver';
    description = 'All tracks have primary masters and metadata';
  } else if (bronzeReq.met) {
    level = 'bronze';
    label = 'Bronze';
    description = 'Release has basic structure';
  }

  return {
    level,
    label,
    description,
    requirements: [bronzeReq, silverReq, goldReq, platinumReq],
  };
}
