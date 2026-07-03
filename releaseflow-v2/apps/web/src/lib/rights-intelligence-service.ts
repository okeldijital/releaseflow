import { getTotalOwnership } from './ownership-repository';
import { getTotalWriterShare, getTotalPublisherShare } from './publishing-repository';
import { getCreditsByTrack } from './credit-repository';
import { getRightsByTrack } from './rights-repository';

export interface TrackRightsReadiness {
  ownershipComplete: boolean;
  ownershipTotal: number;
  publishingComplete: boolean;
  writerShare: number;
  publisherShare: number;
  creditsComplete: boolean;
  rightsComplete: boolean;
  percentage: number;
  warnings: string[];
}

export async function computeRightsReadiness(trackId: string): Promise<TrackRightsReadiness> {
  let ownershipTotal = 0;
  let writerShare = 0;
  let publisherShare = 0;
  let creditsExist = false;
  let rightsExist = false;
  const warnings: string[] = [];

  try { ownershipTotal = await getTotalOwnership('track', trackId); } catch { /* ignore */ }
  try { writerShare = await getTotalWriterShare(trackId); } catch { /* ignore */ }
  try { publisherShare = await getTotalPublisherShare(trackId); } catch { /* ignore */ }
  try { const credits = await getCreditsByTrack(trackId); creditsExist = credits.length > 0; } catch { /* ignore */ }
  try { const rights = await getRightsByTrack(trackId); rightsExist = rights.length > 0; } catch { /* ignore */ }

  const ownershipComplete = ownershipTotal === 100;
  const publishingComplete = writerShare === 100 && publisherShare === 100;
  const creditsComplete = creditsExist;
  const rightsComplete = rightsExist;

  let completedCount = 0;
  if (ownershipComplete) completedCount++; else warnings.push('Ownership is not at 100%');
  if (publishingComplete) completedCount++; else warnings.push('Writer or publisher shares are not at 100%');
  if (creditsComplete) completedCount++; else warnings.push('No credits defined');
  if (rightsComplete) completedCount++; else warnings.push('No rights defined');

  const percentage = Math.round((completedCount / 4) * 100);

  return {
    ownershipComplete,
    ownershipTotal,
    publishingComplete,
    writerShare,
    publisherShare,
    creditsComplete,
    rightsComplete,
    percentage,
    warnings,
  };
}
