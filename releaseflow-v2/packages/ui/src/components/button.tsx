import { type ReactNode, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'outline' | 'destructive-outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-surface-50 shadow-sm hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-transform',
  secondary:
    'bg-secondary-100 text-text-800 hover:bg-secondary-200 active:bg-secondary-300 active:scale-[0.98] transition-transform',
  tertiary:
    'border border-surface-300 bg-layer-2 text-text-700 shadow-sm hover:bg-surface-50 hover:border-surface-400 active:scale-[0.98] transition-transform',
  outline:
    'border border-surface-300 bg-layer-2 text-text-700 shadow-sm hover:bg-surface-50 hover:border-surface-400 active:scale-[0.98] transition-transform',
  ghost:
    'text-text-600 hover:bg-surface-100 hover:text-text-900',
  danger:
    'bg-danger-500 text-surface-50 shadow-sm hover:bg-danger-600 active:bg-danger-700 active:scale-[0.98] transition-transform',
  'destructive-outline':
    'border border-danger-500 text-danger-600 bg-transparent hover:bg-danger-50 active:scale-[0.98] transition-transform',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-md gap-2',
  md: 'h-10 px-4 text-sm rounded-md gap-2',
  lg: 'h-12 px-6 text-sm rounded-md gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 ease-out select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={size} /> : icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  );
}

function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <svg
      className={`animate-spin shrink-0 ${dim}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
