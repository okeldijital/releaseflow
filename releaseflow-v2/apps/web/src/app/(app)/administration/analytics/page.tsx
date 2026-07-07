'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { Button, MetricCard, LoadingState, EmptyState } from '@releaseflow/ui';
import { computeAnalytics, type AnalyticsSnapshot } from '@/lib/analytics-service';

export default function AdministrationAnalyticsPage() {
  const { activeOrgId } = useOrgStore();
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      const result = await computeAnalytics(activeOrgId);
      setSnapshot(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compute analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-text-900 tracking-tight">Analytics</p>
          <p className="text-sm text-text-500 mt-1">Operational analytics and performance metrics</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view analytics." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState text="Computing analytics..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-display-md font-semibold text-text-900 tracking-tight">Analytics</p>
          <p className="text-sm text-text-500 mt-1">Operational analytics and performance metrics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>

      {error ? (
        <EmptyState title="Error loading analytics" description={error} action={{ label: 'Retry', onClick: handleRefresh }} />
      ) : snapshot ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Avg Production Duration"
            value={`${snapshot.avgProductionDuration.toFixed(1)} days`}
          />
          <MetricCard
            label="Avg Approval Time"
            value={`${snapshot.avgApprovalTime.toFixed(1)} days`}
          />
          <MetricCard
            label="Avg Asset Turnaround"
            value={`${snapshot.avgAssetTurnaround.toFixed(1)} days`}
          />
          <MetricCard
            label="Avg Spec Completion"
            value={`${snapshot.avgSpecCompletion.toFixed(1)} days`}
          />
          <MetricCard
            label="Distribution Success Rate"
            value={`${snapshot.distributionSuccessRate.toFixed(1)}%`}
          />
          <MetricCard
            label="Collaboration Responsiveness"
            value={`${snapshot.collaborationResponsiveness.toFixed(1)} hrs`}
          />
        </div>
      ) : (
        <p className="text-sm text-text-400">No analytics data available.</p>
      )}
    </div>
  );
}
