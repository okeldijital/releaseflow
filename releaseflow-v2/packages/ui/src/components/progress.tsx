interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-2',
};

export function ProgressBar({
  value,
  max = 100,
  color,
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;

  return (
    <div
      className={`w-full ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={`${pct}%`}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            color ?? 'bg-primary-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <span className="mt-2 block text-xs font-medium text-text-500 dark:text-text-400">
          {pct}%
        </span>
      ) : null}
    </div>
  );
}

interface HealthBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function HealthBar({ value, max = 100, className = '' }: HealthBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  const color =
    pct >= 70
      ? 'bg-success-500'
      : pct >= 40
      ? 'bg-warning-500'
      : 'bg-danger-500';

  return (
    <ProgressBar
      value={value}
      max={max}
      color={color}
      size="sm"
      className={className}
    />
  );
}
