import { ProgressBar } from '@releaseflow/ui';

interface ReadinessCardProps {
  pct: number;
  categories: { label: string; done: boolean }[];
}

export function ReadinessCard({ pct, categories }: ReadinessCardProps) {
  const color =
    pct >= 80 ? 'bg-success-500' : pct >= 50 ? 'bg-warning-500' : 'bg-danger-500';

  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 bg-layer-2 dark:bg-surface-900 shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-400 uppercase tracking-wider">Release Readiness</h3>
        <span className={`text-sm font-semibold tabular-nums ${pct >= 80 ? 'text-success-500' : pct >= 50 ? 'text-warning-500' : 'text-danger-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="mb-4">
        <ProgressBar value={pct} max={100} color={color} size="sm" />
      </div>
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat.label} className="flex items-center gap-2 text-xs">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cat.done ? 'bg-success-500' : 'bg-surface-300 dark:bg-surface-600'}`} />
            <span className={cat.done ? 'text-text-700 dark:text-text-300' : 'text-text-400 dark:text-text-500'}>
              {cat.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
