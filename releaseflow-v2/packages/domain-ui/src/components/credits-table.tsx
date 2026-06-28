interface CreditItem {
  id: string;
  name: string;
  role: string;
  contribution: string;
  percentage?: number;
  status: 'confirmed' | 'pending' | 'disputed';
  avatarUrl?: string;
}

interface CreditsTableProps {
  items: CreditItem[];
  className?: string;
}

const statusClasses: Record<CreditItem['status'], string> = {
  confirmed: 'bg-success-50 text-success-500',
  pending: 'bg-warning-50 text-warning-500',
  disputed: 'bg-danger-50 text-danger-500',
};

const statusLabels: Record<CreditItem['status'], string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  disputed: 'Disputed',
};

export function CreditsTable({ items, className = '' }: CreditsTableProps) {
  if (items.length === 0) return null;

  const totalPercentage = items.reduce((sum, item) => sum + (item.percentage ?? 0), 0);

  return (
    <div className={`rounded-xl border border-surface-200 bg-white overflow-hidden ${className}`}>
      <div role="table" aria-label="Credits">
        <div role="rowgroup" className="bg-surface-50 border-b border-surface-200">
          <div role="row" className="flex">
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 flex-1">Contributor</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-32">Role</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-40 hidden md:block">Contribution</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-24 hidden md:block">Share</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-28">Status</div>
          </div>
        </div>
        <div role="rowgroup">
          {items.map((item) => (
            <div
              key={item.id}
              role="row"
              className="flex border-b border-surface-100 hover:bg-surface-50 transition-colors duration-200"
            >
              <div role="cell" className="px-4 py-3 flex-1 flex items-center gap-3">
                {item.avatarUrl ? (
                  <img src={item.avatarUrl} alt={item.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-text-500">
                      {item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-text-900">{item.name}</span>
              </div>
              <div role="cell" className="px-4 py-3 w-32 flex items-center">
                <span className="text-sm text-text-700">{item.role}</span>
              </div>
              <div role="cell" className="px-4 py-3 w-40 hidden md:flex items-center">
                <span className="text-sm text-text-700">{item.contribution}</span>
              </div>
              <div role="cell" className="px-4 py-3 w-24 hidden md:flex items-center">
                {item.percentage !== undefined && (
                  <span className="text-sm text-text-900 font-medium">{item.percentage}%</span>
                )}
              </div>
              <div role="cell" className="px-4 py-3 w-28 flex items-center">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPercentage > 0 && (
        <div className="bg-surface-50 px-4 py-3 border-t border-surface-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-900">Total Share</span>
          <span className={`text-sm font-semibold ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-success-500' : 'text-warning-500'}`}>
            {totalPercentage}%
          </span>
        </div>
      )}
    </div>
  );
}
