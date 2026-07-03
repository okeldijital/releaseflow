'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { Button, Card, LoadingState, EmptyState, Select, Input } from '@releaseflow/ui';
import {
  generateReport,
  exportReport,
  type ReportDomain,
  type ReportResult,
} from '@/lib/reporting-service';
import {
  getReportDefinitions,
  type ReportDefinitionRecord,
} from '@/lib/report-definition-repository';

const DOMAIN_OPTIONS: { value: ReportDomain; label: string }[] = [
  { value: 'releases', label: 'Releases' },
  { value: 'tracks', label: 'Tracks' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'assets', label: 'Assets' },
  { value: 'credits', label: 'Credits' },
  { value: 'rights', label: 'Rights' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'team_activity', label: 'Team Activity' },
];

export default function AdministrationReportsPage() {
  const { activeOrgId } = useOrgStore();
  const [domain, setDomain] = useState<ReportDomain>('releases');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [savedReports, setSavedReports] = useState<ReportDefinitionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeOrgId) {
      getReportDefinitions(activeOrgId)
        .then(setSavedReports)
        .catch(() => setSavedReports([]));
    }
  }, [activeOrgId]);

  const handleGenerate = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    setError('');
    try {
      const filters: ReportResult['config']['filters'] = {};
      if (dateFrom) filters.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) filters.dateTo = new Date(dateTo).toISOString();
      if (statusFilter) filters.status = statusFilter;
      const res = await generateReport({ domain, orgId: activeOrgId, filters });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, domain, dateFrom, dateTo, statusFilter]);

  const handleExport = useCallback(
    (format: 'json' | 'csv') => {
      if (!result) return;
      const content = exportReport(result, format);
      const ext = format === 'json' ? 'json' : 'csv';
      const mime = format === 'json' ? 'application/json' : 'text/csv';
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${domain}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [result, domain],
  );

  const handleRunSaved = useCallback(
    async (def: ReportDefinitionRecord) => {
      if (!activeOrgId) return;
      setDomain(def.domain);
      setStatusFilter(def.filters.status ?? '');
      setDateFrom(def.filters.dateFrom ?? '');
      setDateTo(def.filters.dateTo ?? '');
      setLoading(true);
      setError('');
      try {
        const res = await generateReport({
          domain: def.domain,
          orgId: activeOrgId,
          filters: def.filters,
        });
        setResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to run saved report');
      } finally {
        setLoading(false);
      }
    },
    [activeOrgId],
  );

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-[1.75rem] font-semibold text-text-900 tracking-tight">Reports</p>
          <p className="text-sm text-text-500 mt-1">Generate and export organization reports</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to manage reports." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-[1.75rem] font-semibold text-text-900 tracking-tight">Reports</p>
        <p className="text-sm text-text-500 mt-1">Generate and export organization reports</p>
      </div>

      <Card padding="md" className="border border-surface-200/80 mb-6">
        <p className="font-semibold text-text-900 mb-4">Generate Report</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          <Select
            label="Domain"
            options={DOMAIN_OPTIONS}
            value={domain}
            onChange={(v) => setDomain(v as ReportDomain)}
          />
          <Input
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <Input
            label="Status Filter (optional)"
            placeholder="e.g. active, done, released"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={handleGenerate} loading={loading}>
          Generate
        </Button>
        {error ? <p className="text-sm text-danger-500 mt-2">{error}</p> : null}
      </Card>

      {result && (
        <>
          <Card padding="md" className="border border-surface-200/80 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-text-900">Report Results</p>
                <p className="text-sm text-text-400 mt-0.5">
                  {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} &middot; Generated{' '}
                  {new Date(result.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                  Download JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                  Download CSV
                </Button>
              </div>
            </div>
            {result.data.length === 0 ? (
              <p className="text-sm text-text-400">No data found for this report.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200">
                      {Object.keys(result.data[0]!).map((key) => (
                        <th
                          key={key}
                          className="text-left px-3 py-2 text-xs font-semibold text-text-400 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 text-text-700 truncate max-w-[200px]">
                            {val === null || val === undefined
                              ? '\u2014'
                              : typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.data.length > 20 ? (
                  <p className="text-xs text-text-400 mt-2">
                    Showing first 20 of {result.rowCount} rows
                  </p>
                ) : null}
              </div>
            )}
          </Card>
        </>
      )}

      {savedReports.length > 0 && (
        <Card padding="md" className="border border-surface-200/80">
          <p className="font-semibold text-text-900 mb-4">Saved Reports</p>
          <div className="space-y-1.5">
            {savedReports.map((def) => (
              <div
                key={def.id}
                className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-3 hover:bg-surface-100 transition-colors cursor-pointer"
                onClick={() => handleRunSaved(def)}
              >
                <div>
                  <p className="text-sm font-medium text-text-900">{def.name}</p>
                  <p className="text-xs text-text-400 capitalize">{def.domain.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-xs text-primary-500 font-medium">Run &rarr;</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingState text="Generating report..." />
        </div>
      )}
    </div>
  );
}
