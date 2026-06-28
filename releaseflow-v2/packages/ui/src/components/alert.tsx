import { type MouseEventHandler } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertAction {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

interface AlertProps {
  type?: AlertType;
  title?: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: AlertAction;
  className?: string;
}

interface BannerProps extends AlertProps {}

const containerClasses: Record<AlertType, string> = {
  info:    'bg-info-50    border-info-500    text-info-700',
  success: 'bg-success-50 border-success-500 text-success-700',
  warning: 'bg-warning-50 border-warning-500 text-warning-700',
  error:   'bg-danger-50  border-danger-500  text-danger-700',
};

function AlertIcon({ type }: { type: AlertType }) {
  const paths: Record<AlertType, string> = {
    success:
      'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    error:
      'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
    warning:
      'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
    info:
      'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
  };
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d={paths[type]} clipRule="evenodd" />
    </svg>
  );
}

function AlertBody({
  type,
  title,
  message,
  dismissible,
  onDismiss,
  action,
}: {
  type: AlertType;
  title?: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: AlertAction;
}) {
  return (
    <>
      <AlertIcon type={type} />
      <div className="flex-1 min-w-0">
        {title ? <p className="text-sm font-semibold leading-6">{title}</p> : null}
        {message ? (
          <p className={`text-sm leading-6 opacity-85 ${title ? 'mt-1' : ''}`}>
            {message}
          </p>
        ) : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-sm font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity duration-100"
          >
            {action.label}
          </button>
        ) : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity duration-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
          </svg>
        </button>
      ) : null}
    </>
  );
}

export function Alert({
  type = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  action,
  className = '',
}: AlertProps) {
  return (
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      className={`rounded-md border p-4 flex items-start gap-3 ${containerClasses[type]} ${className}`}
    >
      <AlertBody
        type={type}
        title={title}
        message={message}
        dismissible={dismissible}
        onDismiss={onDismiss}
        action={action}
      />
    </div>
  );
}

export function Banner({
  type = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  action,
  className = '',
}: BannerProps) {
  return (
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'banner'}
      className={`w-full border-b flex items-center gap-3 px-6 py-3 ${containerClasses[type]} ${className}`}
    >
      <AlertBody
        type={type}
        title={title}
        message={message}
        dismissible={dismissible}
        onDismiss={onDismiss}
        action={action}
      />
    </div>
  );
}
