interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = { sm: 'h-1.5', md: 'h-2' };

export function ProgressBar({ value, max = 100, color, size = 'md', showLabel = false, className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`w-full ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-surface-200 overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${color ?? 'bg-primary-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? <span className="text-xs text-text-500 mt-1 block">{pct}%</span> : null}
    </div>
  );
}

interface HealthBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function HealthBar({ value, max = 100, className = '' }: HealthBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = pct >= 100 ? 'bg-success-500' : pct >= 70 ? 'bg-warning-500' : 'bg-danger-500';
  return <ProgressBar value={value} max={max} color={color} size="sm" className={className} />;
}
