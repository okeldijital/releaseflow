type SwitchSize = 'sm' | 'md';

interface SwitchProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  className?: string;
}

const trackSize: Record<SwitchSize, string> = {
  sm: 'h-4 w-7',
  md: 'h-5 w-9',
};

const thumbSize: Record<SwitchSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
};

const thumbOff: Record<SwitchSize, string> = {
  sm: 'translate-x-0',
  md: 'translate-x-0',
};

const thumbOn: Record<SwitchSize, string> = {
  sm: 'translate-x-3',
  md: 'translate-x-4',
};

export function Switch({
  label,
  checked = false,
  onChange,
  disabled,
  size = 'md',
  className = '',
}: SwitchProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`
          relative inline-flex items-center rounded-full
          transition-colors duration-200 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1
          ${trackSize[size]}
          ${checked
            ? 'bg-primary-500'
            : 'bg-surface-300 dark:bg-surface-600'}
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-layer-2 shadow-sm
            transition-transform duration-200 ease-out
            ${thumbSize[size]}
            ${checked ? thumbOn[size] : thumbOff[size]}
          `}
        />
      </button>
      {label ? (
        <span className="text-sm leading-5 text-text-700 dark:text-text-300">
          {label}
        </span>
      ) : null}
    </label>
  );
}
