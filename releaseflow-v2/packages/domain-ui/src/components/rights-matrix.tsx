interface RightsItem {
  id: string;
  rightHolder: string;
  role: 'songwriter' | 'publisher';
  percentage: number;
  pro?: string;
  ipi?: string;
  territories: string[];
  collectionSociety?: string;
  status: 'confirmed' | 'pending' | 'disputed';
}

interface RightsMatrixProps {
  items: RightsItem[];
  className?: string;
}

const statusTextClasses: Record<RightsItem['status'], string> = {
  confirmed: 'text-success-500',
  pending: 'text-warning-500',
  disputed: 'text-danger-500',
};

const statusDotClasses: Record<RightsItem['status'], string> = {
  confirmed: 'bg-success-500',
  pending: 'bg-warning-500',
  disputed: 'bg-danger-500',
};

export function RightsMatrix({ items, className = '' }: RightsMatrixProps) {
  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.percentage, 0);
  const isComplete = Math.abs(total - 100) < 0.01;

  return (
    <div className={`rounded-xl border border-surface-200 bg-layer-2 overflow-hidden ${className}`}>
      <div role="table" aria-label="Rights Matrix">
        <div role="rowgroup" className="bg-surface-50 border-b border-surface-200">
          <div role="row" className="flex">
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 flex-1">Right Holder</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-24">Role</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-28">Split</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-20 hidden md:block">PRO</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-28 hidden lg:block">IPI</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-28 hidden lg:block">Status</div>
          </div>
        </div>
        <div role="rowgroup">
          {items.map((item) => (
            <div
              key={item.id}
              role="row"
              className="flex border-b border-surface-100 hover:bg-surface-50 transition-colors duration-200"
            >
              <div role="cell" className="px-4 py-3 flex-1 flex flex-col justify-center">
                <span className="text-sm font-medium text-text-900">{item.rightHolder}</span>
                {item.collectionSociety && (
                  <span className="text-xs text-text-500 mt-0.5">{item.collectionSociety}</span>
                )}
              </div>
              <div role="cell" className="px-4 py-3 w-24 flex items-center">
                <span
                  className={`text-xs rounded-full px-3 py-1 ${
                    item.role === 'songwriter'
                      ? 'bg-info-50 text-info-500'
                      : 'bg-secondary-50 text-secondary-700'
                  }`}
                >
                  {item.role}
                </span>
              </div>
              <div role="cell" className="px-4 py-3 w-28 flex flex-col justify-center">
                <span className="text-sm text-text-900 font-medium">{item.percentage}%</span>
                <div className="h-1 bg-surface-200 rounded-full w-16 mt-1">
                  <div
                    className="h-1 bg-primary-500 rounded-full"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
              <div role="cell" className="px-4 py-3 w-20 hidden md:flex items-center">
                {item.pro && <span className="text-xs text-text-500">{item.pro}</span>}
              </div>
              <div role="cell" className="px-4 py-3 w-28 hidden lg:flex items-center">
                {item.ipi && <span className="text-xs text-text-500 font-mono">{item.ipi}</span>}
              </div>
              <div role="cell" className="px-4 py-3 w-28 hidden lg:flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${statusDotClasses[item.status]}`} />
                <span className={`text-xs ${statusTextClasses[item.status]}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-50 px-4 py-3 border-t border-surface-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-900">Total</span>
          <span className={`text-sm font-semibold ${isComplete ? 'text-success-500' : 'text-danger-500'}`}>
            {total}%
          </span>
        </div>
        <div className="h-1 bg-surface-200 rounded-full w-full mt-2">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${isComplete ? 'bg-success-500' : 'bg-danger-500'}`}
            style={{ width: `${Math.min(100, total)}%` }}
          />
        </div>
      </div>

      {items.some((i) => i.territories.length > 0) && (
        <div className="hidden lg:block px-4 py-2 border-t border-surface-100">
          <span className="text-xs font-medium text-text-500 uppercase tracking-wider">Territories</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {Array.from(new Set(items.flatMap((i) => i.territories))).map((t) => (
              <span key={t} className="text-xs bg-surface-100 text-text-500 rounded px-2 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
