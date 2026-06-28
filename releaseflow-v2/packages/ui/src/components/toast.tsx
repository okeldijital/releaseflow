import { useEffect, useRef, useCallback } from 'react';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  dismissible?: boolean;
  duration?: number;
  onDismiss?: () => void;
  action?: ToastAction;
  visible?: boolean;
  className?: string;
}

const borderAccentClasses: Record<ToastType, string> = {
  info: 'border-l-info-500',
  success: 'border-l-success-500',
  warning: 'border-l-warning-500',
  error: 'border-l-danger-500',
};

const iconBgClasses: Record<ToastType, string> = {
  info: 'bg-info-50 text-info-500',
  success: 'bg-success-50 text-success-500',
  warning: 'bg-warning-50 text-warning-500',
  error: 'bg-danger-50 text-danger-500',
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === 'success') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 4.5h1.5v4h-1.5v-4zm0 6h1.5v1.5h-1.5V10.5z" />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M7.564.99a1 1 0 011.872 0l5.88 11.56a1 1 0 01-.872 1.45H1.556a1 1 0 01-.872-1.45L7.564.99zM7.25 6h1.5v2.5h-1.5V6zm0 4h1.5v1.5h-1.5V10z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zm0 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
  );
};

export function Toast({
  type = 'info',
  title,
  message,
  dismissible = true,
  duration = 5000,
  onDismiss,
  action,
  visible = true,
  className = '',
}: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (!visible || !dismissible) return;
    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration, dismissible, onDismiss]);

  if (!visible) return null;

  const isCritical = type === 'error' || type === 'warning';

  return (
    <div
      role={isCritical ? 'alert' : 'status'}
      aria-live="polite"
      className={`bg-white rounded-md shadow-raised border border-surface-200 p-4 border-l-4 max-w-sm animate-slide-up
        ${borderAccentClasses[type]}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${iconBgClasses[type]}`}>
          <ToastIcon type={type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-900">{title}</p>
          {message ? <p className="text-xs text-text-500 mt-1">{message}</p> : null}
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="text-xs font-medium text-primary-500 hover:text-primary-600 mt-2 transition-colors duration-100"
            >
              {action.label}
            </button>
          ) : null}
        </div>
        {dismissible ? (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded text-text-400 hover:text-text-700 transition-colors duration-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
