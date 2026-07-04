interface TimelineStep {
  stage: string;
  completed: boolean;
  date?: string;
  details?: string;
}

interface DSPDetails {
  upc?: string;
  isrc?: string;
  territories?: string[];
  releasedDate?: string;
}

interface DSPStatusProps {
  dspName: string;
  status: 'live' | 'processing' | 'submitted' | 'pending' | 'error';
  timeline: TimelineStep[];
  details?: DSPDetails;
  className?: string;
}

const statusConfig: Record<DSPStatusProps['status'], { className: string; label: string }> = {
  live: { className: 'bg-success-50 text-success-500', label: 'Live' },
  processing: { className: 'bg-info-50 text-info-500', label: 'Processing' },
  submitted: { className: 'bg-info-50 text-info-500', label: 'Submitted' },
  pending: { className: 'bg-surface-100 text-text-500', label: 'Pending' },
  error: { className: 'bg-danger-50 text-danger-500', label: 'Error' },
};

function renderTimelineDot(completed: boolean, isCurrent: boolean) {
  if (completed) {
    return <div className="h-3 w-3 rounded-full bg-success-500 absolute -left-1.5" />;
  }
  if (isCurrent) {
    return <div className="h-3 w-3 rounded-full bg-primary-500 ring-4 ring-primary-500/20 absolute -left-1.5" />;
  }
  return <div className="h-3 w-3 rounded-full bg-surface-200 border-2 border-surface-300 absolute -left-1.5" />;
}

export function DSPStatus({ dspName, status, timeline, details, className = '' }: DSPStatusProps) {
  if (timeline.length === 0) return null;

  const config = statusConfig[status];
  const currentIndex = timeline.findIndex((s) => !s.completed);
  const effectiveCurrent = currentIndex === -1 ? timeline.length - 1 : currentIndex;

  return (
    <article aria-label={`${dspName} delivery status`} className={`rounded-xl border border-surface-200 bg-layer-2 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-900">{dspName}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>

      <div className="relative">
        {timeline.map((step, i) => {
          const isCurrent = i === effectiveCurrent && !step.completed;
          const isLast = i === timeline.length - 1;
          return (
            <div key={i} className={`flex ${isLast ? '' : 'pb-4'}`}>
              <div className="relative flex flex-col items-center mr-4">
                <div className={`border-l-2 ${step.completed || isCurrent ? 'border-success-500' : 'border-surface-200'} pl-4 ml-2 ${isLast ? 'h-4' : 'h-full'}`} />
              </div>
              <div className="relative pl-4 pb-0 min-w-0 flex-1">
                <div className="relative">
                  {renderTimelineDot(step.completed, isCurrent)}
                  <div className="pl-4">
                    <p className="text-sm font-medium text-text-900">{step.stage}</p>
                    {step.date && <p className="text-xs text-text-400 mt-0.5">{step.date}</p>}
                    {step.details && <p className="text-xs text-text-500 mt-0.5">{step.details}</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {details && (
        <div className="mt-4 pt-4 border-t border-surface-200">
          <h4 className="text-xs font-medium text-text-400 uppercase tracking-wider mb-3">Details</h4>
          <div className="space-y-2">
            {details.upc && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-400">UPC</span>
                <span className="text-sm text-text-700 font-mono">{details.upc}</span>
              </div>
            )}
            {details.isrc && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-400">ISRC</span>
                <span className="text-sm text-text-700 font-mono">{details.isrc}</span>
              </div>
            )}
            {details.releasedDate && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-400">Release Date</span>
                <span className="text-sm text-text-700">{details.releasedDate}</span>
              </div>
            )}
            {details.territories && details.territories.length > 0 && (
              <div>
                <span className="text-xs text-text-400">Territories</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {details.territories.map((t) => (
                    <span key={t} className="text-xs bg-surface-100 text-text-500 rounded px-2 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
