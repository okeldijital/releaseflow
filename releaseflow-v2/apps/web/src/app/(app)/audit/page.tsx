'use client';

import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { auditPermissions, getAuditReport } from '@/lib/permission-audit';
import { auditActivityCoverage } from '@/lib/activity-audit';
import { validateDataIntegrity } from '@/lib/integrity-validator';
import { reviewPerformance } from '@/lib/performance-review';
import type { IntegrityReport } from '@/lib/integrity-validator';
import type { PerformanceReport } from '@/lib/performance-review';
import { Card, Badge, LoadingState } from '@releaseflow/ui';

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
    return <LoadingState />;
  }

  const perms = permReport ? auditPermissions() : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <p className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-2">System Audit</p>
      <p className="text-sm text-text-500 mb-8">Permissions, activity coverage, data integrity, performance</p>

      <div className="space-y-6">
        {permReport ? (
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50 mb-3">Permission Audit</h2>
            <div className="flex gap-3 text-xs mb-3">
              <Badge label={`${permReport.summary.total} routes`} color="zinc" />
              <Badge label={`${permReport.summary.orgScoped} org-scoped`} color="emerald" />
              <Badge label={`${permReport.summary.coverage}% covered`} color={permReport.summary.coverage < 70 ? 'red' : 'amber'} />
            </div>
            {perms?.gaps ? (
              <div className="space-y-1.5">
                {perms.gaps.map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-surface-100 dark:border-surface-800 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${g.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <code className="text-text-600 dark:text-text-400">{g.route}</code>
                      <span className="text-text-400">{g.issue}</span>
                    </div>
                    <span className="text-text-400">{g.recommendation}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}

        {actReport ? (
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50 mb-3">Activity Feed Audit</h2>
            <div className="flex gap-3 text-xs mb-3">
              <Badge label={`${actReport.total} actions tracked`} color="zinc" />
              <Badge label={`${actReport.logged} logged`} color="emerald" />
              <Badge label={`${actReport.coverage}% coverage`} color={actReport.coverage < 80 ? 'amber' : 'emerald'} />
            </div>
            {actReport.gaps.length > 0 ? (
              <div className="space-y-1.5">
                {actReport.gaps.map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-surface-100 dark:border-surface-800 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${g.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="text-text-600 dark:text-text-400">{g.domain} {g.action}</span>
                    </div>
                    <span className="text-text-400">{g.recommendation}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-success-500">All actions are fully audited.</p>
            )}
          </Card>
        ) : null}

        {integrity ? (
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50 mb-3">Data Integrity</h2>
            <div className="flex gap-3 text-xs mb-3">
              <Badge label={`${integrity.scanned.length} collections scanned`} color="zinc" />
              <Badge label={`${integrity.totalOrphans} orphans`} color={integrity.totalOrphans > 0 ? 'red' : 'emerald'} />
              <Badge label={`${integrity.totalBrokenRefs} broken refs`} color="emerald" />
            </div>
            <div className="flex flex-wrap gap-1 text-xs mb-3">
              {integrity.scanned.map((s) => (
                <Badge key={s.collection} label={`${s.collection}: ${s.count}`} color="zinc" size="sm" />
              ))}
            </div>
            {integrity.issues.filter((i) => i.severity === 'high').length > 0 ? (
              <div className="space-y-1">
                {integrity.issues.filter((i) => i.severity === 'high').map((i, idx) => (
                  <div key={idx} className="text-xs text-danger-500 dark:text-danger-500">{i.description}</div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-success-500">No critical issues found.</p>
            )}
          </Card>
        ) : (
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50 mb-3">Data Integrity</h2>
            <p className="text-sm text-text-400">Select an organization to run integrity scan.</p>
          </Card>
        )}

        {perf ? (
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50 mb-3">Performance Review</h2>

            <div className="mb-4">
              <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-2">Suggested Indexes ({perf.suggestedIndexes.length})</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {perf.suggestedIndexes.map((idx, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs border border-surface-100 dark:border-surface-800 rounded px-2.5 py-1.5">
                    <code className="text-text-600 dark:text-text-400">{idx.collection}</code>
                    <span className="text-text-400">{idx.fields.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-2">Collection Growth</p>
              {perf.collectionGrowth.map((c, i) => (
                <p key={i} className="text-xs text-text-500 mb-0.5">{c}</p>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-2">General Recommendations</p>
              {perf.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-text-500 mb-0.5">• {r}</p>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
