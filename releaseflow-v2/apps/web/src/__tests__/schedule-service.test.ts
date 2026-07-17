import { describe, it, expect } from 'vitest';
import {
  dayKey, startOfWeek, addDays, startOfDay, priorityRank,
  hasTimeComponent,
} from '@/lib/schedule-date-utils';
import {
  applyScheduleFilters,
  detectItemConflicts,
  applyConflicts,
  buildAgenda,
  buildWorkload,
  canReschedule,
  canViewTeamSchedule,
  type ScheduleAssignmentItem,
} from '@/lib/schedule-service';
import type { AssignmentRecord } from '@/lib/assignment-repository';

function item(partial: {
  id: string;
  due?: Date | null;
  assigneeId?: string;
  status?: string;
  priority?: string;
  isOverdue?: boolean;
  isDueToday?: boolean;
  isDueTomorrow?: boolean;
  title?: string;
}): ScheduleAssignmentItem {
  const due = partial.due ?? null;
  const assignment = {
    id: partial.id,
    organizationId: 'org1',
    title: partial.title ?? `A-${partial.id}`,
    entityType: 'release',
    entityId: 'r1',
    assigneeId: partial.assigneeId ?? 'p1',
    assignerId: 'p2',
    role: 'mixer',
    priority: (partial.priority as AssignmentRecord['priority']) ?? 'medium',
    status: (partial.status as AssignmentRecord['status']) ?? 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as AssignmentRecord;

  return {
    assignment,
    dueDate: due,
    hasTime: due ? hasTimeComponent(due) : false,
    isOverdue: partial.isOverdue ?? false,
    isDueToday: partial.isDueToday ?? false,
    isDueTomorrow: partial.isDueTomorrow ?? false,
    assigneeName: 'Alice',
    assignerName: 'Bob',
    context: null,
    conflicts: [],
  };
}

describe('CE-007 date utils', () => {
  it('formats day keys', () => {
    expect(dayKey(new Date(2026, 7, 12))).toBe('2026-08-12');
  });

  it('starts week on Monday by default', () => {
    // 2026-07-15 is Wednesday
    const wed = new Date(2026, 6, 15);
    const start = startOfWeek(wed, 1);
    expect(start.getDay()).toBe(1);
  });

  it('ranks priorities', () => {
    expect(priorityRank('urgent')).toBeGreaterThan(priorityRank('low'));
  });
});

describe('CE-007 conflict detection', () => {
  it('flags multiple assignments same day same assignee', () => {
    const day = startOfDay(new Date(2026, 7, 12));
    const a = item({ id: '1', due: day, assigneeId: 'p1' });
    const b = item({ id: '2', due: day, assigneeId: 'p1' });
    const conflicts = detectItemConflicts(a, [a, b]);
    expect(conflicts).toContain('multiple_due');
  });

  it('flags day overload above threshold', () => {
    const day = startOfDay(new Date(2026, 7, 12));
    const peers = Array.from({ length: 6 }, (_, i) =>
      item({ id: String(i), due: day, assigneeId: `p${i}` }),
    );
    const conflicts = detectItemConflicts(peers[0]!, peers);
    expect(conflicts).toContain('day_overload');
  });

  it('applyConflicts mutates each item', () => {
    const day = startOfDay(new Date(2026, 7, 12));
    const list = applyConflicts([
      item({ id: '1', due: day, assigneeId: 'p1' }),
      item({ id: '2', due: day, assigneeId: 'p1' }),
    ]);
    expect(list[0]!.conflicts.length).toBeGreaterThan(0);
  });
});

describe('CE-007 filters and agenda', () => {
  it('filters by overdue flag', () => {
    const list = applyScheduleFilters(
      [
        item({ id: '1', isOverdue: true }),
        item({ id: '2', isOverdue: false }),
      ],
      { status: 'overdue' },
    );
    expect(list).toHaveLength(1);
    expect(list[0]!.assignment.id).toBe('1');
  });

  it('builds agenda sections chronologically', () => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const later = addDays(today, 5);
    const sections = buildAgenda([
      item({ id: 't', due: today, isDueToday: true }),
      item({ id: 'tm', due: tomorrow, isDueTomorrow: true }),
      item({ id: 'u', due: later }),
      item({ id: 'o', due: addDays(today, -2), isOverdue: true }),
    ]);
    expect(sections.today.map((i) => i.assignment.id)).toContain('t');
    expect(sections.tomorrow.map((i) => i.assignment.id)).toContain('tm');
    expect(sections.upcoming.map((i) => i.assignment.id)).toContain('u');
    expect(sections.overdue.map((i) => i.assignment.id)).toContain('o');
  });

  it('computes workload summary', () => {
    const today = startOfDay(new Date());
    const w = buildWorkload([
      item({ id: '1', due: today, isDueToday: true }),
      item({ id: '2', isOverdue: true }),
      item({ id: '3', status: 'blocked' }),
      item({ id: '4', status: 'review' }),
    ]);
    expect(w.today).toBe(1);
    expect(w.overdue).toBe(1);
    expect(w.blocked).toBe(1);
    expect(w.awaitingReview).toBe(1);
  });
});

describe('CE-007 permissions', () => {
  it('collaborators cannot reschedule or view team', () => {
    expect(canReschedule('contributor')).toBe(false);
    expect(canViewTeamSchedule('contributor')).toBe(false);
  });

  it('managers can reschedule and view team', () => {
    expect(canReschedule('release_manager')).toBe(true);
    expect(canViewTeamSchedule('admin')).toBe(true);
  });
});

describe('CE-007 modules', () => {
  it('exports reschedule on assignment service', async () => {
    const mod = await import('@/lib/assignment-service');
    expect(typeof mod.rescheduleAssignment).toBe('function');
  });

  it('exports calendar preferences', async () => {
    const mod = await import('@/lib/calendar-preferences-repository');
    expect(typeof mod.getCalendarPreferences).toBe('function');
    expect(typeof mod.updateCalendarPreferences).toBe('function');
  });

  it('registers schedule notification events', async () => {
    const { getNotificationTypeDefinition } = await import('@/lib/notification-type-registry');
    expect(getNotificationTypeDefinition('assignment.rescheduled')?.title).toBe('Assignment Rescheduled');
    expect(getNotificationTypeDefinition('assignment.due_today')).toBeTruthy();
    expect(getNotificationTypeDefinition('assignment.conflict')).toBeTruthy();
  });
});
