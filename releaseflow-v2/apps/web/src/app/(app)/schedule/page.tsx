'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import {
  Button, Input, Select, Tabs, LoadingState, ConfirmationDialog,
} from '@releaseflow/ui';
import {
  loadScheduleAssignments,
  enrichAssignments,
  applyScheduleFilters,
  buildWorkload,
  buildAgenda,
  itemsForDay,
  buildWeekBuckets,
  buildMonthDayMeta,
  loadScheduleMilestones,
  resolveMyPersonIds,
  listOrgPeople,
  canViewTeamSchedule,
  canReschedule,
  type ScheduleScope,
  type ScheduleFilters,
  type ScheduleAssignmentItem,
  type ScheduleMilestoneItem,
  type WorkloadSummary,
} from '@/lib/schedule-service';
import {
  getCalendarPreferences,
  updateCalendarPreferences,
  type CalendarViewMode,
  type CalendarPreferencesRecord,
} from '@/lib/calendar-preferences-repository';
import { rescheduleAssignment } from '@/lib/assignment-service';
import {
  addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay,
  formatMonthLabel, formatDayLabel,
} from '@/lib/schedule-date-utils';
import { ScheduleWorkload } from '@/components/schedule/schedule-workload';
import {
  AgendaView, DayView, WeekView, MonthView,
} from '@/components/schedule/schedule-views';
import { toast } from '@/stores/toast-store';
import type { PersonRecord } from '@/lib/people-repository';
import { AuthorizationService } from '@/lib/auth/authorization-service';

/** MUX-001: mobile prioritizes agenda; week/month optional. */
const VIEW_TABS = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

const MOBILE_VIEW_TABS = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
];

function defaultViewForViewport(pref?: CalendarViewMode): CalendarViewMode {
  // Phone users think in lists — always start on agenda regardless of desktop pref.
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
    return 'agenda';
  }
  return pref ?? 'week';
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { role } = useRoleStore();

  const isManager = canViewTeamSchedule(role);
  const canDrag = canReschedule(role);
  const isCollab = AuthorizationService.isCollaboratorWorkspace();

  // Collaborators default personal agenda; managers may use week on desktop.
  const [view, setView] = useState<CalendarViewMode>('agenda');
  const [prefs, setPrefs] = useState<CalendarPreferencesRecord | null>(null);
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScheduleAssignmentItem[]>([]);
  const [milestones, setMilestones] = useState<ScheduleMilestoneItem[]>([]);
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [scope, setScope] = useState<ScheduleScope>('mine');
  const [scopePersonId, setScopePersonId] = useState<string>('');
  const [scopeRole, setScopeRole] = useState('');
  const [filters, setFilters] = useState<ScheduleFilters>({ status: 'all', priority: 'all' });
  const [search, setSearch] = useState('');

  const [pendingDrop, setPendingDrop] = useState<{ assignmentId: string; day: Date } | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Preferences — phone always agenda-first (MUX-001)
  useEffect(() => {
    if (!user?.uid) return;
    void getCalendarPreferences(user.uid).then((p) => {
      setPrefs(p);
      if (isCollab) {
        setView(defaultViewForViewport('agenda'));
      } else {
        setView(defaultViewForViewport(p.defaultView));
      }
    });
  }, [user?.uid, isCollab]);

  const weekStartsOn = prefs?.weekStartsOn ?? 1;
  const showWeekends = prefs?.showWeekends ?? true;
  const compactMode = prefs?.compactMode ?? false;

  const load = useCallback(async () => {
    if (!activeOrgId || !user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const myPersonIds = await resolveMyPersonIds(activeOrgId, user.uid);
      const assignments = await loadScheduleAssignments({
        organizationId: activeOrgId,
        role,
        userId: user.uid,
        myPersonIds,
        scope: isManager ? scope : 'mine',
        scopePersonId: scopePersonId || null,
        scopeRole: scopeRole || null,
      });
      const enriched = await enrichAssignments(assignments);
      setItems(enriched);

      const rangeStart = startOfMonth(addDays(anchor, -7));
      const rangeEnd = endOfMonth(addDays(anchor, 40));
      const ms = await loadScheduleMilestones(activeOrgId, rangeStart, rangeEnd);
      setMilestones(ms);

      if (isManager) {
        const ppl = await listOrgPeople(activeOrgId);
        setPeople(ppl.filter((p) => p.status === 'active'));
      }

      // CE-008 — cache schedule snapshot for offline read
      try {
        const { cacheScheduleSnapshot } = await import('@/lib/pwa/offline-data-cache');
        await cacheScheduleSnapshot({
          userId: user.uid,
          organizationId: activeOrgId,
          snapshot: {
            items: enriched,
            milestones: ms,
            scope,
          },
        });
      } catch { /* ignore */ }
    } catch (e) {
      // CE-008 offline schedule fallback
      try {
        const { getCachedSchedule } = await import('@/lib/pwa/offline-data-cache');
        const cached = await getCachedSchedule(user!.uid, activeOrgId!);
        if (cached?.snapshot) {
          const snap = cached.snapshot as {
            items?: ScheduleAssignmentItem[];
            milestones?: ScheduleMilestoneItem[];
          };
          setItems(snap.items ?? []);
          setMilestones(snap.milestones ?? []);
          toast.error('Showing cached schedule (offline)');
          setLoading(false);
          return;
        }
      } catch { /* ignore */ }
      toast.error((e as Error).message || 'Failed to load schedule');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, user?.uid, role, scope, scopePersonId, scopeRole, isManager, anchor]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(
    () => applyScheduleFilters(items, { ...filters, search }),
    [items, filters, search],
  );

  const workload: WorkloadSummary = useMemo(() => buildWorkload(filtered), [filtered]);
  const agenda = useMemo(() => buildAgenda(filtered), [filtered]);
  const weekBuckets = useMemo(
    () => buildWeekBuckets(filtered, anchor, weekStartsOn, milestones, showWeekends),
    [filtered, anchor, weekStartsOn, milestones, showWeekends],
  );
  const monthMeta = useMemo(
    () => buildMonthDayMeta(filtered, anchor, weekStartsOn),
    [filtered, anchor, weekStartsOn],
  );
  const dayItems = useMemo(() => itemsForDay(filtered, anchor), [filtered, anchor]);
  const dayMilestones = useMemo(
    () => milestones.filter((m) => m.dueDate && startOfDay(m.dueDate).getTime() === startOfDay(anchor).getTime()),
    [milestones, anchor],
  );

  const navigate = (dir: -1 | 1) => {
    if (view === 'day' || view === 'agenda') setAnchor((d) => addDays(d, dir));
    else if (view === 'week') setAnchor((d) => addDays(d, dir * 7));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const rangeLabel = useMemo(() => {
    if (view === 'month') return formatMonthLabel(anchor);
    if (view === 'week') {
      const s = startOfWeek(anchor, weekStartsOn);
      const e = endOfWeek(anchor, weekStartsOn);
      return `${formatDayLabel(s)} – ${formatDayLabel(e)}`;
    }
    return formatDayLabel(anchor);
  }, [view, anchor, weekStartsOn]);

  const handleDropOnDay = (assignmentId: string, day: Date) => {
    if (!canDrag) return;
    setPendingDrop({ assignmentId, day });
  };

  const confirmReschedule = async () => {
    if (!pendingDrop || !user?.uid) return;
    setRescheduleLoading(true);
    try {
      // Preserve time-of-day if the assignment already had one
      const existing = items.find((i) => i.assignment.id === pendingDrop.assignmentId);
      const next = startOfDay(pendingDrop.day);
      if (existing?.hasTime && existing.dueDate) {
        next.setHours(existing.dueDate.getHours(), existing.dueDate.getMinutes(), 0, 0);
      } else {
        next.setHours(12, 0, 0, 0); // noon default for all-day → still date-only feel
      }
      await rescheduleAssignment(
        pendingDrop.assignmentId,
        next,
        user.uid,
        role,
        { actorName: user.displayName ?? user.email ?? undefined },
      );
      toast.success('Assignment rescheduled');
      setPendingDrop(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message || 'Failed to reschedule');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const saveViewPref = async (v: CalendarViewMode) => {
    setView(v);
    if (!user?.uid) return;
    try {
      const next = await updateCalendarPreferences(user.uid, { defaultView: v });
      setPrefs(next);
    } catch { /* ignore */ }
  };

  const pendingTitle = pendingDrop
    ? items.find((i) => i.assignment.id === pendingDrop.assignmentId)?.assignment.title
    : '';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">Schedule</h1>
          <p className="text-sm text-text-400 mt-0.5">What work needs to happen, when, and by whom.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAnchor(startOfDay(new Date()))}>Today</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(-1)} aria-label="Previous">‹</Button>
          <span className="text-sm text-surface-100 min-w-[140px] text-center">{rangeLabel}</span>
          <Button size="sm" variant="ghost" onClick={() => navigate(1)} aria-label="Next">›</Button>
        </div>
      </div>

      <div className="mb-4">
        <ScheduleWorkload summary={workload} teamMode={isManager && scope === 'team'} />
      </div>

      <div className="mb-4 sticky top-0 z-10 bg-layer-1/95 backdrop-blur py-2 -mx-1 px-1 border-b border-surface-700/40">
        {/* MUX-001: phones get agenda-first tabs without month clutter */}
        <div className="md:hidden">
          <Tabs
            tabs={MOBILE_VIEW_TABS}
            activeTab={view === 'month' ? 'agenda' : view}
            onChange={(id) => void saveViewPref(id as CalendarViewMode)}
          />
        </div>
        <div className="hidden md:block">
          <Tabs
            tabs={VIEW_TABS}
            activeTab={view}
            onChange={(id) => void saveViewPref(id as CalendarViewMode)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[48px] md:min-h-0"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.status ?? 'all'}
            onChange={(v) => setFilters((f) => ({ ...f, status: v as ScheduleFilters['status'] }))}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'due_today', label: 'Due today' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'review', label: 'In review' },
              { value: 'in_progress', label: 'In progress' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
          <Select
            value={filters.priority ?? 'all'}
            onChange={(v) => setFilters((f) => ({ ...f, priority: v as ScheduleFilters['priority'] }))}
            options={[
              { value: 'all', label: 'All priorities' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
          {isManager ? (
            <>
              <Select
                value={scope}
                onChange={(v) => setScope(v as ScheduleScope)}
                options={[
                  { value: 'mine', label: 'My schedule' },
                  { value: 'team', label: 'Entire team' },
                  { value: 'person', label: 'Collaborator' },
                  { value: 'role', label: 'By role' },
                ]}
              />
              {scope === 'person' ? (
                <Select
                  value={scopePersonId}
                  onChange={setScopePersonId}
                  options={[
                    { value: '', label: 'Select person' },
                    ...people.map((p) => ({ value: p.id, label: p.displayName })),
                  ]}
                />
              ) : null}
              {scope === 'role' ? (
                <Input
                  placeholder="Professional role"
                  value={scopeRole}
                  onChange={(e) => setScopeRole(e.target.value)}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingState /></div>
      ) : (
        <div className={compactMode ? 'text-sm' : ''}>
          {view === 'agenda' && <AgendaView sections={agenda} />}
          {view === 'day' && (
            <DayView day={anchor} items={dayItems} milestones={dayMilestones} />
          )}
          {view === 'week' && (
            <WeekView
              buckets={weekBuckets}
              canDrag={canDrag}
              onDropOnDay={handleDropOnDay}
              compact={compactMode}
            />
          )}
          {view === 'month' && (
            <MonthView
              month={anchor}
              weekStartsOn={weekStartsOn}
              dayMeta={monthMeta}
              showWeekends={showWeekends}
              onSelectDay={(day) => {
                setAnchor(startOfDay(day));
                setView('day');
              }}
            />
          )}
        </div>
      )}

      {/* Preferences (compact) */}
      {prefs && user?.uid ? (
        <div className="mt-8 pt-4 border-t border-surface-700/40 flex flex-wrap gap-4 text-xs text-text-500">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.showWeekends}
              onChange={(e) => {
                void updateCalendarPreferences(user.uid, { showWeekends: e.target.checked }).then(setPrefs);
              }}
            />
            Show weekends
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.compactMode}
              onChange={(e) => {
                void updateCalendarPreferences(user.uid, { compactMode: e.target.checked }).then(setPrefs);
              }}
            />
            Compact mode
          </label>
          <label className="flex items-center gap-2">
            Week starts
            <select
              className="rounded border border-surface-700 bg-layer-2 px-2 py-1 text-surface-100"
              value={prefs.weekStartsOn}
              onChange={(e) => {
                void updateCalendarPreferences(user.uid, {
                  weekStartsOn: Number(e.target.value) as 0 | 1,
                }).then(setPrefs);
              }}
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
            </select>
          </label>
        </div>
      ) : null}

      <ConfirmationDialog
        open={!!pendingDrop}
        onClose={() => setPendingDrop(null)}
        onConfirm={() => void confirmReschedule()}
        title="Reschedule assignment?"
        message={
          pendingDrop
            ? `Move “${pendingTitle}” to ${pendingDrop.day.toLocaleDateString()}? This updates the due date and notifies watchers.`
            : ''
        }
        confirmLabel="Reschedule"
        loading={rescheduleLoading}
      />
    </div>
  );
}
