/**
 * CE-007 — Schedule Service
 *
 * Assignments remain the source of truth. This service only projects
 * calendar models, workload, and conflicts — it never owns assignment data.
 */

import { listAssignments, getAssignmentsByAssignee } from './assignment-repository';
import type { AssignmentRecord, AssignmentPriority, AssignmentStatus } from './assignment-repository';
import { resolvePersonNames } from './resolve-person-names';
import { fetchAssignmentReleaseContext } from './fetch-assignment-context';
import type { AssignmentReleaseContext } from './fetch-assignment-context';
import { fetchMilestonesByOrg } from './milestone-service';
import type { MilestoneRecord } from './milestone-repository';
import { getPeopleByOrg } from './people-repository';
import type { PersonRecord } from './people-repository';
import {
  toDate, startOfDay, addDays, isSameDay, dayKey,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  hasTimeComponent, priorityRank,
} from './schedule-date-utils';
import type { AppRole } from '@/stores/role-store';

export type ScheduleScope = 'mine' | 'team' | 'person' | 'role';

export interface ScheduleFilters {
  status?: AssignmentStatus | 'all' | 'due_today' | 'overdue' | 'blocked' | 'review';
  priority?: AssignmentPriority | 'all';
  releaseId?: string | null;
  artistQuery?: string;
  role?: string | null;
  assigneeId?: string | null;
  search?: string;
}

export interface ScheduleAssignmentItem {
  assignment: AssignmentRecord;
  dueDate: Date | null;
  hasTime: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  assigneeName: string;
  assignerName: string;
  context: AssignmentReleaseContext | null;
  conflicts: string[];
}

export interface ScheduleMilestoneItem {
  milestone: MilestoneRecord;
  dueDate: Date | null;
  releaseTitle?: string;
  readOnly: true;
}

export interface WorkloadSummary {
  today: number;
  thisWeek: number;
  overdue: number;
  completed: number;
  blocked: number;
  awaitingReview: number;
  completedThisWeek: number;
  dueThisWeek: number;
}

export interface DayBucket {
  date: Date;
  key: string;
  items: ScheduleAssignmentItem[];
  milestones: ScheduleMilestoneItem[];
  conflictCount: number;
  highestPriority: AssignmentPriority | null;
}

export interface AgendaSections {
  overdue: ScheduleAssignmentItem[];
  today: ScheduleAssignmentItem[];
  tomorrow: ScheduleAssignmentItem[];
  upcoming: ScheduleAssignmentItem[];
}

const OVERLOAD_THRESHOLD = 5;

export function canViewTeamSchedule(role: AppRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'release_manager';
}

export function canReschedule(role: AppRole): boolean {
  return canViewTeamSchedule(role);
}

function matchesAssignee(
  a: AssignmentRecord,
  personIds: Set<string>,
  userIds: Set<string>,
): boolean {
  if (personIds.has(a.assigneeId) || userIds.has(a.assigneeId)) return true;
  if (a.assigneeUserId && userIds.has(a.assigneeUserId)) return true;
  return false;
}

/**
 * Load assignments for schedule with server-side scope enforcement.
 * Collaborators always get own assignments only.
 */
export async function loadScheduleAssignments(opts: {
  organizationId: string;
  role: AppRole;
  /** Current auth uid */
  userId: string;
  /** Person ids linked to current user */
  myPersonIds: string[];
  scope: ScheduleScope;
  scopePersonId?: string | null;
  scopeRole?: string | null;
}): Promise<AssignmentRecord[]> {
  const { organizationId, role, userId, myPersonIds, scope } = opts;

  if (!canViewTeamSchedule(role) || scope === 'mine') {
    // Own only — fetch by each person id + filter user id match
    const mine = new Set<string>();
    const results: AssignmentRecord[] = [];
    const personSet = new Set(myPersonIds);
    const userSet = new Set([userId, ...myPersonIds]);

    for (const pid of myPersonIds) {
      const list = await getAssignmentsByAssignee(pid, organizationId);
      for (const a of list) {
        if (!mine.has(a.id)) {
          mine.add(a.id);
          results.push(a);
        }
      }
    }
    // Also scan org list for assigneeId === userId (legacy)
    const all = await listAssignments(organizationId);
    for (const a of all) {
      if (!mine.has(a.id) && matchesAssignee(a, personSet, userSet)) {
        mine.add(a.id);
        results.push(a);
      }
    }
    return results.filter((a) => a.status !== 'archived');
  }

  // Managers
  let list = await listAssignments(organizationId);
  list = list.filter((a) => a.status !== 'archived');

  if (scope === 'person' && opts.scopePersonId) {
    list = list.filter((a) => a.assigneeId === opts.scopePersonId);
  }
  if (scope === 'role' && opts.scopeRole) {
    const roleQ = opts.scopeRole.toLowerCase();
    list = list.filter((a) => a.role.toLowerCase().includes(roleQ));
  }
  return list;
}

export function applyScheduleFilters(
  items: ScheduleAssignmentItem[],
  filters: ScheduleFilters,
  _now = new Date(),
): ScheduleAssignmentItem[] {
  return items.filter((item) => {
    const a = item.assignment;
    if (filters.priority && filters.priority !== 'all' && a.priority !== filters.priority) {
      return false;
    }
    if (filters.assigneeId && a.assigneeId !== filters.assigneeId) return false;
    if (filters.role && !a.role.toLowerCase().includes(filters.role.toLowerCase())) return false;
    if (filters.releaseId && item.context?.releaseId !== filters.releaseId) return false;

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'due_today' && !item.isDueToday) return false;
      if (filters.status === 'overdue' && !item.isOverdue) return false;
      if (filters.status === 'blocked' && a.status !== 'blocked') return false;
      if (filters.status === 'review' && a.status !== 'review') return false;
      if (
        !['due_today', 'overdue', 'blocked', 'review'].includes(filters.status)
        && a.status !== filters.status
      ) {
        return false;
      }
    }

    if (filters.artistQuery) {
      const q = filters.artistQuery.toLowerCase();
      const artist = item.context?.artistName?.toLowerCase() ?? '';
      if (!artist.includes(q)) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = [
        a.title,
        a.role,
        item.assigneeName,
        item.context?.releaseTitle,
        item.context?.artistName,
        item.context?.trackTitle,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

/** Detect conflicts for an item within a same-day peer group. */
export function detectItemConflicts(
  item: ScheduleAssignmentItem,
  sameDayPeers: ScheduleAssignmentItem[],
): string[] {
  const conflicts: string[] = [];
  if (!item.dueDate) return conflicts;

  const sameAssignee = sameDayPeers.filter(
    (p) => p.assignment.id !== item.assignment.id
      && p.assignment.assigneeId === item.assignment.assigneeId
      && !['completed', 'cancelled', 'declined'].includes(p.assignment.status),
  );

  if (sameAssignee.length >= 1) {
    conflicts.push('multiple_due');
  }

  if (item.hasTime && item.dueDate) {
    const itemDue = item.dueDate;
    const sameTime = sameAssignee.filter((p) => {
      if (!p.dueDate || !p.hasTime) return false;
      return p.dueDate.getHours() === itemDue.getHours()
        && p.dueDate.getMinutes() === itemDue.getMinutes();
    });
    if (sameTime.length > 0) conflicts.push('overlap_time');
  }

  const activeSameDay = sameDayPeers.filter(
    (p) => !['completed', 'cancelled', 'declined'].includes(p.assignment.status),
  );
  if (activeSameDay.length > OVERLOAD_THRESHOLD) {
    conflicts.push('day_overload');
  }

  return conflicts;
}

export function applyConflicts(items: ScheduleAssignmentItem[]): ScheduleAssignmentItem[] {
  const byDay = new Map<string, ScheduleAssignmentItem[]>();
  for (const item of items) {
    if (!item.dueDate) continue;
    const k = dayKey(item.dueDate);
    const list = byDay.get(k) ?? [];
    list.push(item);
    byDay.set(k, list);
  }
  return items.map((item) => {
    if (!item.dueDate) return { ...item, conflicts: [] };
    const peers = byDay.get(dayKey(item.dueDate)) ?? [];
    return { ...item, conflicts: detectItemConflicts(item, peers) };
  });
}

export async function enrichAssignments(
  assignments: AssignmentRecord[],
  now = new Date(),
): Promise<ScheduleAssignmentItem[]> {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  const ids: string[] = [];
  for (const a of assignments) {
    if (a.assigneeId) ids.push(a.assigneeId);
    if (a.assignerId) ids.push(a.assignerId);
  }
  const names = await resolvePersonNames(ids);

  // Context in parallel (bounded)
  const contextMap = new Map<string, AssignmentReleaseContext | null>();
  await Promise.all(
    assignments.map(async (a) => {
      const key = `${a.entityType}:${a.entityId}`;
      if (contextMap.has(key)) return;
      try {
        const ctx = await fetchAssignmentReleaseContext(a.entityType, a.entityId);
        contextMap.set(key, ctx);
      } catch {
        contextMap.set(key, null);
      }
    }),
  );

  const items: ScheduleAssignmentItem[] = assignments.map((a) => {
    const due = toDate(a.dueDate);
    const dueDay = due ? startOfDay(due) : null;
    const isOverdue = !!(
      due
      && dueDay
      && dueDay < today
      && !['completed', 'cancelled', 'archived', 'declined'].includes(a.status)
    );
    return {
      assignment: a,
      dueDate: due,
      hasTime: due ? hasTimeComponent(due) : false,
      isOverdue,
      isDueToday: !!(dueDay && isSameDay(dueDay, today)),
      isDueTomorrow: !!(dueDay && isSameDay(dueDay, tomorrow)),
      assigneeName: names.get(a.assigneeId) ?? 'Unknown',
      assignerName: names.get(a.assignerId) ?? 'Unknown',
      context: contextMap.get(`${a.entityType}:${a.entityId}`) ?? null,
      conflicts: [],
    };
  });

  return applyConflicts(items);
}

export function buildWorkload(items: ScheduleAssignmentItem[], now = new Date()): WorkloadSummary {
  const weekEnd = endOfWeek(now, 1);
  const weekStart = startOfWeek(now, 1);

  let todayN = 0;
  let thisWeek = 0;
  let overdue = 0;
  let completed = 0;
  let blocked = 0;
  let awaitingReview = 0;
  let completedThisWeek = 0;
  let dueThisWeek = 0;

  for (const item of items) {
    const a = item.assignment;
    if (a.status === 'blocked') blocked++;
    if (a.status === 'review') awaitingReview++;
    if (a.status === 'completed') {
      completed++;
      const done = toDate(a.completedAt) ?? toDate(a.updatedAt);
      if (done && done >= weekStart && done <= weekEnd) completedThisWeek++;
    }
    if (item.isDueToday && !['completed', 'cancelled', 'declined'].includes(a.status)) todayN++;
    if (item.isOverdue) overdue++;
    if (
      item.dueDate
      && item.dueDate >= weekStart
      && item.dueDate <= weekEnd
      && !['completed', 'cancelled', 'declined'].includes(a.status)
    ) {
      thisWeek++;
      dueThisWeek++;
    }
  }

  return {
    today: todayN,
    thisWeek,
    overdue,
    completed,
    blocked,
    awaitingReview,
    completedThisWeek,
    dueThisWeek,
  };
}

export function buildAgenda(items: ScheduleAssignmentItem[]): AgendaSections {
  const withDue = items.filter((i) => i.dueDate);
  const sortAsc = (a: ScheduleAssignmentItem, b: ScheduleAssignmentItem) =>
    (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0);

  return {
    overdue: withDue.filter((i) => i.isOverdue).sort(sortAsc),
    today: withDue.filter((i) => i.isDueToday && !i.isOverdue).sort(sortAsc),
    tomorrow: withDue.filter((i) => i.isDueTomorrow).sort(sortAsc),
    upcoming: withDue
      .filter((i) => !i.isOverdue && !i.isDueToday && !i.isDueTomorrow)
      .sort(sortAsc),
  };
}

export function itemsForDay(items: ScheduleAssignmentItem[], day: Date): ScheduleAssignmentItem[] {
  return items
    .filter((i) => i.dueDate && isSameDay(i.dueDate, day))
    .sort((a, b) => {
      if (a.hasTime && b.hasTime && a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.hasTime) return -1;
      if (b.hasTime) return 1;
      return priorityRank(b.assignment.priority) - priorityRank(a.assignment.priority);
    });
}

export function buildWeekBuckets(
  items: ScheduleAssignmentItem[],
  weekAnchor: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  milestones: ScheduleMilestoneItem[] = [],
  showWeekends = true,
): DayBucket[] {
  const start = startOfWeek(weekAnchor, weekStartsOn);
  const buckets: DayBucket[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    if (!showWeekends && (date.getDay() === 0 || date.getDay() === 6)) continue;
    const dayItems = itemsForDay(items, date);
    const dayMilestones = milestones.filter((m) => m.dueDate && isSameDay(m.dueDate, date));
    const highest = dayItems.reduce<AssignmentPriority | null>((acc, it) => {
      if (!acc) return it.assignment.priority;
      return priorityRank(it.assignment.priority) > priorityRank(acc)
        ? it.assignment.priority
        : acc;
    }, null);
    buckets.push({
      date,
      key: dayKey(date),
      items: dayItems,
      milestones: dayMilestones,
      conflictCount: dayItems.filter((i) => i.conflicts.length > 0).length,
      highestPriority: highest,
    });
  }
  return buckets;
}

export function buildMonthDayMeta(
  items: ScheduleAssignmentItem[],
  month: Date,
  _weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
): Map<string, { count: number; highestPriority: AssignmentPriority | null; hasConflict: boolean }> {
  const map = new Map<string, { count: number; highestPriority: AssignmentPriority | null; hasConflict: boolean }>();
  const mStart = startOfMonth(month);
  const mEnd = endOfMonth(month);
  for (const item of items) {
    if (!item.dueDate || item.dueDate < mStart || item.dueDate > mEnd) continue;
    const k = dayKey(item.dueDate);
    const cur = map.get(k) ?? { count: 0, highestPriority: null, hasConflict: false };
    cur.count++;
    if (
      !cur.highestPriority
      || priorityRank(item.assignment.priority) > priorityRank(cur.highestPriority)
    ) {
      cur.highestPriority = item.assignment.priority;
    }
    if (item.conflicts.length > 0) cur.hasConflict = true;
    map.set(k, cur);
  }
  return map;
}

export async function loadScheduleMilestones(
  organizationId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<ScheduleMilestoneItem[]> {
  try {
    const milestones = await fetchMilestonesByOrg(organizationId);
    return milestones
      .map((m) => ({
        milestone: m,
        dueDate: toDate(m.dueDate),
        readOnly: true as const,
      }))
      .filter((m) => m.dueDate && m.dueDate >= rangeStart && m.dueDate <= rangeEnd);
  } catch {
    return [];
  }
}

export async function resolveMyPersonIds(
  organizationId: string,
  userId: string,
): Promise<string[]> {
  const people = await getPeopleByOrg(organizationId);
  return people.filter((p) => p.userId === userId).map((p) => p.id);
}

export async function listOrgPeople(organizationId: string): Promise<PersonRecord[]> {
  return getPeopleByOrg(organizationId);
}

export { toDate, dayKey, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, startOfDay };
