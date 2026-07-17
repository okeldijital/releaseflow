'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import { LoadingState, Tabs, Badge } from '@releaseflow/ui';
import {
  getReleaseReadiness,
  loadReleaseAssignments,
  type ReleaseReadiness,
} from '@/lib/release-readiness-service';
import { listReadinessHistory, type ReadinessHistoryRecord } from '@/lib/release-readiness-history-repository';
import { canViewTeamSchedule } from '@/lib/schedule-service';
import { resolveMyPersonIds } from '@/lib/schedule-service';
import {
  GoNoGoPanel,
  CountdownPanel,
  HealthIndicators,
  AssignmentSummaryPanel,
  MilestoneProgressPanel,
  CriticalPathPanel,
  TimelinePanel,
  ScoreBreakdownPanel,
  HistoryPanel,
  CollaboratorImpactPanel,
  recLabel,
  recColor,
  scoreBarColor,
} from '@/components/release/readiness/readiness-dashboard';
import { ProgressBar } from '@releaseflow/ui';

export default function ReleaseReadinessPage() {
  const params = useParams();
  const releaseId = params.id as string;
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { role } = useRoleStore();
  const isManager = canViewTeamSchedule(role);

  const [model, setModel] = useState<ReleaseReadiness | null>(null);
  const [history, setHistory] = useState<ReadinessHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [myCount, setMyCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!releaseId || !user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const readiness = await getReleaseReadiness(releaseId, {
        actorId: user.uid,
        emitEvents: isManager,
      });
      if (!readiness) {
        setError('Release not found');
        setModel(null);
        return;
      }

      // Collaborator access: only if they have assignments on this release
      if (!isManager && activeOrgId) {
        const myPersonIds = await resolveMyPersonIds(activeOrgId, user.uid);
        const assignments = await loadReleaseAssignments(releaseId, readiness.organizationId);
        const mine = assignments.filter(
          (a) => a.assigneeId === user.uid || myPersonIds.includes(a.assigneeId),
        );
        setMyCount(mine.length);
        if (mine.length === 0) {
          setError('You do not have assignments on this release.');
          setModel(null);
          return;
        }
      } else if (activeOrgId) {
        const myPersonIds = await resolveMyPersonIds(activeOrgId, user.uid);
        const assignments = await loadReleaseAssignments(releaseId, readiness.organizationId);
        setMyCount(
          assignments.filter(
            (a) => a.assigneeId === user.uid || myPersonIds.includes(a.assigneeId),
          ).length,
        );
      }

      setModel(readiness);

      // Lazy history
      const hist = await listReadinessHistory(releaseId, 20);
      setHistory(hist);
    } catch (e) {
      setError((e as Error).message || 'Failed to load readiness');
      setModel(null);
    } finally {
      setLoading(false);
    }
  }, [releaseId, user?.uid, isManager, activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs = useMemo(() => {
    const base = [
      { id: 'overview', label: 'Overview' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'assignments', label: 'Assignments' },
      { id: 'milestones', label: 'Milestones' },
    ];
    if (isManager) {
      base.push(
        { id: 'blockers', label: 'Blockers' },
        { id: 'activity', label: 'History' },
      );
    }
    return base;
  }, [isManager]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingState />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-display-md font-semibold text-primary-400 mb-2">Readiness unavailable</p>
        <p className="text-sm text-text-500 mb-4">{error ?? 'Unable to compute readiness.'}</p>
        <Link href="/releases" className="text-sm text-primary-400 hover:underline">
          Back to releases
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 page-transition">
      {/* Sticky countdown + header */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4 bg-layer-1/95 backdrop-blur border-b border-surface-700/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/releases/${releaseId}`} className="text-xs text-text-500 hover:text-primary-400">
              ← Release
            </Link>
            <h1 className="text-display-md font-semibold text-primary-400 tracking-tight truncate">
              {model.title}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm tabular-nums text-surface-100 font-semibold">
                {model.readinessScore}%
              </span>
              {isManager ? (
                <Badge label={recLabel[model.recommendation]} size="sm" color={recColor[model.recommendation]} />
              ) : (
                <Badge label="Your release" size="sm" color="bg-primary-500/10 text-primary-400" />
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            {model.countdown.releaseDate ? (
              <p className={`text-xl font-semibold tabular-nums ${
                model.countdown.color === 'red'
                  ? 'text-danger-500'
                  : model.countdown.color === 'yellow'
                    ? 'text-warning-600'
                    : 'text-success-600'
              }`}
              >
                {model.countdown.overdue ? '-' : ''}
                {Math.abs(model.countdown.days ?? 0)}d {model.countdown.hours ?? 0}h
              </p>
            ) : (
              <p className="text-sm text-text-500">No date</p>
            )}
            <p className="text-[11px] text-text-500">until release</p>
          </div>
        </div>
        <div className="mt-2">
          <ProgressBar
            value={model.readinessScore}
            max={100}
            color={scoreBarColor(model.readinessScore)}
            size="sm"
          />
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      <div className="mt-6 space-y-6">
        {tab === 'overview' && (
          <>
            {isManager ? <HealthIndicators model={model} showManagement /> : null}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CountdownPanel model={model} />
              {isManager ? (
                <GoNoGoPanel model={model} showManagement />
              ) : (
                <CollaboratorImpactPanel model={model} myAssignmentCount={myCount} />
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AssignmentSummaryPanel model={model} />
              <MilestoneProgressPanel model={model} />
            </div>
            {isManager ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CriticalPathPanel model={model} />
                <ScoreBreakdownPanel model={model} showManagement />
              </div>
            ) : null}
          </>
        )}

        {tab === 'timeline' && <TimelinePanel model={model} />}

        {tab === 'assignments' && (
          <div className="space-y-4">
            <AssignmentSummaryPanel model={model} />
            {isManager ? <CriticalPathPanel model={model} /> : null}
            <Link
              href={`/assignments?release=${releaseId}`}
              className="text-sm text-primary-400 hover:underline"
            >
              Open assignments →
            </Link>
          </div>
        )}

        {tab === 'milestones' && <MilestoneProgressPanel model={model} />}

        {tab === 'blockers' && isManager && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GoNoGoPanel model={model} showManagement />
            <CriticalPathPanel model={model} />
          </div>
        )}

        {tab === 'activity' && isManager && <HistoryPanel history={history} />}
      </div>
    </div>
  );
}
