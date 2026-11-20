interface SwitchProps {
  label?: string;
  'aria-label'?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Switch({
  label,
  'aria-label': ariaLabel,
  checked = false,
  onChange,
  disabled,
  size = 'md',
  className = '',
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`studio-switch ${className}`}
      data-size={size}
    >
      {label && <span>{label}</span>}
      <span className="studio-switch-track" aria-hidden="true">
        <span className="studio-switch-thumb" />
      </span>
    </button>
  );
}
