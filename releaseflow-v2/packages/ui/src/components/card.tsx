import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  className?: string;
}

const paddingClasses = { sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function Card({ children, padding = 'md', hover = false, clickable = false, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-surface-200 bg-white dark:bg-surface-900 transition-shadow
        ${paddingClasses[padding]}
        ${hover ? 'hover:shadow-elevated' : ''}
        ${clickable ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  className?: string;
}

export function MetricCard({ label, value, trend, trendValue, className = '' }: MetricCardProps) {
  return (
    <div className={`rounded-xl border border-surface-200 bg-white dark:bg-surface-900 p-5 ${className}`}>
      <p className="text-sm text-text-500">{label}</p>
      <p className="text-3xl font-bold text-text-900 mt-1">{value}</p>
      {trend && trendValue ? (
        <p className={`text-xs mt-1 ${trend === 'up' ? 'text-success-500' : trend === 'down' ? 'text-danger-500' : 'text-text-500'}`}>
          {trendValue}
        </p>
      ) : null}
    </div>
  );
}

interface WorkspaceCardProps {
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function WorkspaceCard({ title, subtitle, status, statusColor, actions, children, className = '' }: WorkspaceCardProps) {
  return (
    <div className={`rounded-xl border border-surface-200 bg-white dark:bg-surface-900 p-4 hover:shadow-elevated transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text-900 truncate">{title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {subtitle ? <p className="text-sm text-text-500">{subtitle}</p> : null}
            {status ? (
              <span className={`text-xs capitalize rounded-full px-2.5 py-0.5 ${statusColor ?? 'bg-surface-100 text-text-500'}`}>{status}</span>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0 ml-4">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
