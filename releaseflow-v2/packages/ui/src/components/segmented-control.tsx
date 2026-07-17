type SegmentedControlSize = 'sm' | 'md';

interface SegmentedControlOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  size?: SegmentedControlSize;
  fullWidth?: boolean;
  className?: string;
}

const optionSize: Record<SegmentedControlSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      className={`
        bg-surface-800
        border border-surface-700
        rounded-md p-1 inline-flex overflow-x-auto
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`
              shrink-0 rounded-sm font-medium whitespace-nowrap
              transition-colors duration-100 ease-out
              ${optionSize[size]}
              ${active
                ? 'bg-layer-2 text-content-primary shadow-card'
                : 'text-content-secondary hover:text-content-primary'}
              ${opt.disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
              ${fullWidth ? 'flex-1 text-center' : ''}
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
