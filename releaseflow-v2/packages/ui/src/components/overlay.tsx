import { type ReactNode, useEffect, useRef, useState, useCallback } from 'react';

interface OverlayProps {
  onClick?: () => void;
  className?: string;
}

export function Overlay({ onClick, className = '' }: OverlayProps) {
  return (
    <div
      className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm animate-fade-in z-50 ${className}`}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const modalSizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  className = '',
}: ModalProps) {
  const [closing, setClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = 'modal-title';
  const descId = 'modal-description';

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    modalRef.current
      ?.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
      ?.[0]?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  if (!open && !closing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
      <Overlay onClick={handleClose} />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={`
          relative z-10 w-full ${modalSizeClasses[size]}
          bg-white dark:bg-surface-900
          rounded-lg shadow-overlay
          border border-surface-200 dark:border-surface-700
          ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}
          ${className}
        `}
      >
        {title || description ? (
          <div className="px-6 pt-6 pb-4 border-b border-surface-100 dark:border-surface-800">
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold text-text-900 dark:text-text-50">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descId} className="mt-1 text-sm text-text-500 dark:text-text-400 leading-5">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="px-6 py-6">{children}</div>

        {footer ? (
          <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type DrawerPosition = 'left' | 'right';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  position?: DrawerPosition;
  title?: string;
  children: ReactNode;
  width?: string;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  position = 'right',
  title,
  children,
  width = 'w-96',
  className = '',
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setMounted(true));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    drawerRef.current
      ?.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
      ?.[0]?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  if (!open) return null;

  const side = position === 'left' ? 'left-0 border-r' : 'right-0 border-l';
  const translate = position === 'left' ? '-translate-x-full' : 'translate-x-full';

  return (
    <div className="fixed inset-0 z-50">
      <div className={mounted ? 'animate-fade-in' : 'opacity-0'}>
        <Overlay onClick={handleClose} />
      </div>
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`
          fixed top-0 bottom-0 ${side} ${width} max-w-full
          bg-white dark:bg-surface-900
          border-surface-200 dark:border-surface-700
          shadow-overlay flex flex-col
          transition-transform duration-300 ease-out
          ${mounted ? 'translate-x-0' : translate}
          ${className}
        `}
      >
        {title ? (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
            <h2 className="text-base font-semibold text-text-900 dark:text-text-50">{title}</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={handleClose}
              className="rounded-md p-1 text-text-400 hover:text-text-700 hover:bg-surface-100 transition-colors duration-100 dark:hover:bg-surface-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
