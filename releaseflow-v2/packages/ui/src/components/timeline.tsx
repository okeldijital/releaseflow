import { type ReactNode } from 'react';

type TimelineStatus = 'completed' | 'current' | 'pending' | 'blocked';
type TimelineOrientation = 'vertical' | 'horizontal';

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  status?: TimelineStatus;
  icon?: ReactNode;
}

interface TimelineProps {
  events: TimelineEvent[];
  orientation?: TimelineOrientation;
  className?: string;
}

const statusDotClasses: Record<TimelineStatus, string> = {
  completed: 'bg-success-500',
  current: 'bg-primary-500 ring-4 ring-primary-500/15',
  pending: 'bg-surface-300',
  blocked: 'bg-danger-500',
};

const statusIcon = (status: TimelineStatus) => {
  if (status === 'completed') {
    return (
      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'blocked') {
    return (
      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1a5 5 0 100 10A5 5 0 006 1zM5.25 3.5h1.5v3h-1.5v-3zm0 4.5h1.5v1.5h-1.5V8z" />
      </svg>
    );
  }
  return null;
};

export function Timeline({
  events,
  orientation = 'vertical',
  className = '',
}: TimelineProps) {
  const isHorizontal = orientation === 'horizontal';

  if (events.length === 0) return null;

  return (
    <div
      role="list"
      className={`${isHorizontal ? 'flex overflow-x-auto lg:flex-row flex-col' : 'flex flex-col'} ${className}`}
    >
      {events.map((event, i) => {
        const status = event.status ?? 'pending';
        const isLast = i === events.length - 1;

        if (isHorizontal) {
          return (
            <div
              key={event.id}
              role="listitem"
              className={`flex flex-col items-center relative ${isLast ? '' : 'flex-1'}`}
            >
              <div className="flex items-center w-full">
                <div className={`h-1 flex-1 ${i === 0 ? 'bg-transparent' : 'bg-surface-200'}`} />
                <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${statusDotClasses[status]}`}>
                  {event.icon ?? statusIcon(status)}
                </div>
                <div className={`h-1 flex-1 ${isLast ? 'bg-transparent' : 'bg-surface-200'}`} />
              </div>
              <div className="mt-3 text-center px-2">
                <p className="text-sm font-medium text-text-900">{event.title}</p>
                {event.description ? (
                  <p className="text-xs text-text-500 mt-1">{event.description}</p>
                ) : null}
                <p className="text-xs text-text-400 mt-1">{event.timestamp}</p>
              </div>
            </div>
          );
        }

        return (
          <div
            key={event.id}
            role="listitem"
            className={`flex gap-3 ${isLast ? '' : 'pb-6'}`}
          >
            <div className="flex flex-col items-center shrink-0">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${statusDotClasses[status]}`}>
                {event.icon ?? statusIcon(status)}
              </div>
              {!isLast ? <div className="w-1 flex-1 bg-surface-200 mt-2" /> : null}
            </div>
            <div className="pb-1 min-w-0">
              <p className="text-sm font-medium text-text-900">{event.title}</p>
              {event.description ? (
                <p className="text-xs text-text-500 mt-1">{event.description}</p>
              ) : null}
              <p className="text-xs text-text-400 mt-1">{event.timestamp}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
