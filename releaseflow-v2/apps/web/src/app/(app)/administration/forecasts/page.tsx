'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { Button, Card, LoadingState, EmptyState } from '@releaseflow/ui';
import {
  computeOrganizationForecast,
  type ForecastResult,
} from '@/lib/forecasting-service';
import { getReleasesByOrganization } from '@/lib/release-repository';
import type { ReleaseRecord } from '@/lib/release-repository';

interface ReleaseForecast {
  release: ReleaseRecord;
  forecast: ForecastResult;
}

function riskColor(risk: number): string {
  if (risk < 25) return 'text-success-600';
  if (risk < 50) return 'text-warning-600';
  return 'text-danger-600';
}

function riskBg(risk: number): string {
  if (risk < 25) return 'bg-success-50';
  if (risk < 50) return 'bg-warning-50';
  return 'bg-danger-50';
}

export default function AdministrationForecastsPage() {
  const { activeOrgId } = useOrgStore();
  const [items, setItems] = useState<ReleaseForecast[]>([]);
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
      const [releases, forecasts] = await Promise.all([
        getReleasesByOrganization(activeOrgId).catch(() => [] as ReleaseRecord[]),
        computeOrganizationForecast(activeOrgId).catch(() => [] as ForecastResult[]),
      ]);
      const activeStatuses = new Set([
        'draft',
        'planning',
        'in_production',
        'ready_for_distribution',
        'on_hold',
      ]);
      const activeReleases = releases.filter((r) =>
        activeStatuses.has(r.status as string),
      );
      const paired: ReleaseForecast[] = activeReleases.map((release, i) => ({
        release,
        forecast: forecasts[i] ?? {
          expectedCompletionDate: null,
          riskOfMissingRelease: 0,
          outstandingWorkload: 0,
          capacityUtilisation: 0,
          recommendations: ['Forecast unavailable'],
        },
      }));
      setItems(paired);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compute forecasts');
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
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Forecasts</p>
          <p className="text-sm text-text-500 mt-1">Release completion forecasts and risk analysis</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view forecasts." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState text="Computing forecasts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Forecasts</p>
          <p className="text-sm text-text-500 mt-1">Release completion forecasts and risk analysis</p>
        </div>
        <EmptyState title="Error loading forecasts" description={error} action={{ label: 'Retry', onClick: handleRefresh }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Forecasts</p>
          <p className="text-sm text-text-500 mt-1">Release completion forecasts and risk analysis</p>
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

      {items.length === 0 ? (
        <EmptyState
          title="No active releases to forecast"
          description="Forecasts appear when you have active releases in your organization."
        />
      ) : (
        <div className="space-y-4">
          {items.map(({ release, forecast }) => (
            <Card key={release.id} padding="md" className="border border-surface-200/80">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-text-700">{release.title}</p>
                  <p className="text-xs text-text-400 mt-0.5">
                    {release.releaseType && (
                      <span className="capitalize">{release.releaseType}</span>
                    )}
                    {release.status && (
                      <>
                        {' '}
                        &middot;{' '}
                        <span className="capitalize">{release.status.replace(/_/g, ' ')}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBg(forecast.riskOfMissingRelease)} ${riskColor(forecast.riskOfMissingRelease)}`}>
                  {forecast.riskOfMissingRelease}% risk
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-xs text-text-400">Expected Completion</p>
                  <p className="text-sm font-semibold text-text-700 mt-0.5">
                    {forecast.expectedCompletionDate
                      ? new Date(forecast.expectedCompletionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '\u2014'}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-xs text-text-400">Outstanding Workload</p>
                  <p className="text-sm font-semibold text-text-700 mt-0.5">
                    {forecast.outstandingWorkload} task{forecast.outstandingWorkload !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-xs text-text-400">Capacity Utilization</p>
                  <p className="text-sm font-semibold text-text-700 mt-0.5">
                    {forecast.capacityUtilisation}%
                  </p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-xs text-text-400">Risk Level</p>
                  <p className={`text-sm font-semibold mt-0.5 ${riskColor(forecast.riskOfMissingRelease)}`}>
                    {forecast.riskOfMissingRelease < 25
                      ? 'Low'
                      : forecast.riskOfMissingRelease < 50
                        ? 'Medium'
                        : 'High'}
                  </p>
                </div>
              </div>

              {forecast.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-400 uppercase tracking-widest mb-2">
                    Recommendations
                  </p>
                  <ul className="space-y-1">
                    {forecast.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-text-600 flex items-start gap-2">
                        <span className="text-text-300 mt-1.5">&#8226;</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
