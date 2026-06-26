'use client';

import { useToastStore } from '@/stores/toast-store';

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const bgColors: Record<string, string> = {
  success: 'bg-success-500',
  error: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-info-500',
};

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 shadow-modal p-4 animate-[slideUp_200ms_ease-out]`}
        >
          <span className={`shrink-0 w-5 h-5 rounded-full ${bgColors[t.type]} text-white flex items-center justify-center text-xs font-bold`}>
            {icons[t.type]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-900">{t.title}</p>
            {t.message ? <p className="text-xs text-text-500 mt-0.5">{t.message}</p> : null}
          </div>
          <button onClick={() => remove(t.id)} className="text-text-400 hover:text-text-700 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
