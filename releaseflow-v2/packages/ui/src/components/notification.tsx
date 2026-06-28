type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationAction {
  label: string;
  onClick: () => void;
}

interface NotificationProps {
  type?: NotificationType;
  title: string;
  message?: string;
  action?: NotificationAction;
  dismissible?: boolean;
  onDismiss?: () => void;
  visible?: boolean;
  className?: string;
}

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  action?: NotificationAction;
  timestamp?: string;
}

interface NotificationFeedProps {
  notifications: NotificationItem[];
  onDismiss?: (id: string) => void;
  className?: string;
}

const borderAccentClasses: Record<NotificationType, string> = {
  info: 'border-l-info-500',
  success: 'border-l-success-500',
  warning: 'border-l-warning-500',
  error: 'border-l-danger-500',
};

const iconBgClasses: Record<NotificationType, string> = {
  info: 'bg-info-50 text-info-500',
  success: 'bg-success-50 text-success-500',
  warning: 'bg-warning-50 text-warning-500',
  error: 'bg-danger-50 text-danger-500',
};

const NotifIcon = ({ type }: { type: NotificationType }) => {
  if (type === 'success') {
    return (
      <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2.5 7l3 3L11.5 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg className="h-3 w-3" viewBox="0 0 14 14" fill="currentColor">
        <path d="M7 1a6 6 0 100 12A6 6 0 007 1zM6.25 3.5h1.5v3.5h-1.5V3.5zm0 5.25h1.5v1.5h-1.5v-1.5z" />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg className="h-3 w-3" viewBox="0 0 14 14" fill="currentColor">
        <path d="M6.564.99a1 1 0 011.872 0l5.88 11.56a1 1 0 01-.872 1.45H1.556a1 1 0 01-.872-1.45L7.564.99zM6.25 5.5h1.5v2.5h-1.5V5.5zm0 3.5h1.5v1.5h-1.5V9z" />
      </svg>
    );
  }
  return (
    <svg className="h-3 w-3" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 2.5a.5.5 0 01.5.5v2.5a.5.5 0 01-1 0V4a.5.5 0 01.5-.5zm0 5.5a.5.5 0 110-1 .5.5 0 010 1z" />
    </svg>
  );
};

export function Notification({
  type = 'info',
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
  visible = true,
  className = '',
}: NotificationProps) {
  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`bg-white rounded-md shadow-raised border border-surface-200 p-4 border-l-4
        ${borderAccentClasses[type]}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${iconBgClasses[type]}`}>
          <NotifIcon type={type} />
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
            onClick={onDismiss}
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

export function NotificationFeed({
  notifications,
  onDismiss,
  className = '',
}: NotificationFeedProps) {
  if (notifications.length === 0) return null;

  return (
    <div role="log" aria-live="polite" className={`flex flex-col gap-2 ${className}`}>
      {notifications.map(notif => (
        <Notification
          key={notif.id}
          type={notif.type}
          title={notif.title}
          message={notif.message}
          action={notif.action}
          dismissible={!!onDismiss}
          onDismiss={() => onDismiss?.(notif.id)}
          visible
        />
      ))}
    </div>
  );
}
