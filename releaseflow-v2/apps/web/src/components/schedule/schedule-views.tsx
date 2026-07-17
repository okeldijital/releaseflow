'use client';

import { EmptyState, Badge } from '@releaseflow/ui';
import type {
  AgendaSections,
  DayBucket,
  ScheduleAssignmentItem,
  ScheduleMilestoneItem,
} from '@/lib/schedule-service';
import { ScheduleAssignmentCard } from './schedule-assignment-card';
import {
  dayKey, formatDayLabel, formatMonthLabel, isSameDay, daysInMonthGrid,
  addDays, startOfMonth,
} from '@/lib/schedule-date-utils';
import type { AssignmentPriority } from '@/lib/assignment-repository';

const priorityDot: Record<string, string> = {
  urgent: 'bg-danger-500',
  high: 'bg-warning-500',
  medium: 'bg-primary-500',
  low: 'bg-surface-600',
};

export function AgendaView({ sections }: { sections: AgendaSections }) {
  const blocks: { key: string; label: string; items: ScheduleAssignmentItem[] }[] = [
    { key: 'overdue', label: 'Overdue', items: sections.overdue },
    { key: 'today', label: 'Today', items: sections.today },
    { key: 'tomorrow', label: 'Tomorrow', items: sections.tomorrow },
    { key: 'upcoming', label: 'Upcoming', items: sections.upcoming },
  ];
  const total = blocks.reduce((s, b) => s + b.items.length, 0);
  if (total === 0) {
    return (
      <EmptyState title="Nothing scheduled." description="Enjoy the free time." />
    );
  }
  return (
    <div className="space-y-6">
      {blocks.map((b) => {
        if (b.items.length === 0) return null;
        return (
          <section key={b.key}>
            <p className="text-xs font-medium uppercase tracking-wider text-text-500 mb-2">
              {b.label}
              <span className="ml-2 text-text-400 normal-case tracking-normal">({b.items.length})</span>
            </p>
            <div className="space-y-2">
              {b.items.map((item) => (
                <ScheduleAssignmentCard key={item.assignment.id} item={item} showTime />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function DayView({
  day,
  items,
  milestones,
}: {
  day: Date;
  items: ScheduleAssignmentItem[];
  milestones: ScheduleMilestoneItem[];
}) {
  if (items.length === 0 && milestones.length === 0) {
    return (
      <EmptyState title="Nothing scheduled." description="Enjoy the free time." />
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-surface-100">{formatDayLabel(day)}</p>
      {milestones.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs text-text-500 uppercase tracking-wider">Milestones (read-only)</p>
          {milestones.map((m) => (
            <div
              key={m.milestone.id}
              className="rounded-lg border border-dashed border-surface-600 px-3 py-2 text-xs text-text-400"
            >
              {m.milestone.title}
            </div>
          ))}
        </div>
      ) : null}
      <div className="space-y-2">
        {items.map((item) => (
          <ScheduleAssignmentCard key={item.assignment.id} item={item} showTime />
        ))}
      </div>
    </div>
  );
}

export function WeekView({
  buckets,
  canDrag,
  onDropOnDay,
  compact,
}: {
  buckets: DayBucket[];
  canDrag: boolean;
  onDropOnDay: (assignmentId: string, day: Date) => void;
  compact?: boolean;
}) {
  const today = new Date();
  const hasAny = buckets.some((b) => b.items.length > 0 || b.milestones.length > 0);

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div
        className="grid gap-2 min-w-[720px]"
        style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
      >
        {buckets.map((b) => {
          const isToday = isSameDay(b.date, today);
          return (
            <div
              key={b.key}
              className={`
                rounded-xl border min-h-[200px] flex flex-col
                ${isToday ? 'border-primary-500/50 bg-primary-500/5' : 'border-surface-700/60 bg-layer-2/50'}
              `}
              onDragOver={(e) => {
                if (!canDrag) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                if (!canDrag) return;
                e.preventDefault();
                const id = e.dataTransfer.getData('text/assignment-id');
                if (id) onDropOnDay(id, b.date);
              }}
            >
              <div className="px-2 py-2 border-b border-surface-700/40 sticky top-0">
                <p className={`text-xs font-medium ${isToday ? 'text-primary-400' : 'text-text-400'}`}>
                  {b.date.toLocaleDateString(undefined, { weekday: 'short' })}
                </p>
                <p className={`text-sm font-semibold ${isToday ? 'text-primary-300' : 'text-surface-100'}`}>
                  {b.date.getDate()}
                </p>
                {b.conflictCount > 0 ? (
                  <Badge label={`${b.conflictCount} conflict`} size="sm" color="bg-warning-500/15 text-warning-600" />
                ) : null}
              </div>
              <div className="p-1.5 space-y-1.5 flex-1">
                {b.milestones.map((m) => (
                  <div
                    key={m.milestone.id}
                    className="rounded-md border border-dashed border-surface-600 px-1.5 py-1 text-[10px] text-text-500"
                    title="Release milestone (read-only)"
                  >
                    {m.milestone.title}
                  </div>
                ))}
                {b.items.map((item) => (
                  <ScheduleAssignmentCard
                    key={item.assignment.id}
                    item={item}
                    compact={compact ?? true}
                    draggable={canDrag}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {!hasAny ? (
        <div className="mt-6">
          <EmptyState title="Nothing scheduled." description="Enjoy the free time." />
        </div>
      ) : null}
    </div>
  );
}

export function MonthView({
  month,
  weekStartsOn,
  dayMeta,
  onSelectDay,
  showWeekends,
}: {
  month: Date;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dayMeta: Map<string, { count: number; highestPriority: AssignmentPriority | null; hasConflict: boolean }>;
  onSelectDay: (day: Date) => void;
  showWeekends: boolean;
}) {
  const days = daysInMonthGrid(month, weekStartsOn);
  const monthStart = startOfMonth(month);
  const today = new Date();
  const firstGridDay = days[0] ?? month;
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(firstGridDay, i));

  return (
    <div>
      <p className="text-sm font-medium text-surface-100 mb-3">{formatMonthLabel(month)}</p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d) => {
          if (!showWeekends && (d.getDay() === 0 || d.getDay() === 6)) {
            return <div key={d.toISOString()} />;
          }
          return (
            <div key={d.toISOString()} className="text-[10px] uppercase text-text-500 text-center py-1">
              {d.toLocaleDateString(undefined, { weekday: 'short' })}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          if (!showWeekends && (d.getDay() === 0 || d.getDay() === 6)) {
            return <div key={d.toISOString()} className="min-h-[72px]" />;
          }
          const inMonth = d.getMonth() === monthStart.getMonth();
          const meta = dayMeta.get(dayKey(d));
          const isToday = isSameDay(d, today);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDay(d)}
              className={`
                min-h-[72px] rounded-lg border p-1.5 text-left transition-colors
                ${inMonth ? 'border-surface-700/60 bg-layer-2' : 'border-transparent bg-transparent opacity-40'}
                ${isToday ? 'ring-1 ring-primary-500/50' : ''}
                hover:border-primary-500/40
              `}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-primary-400' : 'text-surface-100'}`}>
                {d.getDate()}
              </span>
              {meta && meta.count > 0 ? (
                <div className="mt-1 flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[meta.highestPriority ?? 'medium']}`} />
                  <span className="text-[10px] text-text-400">{meta.count}</span>
                  {meta.hasConflict ? (
                    <span className="text-[9px] text-warning-600">!</span>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
