'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useOperationsCenter } from '@/hooks/useOperationsCenter';
import { MetricCard, Card, StatusBadge, Badge, EmptyState, LoadingState, Avatar } from '@releaseflow/ui';
import type { ActivityItem, BlockedItem } from '@/hooks/useOperationsCenter';

const alertPriorityStyles: Record<string, string> = {
  high: 'bg-danger-50 dark:bg-danger-950 text-danger-500 border-danger-200 dark:border-danger-800',
  medium: 'bg-warning-50 dark:bg-warning-950 text-warning-500 border-warning-200 dark:border-warning-800',
  low: 'bg-info-50 dark:bg-info-950 text-info-500 border-info-200 dark:border-info-800',
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function OperationsPage() {
  const { alerts, blockedItems, deadlines, pulseMetrics, activities, loading, error, refresh } = useOperationsCenter();
  const [lastSessionEndedAt, setLastSessionEndedAt] = useState<number | null>(null);
  const [awayCollapsed, setAwayCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ops_last_session_ended_at');
    const viewed = localStorage.getItem('ops_away_summary_viewed') === 'true';
    setLastSessionEndedAt(stored ? parseInt(stored, 10) : null);
    setAwayCollapsed(viewed);
    localStorage.setItem('ops_last_session_ended_at', Date.now().toString());
  }, []);

  const awaySummary = useMemo(() => {
    if (!lastSessionEndedAt || loading) return null;
    const sinceDate = new Date(lastSessionEndedAt);
    const sinceActivities = activities.filter((a) => a.createdAt > sinceDate);
    if (sinceActivities.length === 0) return null;

    return {
      tasksCompleted: sinceActivities.filter((a) => a.type.includes('task')).length,
      stagesAdvanced: sinceActivities.filter((a) => a.type.includes('stage')).length,
      approvalsDecided: sinceActivities.filter((a) => a.type.includes('approval')).length,
      newBlockers: sinceActivities.filter((a) => a.type.includes('block')).length,
      total: sinceActivities.length,
    };
  }, [lastSessionEndedAt, activities, loading]);

  const handleAwayCollapse = () => {
    const next = !awayCollapsed;
    setAwayCollapsed(next);
    if (next) {
      localStorage.setItem('ops_away_summary_viewed', 'true');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-text-900 mb-8">Operations Center</h1>
        <LoadingState text="Loading operations data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-text-900 mb-8">Operations Center</h1>
        <EmptyState
          title="Unable to load data"
          description={error}
          action={{ label: 'Retry', onClick: refresh }}
        />
      </div>
    );
  }

  const isAllClear = alerts.length === 0 && blockedItems.length === 0 && deadlines.length === 0;

  const AwaySummarySection = awaySummary ? (
    <Card padding="sm" className="border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30">
      <button
        onClick={handleAwayCollapse}
        className="flex items-center justify-between w-full text-left"
        type="button"
      >
        <h2 className="text-sm font-semibold text-text-900">
          Since you were away
          <span className="ml-2 text-xs font-normal text-text-400">
            {awaySummary.total} activity {awaySummary.total === 1 ? 'item' : 'items'}
          </span>
        </h2>
        <span className="text-xs text-text-400 shrink-0 ml-2">
          {awayCollapsed ? 'Show' : 'Hide'}
        </span>
      </button>
      {!awayCollapsed && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white dark:bg-surface-900 rounded-lg px-3 py-2 text-center border border-surface-200">
            <p className="text-lg font-bold text-text-900">{awaySummary.tasksCompleted}</p>
            <p className="text-[10px] text-text-500">Tasks completed</p>
          </div>
          <div className="bg-white dark:bg-surface-900 rounded-lg px-3 py-2 text-center border border-surface-200">
            <p className="text-lg font-bold text-text-900">{awaySummary.stagesAdvanced}</p>
            <p className="text-[10px] text-text-500">Stages advanced</p>
          </div>
          <div className="bg-white dark:bg-surface-900 rounded-lg px-3 py-2 text-center border border-surface-200">
            <p className="text-lg font-bold text-text-900">{awaySummary.approvalsDecided}</p>
            <p className="text-[10px] text-text-500">Approvals decided</p>
          </div>
          <div className="bg-white dark:bg-surface-900 rounded-lg px-3 py-2 text-center border border-surface-200">
            <p className="text-lg font-bold text-text-900">{awaySummary.newBlockers}</p>
            <p className="text-[10px] text-text-500">New blockers</p>
          </div>
        </div>
      )}
    </Card>
  ) : null;

  const MetricGrid = (
    <>
      <MetricCard label="Active Releases" value={pulseMetrics.activeReleases} />
      <MetricCard label="Blocked Releases" value={pulseMetrics.blockedReleases} trend={pulseMetrics.blockedReleases > 0 ? 'down' : 'flat'} trendValue={pulseMetrics.blockedReleases > 0 ? 'Needs attention' : 'Clear'} />
      <MetricCard label="Over Budget" value={pulseMetrics.overBudget} trend={pulseMetrics.overBudget > 0 ? 'down' : 'flat'} trendValue={pulseMetrics.overBudget > 0 ? 'At risk' : 'On track'} />
      <MetricCard label="Campaigns Active" value={pulseMetrics.campaignsActive} />
    </>
  );

  const ActivityRail = (
    <>
      <Card padding="sm">
        <h2 className="text-sm font-semibold text-text-900 mb-3">Recent Activity</h2>
        {activities.length === 0 ? (
          <p className="text-xs text-text-400 py-4 text-center">
            No recent activity. Activity will appear when your team takes action.
          </p>
        ) : (
          <div className="space-y-2">
            {activities.map((a) => (
              <ActivityRow key={a.id} item={a} />
            ))}
          </div>
        )}
      </Card>
      <Card padding="sm">
        <h2 className="text-sm font-semibold text-text-900 mb-3">Quick Links</h2>
        <div className="space-y-1 text-sm">
          <Link href="/releases/new" className="block text-text-500 hover:text-text-900">+ New Release</Link>
          <Link href="/artists/new" className="block text-text-500 hover:text-text-900">+ New Artist</Link>
          <Link href="/campaigns/new" className="block text-text-500 hover:text-text-900">+ New Campaign</Link>
        </div>
      </Card>
    </>
  );

  const WorkArea = isAllClear ? (
    <Card padding="lg">
      <EmptyState
        title="All clear"
        description="All clear. Every release is on track."
      />
    </Card>
  ) : (
    <>
      <Card padding="sm">
        <h2 className="text-sm font-semibold text-text-900 mb-3">Alerts ({alerts.length})</h2>
        {alerts.length === 0 ? (
          <EmptyState title="No alerts" description="All clear. No operational alerts right now." />
        ) : (
          <div className="space-y-1.5">
            {alerts.slice(0, 6).map((a) => (
              <div key={a.id} className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-between ${alertPriorityStyles[a.priority] ?? ''}`}>
                <div className="min-w-0 flex-1 flex items-center gap-1">
                  <span className="text-xs font-bold uppercase shrink-0">{a.priority}</span>
                  <span className="truncate">{a.message}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Link href={`/releases/${a.releaseId}`} className="text-xs underline">View</Link>
                  <span className="text-[10px] text-text-300 sm:hidden" aria-hidden="true">&#8592;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="sm">
        <h2 className="text-sm font-semibold text-text-900 mb-3">Blocked Work ({blockedItems.length})</h2>
        {blockedItems.length === 0 ? (
          <EmptyState title="No blocked items" description="No blocked work. Everything is flowing." />
        ) : (
          <div className="space-y-1.5">
            {blockedItems.map((b) => (
              <BlockedRow key={b.id} item={b} />
            ))}
          </div>
        )}
      </Card>

      <Card padding="sm">
        <h2 className="text-sm font-semibold text-text-900 mb-3">Critical Deadlines ({deadlines.length})</h2>
        {deadlines.length === 0 ? (
          <EmptyState title="No deadlines this week" description="No upcoming deadlines. You're ahead of schedule." />
        ) : (
          <div className="space-y-1.5">
            {deadlines.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-surface-100 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <Badge label={d.type.replace(/_/g, ' ')} color={d.type === 'campaign_task' ? 'bg-info-50 text-info-500' : 'bg-surface-100 text-text-500'} size="sm" />
                  <span className="text-text-700 truncate">{d.title}</span>
                  <Badge label={d.priority} color={d.priority === 'critical' || d.priority === 'high' ? 'bg-danger-50 text-danger-500' : d.priority === 'medium' ? 'bg-warning-50 text-warning-500' : 'bg-surface-100 text-text-500'} size="sm" />
                </div>
                <span className="text-xs text-text-400 shrink-0 ml-2">{fmtDate(d.dueDate)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-900">Operations Center</h1>
          <p className="text-sm text-text-500 mt-1">Today's operational overview</p>
        </div>
        <button onClick={refresh} className="text-xs text-text-500 hover:text-text-900 underline">Refresh</button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
        {MetricGrid}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {AwaySummarySection}
          {WorkArea}
        </div>
        <div className="space-y-6">
          {ActivityRail}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-text-700 text-xs truncate">{item.message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-400">{timeAgo(item.createdAt)}</span>
          <Link href={`/releases/${item.releaseId}`} className="text-xs text-primary-500 hover:underline">View</Link>
        </div>
      </div>
    </div>
  );
}

function BlockedRow({ item }: { item: BlockedItem }) {
  const typeColors: Record<string, string> = {
    stage: 'bg-danger-50 text-danger-500',
    dependency: 'bg-warning-50 text-warning-500',
    approval: 'bg-info-50 text-info-500',
  };
  return (
    <div className="flex items-center justify-between rounded-lg border border-surface-100 px-3 py-2 text-sm">
      <div className="min-w-0 flex-1 flex items-center gap-2">
        <Badge label={item.type} color={typeColors[item.type] ?? 'bg-surface-100 text-text-500'} size="sm" />
        <span className="text-text-700 truncate">{item.name}</span>
        {item.owner ? <Avatar name={item.owner} size="sm" /> : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-text-400">{item.age}</span>
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}
