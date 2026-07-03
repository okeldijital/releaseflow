type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  color?: string;
  darkColor?: string;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1 text-xs',
};

export function Badge({
  label,
  color = 'bg-surface-100 text-text-600',
  darkColor,
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium tracking-wide
        ${sizeClasses[size]} ${color} ${darkColor ?? ''} ${className}
      `.trim()}
    >
      {dot ? (
        <span
          className="h-2 w-2 rounded-full bg-current shrink-0 opacity-80"
          aria-hidden="true"
        />
      ) : null}
      {label}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { color: string; darkColor: string; dot?: boolean }> = {
  active:                   { color: 'bg-success-50 text-success-600', darkColor: 'dark:bg-success-500/15 dark:text-success-400', dot: true },
  approved:                 { color: 'bg-success-50 text-success-600', darkColor: 'dark:bg-success-500/15 dark:text-success-400', dot: true },
  completed:                { color: 'bg-success-50 text-success-600', darkColor: 'dark:bg-success-500/15 dark:text-success-400', dot: true },
  released:                 { color: 'bg-success-50 text-success-600', darkColor: 'dark:bg-success-500/15 dark:text-success-400', dot: true },
  ready:                    { color: 'bg-success-50 text-success-600', darkColor: 'dark:bg-success-500/15 dark:text-success-400', dot: true },
  on_budget:                { color: 'bg-success-50 text-success-600', darkColor: 'dark:bg-success-500/15 dark:text-success-400', dot: true },
  ready_for_distribution:   { color: 'bg-success-50 text-success-600', darkColor: 'dark:bg-success-500/15 dark:text-success-400', dot: true },
  in_progress:              { color: 'bg-info-50 text-info-600', darkColor: 'dark:bg-info-500/15 dark:text-info-400', dot: true },
  in_review:                { color: 'bg-info-50 text-info-600', darkColor: 'dark:bg-info-500/15 dark:text-info-400', dot: true },
  review:                   { color: 'bg-info-50 text-info-600', darkColor: 'dark:bg-info-500/15 dark:text-info-400' },
  pending:                  { color: 'bg-info-50 text-info-600', darkColor: 'dark:bg-info-500/15 dark:text-info-400' },
  planning:                 { color: 'bg-info-50 text-info-600', darkColor: 'dark:bg-info-500/15 dark:text-info-400' },
  generated:                { color: 'bg-info-50 text-info-600', darkColor: 'dark:bg-info-500/15 dark:text-info-400' },
  sent:                     { color: 'bg-info-50 text-info-600', darkColor: 'dark:bg-info-500/15 dark:text-info-400' },
  draft:                    { color: 'bg-surface-100 text-text-500', darkColor: 'dark:bg-surface-800 dark:text-text-400' },
  planned:                  { color: 'bg-surface-100 text-text-500', darkColor: 'dark:bg-surface-800 dark:text-text-400' },
  archived:                 { color: 'bg-surface-100 text-text-400', darkColor: 'dark:bg-surface-800 dark:text-text-500' },
  inactive:                 { color: 'bg-surface-100 text-text-400', darkColor: 'dark:bg-surface-800 dark:text-text-500' },
  at_risk:                  { color: 'bg-warning-50 text-warning-700', darkColor: 'dark:bg-warning-500/15 dark:text-warning-400', dot: true },
  overdue:                  { color: 'bg-warning-50 text-warning-700', darkColor: 'dark:bg-warning-500/15 dark:text-warning-400', dot: true },
  warning:                  { color: 'bg-warning-50 text-warning-700', darkColor: 'dark:bg-warning-500/15 dark:text-warning-400', dot: true },
  on_hold:                  { color: 'bg-warning-50 text-warning-700', darkColor: 'dark:bg-warning-500/15 dark:text-warning-400' },
  blocked:                  { color: 'bg-danger-50 text-danger-600', darkColor: 'dark:bg-danger-500/15 dark:text-danger-400', dot: true },
  rejected:                 { color: 'bg-danger-50 text-danger-600', darkColor: 'dark:bg-danger-500/15 dark:text-danger-400' },
  critical:                 { color: 'bg-danger-50 text-danger-600', darkColor: 'dark:bg-danger-500/15 dark:text-danger-400', dot: true },
  over_budget:              { color: 'bg-danger-50 text-danger-600', darkColor: 'dark:bg-danger-500/15 dark:text-danger-400', dot: true },
  cancelled:                { color: 'bg-danger-50 text-danger-600', darkColor: 'dark:bg-danger-500/15 dark:text-danger-400' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { color: 'bg-surface-100 text-text-600', darkColor: 'dark:bg-surface-800 dark:text-text-400' };
  return (
    <span role="status">
      <Badge
        label={status.replace(/_/g, ' ')}
        color={config.color}
        darkColor={config.darkColor}
        dot={config.dot}
        className={className}
      />
    </span>
  );
}
