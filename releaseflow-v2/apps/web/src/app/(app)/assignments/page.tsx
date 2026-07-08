'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAssignments } from '@/hooks/useAssignment';
import { Button, EmptyState, LoadingState, Input, Badge } from '@releaseflow/ui';

const KANBAN_COLUMNS = [
  { id: 'assigned', label: 'Assigned' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'completed', label: 'Completed' },
] as const;

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

export default function AssignmentsPage() {
  const { activeOrgId } = useOrgStore();
  const { assignments, loading } = useAssignments();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filtered = assignments.filter((a) => {
    if (a.status === 'archived' || a.status === 'cancelled' || a.status === 'declined') return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
    return true;
  });

  const grouped = KANBAN_COLUMNS.map((col) => ({
    ...col,
    items: filtered.filter((a) => a.status === col.id),
  }));

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-6xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Assignments</p>
          <p className="mt-1 text-sm text-text-400">Kanban board for task assignments.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view assignments." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Assignments</p>
          <p className="mt-1 text-sm text-text-400">Kanban board for task assignments.</p>
        </div>
        <Link href="/assignments/new">
          <Button>New Assignment</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-64">
          <Input placeholder="Search assignments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-surface-700/60 bg-surface-900 text-surface-100"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {grouped.map((col) => (
            <div key={col.id} className="rounded-xl border border-surface-700/60 bg-surface-900/50 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-surface-100">{col.label}</h3>
                <span className="text-xs text-text-500 bg-surface-800 px-2 py-0.5 rounded-full">{col.items.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {col.items.length === 0 ? (
                  <p className="text-xs text-text-500 text-center py-4">No items</p>
                ) : (
                  col.items.map((a) => (
                    <Link key={a.id} href={`/assignments/${a.id}`} className="block p-3 rounded-lg bg-surface-800 border border-surface-700/40 hover:border-primary-500/30 transition-colors">
                      <p className="text-sm font-medium text-surface-100 truncate mb-1">{a.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge label={a.priority} color={priorityColors[a.priority] ?? ''} />
                        <span className="text-xs text-text-500 truncate">{a.assigneeId}</span>
                      </div>
                      {a.dueDate ? <p className="text-xs text-text-500 mt-1">Due: {formatDate(a.dueDate)}</p> : null}
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
