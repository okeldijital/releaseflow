'use client';

import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useReleases } from '@/hooks/useRelease';
import { getMembershipsByOrg } from '@/lib/organization-repository';
import { getPendingInvitations } from '@/lib/invitation-repository';
import { getPendingApprovals } from '@/lib/approval-service';
import { getRecentActivity } from '@/lib/activity-service';
import { computeOrganizationHealth } from '@/lib/organization-intelligence-service';
import type { OrgHealth } from '@/lib/organization-intelligence-service';
import { MetricCard, LoadingState, EmptyState, Card } from '@releaseflow/ui';

export default function AdministrationDashboardPage() {
  const { activeOrgId } = useOrgStore();
  const { releases, loading: releasesLoading } = useReleases();
  const [activeMembers, setActiveMembers] = useState(0);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [recentCount, setRecentCount] = useState(0);
  const [health, setHealth] = useState<OrgHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeOrgId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      const [memberships, invitations, approvals, activity] = await Promise.all([
        getMembershipsByOrg(activeOrgId!).catch(() => []),
        getPendingInvitations(activeOrgId!).catch(() => []),
        getPendingApprovals(activeOrgId!).catch(() => []),
        getRecentActivity(activeOrgId!, 50).catch(() => []),
      ]);
      if (cancelled) return;
      setActiveMembers(memberships.filter((m) => m.status === 'active').length);
      setPendingInvites(invitations.length);
      setPendingApprovals(approvals.length);
      setRecentCount(activity.length);

      const h = await computeOrganizationHealth(activeOrgId!).catch(() => null);
      if (!cancelled) {
        setHealth(h);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeOrgId]);

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Dashboard</p>
          <p className="text-sm text-text-500 mt-1">Organization overview and health metrics</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view its dashboard." />
      </div>
    );
  }

  if (loading || releasesLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  const activeReleases = releases.filter(
    (r) => r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived',
  ).length;

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">Dashboard</p>
        <p className="text-sm text-text-500 mt-1">Organization overview and health metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard label="Active Users" value={activeMembers} />
        <MetricCard label="Pending Invitations" value={pendingInvites} />
        <MetricCard label="Active Releases" value={activeReleases} />
        <MetricCard label="Pending Approvals" value={pendingApprovals} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card padding="md" className="border border-surface-200/80">
          <p className="font-semibold text-text-700 mb-4">Organization Health</p>
          {health ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-500">Overall Score</span>
                  <span className="text-sm font-semibold text-text-700">{Math.round(health.overallHealth * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${Math.round(health.overallHealth * 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-lg font-semibold text-text-700">{Math.round(health.collaborationScore * 100)}%</p>
                  <p className="text-xs text-text-500">Collaboration</p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-lg font-semibold text-text-700">{Math.round(health.operationalThroughput * 100)}%</p>
                  <p className="text-xs text-text-500">Throughput</p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-lg font-semibold text-text-700">{Math.round(health.platformReadiness * 100)}%</p>
                  <p className="text-xs text-text-500">Readiness</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-400">Unable to compute health metrics</p>
          )}
        </Card>

        <Card padding="md" className="border border-surface-200/80">
          <p className="font-semibold text-text-700 mb-4">Storage Usage</p>
          <p className="text-sm text-text-400">Storage monitoring coming in v1.3</p>
        </Card>
      </div>

      <Card padding="md" className="border border-surface-200/80">
        <p className="font-semibold text-text-700 mb-4">Recent Activity</p>
        {recentCount > 0 ? (
          <p className="text-sm text-text-500">{recentCount} recent activity events</p>
        ) : (
          <p className="text-sm text-text-400">No recent activity</p>
        )}
      </Card>
    </div>
  );
}
