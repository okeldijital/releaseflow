'use client';

import { useEffect, useRef, useState } from 'react';

export interface EntityOverflowMenuItem {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  secondaryLabel?: string;
  variant?: 'default' | 'danger';
  separatorBefore?: boolean;
}

interface EntityOverflowMenuProps {
  items: EntityOverflowMenuItem[];
  align?: 'left' | 'right';
  'aria-label'?: string;
}

export function EntityOverflowMenu({
  items,
  align = 'right',
  'aria-label': ariaLabel = 'More actions',
}: EntityOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-200 bg-layer-2 text-text-500 hover:bg-surface-50 hover:text-text-700 dark:border-surface-700 dark:bg-surface-900 dark:hover:bg-surface-800 dark:hover:text-text-200 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 4.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 13a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 rounded-xl border border-surface-200 bg-layer-2 p-1.5 shadow-modal z-50 animate-fade-in dark:border-surface-700 dark:bg-surface-900`}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item) => (
            <div key={item.id}>
              {item.separatorBefore ? (
                <div className="my-1 border-t border-surface-100 dark:border-surface-700/60" role="separator" />
              ) : null}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled || !item.onClick) return;
                  setOpen(false);
                  item.onClick();
                }}
                className={`
                  flex w-full items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg text-left transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
                  ${item.disabled ? 'cursor-default opacity-60' : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'}
                  ${item.variant === 'danger' && !item.disabled
                    ? 'text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/20'
                    : 'text-text-700 dark:text-text-300 hover:text-text-900 dark:hover:text-surface-50'}
                `}
              >
                <span>{item.label}</span>
                {item.secondaryLabel ? (
                  <span className="text-xs text-text-400 shrink-0">{item.secondaryLabel}</span>
                ) : null}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}