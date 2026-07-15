'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { fetchAssignmentsByAssignee, fetchAssignmentStats } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { EmptyState, LoadingState, Badge } from '@releaseflow/ui';

const statusColors: Record<string, string> = {
  draft: 'bg-surface-800 text-text-500',
  assigned: 'bg-primary-500/10 text-primary-400',
  accepted: 'bg-info-500/10 text-info-400',
  in_progress: 'bg-warning-500/10 text-warning-600',
  review: 'bg-accent-500/10 text-accent-400',
  completed: 'bg-success-500/10 text-success-600',
  declined: 'bg-danger-500/10 text-danger-600',
  cancelled: 'bg-surface-800 text-text-500',
  archived: 'bg-surface-800 text-text-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-text-500',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

function formatDate(d: unknown): string {
  if (!d) return '';
  if (d && typeof d === 'object' && 'toDate' in d) return (d as { toDate: () => Date }).toDate().toLocaleDateString();
  return String(d);
}

function isOverdue(dueDate: unknown): boolean {
  if (!dueDate) return false;
  let date: Date;
  if (dueDate && typeof dueDate === 'object' && 'toDate' in dueDate) {
    date = (dueDate as { toDate: () => Date }).toDate();
  } else {
    date = new Date(String(dueDate));
  }
  return date.getTime() < Date.now();
}

export default function MyWorkPage() {
  const { activeOrgId } = useOrgStore();
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; overdue: number; completed: number; completionRate: number; estimatedHours: number; actualHours: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    if (!activeOrgId) { setLoading(false); return; }
    const stored = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const id = stored ?? '';
    setUserId(id);
    if (!id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetchAssignmentsByAssignee(id, activeOrgId),
      fetchAssignmentStats(id, activeOrgId),
    ]).then(([data, s]) => {
      setAssignments(data);
      setStats(s);
    }).catch(() => {
      setAssignments([]);
    }).finally(() => setLoading(false));
  }, [activeOrgId]);

  const activeAssignments = assignments.filter((a) => !['completed', 'archived', 'cancelled', 'declined'].includes(a.status));
  const dueToday = activeAssignments.filter((a) => {
    if (!a.dueDate) return false;
    const d = (a.dueDate as { toDate?: () => Date }).toDate ? (a.dueDate as { toDate: () => Date }).toDate() : new Date(String(a.dueDate));
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const dueThisWeek = activeAssignments.filter((a) => {
    if (!a.dueDate) return false;
    const d = (a.dueDate as { toDate?: () => Date }).toDate ? (a.dueDate as { toDate: () => Date }).toDate() : new Date(String(a.dueDate));
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d > now && d <= weekFromNow;
  });
  const overdue = activeAssignments.filter((a) => isOverdue(a.dueDate));
  const awaitingReview = assignments.filter((a) => a.status === 'review');
  const completedRecent = assignments
    .filter((a) => a.status === 'completed')
    .sort((a, b) => {
      const da = (a.completedAt as { toDate?: () => Date })?.toDate?.().getTime() ?? 0;
      const db = (b.completedAt as { toDate?: () => Date })?.toDate?.().getTime() ?? 0;
      return db - da;
    })
    .slice(0, 5);

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-5xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">My Work</p>
          <p className="mt-1 text-sm text-text-400">Your task assignments and workload.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view your work." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">My Work</p>
        <p className="mt-1 text-sm text-text-400">Your task assignments and workload.</p>
      </div>

      {loading ? <LoadingState /> : (
        <>
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl border border-surface-700/60 bg-surface-900/50 p-4">
                <p className="text-2xl font-semibold text-surface-100">{stats.active}</p>
                <p className="text-xs text-text-400 mt-1">Active</p>
              </div>
              <div className="rounded-xl border border-surface-700/60 bg-surface-900/50 p-4">
                <p className="text-2xl font-semibold text-warning-600">{stats.overdue}</p>
                <p className="text-xs text-text-400 mt-1">Overdue</p>
              </div>
              <div className="rounded-xl border border-surface-700/60 bg-surface-900/50 p-4">
                <p className="text-2xl font-semibold text-success-600">{stats.completionRate}%</p>
                <p className="text-xs text-text-400 mt-1">Completion Rate</p>
              </div>
              <div className="rounded-xl border border-surface-700/60 bg-surface-900/50 p-4">
                <p className="text-2xl font-semibold text-surface-100">{stats.estimatedHours}h</p>
                <p className="text-xs text-text-400 mt-1">Est. Hours</p>
              </div>
            </div>
          )}

          {!userId && (
            <div className="rounded-xl border border-warning-500/30 bg-warning-500/5 p-4 mb-6">
              <p className="text-sm text-warning-600">Set your user ID to see your assignments.</p>
            </div>
          )}

          <div className="space-y-8">
            <Section title="Due Today" items={dueToday} statusColors={statusColors} priorityColors={priorityColors} formatDate={formatDate} />
            <Section title="Due This Week" items={dueThisWeek} statusColors={statusColors} priorityColors={priorityColors} formatDate={formatDate} />
            <Section title="Overdue" items={overdue} statusColors={statusColors} priorityColors={priorityColors} formatDate={formatDate} />
            <Section title="Awaiting Review" items={awaitingReview} statusColors={statusColors} priorityColors={priorityColors} formatDate={formatDate} />
            <Section title="All Active" items={activeAssignments} statusColors={statusColors} priorityColors={priorityColors} formatDate={formatDate} />
            {completedRecent.length > 0 && (
              <Section title="Recently Completed" items={completedRecent} statusColors={statusColors} priorityColors={priorityColors} formatDate={formatDate} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Section({
  title, items, statusColors: sc, priorityColors: pc, formatDate: fd,
}: {
  title: string;
  items: AssignmentRecord[];
  statusColors: Record<string, string>;
  priorityColors: Record<string, string>;
  formatDate: (d: unknown) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">{title}</h2>
        <span className="text-xs text-text-500 bg-surface-800 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.slice(0, 10).map((a) => (
          <Link key={a.id} href={`/assignments/${a.id}`} className="flex items-center gap-4 p-3 rounded-lg bg-surface-800/50 border border-surface-700/40 hover:border-primary-500/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-100 truncate">{a.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge label={a.status.replace(/_/g, ' ')} color={sc[a.status] ?? ''} />
                <Badge label={a.priority} color={pc[a.priority] ?? ''} />
                <span className="text-xs text-text-500">{a.entityType} &middot; {a.entityId}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {a.dueDate ? <p className="text-xs text-text-500">{fd(a.dueDate)}</p> : null}
              {a.estimatedHours ? <p className="text-xs text-text-500">{a.estimatedHours}h</p> : null}
            </div>
          </Link>
        ))}
        {items.length > 10 && (
          <p className="text-xs text-text-500 text-center py-2">+{items.length - 10} more</p>
        )}
      </div>
    </div>
  );
}
