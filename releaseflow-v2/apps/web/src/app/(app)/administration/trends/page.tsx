'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { Button, Card, LoadingState, EmptyState } from '@releaseflow/ui';
import { getReportSummary } from '@/lib/reporting-service';

interface DomainCount {
  domain: string;
  count: number;
}

const DOMAIN_LABELS: Record<string, string> = {
  releases: 'Releases',
  tracks: 'Tracks',
  tasks: 'Tasks',
  assets: 'Assets',
  credits: 'Credits',
  rights: 'Rights',
  distribution: 'Distribution',
  team_activity: 'Team Activity',
};

export default function AdministrationTrendsPage() {
  const { activeOrgId } = useOrgStore();
  const [summaries, setSummaries] = useState<DomainCount[]>([]);
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
      const result = await getReportSummary(activeOrgId);
      setSummaries(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trend data');
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
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Trends</p>
          <p className="text-sm text-text-500 mt-1">Organizational throughput and trend analysis</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view trends." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState text="Loading trend data..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Trends</p>
          <p className="text-sm text-text-500 mt-1">Organizational throughput and trend analysis</p>
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
        <EmptyState title="Error loading trends" description={error} action={{ label: 'Retry', onClick: handleRefresh }} />
      ) : (
        <div className="space-y-6">
          <Card padding="md" className="border border-surface-200/80">
            <p className="font-semibold text-text-700 mb-2">Release Throughput</p>
            <p className="text-sm text-text-500 mb-3">Releases completed per month</p>
            {summaries.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-text-400 uppercase tracking-wider">Domain</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-text-400 uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.domain} className="border-b border-surface-100">
                      <td className="px-3 py-2 text-text-700">{DOMAIN_LABELS[s.domain] ?? s.domain}</td>
                      <td className="px-3 py-2 text-text-900 text-right font-medium tabular-nums">{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-text-400">No data available yet</p>
            )}
          </Card>

          <Card padding="md" className="border border-surface-200/80">
            <p className="font-semibold text-text-700 mb-2">Track Throughput</p>
            <p className="text-sm text-text-500 mb-3">Tracks created per month</p>
            <p className="text-sm text-text-400">Aggregate counts shown above. Monthly breakdown charts will be available in v1.3.</p>
          </Card>

          <Card padding="md" className="border border-surface-200/80">
            <p className="font-semibold text-text-700 mb-2">Approval Turnaround</p>
            <p className="text-sm text-text-500 mb-3">Average approval time trend</p>
            <p className="text-sm text-text-400">Trend analysis requires historical data. Charts will be available in v1.3.</p>
          </Card>

          <Card padding="md" className="border border-surface-200/80">
            <p className="font-semibold text-text-700 mb-2">Asset Delivery</p>
            <p className="text-sm text-text-500 mb-3">Asset completion trend</p>
            <p className="text-sm text-text-400">Trend analysis requires historical data. Charts will be available in v1.3.</p>
          </Card>

          <Card padding="md" className="border border-surface-200/80">
            <p className="font-semibold text-text-700 mb-2">Collaboration Trends</p>
            <p className="text-sm text-text-500 mb-3">Activity events trend</p>
            <p className="text-sm text-text-400">Trend analysis requires historical data. Charts will be available in v1.3.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
