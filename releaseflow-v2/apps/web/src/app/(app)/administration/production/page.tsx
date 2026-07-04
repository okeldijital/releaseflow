'use client';

import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { getTracksByOrg } from '@/lib/track-repository';
import { getSpecificationsByTrack, type SpecRecord } from '@/lib/specification-repository';
import { getDeliverablesByTrack, type ProductionDeliverableRecord } from '@/lib/deliverable-management-repository';
import { getPendingSubmissions, type SubmissionRecord } from '@/lib/submission-repository';
import { getPendingReviews, type ReviewRecord } from '@/lib/review-repository';
import { LoadingState, EmptyState } from '@releaseflow/ui';

function specStatusColor(status: string): string {
  switch (status) {
    case 'draft': return 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
    case 'active': return 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-400';
    case 'submitted': return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400';
    case 'approved': return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400';
    case 'changes_requested': return 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400';
    case 'completed': return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300';
    default: return 'bg-surface-100 text-surface-700';
  }
}

function statusBadgeStyle(status: string): string {
  switch (status) {
    case 'expected': return 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
    case 'submitted': return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400';
    case 'under_review': return 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-400';
    case 'approved': return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400';
    case 'changes_requested': return 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400';
    default: return 'bg-surface-100 text-surface-700';
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function fmtTimestamp(ts: unknown): string {
  if (ts && typeof ts === 'object' && 'toDate' in (ts as Record<string, unknown>)) {
    return (ts as { toDate: () => Date }).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return '—';
}

function daysAgo(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toDate' in (ts as Record<string, unknown>)) {
    const date = (ts as { toDate: () => Date }).toDate();
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
}

export default function ProductionDashboardPage() {
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const [specs, setSpecs] = useState<SpecRecord[]>([]);
  const [deliverables, setDeliverables] = useState<ProductionDeliverableRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [trackMap, setTrackMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeOrgId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const trackRecords = (await getTracksByOrg(activeOrgId!)).filter(
          (t) => t.status !== 'archived',
        );
        const map: Record<string, string> = {};
        trackRecords.forEach((t) => { map[t.id] = t.title; });

        if (cancelled) return;
        setTrackMap(map);

        const [specsData, deliverablesData, pendingSubmissions, pendingReviewsData] = await Promise.all([
          Promise.all(trackRecords.map((t) => getSpecificationsByTrack(t.id).catch(() => [] as SpecRecord[]))),
          Promise.all(trackRecords.map((t) => getDeliverablesByTrack(t.id).catch(() => [] as ProductionDeliverableRecord[]))),
          getPendingSubmissions(activeOrgId!).catch(() => [] as SubmissionRecord[]),
          user?.uid ? getPendingReviews(user.uid).catch(() => [] as ReviewRecord[]) : Promise.resolve([] as ReviewRecord[]),
        ]);

        if (cancelled) return;
        setSpecs(specsData.flat());
        setDeliverables(deliverablesData.flat());
        setSubmissions(pendingSubmissions);
        setReviews(pendingReviewsData);
      } catch { /* defaults remain */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeOrgId, user?.uid]);

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-[1.75rem] font-semibold text-text-900 tracking-tight">Production</p>
          <p className="text-sm text-text-500 mt-1">Active specifications, deliverables, and review workflows</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view production status." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  const activeSpecs = specs.filter((s) => s.status !== 'completed');
  const pendingSubmissions = submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'under_review',
  );
  const deliverablesNeedingChanges = deliverables.filter((d) => d.status === 'changes_requested');

  const overdueSpecs = activeSpecs.filter(() => {
    // specs stalled > 14 days without status change
    const staleSpecs = activeSpecs.filter((s) => {
      const d = daysAgo(s.updatedAt);
      return d > 14;
    });
    return staleSpecs.length > 0;
  }).length > 0 ? activeSpecs.filter((s) => daysAgo(s.updatedAt) > 14) : [];

  const stalledReviews = reviews.filter((r) => daysAgo(r.createdAt) > 7);

  const bottleneckCount = overdueSpecs.length + stalledReviews.length;

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-[1.75rem] font-semibold text-text-900 tracking-tight">Production</p>
        <p className="text-sm text-text-500 mt-1">Active specifications, deliverables, and review workflows</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-5 py-4">
          <p className="text-xs text-text-500">Active Specs</p>
          <p className="text-2xl font-bold mt-0.5 text-text-900">{activeSpecs.length}</p>
        </div>
        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-5 py-4">
          <p className="text-xs text-text-500">Pending Submissions</p>
          <p className="text-2xl font-bold mt-0.5 text-warning-600 dark:text-warning-400">{pendingSubmissions.length}</p>
        </div>
        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-5 py-4">
          <p className="text-xs text-text-500">Reviews Awaiting</p>
          <p className="text-2xl font-bold mt-0.5 text-info-600 dark:text-info-400">{reviews.length}</p>
        </div>
        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-5 py-4">
          <p className="text-xs text-text-500">Bottlenecks</p>
          <p className={`text-2xl font-bold mt-0.5 ${bottleneckCount > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>{bottleneckCount}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-text-900 dark:text-text-100 mb-3">Active Specifications</p>
          {activeSpecs.length === 0 ? (
            <EmptyState title="No active specifications" description="Specifications will appear as they are created for tracks." />
          ) : (
            <div className="space-y-1.5">
              {activeSpecs.slice(0, 15).map((spec) => (
                <div key={spec.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-900 dark:text-text-100 truncate">{spec.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${specStatusColor(spec.status)}`}>
                        {spec.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-text-400">{trackMap[spec.trackId] ?? spec.trackId.slice(0, 8)}</span>
                    </div>
                  </div>
                  {spec.assignedPersonId ? (
                    <span className="text-xs text-text-400 shrink-0">{spec.assignedPersonId.slice(0, 10)}...</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-text-900 dark:text-text-100 mb-3">Pending Submissions</p>
          {pendingSubmissions.length === 0 ? (
            <EmptyState title="No pending submissions" description="Submissions awaiting review will appear here." />
          ) : (
            <div className="space-y-1.5">
              {pendingSubmissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-900 dark:text-text-100 truncate">
                      {sub.entityType} — rev {sub.revisionNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${statusBadgeStyle(sub.status)}`}>
                        {statusLabel(sub.status)}
                      </span>
                      <span className="text-xs text-text-400">{fmtTimestamp(sub.submittedAt)}</span>
                    </div>
                  </div>
                  <span className="text-xs text-text-400 shrink-0">{sub.submittedBy.slice(0, 10)}...</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-text-900 dark:text-text-100 mb-3">Reviews Awaiting Action</p>
          {reviews.length === 0 ? (
            <EmptyState title="No reviews awaiting action" description="You have no pending reviews at this time." />
          ) : (
            <div className="space-y-1.5">
              {reviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-900 dark:text-text-100 truncate">
                      {review.entityType} — {review.entityId.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${
                        review.status === 'pending' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400'
                          : 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-400'
                      }`}>
                        {review.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-text-400">{fmtTimestamp(review.createdAt)}</span>
                      {review.dueDate ? <span className="text-xs text-warning-500">Due: {review.dueDate}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-text-900 dark:text-text-100 mb-3">Deliverables Requiring Revision</p>
          {deliverablesNeedingChanges.length === 0 ? (
            <EmptyState title="No revisions required" description="All deliverables are on track." />
          ) : (
            <div className="space-y-1.5">
              {deliverablesNeedingChanges.map((del) => (
                <div key={del.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-900 dark:text-text-100 truncate">
                      {del.deliverableType} (v{del.version}) — {del.type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${statusBadgeStyle(del.status)}`}>
                        {statusLabel(del.status)}
                      </span>
                      <span className="text-xs text-text-400">{trackMap[del.trackId] ?? del.trackId.slice(0, 8)}</span>
                    </div>
                  </div>
                  {del.submittedBy ? (
                    <span className="text-xs text-text-400 shrink-0">{del.submittedBy.slice(0, 10)}...</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-text-900 dark:text-text-100 mb-3">Production Bottlenecks</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-5 py-4">
              <p className="text-xs font-medium text-text-600 dark:text-text-400 uppercase tracking-wide mb-2">Overdue Specs</p>
              {overdueSpecs.length === 0 ? (
                <p className="text-sm text-text-400">None</p>
              ) : (
                <div className="space-y-1">
                  {overdueSpecs.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="text-text-700 dark:text-text-300 truncate">{s.title}</span>
                      <span className="text-danger-500 shrink-0 ml-2">{daysAgo(s.updatedAt)}d</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-5 py-4">
              <p className="text-xs font-medium text-text-600 dark:text-text-400 uppercase tracking-wide mb-2">Stalled Reviews</p>
              {stalledReviews.length === 0 ? (
                <p className="text-sm text-text-400">None</p>
              ) : (
                <div className="space-y-1">
                  {stalledReviews.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className="text-text-700 dark:text-text-300 truncate">{r.entityType} — {r.entityId.slice(0, 8)}</span>
                      <span className="text-warning-500 shrink-0 ml-2">{daysAgo(r.createdAt)}d</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-5 py-4">
              <p className="text-xs font-medium text-text-600 dark:text-text-400 uppercase tracking-wide mb-2">Incomplete Checklists</p>
              <p className="text-sm text-text-400">Checklist tracking coming in next release</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
