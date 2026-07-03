import { getTotalOwnership } from './ownership-repository';
import { getTotalWriterShare, getTotalPublisherShare } from './publishing-repository';
import { getCreditsByTrack } from './credit-repository';
import { getRightsByTrack } from './rights-repository';
import { getTrack } from './track-repository';
import { getTracksByRelease } from './release-track-repository';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  blockers: string[];
}

export async function validateTrackForDistribution(trackId: string): Promise<ValidationResult> {
  const warnings: string[] = [];
  const blockers: string[] = [];

  let ownershipTotal = 0;
  let writerShare = 0;
  let publisherShare = 0;
  let creditsExist = false;
  let rightsExist = false;
  let isrcDefined = false;

  try { ownershipTotal = await getTotalOwnership('track', trackId); } catch { /* ignore */ }
  try { writerShare = await getTotalWriterShare(trackId); } catch { /* ignore */ }
  try { publisherShare = await getTotalPublisherShare(trackId); } catch { /* ignore */ }
  try { const credits = await getCreditsByTrack(trackId); creditsExist = credits.length > 0; } catch { /* ignore */ }
  try { const rights = await getRightsByTrack(trackId); rightsExist = rights.length > 0; } catch { /* ignore */ }
  try { const track = await getTrack(trackId); isrcDefined = !!(track?.isrc); } catch { /* ignore */ }

  if (ownershipTotal < 100) blockers.push(`Ownership total is ${ownershipTotal}% (requires 100%)`);
  if (writerShare < 100) blockers.push(`Writer share total is ${writerShare}% (requires 100%)`);
  if (publisherShare < 100) blockers.push(`Publisher share total is ${publisherShare}% (requires 100%)`);

  if (!creditsExist) warnings.push('No mastering credit found');
  if (!creditsExist) warnings.push('No producer credit found');
  if (!isrcDefined) warnings.push('Missing ISRC');
  if (!rightsExist) warnings.push('No rights defined');

  return {
    valid: blockers.length === 0,
    warnings,
    blockers,
  };
}

export async function validateReleaseForDistribution(releaseId: string): Promise<ValidationResult> {
  const warnings: string[] = [];
  const blockers: string[] = [];

  let releaseTracks: { trackId: string }[] = [];
  try {
    const tracks = await getTracksByRelease(releaseId);
    releaseTracks = tracks.filter((rt) => rt.track !== null).map((rt) => ({ trackId: rt.track!.id }));
  } catch { /* ignore */ }

  if (releaseTracks.length === 0) {
    blockers.push('No tracks linked to release');
  }

  let hasMasteringAsset = false;
  try {
    const { getAssetsByRelease } = await import('./asset-repository');
    const releaseAssets = await getAssetsByRelease(releaseId);
    hasMasteringAsset = releaseAssets.length > 0;
  } catch { /* ignore */ }

  if (!hasMasteringAsset) {
    warnings.push('No mastering asset found');
  }

  const trackResults = await Promise.all(
    releaseTracks.map(async (rt) => {
      try {
        return await validateTrackForDistribution(rt.trackId);
      } catch {
        return { valid: false, warnings: [], blockers: ['Track validation failed'] };
      }
    }),
  );

  for (const result of trackResults) {
    for (const blocker of result.blockers) {
      blockers.push(blocker);
    }
    for (const warning of result.warnings) {
      warnings.push(warning);
    }
  }

  return {
    valid: blockers.length === 0,
    warnings,
    blockers,
  };
}
