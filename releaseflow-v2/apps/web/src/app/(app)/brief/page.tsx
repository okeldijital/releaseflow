'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { getActiveAlerts, generateOrgAlerts } from '@/lib/alert-engine';
import { generateRecommendations } from '@/lib/recommendation-engine';
import { fmtDate } from '@/lib/utils';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { OperationalAlert, Task, Stage, ReleaseBudget } from '../types';
import type { Recommendation } from '@/lib/recommendation-engine';

const priorityStyles: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as Record<string, unknown>;
    if (typeof obj.toDate === 'function') return (obj as { toDate: () => Date }).toDate();
    if (typeof obj.seconds === 'number') return new Date((obj as { seconds: number }).seconds * 1000);
  }
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export default function BriefPage() {
  const { activeOrgId } = useOrgStore();
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [upcoming, setUpcoming] = useState<{ tasks: Task[] }>({ tasks: [] });
  const [blocked, setBlocked] = useState<Stage[]>([]);
  const [budgetWarnings, setBudgetWarnings] = useState<ReleaseBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeOrgId) { setLoading(false); return; }
    const orgId = activeOrgId;
    async function load() {
      const db = getDb();
      if (!db) return;

      await generateOrgAlerts(orgId);
      const [a, r] = await Promise.all([
        getActiveAlerts(orgId),
        generateRecommendations(orgId),
      ]);
      setAlerts(a);
      setRecs(r);

      const snap = await getDocs(
        query(collection(db, 'releases'), where('organizationId', '==', orgId)),
      );
      const ids = snap.docs.map((d) => d.id);

      if (ids.length > 0) {
        const now = new Date();
        const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const taskSnap = await getDocs(
          query(collection(db, 'tasks'), where('releaseId', 'in', ids), where('status', '!=', 'done'), orderBy('dueDate', 'asc')),
        );
        const upcomingTasks = taskSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Task)
          .filter((t) => {
            const dd = toDate(t.dueDate);
            return dd && dd > now && dd < future;
          })
          .slice(0, 10);
        setUpcoming({ tasks: upcomingTasks });

        const stageSnap = await getDocs(
          query(collection(db, 'stages'), where('status', '==', 'blocked')),
        );
        setBlocked(stageSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stage));

        const budgetSnap = await getDocs(
          query(collection(db, 'release_budgets'), where('releaseId', 'in', ids), where('status', 'in', ['at_risk', 'over_budget']), orderBy('updatedAt', 'desc'), limit(10)),
        );
        setBudgetWarnings(budgetSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseBudget));
      }
      setLoading(false);
    }
    load();
  }, [activeOrgId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }

  const highAlerts = alerts.filter((a) => a.priority === 'high');
  const medAlerts = alerts.filter((a) => a.priority === 'medium');
  const lowAlerts = alerts.filter((a) => a.priority === 'low');

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Daily Brief</h1>
      <p className="text-sm text-zinc-500 mb-8">Operational overview for today</p>

      {!activeOrgId ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700"><p className="text-zinc-500">Select an organization first.</p></div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Today's Risks ({alerts.length})</h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-zinc-400">No active risks.</p>
            ) : (
              <div className="space-y-2">
                {highAlerts.map((a) => (
                  <div key={a.id} className={`rounded-lg border px-3 py-2 text-sm ${priorityStyles.high}`}>
                    <span className="text-xs font-medium uppercase mr-2">HIGH</span>
                    {a.message}
                    <Link href={`/releases/${a.releaseId}`} className="text-xs underline ml-2">View</Link>
                  </div>
                ))}
                {medAlerts.map((a) => (
                  <div key={a.id} className={`rounded-lg border px-3 py-2 text-sm ${priorityStyles.medium}`}>
                    <span className="text-xs font-medium uppercase mr-2">MED</span>
                    {a.message}
                    <Link href={`/releases/${a.releaseId}`} className="text-xs underline ml-2">View</Link>
                  </div>
                ))}
                {lowAlerts.map((a) => (
                  <div key={a.id} className={`rounded-lg border px-3 py-2 text-sm ${priorityStyles.low}`}>
                    <span className="text-xs font-medium uppercase mr-2">LOW</span>
                    {a.message}
                    <Link href={`/releases/${a.releaseId}`} className="text-xs underline ml-2">View</Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Upcoming Deadlines ({upcoming.tasks.length})</h2>
            {upcoming.tasks.length === 0 ? (
              <p className="text-sm text-zinc-400">No upcoming deadlines this week.</p>
            ) : (
              <div className="space-y-1.5">
                {upcoming.tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <Link href={`/releases/${t.releaseId}`} className="text-zinc-700 dark:text-zinc-300 hover:underline truncate">{t.title}</Link>
                    <span className="text-xs text-zinc-400 shrink-0 ml-2">{fmtDate(t.dueDate)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Blocked Items ({blocked.length})</h2>
            {blocked.length === 0 ? (
              <p className="text-sm text-zinc-400">No blocked items.</p>
            ) : (
              <div className="space-y-1.5">
                {blocked.map((s) => (
                  <div key={s.id} className="text-sm text-red-600 dark:text-red-400">Blocked: {s.name}</div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Budget Warnings ({budgetWarnings.length})</h2>
            {budgetWarnings.length === 0 ? (
              <p className="text-sm text-zinc-400">No budget warnings.</p>
            ) : (
              <div className="space-y-2">
                {budgetWarnings.map((b) => (
                  <div key={b.id} className={`rounded-lg border px-3 py-2 text-sm ${b.status === 'over_budget' ? priorityStyles.high : priorityStyles.medium}`}>
                    <span className="text-xs font-medium uppercase mr-2">{b.status.replace(/_/g, ' ')}</span>
                    ${b.actualCost} / ${b.plannedBudget}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Recommendations ({recs.length})</h2>
            {recs.length === 0 ? (
              <p className="text-sm text-zinc-400">No recommendations.</p>
            ) : (
              <div className="space-y-1.5">
                {recs.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs rounded-full px-1.5 py-0.5 shrink-0 ${priorityStyles[rec.priority]}`}>{rec.priority}</span>
                      <Link href={`/releases/${rec.releaseId}`} className="text-zinc-700 dark:text-zinc-300 hover:underline truncate">{rec.message}</Link>
                    </div>
                    <span className="text-xs text-zinc-400 shrink-0 ml-2">{rec.action}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
