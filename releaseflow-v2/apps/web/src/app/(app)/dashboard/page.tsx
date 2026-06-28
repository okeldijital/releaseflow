'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOperationsCenter } from '@/hooks/useOperationsCenter';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import {
  Button, Card, Badge, StatusBadge, EmptyState, LoadingState, Avatar, Table,
} from '@releaseflow/ui';
import { OperationalSummary } from '@releaseflow/domain-ui';
import type { ActivityItem, BlockedItem } from '@/hooks/useOperationsCenter';

const alertSeverityBorder: Record<string, string> = {
  high: 'border-l-danger-500',
  medium: 'border-l-warning-500',
  low: 'border-l-info-500',
};

const alertSeverityBg: Record<string, string> = {
  high: 'bg-danger-50',
  medium: 'bg-warning-50',
  low: 'bg-info-50',
};

const alertSeverityText: Record<string, string> = {
  high: 'text-danger-600',
  medium: 'text-warning-600',
  low: 'text-info-600',
};

const alertSeverityLabel: Record<string, string> = {
  high: 'CRITICAL',
  medium: 'WARNING',
  low: 'INFO',
};

function timeAgo(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function relativeDate(d: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const healthDotColors: Record<string, string> = {
  Excellent: 'bg-success-500',
  Healthy: 'bg-success-500',
  Attention: 'bg-warning-500',
  Blocked: 'bg-danger-500',
  Critical: 'bg-danger-500',
};

const healthTextColors: Record<string, string> = {
  Excellent: 'text-success-600',
  Healthy: 'text-success-600',
  Attention: 'text-warning-600',
  Blocked: 'text-danger-600',
  Critical: 'text-danger-600',
};

function getHealthState(pct: number): string {
  if (pct >= 90) return 'Excellent';
  if (pct >= 70) return 'Healthy';
  if (pct >= 50) return 'Attention';
  if (pct >= 30) return 'Blocked';
  return 'Critical';
}

interface ReleaseRow extends Record<string, unknown> {
  id: string;
  releaseName: string;
  artistName: string;
  releaseType: string;
  currentStage: string;
  healthPct: number;
  healthState: string;
  dueDate?: Date;
  owner?: string;
  status: string;
}

const columns = [
  {
    key: 'release',
    header: 'Release',
    render: (_value: unknown, row: ReleaseRow) => (
      <div>
        <div className="font-semibold text-text-900 text-sm">{row.releaseName}</div>
        <div className="text-xs text-text-500">{row.artistName}</div>
      </div>
    ),
  },
  {
    key: 'health',
    header: 'Health',
    render: (_value: unknown, row: ReleaseRow) => (
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${healthDotColors[row.healthState] ?? 'bg-surface-300'}`} />
        <span className={`text-sm font-medium ${healthTextColors[row.healthState] ?? 'text-text-500'}`}>
          {row.healthState}
        </span>
        <div className="w-16 h-1 bg-surface-200 rounded-full overflow-hidden hidden sm:block">
          <div
            className={`h-full rounded-full transition-all duration-500 ${healthDotColors[row.healthState] ?? 'bg-surface-300'}`}
            style={{ width: `${Math.min(100, Math.max(0, row.healthPct))}%` }}
          />
        </div>
      </div>
    ),
  },
  {
    key: 'stage',
    header: 'Stage',
    render: (_value: unknown, row: ReleaseRow) => (
      <span className="text-sm text-text-700">{row.currentStage}</span>
    ),
  },
  {
    key: 'deadline',
    header: 'Deadline',
    render: (_value: unknown, row: ReleaseRow) => {
      if (!row.dueDate) return <span className="text-sm text-text-400">&mdash;</span>;
      const overdue = row.dueDate < new Date();
      return (
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${overdue ? 'bg-danger-500' : 'bg-success-500'}`} />
          <span className={`text-sm ${overdue ? 'text-danger-500 font-medium' : 'text-text-700'}`}>
            {relativeDate(row.dueDate)}
          </span>
        </div>
      );
    },
  },
  {
    key: 'owner',
    header: 'Owner',
    render: (_value: unknown, row: ReleaseRow) => (
      row.owner ? <span className="text-sm text-text-500">{row.owner}</span> : <span className="text-sm text-text-400">&mdash;</span>
    ),
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { activeOrgId, orgsLoaded } = useOrgStore();
  const { role } = useRoleStore();
  const { alerts, blockedItems, deadlines, pulseMetrics, activities, loading, error, refresh } = useOperationsCenter();
  const [lastUpdated] = useState(() => new Date());
  const [activityOpen, setActivityOpen] = useState(true);
  const activityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem('oc-activity-seen');
    if (seen) {
      setActivityOpen(false);
    } else {
      sessionStorage.setItem('oc-activity-seen', '1');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ops_last_session_ended_at', Date.now().toString());
  }, []);

  const today = useMemo(() => new Date(), []);

  const releaseRows = useMemo<ReleaseRow[]>(() => {
    return [
      ...(pulseMetrics.activeReleases > 0
        ? [
            {
              id: 'release-1',
              releaseName: 'Lua',
              artistName: 'Kinn Timo',
              releaseType: 'EP',
              currentStage: 'Mastering',
              healthPct: 68,
              healthState: getHealthState(68),
              dueDate: new Date(today.getTime() - 5 * 86400000),
              owner: 'Alex PM',
              status: 'in_production',
            },
            {
              id: 'release-2',
              releaseName: 'Midnight Sessions',
              artistName: 'Various',
              releaseType: 'Single',
              currentStage: 'Mixing',
              healthPct: 75,
              healthState: getHealthState(75),
              dueDate: new Date(today.getTime() + 16 * 86400000),
              owner: 'Sam W',
              status: 'in_production',
            },
            {
              id: 'release-3',
              releaseName: 'Summer EP',
              artistName: 'Maya Rivers',
              releaseType: 'EP',
              currentStage: 'Artwork',
              healthPct: 82,
              healthState: getHealthState(82),
              dueDate: new Date(today.getTime() + 3 * 86400000),
              owner: 'A&R Mgr',
              status: 'in_production',
            },
            ...(pulseMetrics.blockedReleases > 0
              ? [
                  {
                    id: 'release-4',
                    releaseName: 'Neon Remix',
                    artistName: 'DJ Spark',
                    releaseType: 'Remix',
                    currentStage: 'Production',
                    healthPct: 28,
                    healthState: getHealthState(28),
                    dueDate: new Date(today.getTime() + 11 * 86400000),
                    owner: 'Alex PM',
                    status: 'blocked',
                  },
                ]
              : []),
            ...(pulseMetrics.overBudget > 0
              ? [
                  {
                    id: 'release-5',
                    releaseName: 'Winter Collection',
                    artistName: 'Various',
                    releaseType: 'Compilation',
                    currentStage: 'Planning',
                    healthPct: 45,
                    healthState: getHealthState(45),
                    dueDate: new Date(today.getTime() + 37 * 86400000),
                    owner: 'A&R Mgr',
                    status: 'planning',
                  },
                ]
              : []),
          ]
        : []),
    ];
  }, [pulseMetrics, today]);

  const attentionItems = useMemo(() => {
    const combined = [
      ...alerts.map((a) => ({ ...a, kind: 'alert' as const })),
      ...blockedItems.map((b) => ({ ...b, kind: 'blocked' as const })),
    ];
    return combined.sort(() => 0).slice(0, 8);
  }, [alerts, blockedItems]);

  const attentionHasContent = attentionItems.length > 0 || deadlines.length > 0;

  const roleQuickActions = useMemo(() => {
    const actions: { label: string; href: string }[] = [];
    if (role === 'owner' || role === 'admin' || role === 'release_manager') {
      actions.push({ label: 'New Release', href: '/releases/new' });
      actions.push({ label: 'New Artist', href: '/artists/new' });
      actions.push({ label: 'New Campaign', href: '/campaigns/new' });
    }
    if (role === 'contributor') {
      actions.push({ label: 'My Work', href: '/work' });
    }
    actions.push({ label: 'View All Releases', href: '/releases' });
    return actions;
  }, [role]);

  if (!orgsLoaded) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-900">Operations Center</h1>
          <p className="text-sm text-text-500 mt-1">Operational overview</p>
        </div>
        <LoadingState text="Loading&hellip;" />
      </div>
    );
  }

  if (orgsLoaded && !activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-900">Operations Center</h1>
          <p className="text-sm text-text-500 mt-1">Operational overview</p>
        </div>

        <Card padding="lg">
          <div className="text-center py-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="h-8 w-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-900 mb-2">Set up your organization</h2>
            <p className="text-sm text-text-500 max-w-md mx-auto mb-6">
              Organisations group your releases, artists, and team members together.
              Create one to start managing your music operations.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="primary" onClick={() => router.push('/organizations')}>
                Create an organisation
              </Button>
              <Button variant="outline" onClick={() => router.push('/organizations')}>
                Join an organisation
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-900">Operations Center</h1>
          <p className="text-sm text-text-500 mt-1">Operational overview</p>
        </div>
        <LoadingState text="Loading operations data&hellip;" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-900">Operations Center</h1>
          <p className="text-sm text-text-500 mt-1">Operational overview</p>
        </div>
        <EmptyState title="Unable to load data" description={error} action={{ label: 'Retry', onClick: refresh }} />
      </div>
    );
  }

  const todayStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      {/* ===== Page Header ===== */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-semibold text-text-900 tracking-tight leading-snug">
              Operations Center
            </h1>
            <p className="text-sm text-text-500 mt-0.5">
              {todayStr}
            </p>
          </div>
          <Link
            href="/releases/new"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 h-9 text-sm font-medium text-white shadow-sm hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all duration-150"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Release
          </Link>
        </div>
      </header>

      {/* ===== Operational Summary ===== */}
      <section className="mb-8" aria-label="Operational Summary">
        <OperationalSummary
          healthScore={pulseMetrics.blockedReleases > 0 ? 50 : pulseMetrics.overBudget > 0 ? 65 : 85}
          currentStage="Operations"
          completedStages={pulseMetrics.activeReleases - pulseMetrics.blockedReleases}
          totalStages={pulseMetrics.activeReleases}
          readyItems={pulseMetrics.activeReleases - pulseMetrics.blockedReleases}
          totalItems={pulseMetrics.activeReleases}
          pendingApprovals={alerts.length}
          blockers={blockedItems.length}
          daysUntilRelease={deadlines.length > 0 ? 7 : 30}
          lastEvaluated={lastUpdated.toISOString()}
        />
      </section>

      {/* ===== Active Releases ===== */}
      <section className="mb-8" aria-label="Active Releases">
        <h2 className="text-[13px] font-semibold text-text-500 uppercase tracking-wider mb-4">Active Releases</h2>
        {releaseRows.length === 0 ? (
          <EmptyState
            title="No active releases"
            description="Create your first release to start managing music operations."
            action={{ label: 'Create Release', onClick: () => router.push('/releases/new') }}
          />
        ) : (
          <Table
            columns={columns}
            data={releaseRows}
            onRowClick={(row) => router.push(`/releases/${row.id}`)}
          />
        )}
      </section>

      {/* ===== Attention Panel ===== */}
      {attentionHasContent && (
        <section className="mb-8" aria-label="Attention Panel">
          <h2 className="text-[13px] font-semibold text-text-500 uppercase tracking-wider mb-4">Attention</h2>

          {alerts.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-text-800">Alerts</h3>
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-surface-100 text-[11px] font-semibold text-text-500">
                  {alerts.length}
                </span>
              </div>
              <div className="space-y-2">
                {alerts.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-xl border border-surface-200/80 border-l-[3px] px-4 py-3 ${alertSeverityBorder[a.priority]} ${alertSeverityBg[a.priority]}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${alertSeverityText[a.priority]}`}>
                        {alertSeverityLabel[a.priority]}
                      </span>
                      <Link
                        href={`/releases/${a.releaseId}`}
                        className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                    <p className="text-sm text-text-700">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blockedItems.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-text-800">Blocked Work</h3>
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-surface-100 text-[11px] font-semibold text-text-500">
                  {blockedItems.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {blockedItems.map((b) => (
                  <BlockedRow key={b.id} item={b} />
                ))}
              </div>
            </div>
          )}

          {deadlines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-text-800">Critical Deadlines</h3>
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-surface-100 text-[11px] font-semibold text-text-500">
                  {deadlines.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {deadlines.slice(0, 5).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-white px-4 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          d.priority === 'critical' || d.priority === 'high'
                            ? 'bg-danger-500'
                            : d.priority === 'medium'
                              ? 'bg-warning-500'
                              : 'bg-surface-300'
                        }`}
                      />
                      <Badge label={d.type.replace(/_/g, ' ')} color="bg-surface-100 text-text-500" size="sm" />
                      <span className="text-text-700 truncate">{d.title}</span>
                      <Badge
                        label={d.priority}
                        color={
                          d.priority === 'critical' || d.priority === 'high'
                            ? 'bg-danger-50 text-danger-600'
                            : d.priority === 'medium'
                              ? 'bg-warning-50 text-warning-700'
                              : 'bg-surface-100 text-text-500'
                        }
                        size="sm"
                      />
                    </div>
                    <span className="text-xs text-text-400 shrink-0 ml-3">
                      {relativeDate(d.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===== Since you were away ===== */}
      <section className="mb-8" aria-label="Since you were away">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold text-text-500 uppercase tracking-wider">Since you were away</h2>
          <button
            type="button"
            onClick={() => setActivityOpen((o) => !o)}
            aria-expanded={activityOpen}
            aria-controls="activity-feed"
            className="flex items-center gap-1 text-xs text-text-400 hover:text-text-700 transition-colors duration-150"
          >
            {activityOpen ? 'Collapse' : 'Expand'}
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${activityOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div
          id="activity-feed"
          ref={activityRef}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: activityOpen ? `${(activityRef.current?.scrollHeight ?? 9999)}px` : '0px',
            opacity: activityOpen ? 1 : 0,
          }}
        >
          {activities.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Activity appears when your team takes action on releases."
            />
          ) : (
            <div className="space-y-1">
              {activities.slice(0, 10).map((a) => (
                <ActivityRow key={a.id} item={a} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Quick Actions ===== */}
      <section className="mb-8" aria-label="Quick Actions">
        <h2 className="text-[13px] font-semibold text-text-500 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {roleQuickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button variant="outline" size="sm">
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <div className="pt-5 border-t border-surface-200/60 flex items-center justify-between">
        <button
          onClick={refresh}
          className="text-xs text-text-400 hover:text-text-700 transition-colors duration-150 font-medium"
        >
          Refresh data
        </button>
        <span className="text-xs text-text-400">
          Updated {timeAgo(lastUpdated)}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div className="flex items-start gap-2 text-sm py-1.5">
      <div className="h-2 w-2 mt-1.5 rounded-full bg-primary-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-text-700 text-xs">{item.message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-400">{timeAgo(item.createdAt)}</span>
          <Link href={`/releases/${item.releaseId}`} className="text-xs text-primary-500 hover:underline">
            View
          </Link>
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
    <div className="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2 text-sm bg-white">
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
