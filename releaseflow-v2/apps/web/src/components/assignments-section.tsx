'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchAssignmentsByEntity } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { EmptyState, LoadingState, Badge, StatusBadge } from '@releaseflow/ui';

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-content-secondary',
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
  entityType: 'release' | 'track' | 'artist';
  entityId: string;
}

export function AssignmentsSection({ entityType, entityId }: AssignmentsSectionProps) {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssignmentsByEntity(entityType, entityId);
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
            <p className="text-xs text-content-label">{a.role} &middot; Due: {formatDate(a.dueDate)}</p>
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
