type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  color?: string;
  size?: BadgeSize;
  className?: string;
}

const sizeClasses: Record<BadgeSize, string> = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-0.5 text-xs' };

export function Badge({ label, color = 'bg-surface-100 text-text-600', size = 'sm', className = '' }: BadgeProps) {
  return <span className={`inline-block rounded-full font-medium capitalize ${sizeClasses[size]} ${color} ${className}`}>{label}</span>;
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-success-50 text-success-500',
  approved: 'bg-success-50 text-success-500',
  completed: 'bg-success-50 text-success-500',
  released: 'bg-success-50 text-success-500',
  ready: 'bg-success-50 text-success-500',
  on_budget: 'bg-success-50 text-success-500',
  in_progress: 'bg-info-50 text-info-500',
  in_review: 'bg-info-50 text-info-500',
  review: 'bg-info-50 text-info-500',
  pending: 'bg-info-50 text-info-500',
  planning: 'bg-info-50 text-info-500',
  draft: 'bg-surface-100 text-text-500',
  planned: 'bg-surface-100 text-text-500',
  at_risk: 'bg-warning-50 text-warning-500',
  overdue: 'bg-warning-50 text-warning-500',
  warning: 'bg-warning-50 text-warning-500',
  blocked: 'bg-danger-50 text-danger-500',
  rejected: 'bg-danger-50 text-danger-500',
  critical: 'bg-danger-50 text-danger-500',
  over_budget: 'bg-danger-50 text-danger-500',
  archived: 'bg-surface-100 text-text-400',
  inactive: 'bg-surface-100 text-text-400',
  generated: 'bg-info-50 text-info-500',
  sent: 'bg-info-50 text-info-500',
  on_hold: 'bg-warning-50 text-warning-500',
  cancelled: 'bg-danger-50 text-danger-500',
  ready_for_distribution: 'bg-success-50 text-success-500',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const color = statusColors[status] ?? 'bg-surface-100 text-text-600';
  return <Badge label={status.replace(/_/g, ' ')} color={color} className={className} />;
}
