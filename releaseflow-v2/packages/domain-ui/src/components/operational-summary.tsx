import { useMemo } from 'react';

interface Recommendation {
  action: string;
  urgency: 'now' | 'soon' | 'later';
  type: 'action' | 'info' | 'warning';
}

interface OperationalSummaryProps {
  healthScore: number;
  currentStage: string;
  completedStages: number;
  totalStages: number;
  readyItems: number;
  totalItems: number;
  pendingApprovals: number;
  blockers: number;
  daysUntilRelease: number;
  lastEvaluated?: string;
  stageHref?: string;
  onDrillDown?: (section: string) => void;
  loading?: boolean;
  className?: string;
}

const urgencyDot: Record<Recommendation['urgency'], string> = {
  now:  'bg-danger-500',
  soon: 'bg-warning-500',
  later:'bg-info-500',
};
const urgencyText: Record<Recommendation['urgency'], string> = {
  now:  'text-danger-600',
  soon: 'text-warning-600',
  later:'text-info-600',
};

function healthPill(score: number) {
  if (score >= 80) return { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500', label: 'Healthy' };
  if (score >= 60) return { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning-500', label: 'Attention' };
  return { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-500', label: 'Critical' };
}

function confidenceBar(v: number) {
  if (v >= 80) return 'bg-success-500';
  if (v >= 50) return 'bg-warning-500';
  return 'bg-danger-500';
}

function MetricCell({
  value, label, section, critical = false, onDrillDown,
}: { value: string; label: string; section: string; critical?: boolean; onDrillDown?: (s: string) => void }) {
  const inner = (
    <>
      <span className={`text-2xl font-semibold leading-none ${critical ? 'text-danger-600' : 'text-text-900'}`}>
        {value}
      </span>
      <span className="mt-1 text-xs font-medium text-text-400 uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </>
  );

  if (onDrillDown) {
    return (
      <button
        onClick={() => onDrillDown(section)}
        className="flex flex-col items-center flex-1 min-w-16 py-1 rounded-lg hover:bg-surface-50 transition-colors duration-200"
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center flex-1 min-w-16">
      {inner}
    </div>
  );
}

export function OperationalSummary({
  healthScore,
  currentStage,
  completedStages,
  totalStages,
  readyItems,
  totalItems,
  pendingApprovals,
  blockers,
  daysUntilRelease,
  lastEvaluated,
  stageHref,
  onDrillDown,
  loading = false,
  className = '',
}: OperationalSummaryProps) {
  const score = Math.max(0, Math.min(100, healthScore));
  const hp = healthPill(score);

  const narrative = useMemo(() => {
    const parts: string[] = [];
    if (score >= 80) parts.push('Release is healthy.');
    else if (score >= 60) parts.push('Release needs attention.');
    else parts.push('Release is in critical state.');

    parts.push(`${completedStages} of ${totalStages} stages complete. Currently in ${currentStage}.`);
    parts.push(`${readyItems} of ${totalItems} readiness checks passed.`);
    if (blockers > 0) parts.push(`${blockers} active ${blockers === 1 ? 'blocker' : 'blockers'}.`);
    if (pendingApprovals > 0) parts.push(`${pendingApprovals} pending ${pendingApprovals === 1 ? 'approval' : 'approvals'}.`);
    parts.push(daysUntilRelease < 7 ? `⚠ Release in ${daysUntilRelease} days — act now.` : `Release in ${daysUntilRelease} days.`);
    return parts.join(' ');
  }, [score, completedStages, totalStages, currentStage, readyItems, totalItems, pendingApprovals, blockers, daysUntilRelease]);

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    if (blockers > 0) recs.push({ action: `Resolve ${blockers} blocking ${blockers === 1 ? 'dependency' : 'dependencies'}`, urgency: 'now', type: 'action' });
    if (pendingApprovals > 0) recs.push({ action: `Complete ${pendingApprovals} pending ${pendingApprovals === 1 ? 'approval' : 'approvals'}`, urgency: 'soon', type: 'action' });
    if (score < 60) recs.push({ action: 'Health is critical — review release status', urgency: 'now', type: 'warning' });
    if (daysUntilRelease < 7 && readyItems < totalItems) recs.push({ action: 'Release approaching — complete readiness checks', urgency: 'now', type: 'action' });
    if (recs.length === 0) recs.push({ action: score >= 80 && blockers === 0 ? 'Release is on track — continue monitoring' : 'Monitor release status and address any issues', urgency: 'later', type: 'info' });
    return recs;
  }, [score, blockers, pendingApprovals, daysUntilRelease, readyItems, totalItems]);

  const confidence = useMemo(() => {
    const readinessPct = totalItems > 0 ? (readyItems / totalItems) * 100 : 100;
    const timelinePct = Math.max(0, Math.min(100, daysUntilRelease >= 30 ? 100 : (daysUntilRelease / 30) * 100));
    const blockerScore = blockers === 0 ? 100 : blockers <= 2 ? 50 : 0;
    return Math.round(score * 0.4 + readinessPct * 0.3 + timelinePct * 0.2 + blockerScore * 0.1);
  }, [score, readyItems, totalItems, daysUntilRelease, blockers]);

  const shimmer = 'rounded-md bg-surface-200 dark:bg-surface-700 animate-pulse';

  if (loading) {
    return (
      <div role="region" aria-label="Operational Summary"
        className={`rounded-xl border border-surface-200/80 bg-white dark:bg-surface-900 dark:border-surface-700/80 p-6 ${className}`}>
        <div className="flex gap-2 mb-3">
          <div className={`${shimmer} h-6 w-20`} />
          <div className={`${shimmer} h-6 w-24`} />
        </div>
        <div className={`${shimmer} h-4 w-full mt-3`} />
        <div className={`${shimmer} h-4 w-3/4 mt-2`} />
        <div className={`${shimmer} h-4 w-5/6 mt-2`} />
        <div className="flex gap-3 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`${shimmer} h-6 w-10`} />
              <div className={`${shimmer} h-2 w-14 mt-2`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stagePill = (
    <span className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold rounded-full px-3 py-1 dark:bg-primary-900/30 dark:text-primary-300">
      {currentStage}
    </span>
  );

  return (
    <div role="region" aria-label="Operational Summary"
      className={`rounded-xl border border-surface-200/80 bg-white dark:bg-surface-900 dark:border-surface-700/80 p-6 ${className}`}>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${hp.bg} ${hp.text}`}>
          <span className={`h-2 w-2 rounded-full ${hp.dot}`} aria-hidden="true" />
          {hp.label}
        </span>
        {stageHref
          ? <a href={stageHref} className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold rounded-full px-3 py-1 hover:bg-primary-100 transition-colors duration-200 dark:bg-primary-900/30 dark:text-primary-300">{currentStage}</a>
          : stagePill}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-400">Confidence</span>
        <div className="h-1 flex-1 w-32 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${confidenceBar(confidence)}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-text-700 dark:text-text-200">{confidence}%</span>
      </div>

      <p aria-live="polite" className="text-sm text-text-700 dark:text-text-300 leading-relaxed">
        {narrative}
      </p>

      <div className="flex flex-wrap gap-1 mt-6 pt-6 border-t border-surface-100/80 dark:border-surface-800">
        <MetricCell value={`${completedStages}/${totalStages}`} label="Stages" section="stages" onDrillDown={onDrillDown} />
        <MetricCell value={`${readyItems}/${totalItems}`} label="Ready" section="items" onDrillDown={onDrillDown} />
        <div className="hidden lg:flex flex-1 min-w-16">
          <MetricCell value={String(pendingApprovals)} label="Approvals" section="approvals" onDrillDown={onDrillDown} />
        </div>
        <MetricCell value={String(blockers)} label="Blockers" section="blockers" critical={blockers > 0} onDrillDown={onDrillDown} />
        <MetricCell value={String(daysUntilRelease)} label="Days" section="timeline" critical={daysUntilRelease < 7} onDrillDown={onDrillDown} />
      </div>

      {recommendations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-surface-100/80 dark:border-surface-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-400 mb-2">Recommended Actions</p>
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 py-2">
              <span className={`h-2 w-2 rounded-full shrink-0 mt-1 ${urgencyDot[rec.urgency]}`} />
              <span className="text-sm text-text-700 dark:text-text-300 flex-1">{rec.action}</span>
              <span className={`text-xs font-semibold shrink-0 uppercase tracking-wide ${urgencyText[rec.urgency]}`}>
                {rec.urgency}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-text-400 dark:text-text-500 text-right">
        {lastEvaluated ? `Evaluated ${lastEvaluated}` : 'Evaluated just now'}
      </p>
    </div>
  );
}
