'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAssignmentsByEntity } from '@/lib/assignment-repository';
import type { AssignmentRecord } from '@/lib/assignment-repository';
import { Button, EmptyState, LoadingState, Badge, StatusBadge } from '@releaseflow/ui';

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

interface AssignmentsSectionProps {
  entityType: 'release' | 'track';
  entityId: string;
}

export function AssignmentsSection({ entityType, entityId }: AssignmentsSectionProps) {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssignmentsByEntity(entityType, entityId);
      setAssignments(data.filter((a) => !['archived', 'cancelled', 'declined'].includes(a.status)));
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingState />;
  if (assignments.length === 0) return <EmptyState title="No assignments" description="No assignments for this item yet." />;

  return (
    <div className="space-y-2">
      {assignments.map((a) => (
        <Link key={a.id} href={`/assignments/${a.id}`} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
            <p className="text-xs text-text-500">{a.role} &middot; Due: {formatDate(a.dueDate)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Badge label={a.priority} color={priorityColors[a.priority] ?? ''} />
            <StatusBadge status={a.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
