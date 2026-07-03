export interface OrgHealth {
  totalUsers: number;
  pendingInvitations: number;
  activeReleases: number;
  pendingApprovals: number;
  collaborationScore: number;
  operationalThroughput: number;
  platformReadiness: number;
  overallHealth: number;
}

export async function computeOrganizationHealth(orgId: string): Promise<OrgHealth> {
  const { getMembershipsByOrg } = await import('./organization-repository');
  const { getPendingInvitations } = await import('./invitation-repository');
  const { getReleasesByOrganization } = await import('./release-repository');
  const { getRecentActivity } = await import('./activity-service');
  const { getPendingApprovals } = await import('./approval-service');

  const [memberships, invitations, releases, recentActivity, approvalRequests] = await Promise.all([
    getMembershipsByOrg(orgId).catch(() => []),
    getPendingInvitations(orgId).catch(() => []),
    getReleasesByOrganization(orgId).catch(() => []),
    getRecentActivity(orgId, 500).catch(() => []),
    getPendingApprovals(orgId).catch(() => []),
  ]);

  const totalUsers = memberships.filter((m) => m.status === 'active').length;
  const pendingInvitations = invitations.length;
  const activeReleases = releases.filter(
    (r) => r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived',
  ).length;
  const pendingApprovals = approvalRequests.length;

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentEvents = recentActivity.filter((a) => {
    const ts = a.createdAt;
    if (ts && typeof ts === 'object' && 'toDate' in (ts as Record<string, unknown>)) {
      return (ts as { toDate: () => Date }).toDate().getTime() > thirtyDaysAgo;
    }
    return false;
  });
  const collaborationScore = recentEvents.length > 0 ? Math.min(1, recentEvents.length / 50) : 0.5;

  const startOfMonth = new Date(now);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const completedThisMonth = releases.filter((r) => {
    if (r.status !== 'released') return false;
    const ts = r.updatedAt ?? r.createdAt;
    if (ts && typeof ts === 'object' && 'toDate' in (ts as Record<string, unknown>)) {
      return (ts as { toDate: () => Date }).toDate().getTime() >= startOfMonth.getTime();
    }
    return false;
  }).length;
  const operationalThroughput = releases.length > 0
    ? Math.min(1, completedThisMonth / Math.max(1, releases.length))
    : 0.5;

  const platformReadiness = 0.5;

  const metrics = [collaborationScore, operationalThroughput, platformReadiness];
  const overallHealth = metrics.reduce((sum, v) => sum + v, 0) / metrics.length;

  return {
    totalUsers,
    pendingInvitations,
    activeReleases,
    pendingApprovals,
    collaborationScore,
    operationalThroughput,
    platformReadiness,
    overallHealth,
  };
}
