interface PlatformItem {
  id: string;
  name: string;
  icon?: string;
  status: 'live' | 'processing' | 'submitted' | 'pending' | 'error';
  submittedDate?: string;
  liveDate?: string;
  url?: string;
  territories?: string[];
}

interface DistributionBoardProps {
  platforms: PlatformItem[];
  className?: string;
}

const statusConfig: Record<PlatformItem['status'], { className: string; label: string }> = {
  live: { className: 'bg-success-50 text-success-500 border-success-200', label: 'Live' },
  processing: { className: 'bg-info-50 text-info-500 border-info-200', label: 'Processing' },
  submitted: { className: 'bg-info-50 text-info-500 border-info-200', label: 'Submitted' },
  pending: { className: 'bg-surface-100 text-text-500 border-surface-200', label: 'Pending' },
  error: { className: 'bg-danger-50 text-danger-500 border-danger-200', label: 'Error' },
};

export function DistributionBoard({ platforms, className = '' }: DistributionBoardProps) {
  if (platforms.length === 0) return null;

  return (
    <div role="list" aria-label="Distribution Platforms" className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {platforms.map((platform) => {
        const config = statusConfig[platform.status];
        return (
          <div
            key={platform.id}
            role="listitem"
            className="rounded-xl border border-surface-200 bg-white p-4 hover:shadow-raised transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-text-900">{platform.name}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
                {config.label}
              </span>
            </div>

            {platform.status === 'processing' && (
              <div className="mb-3">
                <div className="h-1 bg-surface-200 rounded-full w-full">
                  <div className="h-1 bg-info-500 animate-pulse rounded-full w-2/3" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              {platform.submittedDate && (
                <p className="text-xs text-text-400">Submitted: {platform.submittedDate}</p>
              )}
              {platform.liveDate && (
                <p className="text-xs text-success-500">Live: {platform.liveDate}</p>
              )}
              {platform.url && (
                <p className="text-xs text-info-500 truncate">{platform.url}</p>
              )}
            </div>

            {platform.territories && platform.territories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {platform.territories.map((t) => (
                  <span key={t} className="text-xs bg-surface-100 text-text-500 rounded px-2 py-1">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
