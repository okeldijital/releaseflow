import { type ReactNode } from 'react';

type CardElevation = 'none' | 'card' | 'raised';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  padding?: CardPadding;
  elevation?: CardElevation;
  hover?: boolean;
  clickable?: boolean;
  className?: string;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const elevationClasses: Record<CardElevation, string> = {
  none: '',
  card: 'shadow-card',
  raised: 'shadow-raised',
};

export function Card({
  children,
  padding = 'md',
  elevation = 'none',
  hover = false,
  clickable = false,
  className = '',
}: CardProps) {
  return (
    <div
      className={`
         rounded-lg border border-divider bg-layer-2
         ${elevationClasses[elevation]}
         ${hover || clickable ? 'hover:shadow-raised transition-shadow duration-150' : ''}
         ${clickable ? 'cursor-pointer' : ''}
         ${paddingClasses[padding]}
         ${className}
       `.trim()}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                (e.currentTarget as HTMLElement).click();
              }
            }
          : undefined
      }
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
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  trendValue,
  icon,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`
         rounded-lg border border-divider bg-layer-2 shadow-card p-6
         ${className}
       `.trim()}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-content-label uppercase tracking-wider">{label}</p>
        {icon ? (
          <span className="text-content-label">{icon}</span>
        ) : null}
      </div>
      <p className="text-3xl font-semibold text-content-primary mt-2 leading-none">{value}</p>
      {trend && trendValue ? (
        <p
          className={`text-xs mt-2 font-medium ${
            trend === 'up'
              ? 'text-success-500'
              : trend === 'down'
              ? 'text-danger-500'
              : 'text-content-label'
          }`}
        >
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

export function WorkspaceCard({
  title,
  subtitle,
  status,
  statusColor,
  actions,
  children,
  className = '',
}: WorkspaceCardProps) {
  return (
    <div
      className={`
         rounded-lg border border-divider bg-layer-2 shadow-card p-4
         hover:shadow-raised transition-shadow duration-200
         ${className}
       `.trim()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-content-primary truncate leading-snug">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            {subtitle ? (
              <p className="text-sm text-content-secondary truncate">{subtitle}</p>
            ) : null}
            {status ? (
              <span
                className={`text-xs font-medium capitalize rounded-full px-2 py-1 shrink-0 ${statusColor ?? 'bg-layer-3 text-content-label'}`}
              >
                {status}
              </span>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}