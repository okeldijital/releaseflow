'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getBudgetSummary } from '@/lib/budget-service';
import { getUserUtilization } from '@/lib/resource-service';
import { useAuth } from '@/contexts/auth-context';

const healthStyles: Record<string, string> = {
  on_budget: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  at_risk: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  over_budget: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function BudgetsPage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [releases, setReleases] = useState<{ id: string; title: string; summary: Awaited<ReturnType<typeof getBudgetSummary>> }[]>([]);
  const [myUtil, setMyUtil] = useState<Awaited<ReturnType<typeof getUserUtilization>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const db = getDb();
      if (!db || !activeOrgId) { setLoading(false); return; }
      const snap = await getDocs(
        query(collection(db, 'releases'), where('organizationId', '==', activeOrgId), orderBy('createdAt', 'desc')),
      );
      const data = await Promise.all(
        snap.docs.map(async (d) => ({
          id: d.id,
          title: d.data().title as string,
          summary: await getBudgetSummary(d.id),
        })),
      );
      setReleases(data);
      if (user) setMyUtil(await getUserUtilization(user.uid));
      setLoading(false);
    }
    load();
  }, [activeOrgId, user]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">Budgets</h1>

      {myUtil ? (
        <div className="mb-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">My Capacity</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-500">{myUtil.assignmentCount} assignments</span>
            <span className="text-zinc-500">Capacity: {myUtil.totalCapacity}%</span>
            <span className="text-zinc-500">Utilization: {myUtil.totalUtilization}%</span>
            <span className={`text-xs rounded-full px-2 py-0.5 ${myUtil.overloaded ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : myUtil.available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
              {myUtil.overloaded ? 'Overloaded' : myUtil.available ? 'Available' : 'Full'}
            </span>
          </div>
        </div>
      ) : null}

      {!activeOrgId ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700"><p className="text-zinc-500">Select an organization first.</p></div>
      ) : releases.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700"><p className="text-zinc-500">No releases with budgets yet.</p></div>
      ) : (
        <div className="space-y-4">
          {releases.map((r) => (
            <Link key={r.id} href={`/releases/${r.id}`} className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{r.title}</h3>
                {r.summary.budgetId ? (
                  <span className={`text-xs capitalize rounded-full px-2.5 py-0.5 ${healthStyles[r.summary.status] ?? ''}`}>{r.summary.status.replace(/_/g, ' ')}</span>
                ) : (
                  <span className="text-xs text-zinc-400">No budget set</span>
                )}
              </div>

              {r.summary.budgetId ? (
                <>
                  <div className="mb-2 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${r.summary.status === 'over_budget' ? 'bg-red-500' : r.summary.status === 'at_risk' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${r.summary.planned > 0 ? Math.min(100, (r.summary.actual / r.summary.planned) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Spent: ${r.summary.actual.toLocaleString()} / ${r.summary.planned.toLocaleString()}</span>
                    <span>Remaining: ${r.summary.remaining.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-zinc-400 mt-2">
                    <span>{r.summary.costItems.total} items</span>
                    <span>{r.summary.costItems.planned} planned</span>
                    <span>{r.summary.costItems.incurred} incurred</span>
                    <span>{r.summary.costItems.paid} paid</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-zinc-400">No budget initialized for this release.</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
