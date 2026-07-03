import { getReleaseData } from './distribution-repository';
import { getTrack } from './track-repository';
import { getCreditsByTrack } from './credit-repository';
import { getRightsByTrack } from './rights-repository';
import { getDeliveriesByTrack } from './distribution-delivery-repository';
import { getTracksByRelease } from './release-track-repository';

export async function validateReleaseMetadata(releaseId: string): Promise<{ valid: boolean; missing: string[] }> {
  const missing: string[] = [];
  const release = await getReleaseData(releaseId).catch(() => null) as Record<string, unknown> | null;
  if (!release) return { valid: false, missing: ['release not found'] };

  if (!release.title) missing.push('title');
  if (!release.releaseType) missing.push('releaseType');
  if (release.targetReleaseDate == null) missing.push('releaseDate');
  if (!release.genre) missing.push('genre');
  if (!release.label) missing.push('label');

  return { valid: missing.length === 0, missing };
}

export async function validateTrackMetadata(trackId: string): Promise<{ valid: boolean; missing: string[] }> {
  const missing: string[] = [];
  const track = await getTrack(trackId).catch(() => null);
  if (!track) return { valid: false, missing: ['track not found'] };

  if (!track.isrc) missing.push('ISRC');
  if (!track.duration) missing.push('duration');

  try {
    const credits = await getCreditsByTrack(trackId);
    if (credits.length === 0) missing.push('credits');
  } catch { missing.push('credits'); }

  try {
    const rights = await getRightsByTrack(trackId);
    if (rights.length === 0) missing.push('rights');
  } catch { missing.push('rights'); }

  try {
    const deliveries = await getDeliveriesByTrack(trackId);
    if (!deliveries.some((d) => d.variant === 'primary_master')) missing.push('primary_master');
  } catch { missing.push('primary_master'); }

  return { valid: missing.length === 0, missing };
}

export async function validateReleaseTracks(
  releaseId: string,
): Promise<{ valid: boolean; issues: { trackId: string; title: string; missing: string[] }[] }> {
  const issues: { trackId: string; title: string; missing: string[] }[] = [];

  try {
    const releaseTracks = await getTracksByRelease(releaseId);
    const tracks = releaseTracks.filter((rt) => rt.track !== null);

    for (const rt of tracks) {
      const result = await validateTrackMetadata(rt.track!.id);
      if (!result.valid) {
        issues.push({ trackId: rt.track!.id, title: rt.track!.title, missing: result.missing });
      }
    }
  } catch { /* ignore */ }

  return { valid: issues.length === 0, issues };
}
