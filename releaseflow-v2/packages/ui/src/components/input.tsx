import { type ReactNode, useId } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  disabled,
  id,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy =
    [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-text-700 dark:text-text-300"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-400">
            {leftIcon}
          </span>
        ) : null}

        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`
            h-10 w-full rounded-md border bg-white px-3 text-sm text-text-900
            placeholder:text-text-400
            transition-colors duration-100 ease-out
            dark:bg-surface-900 dark:text-text-100 dark:placeholder:text-text-600
            ${error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500'
              : 'border-surface-300 dark:border-surface-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500'
            }
            ${leftIcon ? 'pl-9' : ''}
            ${rightIcon ? 'pr-9' : ''}
            ${disabled
              ? 'cursor-not-allowed bg-surface-50 text-text-400 opacity-50 dark:bg-surface-800'
              : 'hover:border-surface-400 dark:hover:border-surface-500'
            }
            focus:outline-none
          `.trim()}
          {...props}
        />

        {rightIcon ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-400">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="mt-2 text-xs text-danger-500 dark:text-danger-400">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="mt-2 text-xs text-text-400 dark:text-text-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
  resize?: boolean;
}

export function TextArea({
  label,
  error,
  hint,
  rows = 3,
  resize = true,
  disabled,
  id,
  className = '',
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const describedBy =
    [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <label
          htmlFor={textareaId}
          className="mb-2 block text-sm font-medium text-text-700 dark:text-text-300"
        >
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`
          w-full rounded-md border bg-white px-3 py-2 text-sm text-text-900
          placeholder:text-text-400
          transition-colors duration-100 ease-out
          dark:bg-surface-900 dark:text-text-100 dark:placeholder:text-text-600
          ${error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500'
            : 'border-surface-300 dark:border-surface-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500'
          }
          ${!resize ? 'resize-none' : ''}
          ${disabled
            ? 'cursor-not-allowed bg-surface-50 text-text-400 opacity-50 dark:bg-surface-800'
            : 'hover:border-surface-400 dark:hover:border-surface-500'
          }
          focus:outline-none
        `.trim()}
        {...props}
      />

      {error ? (
        <p id={errorId} className="mt-2 text-xs text-danger-500 dark:text-danger-400">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="mt-2 text-xs text-text-400 dark:text-text-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
