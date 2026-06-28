type TagVariant = 'filled' | 'outline';
type TagColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type TagSize = 'sm' | 'md';

interface TagProps {
  label: string;
  variant?: TagVariant;
  color?: TagColor;
  size?: TagSize;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const filledColorClasses: Record<TagColor, string> = {
  primary: 'bg-primary-50 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-info-50 text-info-700',
  neutral: 'bg-surface-100 text-text-500',
};

const outlineColorClasses: Record<TagColor, string> = {
  primary: 'border-primary-500 text-primary-700',
  secondary: 'border-secondary-500 text-secondary-700',
  success: 'border-success-500 text-success-700',
  warning: 'border-warning-500 text-warning-700',
  danger: 'border-danger-500 text-danger-700',
  info: 'border-info-500 text-info-700',
  neutral: 'border-surface-300 text-text-500',
};

const sizeClasses: Record<TagSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Tag({
  label,
  variant = 'filled',
  color = 'neutral',
  size = 'sm',
  removable = false,
  onRemove,
  className = '',
}: TagProps) {
  const colorClasses = variant === 'filled' ? filledColorClasses[color] : outlineColorClasses[color];
  const borderClass = variant === 'outline' ? 'border' : '';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${colorClasses} ${borderClass} ${className}`}>
      {label}
      {removable ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="inline-flex items-center justify-center rounded-full hover:opacity-70 transition-opacity duration-100"
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3.646 3.646a.5.5 0 01.708 0L6 5.293l1.646-1.647a.5.5 0 01.708.708L6.707 6l1.647 1.646a.5.5 0 01-.708.708L6 6.707 4.354 8.354a.5.5 0 01-.708-.708L5.293 6 3.646 4.354a.5.5 0 010-.708z" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
