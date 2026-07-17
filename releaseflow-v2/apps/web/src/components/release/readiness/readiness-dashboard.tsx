'use client';

import Link from 'next/link';
import {
  Badge, ProgressBar, WorkspaceCard,
} from '@releaseflow/ui';
import type {
  ReleaseReadiness,
  ReadinessIssue,
  Recommendation,
} from '@/lib/release-readiness-service';
import type { ReadinessHistoryRecord } from '@/lib/release-readiness-history-repository';

const recLabel: Record<Recommendation, string> = {
  ready: 'Ready',
  needs_attention: 'Needs Attention',
  not_ready: 'Not Ready',
};

const recColor: Record<Recommendation, string> = {
  ready: 'bg-success-500/15 text-success-600',
  needs_attention: 'bg-warning-500/15 text-warning-600',
  not_ready: 'bg-danger-500/15 text-danger-500',
};

const countdownColor: Record<string, string> = {
  green: 'text-success-600',
  yellow: 'text-warning-600',
  red: 'text-danger-500',
  none: 'text-text-500',
};

function scoreBarColor(score: number): string {
  if (score >= 85) return 'bg-success-500';
  if (score >= 55) return 'bg-warning-500';
  return 'bg-danger-500';
}

export function GoNoGoPanel({
  model,
  showManagement,
}: {
  model: ReleaseReadiness;
  showManagement: boolean;
}) {
  if (!showManagement) return null;
  return (
    <WorkspaceCard title="Go / No-Go">
      <div className="mt-2 space-y-3">
        <div className="flex items-center gap-3">
          <Badge
            label={recLabel[model.recommendation]}
            color={recColor[model.recommendation]}
            size="md"
          />
          <span className="text-2xl font-semibold tabular-nums text-surface-100">
            {model.readinessScore}
          </span>
          <span className="text-xs text-text-500">/ 100</span>
        </div>
        <ProgressBar value={model.readinessScore} max={100} color={scoreBarColor(model.readinessScore)} size="sm" />
        <p className="text-xs text-text-500">
          Evidence-based recommendation — not a manual status. Managers decide; the system does not override.
        </p>
        {model.blockers.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-text-500 mb-1">Blockers</p>
            <ul className="space-y-1">
              {model.blockers.slice(0, 6).map((b) => (
                <IssueRow key={b.id} issue={b} />
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-success-600">No blockers detected.</p>
        )}
        {model.warnings.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-text-500 mb-1">Warnings</p>
            <ul className="space-y-1">
              {model.warnings.slice(0, 4).map((w) => (
                <IssueRow key={w.id} issue={w} />
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-[11px] text-text-500">
          Last calculated {model.calculatedAt.toLocaleString()}
        </p>
      </div>
    </WorkspaceCard>
  );
}

function IssueRow({ issue }: { issue: ReadinessIssue }) {
  const body = (
    <span className={`text-sm ${issue.kind === 'blocker' ? 'text-danger-500' : 'text-warning-600'}`}>
      {issue.message}
    </span>
  );
  if (issue.href) {
    return (
      <li>
        <Link href={issue.href} className="hover:underline">
          {body}
        </Link>
      </li>
    );
  }
  return <li>{body}</li>;
}

export function CountdownPanel({ model }: { model: ReleaseReadiness }) {
  const c = model.countdown;
  return (
    <WorkspaceCard title="Countdown">
      <div className="mt-2">
        {c.releaseDate ? (
          <>
            <p className={`text-3xl font-semibold tabular-nums ${countdownColor[c.color]}`}>
              {c.overdue ? '-' : ''}
              {Math.abs(c.days ?? 0)}d {c.hours ?? 0}h
            </p>
            <p className="text-xs text-text-500 mt-1">
              {c.overdue ? 'Past release date' : 'Until release'} ·{' '}
              {c.releaseDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </>
        ) : (
          <p className="text-sm text-text-500">No release date set.</p>
        )}
      </div>
    </WorkspaceCard>
  );
}

export function HealthIndicators({
  model,
  showManagement,
}: {
  model: ReleaseReadiness;
  showManagement: boolean;
}) {
  if (!showManagement) return null;
  const items = [
    { label: 'Health', value: `${model.health.healthScore}%` },
    { label: 'Overdue', value: String(model.health.overdueCount) },
    { label: 'Blocked', value: String(model.health.blockedCount) },
    { label: 'Review queue', value: String(model.health.reviewQueue) },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border border-surface-700/60 bg-layer-2 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-text-500">{i.label}</p>
          <p className="text-lg font-semibold text-surface-100 mt-0.5">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

export function AssignmentSummaryPanel({ model }: { model: ReleaseReadiness }) {
  const s = model.assignmentSummary;
  const cells = [
    { label: 'Completed', value: s.completed, href: `/assignments?release=${model.releaseId}&status=completed` },
    { label: 'In Progress', value: s.inProgress, href: `/assignments?release=${model.releaseId}&status=in_progress` },
    { label: 'Blocked', value: s.blocked, href: `/assignments?release=${model.releaseId}&status=blocked` },
    { label: 'Review', value: s.review, href: `/assignments?release=${model.releaseId}&status=review` },
    { label: 'Not Started', value: s.notStarted, href: `/assignments?release=${model.releaseId}` },
    { label: 'Overdue', value: s.overdue, href: `/assignments?release=${model.releaseId}` },
  ];
  return (
    <WorkspaceCard title="Assignments">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        {cells.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-surface-700/50 px-3 py-2 hover:border-primary-500/40 transition-colors"
          >
            <p className="text-[10px] uppercase tracking-wider text-text-500">{c.label}</p>
            <p className="text-lg font-semibold text-surface-100">{c.value}</p>
          </Link>
        ))}
      </div>
    </WorkspaceCard>
  );
}

export function MilestoneProgressPanel({ model }: { model: ReleaseReadiness }) {
  return (
    <WorkspaceCard title="Milestone Progress">
      <ul className="mt-3 space-y-3">
        {model.milestoneProgress.map((m) => (
          <li key={m.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-surface-100">{m.label}</span>
              <span className="tabular-nums text-text-500">{m.pct}%</span>
            </div>
            <ProgressBar value={m.pct} max={100} color={scoreBarColor(m.pct)} size="sm" />
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-text-500 mt-3">Computed from operational data — not manually updated.</p>
    </WorkspaceCard>
  );
}

export function CriticalPathPanel({ model }: { model: ReleaseReadiness }) {
  if (model.criticalPath.length === 0) {
    return (
      <WorkspaceCard title="Critical Path">
        <p className="text-sm text-text-500 mt-2">No critical path assignments identified.</p>
      </WorkspaceCard>
    );
  }
  return (
    <WorkspaceCard title="Critical Path">
      <ul className="mt-2 space-y-2">
        {model.criticalPath.map((c) => (
          <li key={c.assignmentId}>
            <Link
              href={`/assignments/${c.assignmentId}`}
              className="flex items-start justify-between gap-2 rounded-lg border border-warning-500/30 bg-warning-500/5 px-3 py-2 hover:border-warning-500/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface-100 truncate">{c.title}</p>
                <p className="text-xs text-warning-600 mt-0.5">{c.reason}</p>
              </div>
              <Badge label={c.status.replace(/_/g, ' ')} size="sm" color="bg-surface-800 text-text-400" />
            </Link>
          </li>
        ))}
      </ul>
    </WorkspaceCard>
  );
}

export function TimelinePanel({ model }: { model: ReleaseReadiness }) {
  return (
    <WorkspaceCard title="Release Timeline">
      <ol className="mt-3 space-y-0">
        {model.timeline.map((e, i) => {
          const last = i === model.timeline.length - 1;
          return (
            <li key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${e.at ? 'bg-primary-500' : 'bg-surface-600'}`} />
                {!last ? <div className="w-px flex-1 bg-surface-700/60 my-1" /> : null}
              </div>
              <div className={`pb-4 ${last ? 'pb-0' : ''}`}>
                <p className="text-sm text-surface-100">{e.label}</p>
                <p className="text-[11px] text-text-500">
                  {e.at ? e.at.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </WorkspaceCard>
  );
}

export function ScoreBreakdownPanel({ model, showManagement }: { model: ReleaseReadiness; showManagement: boolean }) {
  if (!showManagement) return null;
  return (
    <WorkspaceCard title="Score Breakdown">
      <ul className="mt-2 space-y-2">
        {model.scoreBreakdown.map((s) => (
          <li key={s.key} className="flex items-center justify-between text-xs gap-2">
            <span className="text-text-400">
              {s.label}
              <span className="text-text-500 ml-1">({Math.round(s.weight * 100)}%)</span>
            </span>
            <span className="tabular-nums text-surface-100">
              {s.componentScore} → {s.contribution} pts
            </span>
          </li>
        ))}
      </ul>
    </WorkspaceCard>
  );
}

export function HistoryPanel({ history }: { history: ReadinessHistoryRecord[] }) {
  if (history.length === 0) {
    return (
      <WorkspaceCard title="Readiness History">
        <p className="text-sm text-text-500 mt-2">No transitions recorded yet. Meaningful score/recommendation changes appear here.</p>
      </WorkspaceCard>
    );
  }
  return (
    <WorkspaceCard title="Readiness History">
      <ul className="mt-2 space-y-2">
        {history.map((h) => {
          const at =
            h.createdAt && typeof h.createdAt === 'object' && 'toDate' in h.createdAt
              ? (h.createdAt as { toDate: () => Date }).toDate()
              : null;
          return (
            <li key={h.id} className="flex items-center justify-between text-xs border border-surface-700/40 rounded-lg px-3 py-2">
              <div>
                <Badge label={recLabel[h.recommendation]} size="sm" color={recColor[h.recommendation]} />
                <span className="ml-2 text-surface-100 tabular-nums">{h.readinessScore}</span>
                <span className="ml-2 text-text-500">{h.blockerCount} blockers</span>
              </div>
              <span className="text-text-500">{at ? at.toLocaleString() : ''}</span>
            </li>
          );
        })}
      </ul>
    </WorkspaceCard>
  );
}

export function CollaboratorImpactPanel({
  model,
  myAssignmentCount,
}: {
  model: ReleaseReadiness;
  myAssignmentCount: number;
}) {
  return (
    <WorkspaceCard title="Your impact">
      <div className="mt-2 space-y-2 text-sm">
        <p className="text-text-400">
          You have <span className="text-surface-100 font-medium">{myAssignmentCount}</span> assignment
          {myAssignmentCount === 1 ? '' : 's'} on this release.
        </p>
        <p className="text-text-400">
          Remaining team work: <span className="text-surface-100 font-medium">{model.remainingAssignments}</span>
        </p>
        <Link
          href={`/assignments?release=${model.releaseId}`}
          className="inline-block text-sm text-primary-400 hover:underline"
        >
          View my assignments →
        </Link>
      </div>
    </WorkspaceCard>
  );
}

export { recLabel, recColor, scoreBarColor };
