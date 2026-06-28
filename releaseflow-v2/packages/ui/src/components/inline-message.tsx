type InlineMessageType = 'info' | 'success' | 'warning' | 'error';

interface InlineMessageProps {
  type?: InlineMessageType;
  message: string;
  className?: string;
}

const colorClasses: Record<InlineMessageType, string> = {
  info: 'text-info-500',
  success: 'text-success-500',
  warning: 'text-warning-500',
  error: 'text-danger-500',
};

const InlineIcon = ({ type }: { type: InlineMessageType }) => {
  if (type === 'success') {
    return (
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2.5 7l3 3L11.5 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 14 14" fill="currentColor">
        <path d="M7 1a6 6 0 100 12A6 6 0 007 1zM6.25 3.5h1.5v3.5h-1.5V3.5zm0 5.25h1.5v1.5h-1.5v-1.5z" />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 14 14" fill="currentColor">
        <path d="M6.564.99a1 1 0 011.872 0l5.88 11.56a1 1 0 01-.872 1.45H1.556a1 1 0 01-.872-1.45L7.564.99zM6.25 5.5h1.5v2.5h-1.5V5.5zm0 3.5h1.5v1.5h-1.5V9z" />
      </svg>
    );
  }
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 2.5a.5.5 0 01.5.5v2.5a.5.5 0 01-1 0V4a.5.5 0 01.5-.5zm0 5.5a.5.5 0 110-1 .5.5 0 010 1z" />
    </svg>
  );
};

export function InlineMessage({
  type = 'info',
  message,
  className = '',
}: InlineMessageProps) {
  const isError = type === 'error';

  return (
    <span
      role={isError ? 'alert' : 'status'}
      className={`inline-flex items-center gap-2 text-xs ${colorClasses[type]} ${className}`}
    >
      <InlineIcon type={type} />
      {message}
    </span>
  );
}
