'use client';

import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { auditPermissions, getAuditReport } from '@/lib/permission-audit';
import { auditActivityCoverage } from '@/lib/activity-audit';
import { validateDataIntegrity } from '@/lib/integrity-validator';
import { reviewPerformance } from '@/lib/performance-review';
import type { IntegrityReport } from '@/lib/integrity-validator';
import type { PerformanceReport } from '@/lib/performance-review';

export default function AuditPage() {
  const { activeOrgId } = useOrgStore();
  const [permReport, setPermReport] = useState<ReturnType<typeof getAuditReport> | null>(null);
  const [actReport, setActReport] = useState<ReturnType<typeof auditActivityCoverage> | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityReport | null>(null);
  const [perf, setPerf] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPermReport(getAuditReport());
    setActReport(auditActivityCoverage());
    setPerf(reviewPerformance());
    if (activeOrgId) {
      validateDataIntegrity(activeOrgId).then(setIntegrity).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeOrgId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }

  const perms = permReport ? auditPermissions() : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">System Audit</h1>
      <p className="text-sm text-zinc-500 mb-8">Permissions, activity coverage, data integrity, performance</p>

      <div className="space-y-6">
        {permReport ? (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Permission Audit</h2>
            <div className="flex gap-3 text-xs mb-3">
              <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1">{permReport.summary.total} routes</span>
              <span className="rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1">{permReport.summary.orgScoped} org-scoped</span>
              <span className={`rounded px-2 py-1 ${permReport.summary.coverage < 70 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>{permReport.summary.coverage}% covered</span>
            </div>
            {perms?.gaps ? (
              <div className="space-y-1.5">
                {perms.gaps.map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-zinc-100 dark:border-zinc-800 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${g.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <code className="text-zinc-600 dark:text-zinc-400">{g.route}</code>
                      <span className="text-zinc-400">{g.issue}</span>
                    </div>
                    <span className="text-zinc-400">{g.recommendation}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {actReport ? (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Activity Feed Audit</h2>
            <div className="flex gap-3 text-xs mb-3">
              <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1">{actReport.total} actions tracked</span>
              <span className="rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1">{actReport.logged} logged</span>
              <span className={`rounded px-2 py-1 ${actReport.coverage < 80 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>{actReport.coverage}% coverage</span>
            </div>
            {actReport.gaps.length > 0 ? (
              <div className="space-y-1.5">
                {actReport.gaps.map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-zinc-100 dark:border-zinc-800 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${g.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="text-zinc-600 dark:text-zinc-400">{g.domain} {g.action}</span>
                    </div>
                    <span className="text-zinc-400">{g.recommendation}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-600">All actions are fully audited.</p>
            )}
          </section>
        ) : null}

        {integrity ? (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Data Integrity</h2>
            <div className="flex gap-3 text-xs mb-3">
              <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1">{integrity.scanned.length} collections scanned</span>
              <span className={`rounded px-2 py-1 ${integrity.totalOrphans > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>{integrity.totalOrphans} orphans</span>
              <span className="rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1">{integrity.totalBrokenRefs} broken refs</span>
            </div>
            <div className="flex flex-wrap gap-1 text-xs mb-3">
              {integrity.scanned.map((s) => (
                <span key={s.collection} className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-zinc-500">{s.collection}: {s.count}</span>
              ))}
            </div>
            {integrity.issues.filter((i) => i.severity === 'high').length > 0 ? (
              <div className="space-y-1">
                {integrity.issues.filter((i) => i.severity === 'high').map((i, idx) => (
                  <div key={idx} className="text-xs text-red-600 dark:text-red-400">{i.description}</div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-600">No critical issues found.</p>
            )}
          </section>
        ) : (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Data Integrity</h2>
            <p className="text-sm text-zinc-400">Select an organization to run integrity scan.</p>
          </section>
        )}

        {perf ? (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Performance Review</h2>

            <div className="mb-4">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Suggested Indexes ({perf.suggestedIndexes.length})</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {perf.suggestedIndexes.map((idx, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs border border-zinc-100 dark:border-zinc-800 rounded px-2.5 py-1.5">
                    <code className="text-zinc-600 dark:text-zinc-400">{idx.collection}</code>
                    <span className="text-zinc-400">{idx.fields.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Collection Growth</p>
              {perf.collectionGrowth.map((c, i) => (
                <p key={i} className="text-xs text-zinc-500 mb-0.5">{c}</p>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">General Recommendations</p>
              {perf.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-zinc-500 mb-0.5">• {r}</p>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
