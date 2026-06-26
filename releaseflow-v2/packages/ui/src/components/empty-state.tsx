import { type ReactNode } from 'react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {icon ? <div className="mb-4 text-text-300">{icon}</div> : null}
      <p className="text-text-700 font-medium mb-1">{title}</p>
      {description ? <p className="text-sm text-text-500 mb-4">{description}</p> : null}
      {action ? <Button variant="outline" size="sm" onClick={action.onClick}>{action.label}</Button> : null}
    </div>
  );
}

interface LoadingStateProps {
  variant?: 'spinner' | 'pulse';
  text?: string;
  className?: string;
}

export function LoadingState({ variant = 'spinner', text = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      {variant === 'spinner' ? (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-300 border-t-primary-500" />
      ) : (
        <div className="w-64 space-y-3">
          <div className="h-4 bg-surface-200 rounded animate-pulse" />
          <div className="h-4 bg-surface-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-surface-200 rounded animate-pulse w-1/2" />
        </div>
      )}
      <p className="text-sm text-text-500 mt-4">{text}</p>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table-row';
  count?: number;
}

export function Skeleton({ className = '', variant = 'text', count = 1 }: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`rounded-lg border border-surface-200 bg-white p-4 ${className}`}>
            <div className="h-4 bg-surface-200 rounded animate-pulse w-2/3 mb-2" />
            <div className="h-3 bg-surface-100 rounded animate-pulse w-1/2 mb-1" />
            <div className="h-3 bg-surface-100 rounded animate-pulse w-1/3" />
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
            <div className="h-8 w-8 rounded-full bg-surface-200 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-surface-200 rounded animate-pulse w-1/3" />
              <div className="h-2.5 bg-surface-100 rounded animate-pulse w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`h-4 bg-surface-200 rounded animate-pulse ${i === count - 1 ? 'w-2/3' : 'w-full'} ${className}`} />
      ))}
    </div>
  );
}
