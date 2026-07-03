import { getTrack } from './track-repository';
import { getArtistsByTrack } from './track-artist-repository';
import { getAssetsByTrack } from './asset-lifecycle-service';
import { getSpecificationsByTrack } from './specification-repository';
import { getTasksByEntity } from './task-service';
import { getTracksByRelease } from './release-track-repository';

export interface TrackReadiness {
  metadataComplete: boolean;
  creditComplete: boolean;
  assetsComplete: boolean;
  specsComplete: boolean;
  tasksComplete: boolean;
  percentage: number;
  missingFields: string[];
}

export interface TrackHealth {
  score: number;
  tracks: { id: string; readiness: number }[];
}

export interface ReleaseHealth {
  score: number;
  tracks: { id: string; title: string; readiness: TrackReadiness }[];
}

export async function computeTrackReadiness(
  trackId: string,
  _orgId: string,
): Promise<TrackReadiness> {
  let track = null;
  let artists: unknown[] = [];
  let assets: unknown[] = [];
  let specs: unknown[] = [];
  let tasks: unknown[] = [];

  try { track = await getTrack(trackId); } catch { /* collection may not exist */ }
  try { artists = await getArtistsByTrack(trackId); } catch { /* collection may not exist */ }
  try { assets = await getAssetsByTrack(trackId); } catch { /* collection may not exist */ }
  try { specs = await getSpecificationsByTrack(trackId); } catch { /* collection may not exist */ }
  try { tasks = await getTasksByEntity('track', trackId); } catch { /* collection may not exist */ }

  const missing: string[] = [];
  let score = 0;
  const categories = 5;

  const metadataComplete: boolean = !!(track?.title?.trim() && track?.isrc && track?.duration);
  if (!track?.title?.trim()) missing.push('title');
  if (!track?.isrc) missing.push('ISRC');
  if (!track?.duration) missing.push('duration');
  if (metadataComplete) score++;

  const creditComplete: boolean = artists.length > 0;
  if (!creditComplete) missing.push('artists');
  if (creditComplete) score++;

  const approvedOrAvailable = assets.filter(
    (a) => (a as Record<string, unknown>).lifecycleState === 'approved' || (a as Record<string, unknown>).lifecycleState === 'attached',
  );
  const assetsComplete: boolean = approvedOrAvailable.length > 0;
  if (!assetsComplete) missing.push('assets');
  if (assetsComplete) score++;

  const completedSpecs = specs.filter(
    (s) => (s as Record<string, unknown>).status === 'completed',
  );
  const specsComplete: boolean = completedSpecs.length > 0;
  if (!specsComplete) missing.push('specifications');
  if (specsComplete) score++;

  const incompleteTasks = tasks.filter(
    (t) => (t as Record<string, unknown>).status !== 'done',
  );
  const tasksComplete: boolean = incompleteTasks.length === 0 && tasks.length > 0;
  if (!tasksComplete) {
    if (tasks.length === 0) missing.push('tasks');
    else missing.push(`${incompleteTasks.length} tasks remaining`);
  }
  if (tasksComplete) score++;

  const percentage = Math.round((score / categories) * 100);

  return {
    metadataComplete,
    creditComplete,
    assetsComplete,
    specsComplete,
    tasksComplete,
    percentage,
    missingFields: missing,
  };
}

export async function computeTrackHealth(
  _releaseId?: string,
): Promise<TrackHealth> {
  return { score: 0, tracks: [] };
}

export async function computeTrackBottlenecks(trackId: string): Promise<string[]> {
  const bottlenecks: string[] = [];

  try {
    const { getDeliveriesByTrack } = await import('./distribution-delivery-repository');
    const deliveries = await getDeliveriesByTrack(trackId);
    const hasPrimaryMaster = deliveries.some((d) => d.variant === 'primary_master');
    if (!hasPrimaryMaster) {
      bottlenecks.push('Missing primary master audio delivery');
    }
  } catch {
    /* ignore */
  }

  try {
    const { getApprovalsByEntity } = await import('./approval-service');
    const approvals = await getApprovalsByEntity('track' as never, trackId);
    const pending = approvals.filter(
      (a) => a.lifecycleState === 'requested' || a.lifecycleState === 'under_review',
    );
    if (pending.length > 0) {
      bottlenecks.push(`${pending.length} pending approval(s)`);
    }
  } catch {
    /* ignore */
  }

  try {
    const { getCommentsByEntity } = await import('./comments-repository');
    const comments = await getCommentsByEntity('track', trackId);
    const unresolved = comments.filter((c) => !c.isResolved);
    if (unresolved.length > 0) {
      bottlenecks.push(`${unresolved.length} unresolved comment(s)`);
    }
  } catch {
    /* ignore */
  }

  try {
    const specs = await getSpecificationsByTrack(trackId);
    const incomplete = specs.filter((s) => s.status !== 'completed');
    if (incomplete.length > 0) {
      bottlenecks.push(`${incomplete.length} incomplete specification(s)`);
    }
  } catch {
    /* ignore */
  }

  return bottlenecks;
}

export async function computeTrackCompletion(
  trackId: string,
): Promise<{ percentage: number; estimatedDays: number }> {
  let percentage = 0;
  try {
    const readiness = await computeTrackReadiness(trackId, '');
    percentage = readiness.percentage;
  } catch {
    /* ignore */
  }

  const estimatedDays = percentage < 100 ? Math.ceil((100 - percentage) / 5) : 0;

  return { percentage, estimatedDays };
}

export async function getTrackRecommendations(trackId: string): Promise<string[]> {
  const recommendations: string[] = [];

  try {
    const readiness = await computeTrackReadiness(trackId, '');

    if (!readiness.metadataComplete) {
      if (readiness.missingFields.includes('title')) {
        recommendations.push('Add track title');
      }
      if (readiness.missingFields.includes('ISRC')) {
        recommendations.push('Add ISRC code');
      }
      if (readiness.missingFields.includes('duration')) {
        recommendations.push('Add track duration');
      }
    }

    if (!readiness.creditComplete) {
      recommendations.push('Add artist credits to the track');
    }

    if (!readiness.assetsComplete) {
      recommendations.push('Upload primary master recording');
    }

    if (!readiness.specsComplete) {
      recommendations.push('Add mastering specification');
    }

    if (!readiness.tasksComplete) {
      recommendations.push('Complete remaining production tasks');
    }
  } catch {
    /* ignore */
  }

  try {
    const { getOwnershipsByEntity } = await import('./ownership-repository');
    const ownershipEntries = await getOwnershipsByEntity('track', trackId);
    if (ownershipEntries.length === 0) {
      recommendations.push('Complete ownership details');
    }
  } catch {
    /* ignore */
  }

  try {
    const { getRightsByTrack } = await import('./rights-repository');
    const rights = await getRightsByTrack(trackId);
    if (rights.length === 0) {
      recommendations.push('Define rights and territory details');
    }
  } catch {
    /* ignore */
  }

  if (recommendations.length === 0) {
    recommendations.push('Track is ready — no recommendations needed');
  }

  return recommendations;
}

export async function aggregateReleaseHealth(
  releaseId: string,
): Promise<ReleaseHealth> {
  try {
    const releaseTracks = await getTracksByRelease(releaseId);
    const results = await Promise.all(
      releaseTracks
        .filter((rt) => rt.track !== null)
        .map(async (rt) => ({
          id: rt.track!.id,
          title: rt.track!.title,
          readiness: await computeTrackReadiness(
            rt.track!.id,
            rt.track!.organizationId,
          ),
        })),
    );
    const avgScore =
      results.length > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.readiness.percentage, 0) /
              results.length,
          )
        : 0;
    return { score: avgScore, tracks: results };
  } catch {
    return { score: 0, tracks: [] };
  }
}
