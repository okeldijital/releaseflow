type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  color?: string;
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
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium tracking-wide
        ${sizeClasses[size]} ${color} ${className}
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

const statusConfig: Record<string, { color: string; dot?: boolean }> = {
  active:                   { color: 'bg-success-50 text-success-600', dot: true },
  approved:                 { color: 'bg-success-50 text-success-600', dot: true },
  completed:                { color: 'bg-success-50 text-success-600', dot: true },
  released:                 { color: 'bg-success-50 text-success-600', dot: true },
  ready:                    { color: 'bg-success-50 text-success-600', dot: true },
  on_budget:                { color: 'bg-success-50 text-success-600', dot: true },
  ready_for_distribution:   { color: 'bg-success-50 text-success-600', dot: true },
  in_progress:              { color: 'bg-info-50 text-info-600', dot: true },
  in_review:                { color: 'bg-info-50 text-info-600', dot: true },
  review:                   { color: 'bg-info-50 text-info-600' },
  pending:                  { color: 'bg-info-50 text-info-600' },
  planning:                 { color: 'bg-info-50 text-info-600' },
  generated:                { color: 'bg-info-50 text-info-600' },
  sent:                     { color: 'bg-info-50 text-info-600' },
  draft:                    { color: 'bg-surface-100 text-text-500' },
  planned:                  { color: 'bg-surface-100 text-text-500' },
  archived:                 { color: 'bg-surface-100 text-text-400' },
  inactive:                 { color: 'bg-surface-100 text-text-400' },
  at_risk:                  { color: 'bg-warning-50 text-warning-700', dot: true },
  overdue:                  { color: 'bg-warning-50 text-warning-700', dot: true },
  warning:                  { color: 'bg-warning-50 text-warning-700', dot: true },
  on_hold:                  { color: 'bg-warning-50 text-warning-700' },
  blocked:                  { color: 'bg-danger-50 text-danger-600', dot: true },
  rejected:                 { color: 'bg-danger-50 text-danger-600' },
  critical:                 { color: 'bg-danger-50 text-danger-600', dot: true },
  over_budget:              { color: 'bg-danger-50 text-danger-600', dot: true },
  cancelled:                { color: 'bg-danger-50 text-danger-600' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { color: 'bg-surface-100 text-text-600' };
  return (
    <span role="status">
      <Badge
        label={status.replace(/_/g, ' ')}
        color={config.color}
        dot={config.dot}
        className={className}
      />
    </span>
  );
}
