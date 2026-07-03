export interface ReleaseHealth {
  releaseId: string;
  productionScore: number;
  legalScore: number;
  distributionScore: number;
  collaborationScore: number;
  overallHealth: number;
  status: 'healthy' | 'at_risk' | 'critical';
  recommendations: string[];
}

export async function computeReleaseHealth(
  releaseId: string,
  orgId: string,
): Promise<ReleaseHealth> {
  const { getTracksByRelease } = await import('./release-track-repository');
  const { computeTrackReadiness } = await import('./track-intelligence-service');
  const { computeRightsReadiness } = await import('./rights-intelligence-service');
  const { computeDistributionReadiness } = await import('./distribution-intelligence-service');
  const { computeCollaborationReadiness } = await import('./collaboration-intelligence-service');

  const [releaseTracks, distribution] = await Promise.all([
    getTracksByRelease(releaseId).catch(() => []),
    computeDistributionReadiness(releaseId, orgId).catch(() => ({
      percentage: 0,
      warnings: [],
      blockers: [],
    })),
  ]);

  const tracks = releaseTracks.filter((rt) => rt.track !== null);
  const trackIds = tracks.map((rt) => rt.track!.id);

  let productionScore = 0;
  let legalScore = 0;
  let collaborationScore = 0;

  if (trackIds.length > 0) {
    const [trackReadinessResults, rightsResults] = await Promise.all([
      Promise.all(
        trackIds.map((id) =>
          computeTrackReadiness(id, orgId).catch(() => ({
            percentage: 0,
            metadataComplete: false,
            creditComplete: false,
            assetsComplete: false,
            specsComplete: false,
            tasksComplete: false,
            missingFields: [],
          })),
        ),
      ),
      Promise.all(
        trackIds.map((id) =>
          computeRightsReadiness(id).catch(() => ({
            ownershipComplete: false,
            ownershipTotal: 0,
            publishingComplete: false,
            writerShare: 0,
            publisherShare: 0,
            creditsComplete: false,
            rightsComplete: false,
            percentage: 0,
            warnings: [],
          })),
        ),
      ),
    ]);

    productionScore = Math.round(
      trackReadinessResults.reduce((sum, t) => sum + t.percentage, 0) / trackIds.length,
    );
    legalScore = Math.round(
      rightsResults.reduce((sum, r) => sum + r.percentage, 0) / trackIds.length,
    );
  }

  try {
    const collab = await computeCollaborationReadiness('release', releaseId, orgId);
    collaborationScore = collab.percentage;
  } catch {
    /* ignore */
  }

  const distributionScore = distribution.percentage;

  const overallHealth = Math.round(
    productionScore * 0.3 + legalScore * 0.2 + distributionScore * 0.3 + collaborationScore * 0.2,
  );

  const status: 'healthy' | 'at_risk' | 'critical' =
    overallHealth > 66 ? 'healthy' : overallHealth > 33 ? 'at_risk' : 'critical';

  const recommendations: string[] = [];

  if (productionScore < 50) {
    recommendations.push(
      'Improve production readiness: complete track metadata, credits, specs, and tasks',
    );
  }
  if (legalScore < 50) {
    recommendations.push(
      'Resolve legal gaps: ensure ownership, publishing rights, and credits are complete',
    );
  }
  if (distributionScore < 50) {
    recommendations.push(
      'Prepare for distribution: complete metadata, assets, and schedule',
    );
  }
  if (collaborationScore < 50) {
    recommendations.push(
      'Improve collaboration: resolve pending approvals and unresolved comments',
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Release is on track');
  }

  return {
    releaseId,
    productionScore,
    legalScore,
    distributionScore,
    collaborationScore,
    overallHealth,
    status,
    recommendations,
  };
}
