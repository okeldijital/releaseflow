'use client';

import type { WorkloadSummary } from '@/lib/schedule-service';

interface ScheduleWorkloadProps {
  summary: WorkloadSummary;
  teamMode?: boolean;
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-surface-700/60 bg-layer-2 px-3 py-2.5 min-w-[100px]">
      <p className="text-[10px] uppercase tracking-wider text-text-500">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${accent ?? 'text-surface-100'}`}>{value}</p>
    </div>
  );
}

export function ScheduleWorkload({ summary, teamMode }: ScheduleWorkloadProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Stat label="Today" value={summary.today} accent="text-primary-400" />
      <Stat label="This Week" value={summary.thisWeek} />
      <Stat label="Overdue" value={summary.overdue} accent={summary.overdue > 0 ? 'text-danger-500' : undefined} />
      <Stat label="Review" value={summary.awaitingReview} accent="text-info-400" />
      <Stat label="Blocked" value={summary.blocked} accent={summary.blocked > 0 ? 'text-warning-600' : undefined} />
      <Stat label="Done (wk)" value={summary.completedThisWeek} accent="text-success-600" />
      {teamMode ? (
        <Stat label="Completed" value={summary.completed} />
      ) : null}
    </div>
  );
}
