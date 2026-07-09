import { collection, query, where, getDocs } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface ExecutiveSummary {
  activeReleases: number;
  tracksInProduction: number;
  releasesAtRisk: number;
  distributionReady: number;
  collaborationHealth: number;
  organizationHealth: number;
  overdueTasks: number;
  pendingApprovals: number;
  overallScore: number;
}

export async function computeExecutiveSummary(orgId: string): Promise<ExecutiveSummary> {
  const { getReleasesByOrganization } = await import('./release-repository');
  const { getTracksByOrg } = await import('./track-repository');
  const { computeOrganizationHealth } = await import('./organization-intelligence-service');
  const { getPendingApprovals } = await import('./approval-service');

  const [releases, tracks, orgHealth, pendingApprovals] = await Promise.all([
    getReleasesByOrganization(orgId).catch(() => []),
    getTracksByOrg(orgId).catch(() => []),
    computeOrganizationHealth(orgId).catch(() => ({
      totalUsers: 0,
      pendingInvitations: 0,
      activeReleases: 0,
      pendingApprovals: 0,
      collaborationScore: 0.5,
      operationalThroughput: 0.5,
      platformReadiness: 0.5,
      overallHealth: 0.5,
    })),
    getPendingApprovals(orgId).catch(() => []),
  ]);

  const activeReleaseList = releases.filter(
    (r) => r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived',
  );

  const activeReleases = activeReleaseList.length;
  const tracksInProduction = tracks.length;

  const { aggregateReleaseHealth } = await import('./track-intelligence-service');
  const { computeDistributionReadiness } = await import('./distribution-intelligence-service');

  const [healthResults, distributionResults] = await Promise.all([
    Promise.all(
      activeReleaseList.map((r) =>
        aggregateReleaseHealth(r.id).catch(() => ({ score: 0, tracks: [] })),
      ),
    ),
    Promise.all(
      activeReleaseList.map((r) =>
        computeDistributionReadiness(r.id, orgId).catch(() => ({
          percentage: 0,
          warnings: [],
          blockers: [],
        })),
      ),
    ),
  ]);

  const releasesAtRisk = healthResults.filter((h) => h.score < 50).length;
  const distributionReady = distributionResults.filter((d) => d.percentage >= 100).length;

  const collaborationHealth = 0.5;

  let overdueTasks = 0;
  try {
    const db = getDb();
    if (db) {
      const releaseIds = new Set(activeReleaseList.map((r) => r.id));
      const tasksSnap = await getDocs(
        query(collection(db, 'tasks'), where('status', '!=', 'done')),
      );
      const now = new Date();
      overdueTasks = tasksSnap.docs.filter((d) => {
        const data = d.data();
        const dueDate = data.dueDate;
        if (!dueDate) return false;
        const releaseId = data.releaseId;
        if (releaseId && !releaseIds.has(releaseId)) return false;
        const due =
          dueDate && typeof dueDate === 'object' && 'toDate' in (dueDate as Record<string, unknown>)
            ? (dueDate as { toDate: () => Date }).toDate()
            : new Date(dueDate as string);
        return due < now;
      }).length;
    }
  } catch {
    /* ignore */
  }

  const pendingApprovalsCount = pendingApprovals.length;

  const activeReleasesScore = Math.min(100, activeReleases * 10);
  const tracksScore = Math.min(100, tracksInProduction * 5);
  const atRiskPenalty = Math.max(0, 100 - releasesAtRisk * 20);
  const distributionScore =
    activeReleaseList.length > 0
      ? Math.round((distributionReady / activeReleaseList.length) * 100)
      : 100;
  const orgHealthScore = Math.round(orgHealth.overallHealth * 100);
  const overduePenalty = Math.max(0, 100 - overdueTasks * 5);
  const approvalPenalty = Math.max(0, 100 - pendingApprovalsCount * 10);

  const scores = [
    activeReleasesScore,
    tracksScore,
    atRiskPenalty,
    distributionScore,
    collaborationHealth * 100,
    orgHealthScore,
    overduePenalty,
    approvalPenalty,
  ];
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    activeReleases,
    tracksInProduction,
    releasesAtRisk,
    distributionReady,
    collaborationHealth,
    organizationHealth: orgHealth.overallHealth,
    overdueTasks,
    pendingApprovals: pendingApprovalsCount,
    overallScore,
  };
}
