import { type ReactNode, useRef, useEffect } from 'react';

interface CheckboxProps {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  className?: string;
}

export function Checkbox({
  label,
  checked = false,
  onChange,
  indeterminate = false,
  disabled,
  name,
  value,
  className = '',
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={`inline-flex items-center gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        name={name}
        value={value}
        className="peer sr-only"
      />
      <span
        className={`
          inline-flex items-center justify-center h-4 w-4 rounded-sm border shrink-0
          transition-colors duration-100 ease-out
          peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-1
          ${checked || indeterminate
            ? 'bg-primary-500 border-primary-500'
            : 'border-surface-300 bg-layer-2 dark:border-surface-600'}
        `}
      >
        {checked && !indeterminate ? (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
        {indeterminate ? (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="2" y="5" width="8" height="2" rx="1" />
          </svg>
        ) : null}
      </span>
      {label ? (
        <span className="text-sm leading-5 text-text-700 dark:text-text-300">
          {label}
        </span>
      ) : null}
    </label>
  );
}

interface RadioProps {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  className?: string;
}

export function Radio({
  label,
  checked = false,
  onChange,
  disabled,
  name,
  value,
  className = '',
}: RadioProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        name={name}
        value={value}
        className="peer sr-only"
      />
      <span
        className={`
          inline-flex items-center justify-center h-4 w-4 rounded-full border shrink-0
          transition-colors duration-100 ease-out
          peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-1
          ${checked
            ? 'border-primary-500 bg-layer-2'
            : 'border-surface-300 bg-layer-2 dark:border-surface-600'}
        `}
      >
        {checked ? (
          <span className="h-2 w-2 rounded-full bg-primary-500" />
        ) : null}
      </span>
      {label ? (
        <span className="text-sm leading-5 text-text-700 dark:text-text-300">
          {label}
        </span>
      ) : null}
    </label>
  );
}
