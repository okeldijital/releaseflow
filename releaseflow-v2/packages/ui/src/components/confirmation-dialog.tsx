import { useState, useEffect, useRef, useCallback } from 'react';

type ConfirmationVariant = 'danger' | 'default';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmationDialogProps) {
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!els.length) return;
        const first = els[0]!;
        const last = els[els.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => cancelRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  if (!open && !closing) return null;

  const confirmBase =
    variant === 'danger'
      ? 'bg-danger-500 text-surface-50 hover:bg-danger-600 active:bg-danger-700'
      : 'bg-primary-500 text-surface-50 hover:bg-primary-600 active:bg-primary-700';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        closing ? 'opacity-0 transition-opacity duration-200' : ''
      }`}
    >
      <div
        className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm ${
          closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={message ? 'confirm-message' : undefined}
        className={`
          relative z-10 w-full max-w-md
          bg-layer-2
          rounded-lg shadow-modal
          border border-surface-200 dark:border-surface-700
          ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}
        `}
      >
        {variant === 'danger' ? (
          <div className="px-6 pt-6 flex gap-4 items-start">
            <div className="shrink-0 h-10 w-10 rounded-full bg-danger-50 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-danger-500"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0 pb-4">
              <h2 id="confirm-title" className="text-base font-semibold text-text-900 dark:text-text-50 leading-6">
                {title}
              </h2>
              {message ? (
                <p id="confirm-message" className="mt-2 text-sm text-text-500 dark:text-text-400 leading-5">
                  {message}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="px-6 pt-6 pb-4">
            <h2 id="confirm-title" className="text-base font-semibold text-text-900 dark:text-text-50">
              {title}
            </h2>
            {message ? (
              <p id="confirm-message" className="mt-2 text-sm text-text-500 dark:text-text-400 leading-5">
                {message}
              </p>
            ) : null}
          </div>
        )}

        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="h-10 px-4 text-sm font-medium text-text-700 dark:text-text-300 rounded-md border border-surface-200 dark:border-surface-600 bg-layer-2 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-100 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`
              h-10 px-4 text-sm font-medium rounded-md shadow-sm
              inline-flex items-center gap-2
              transition-colors duration-100
              disabled:opacity-50 disabled:cursor-not-allowed
              ${confirmBase}
            `}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
