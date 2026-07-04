import { type ReactNode } from 'react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}
    >
      {icon ? (
        <div className="mb-6 rounded-full bg-layer-3 p-5 text-content-label">
          {icon}
        </div>
      ) : (
        <div className="mb-6 rounded-full bg-layer-3 p-5">
          <svg
            className="h-7 w-7 text-content-label"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
            />
          </svg>
        </div>
      )}
      <p className="text-base font-semibold text-content-primary">{title}</p>
      {description ? (
        <p className="mt-3 max-w-sm text-sm text-content-secondary leading-6">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button
          variant="tertiary"
          size="sm"
          className="mt-8"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

interface LoadingStateProps {
  variant?: 'spinner' | 'pulse';
  text?: string;
  className?: string;
}

export function LoadingState({
  variant = 'spinner',
  text = 'Loading…',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 ${className}`}
      role="status"
      aria-label={text}
    >
      {variant === 'spinner' ? (
        <div className="relative">
          <div className="h-8 w-8 rounded-full border-2 border-divider" />
          <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-transparent border-t-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="w-64 space-y-2">
          <div className="h-3 rounded-full bg-layer-3 animate-pulse" />
          <div className="h-3 rounded-full bg-layer-3 animate-pulse w-3/4" />
          <div className="h-3 rounded-full bg-layer-3 animate-pulse w-1/2" />
        </div>
      )}
      {text ? (
        <p className="mt-4 text-sm text-content-secondary">{text}</p>
      ) : null}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table-row' | 'avatar';
  count?: number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  count = 1,
}: SkeletonProps) {
  const base =
    'rounded-md bg-layer-3 animate-shimmer';

  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`rounded-lg border border-divider bg-layer-2 p-6 ${className}`}
          >
            <div className={`${base} h-4 w-2/3 mb-3`} />
            <div className={`${base} h-3 w-1/2 mb-2`} />
            <div className={`${base} h-3 w-1/3`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`flex items-center gap-3 py-2 ${className}`}>
            <div className={`${base} h-8 w-8 rounded-full shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${base} h-3 w-1/3`} />
              <div className={`${base} h-2 w-1/4`} />
            </div>
            <div className={`${base} h-3 w-16 shrink-0`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`${base} h-8 w-8 rounded-full ${className}`} />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${base} h-4 ${i === count - 1 ? 'w-2/3' : 'w-full'} ${className}`}
        />
      ))}
    </div>
  );
}