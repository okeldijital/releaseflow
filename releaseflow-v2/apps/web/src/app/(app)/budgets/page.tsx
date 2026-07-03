'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getBudgetSummary } from '@/lib/budget-service';
import { getUserUtilization } from '@/lib/resource-service';
import { useAuth } from '@/contexts/auth-context';
import { Card, StatusBadge, ProgressBar, EmptyState, LoadingState } from '@releaseflow/ui';

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
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <p className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-8">Budgets</p>

      {myUtil ? (
        <Card padding="sm" className="mb-8">
          <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50 mb-3">My Capacity</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-500">{myUtil.assignmentCount} assignments</span>
            <span className="text-text-500">Capacity: {myUtil.totalCapacity}%</span>
            <span className="text-text-500">Utilization: {myUtil.totalUtilization}%</span>
            <StatusBadge status={myUtil.overloaded ? 'Overloaded' : myUtil.available ? 'Available' : 'Full'} />
          </div>
        </Card>
      ) : null}

      {!activeOrgId ? (
        <EmptyState title="Select an organization first." />
      ) : releases.length === 0 ? (
        <EmptyState title="No releases with budgets yet." />
      ) : (
        <div className="space-y-4">
          {releases.map((r) => (
            <Link key={r.id} href={`/releases/${r.id}`} className="block">
              <Card padding="md" hover clickable>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-900 dark:text-surface-50">{r.title}</h3>
                  {r.summary.budgetId ? (
                    <StatusBadge status={r.summary.status.replace(/_/g, ' ')} />
                  ) : (
                    <span className="text-xs text-text-400">No budget set</span>
                  )}
                </div>

                {r.summary.budgetId ? (
                  <>
                    <ProgressBar
                      value={r.summary.planned > 0 ? Math.min(100, (r.summary.actual / r.summary.planned) * 100) : 0}
                      size="sm"
                      className="mb-2"
                    />
                    <div className="flex items-center justify-between text-xs text-text-500">
                      <span>Spent: ${r.summary.actual.toLocaleString()} / ${r.summary.planned.toLocaleString()}</span>
                      <span>Remaining: ${r.summary.remaining.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-text-400 mt-2">
                      <span>{r.summary.costItems.total} items</span>
                      <span>{r.summary.costItems.planned} planned</span>
                      <span>{r.summary.costItems.incurred} incurred</span>
                      <span>{r.summary.costItems.paid} paid</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-text-400">No budget initialized for this release.</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
