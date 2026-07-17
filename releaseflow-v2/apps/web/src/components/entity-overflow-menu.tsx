'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Portal } from '@/components/portal';

export interface EntityOverflowMenuItem {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  secondaryLabel?: string;
  variant?: 'default' | 'secondary' | 'danger';
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
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [position, setPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const enabledIndexes = useCallback(
    () => items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0),
    [items],
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (align === 'left') {
      setPosition({ top: rect.bottom + 8, left: rect.left });
    } else {
      setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [align]);

  const openMenu = useCallback(() => {
    updatePosition();
    setOpen(true);
    const firstEnabled = items.findIndex((item) => !item.disabled);
    setActiveIndex(firstEnabled);
  }, [items, updatePosition]);

  const closeMenu = useCallback((focusTrigger = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  const focusItem = useCallback((index: number) => {
    const el = itemRefs.current[index];
    if (el) el.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const enabled = enabledIndexes();
        if (enabled.length === 0) return;
        const current = enabled.indexOf(activeIndex);
        const nextOffset = e.key === 'ArrowDown' ? 1 : -1;
        const nextPos = (current + nextOffset + enabled.length) % enabled.length;
        const nextIndex = enabled[nextPos] ?? -1;
        setActiveIndex(nextIndex);
        focusItem(nextIndex);
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        const enabled = enabledIndexes();
        if (enabled.length === 0) return;
        const nextIndex = e.key === 'Home' ? enabled[0] ?? -1 : enabled[enabled.length - 1] ?? -1;
        setActiveIndex(nextIndex);
        focusItem(nextIndex);
        return;
      }
      if (e.key === 'Tab') {
        closeMenu(false);
      }
    };
    const onScroll = () => closeMenu(false);
    const onResize = () => updatePosition();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, activeIndex, closeMenu, enabledIndexes, focusItem, updatePosition]);

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closeMenu(false) : openMenu())}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-default bg-layer-2 text-content-primary transition-colors duration-150 hover:bg-layer-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 4.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 13a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </svg>
      </button>

      {open && position && (
        <Portal>
          <div
            ref={menuRef}
            className="fixed w-56 rounded-xl border border-border-default bg-layer-2 p-1.5 shadow-modal z-modal animate-fade-in"
            style={
              position.left !== undefined
                ? { top: position.top, left: position.left }
                : { top: position.top, right: position.right }
            }
            role="menu"
            aria-orientation="vertical"
            aria-label={ariaLabel}
          >
            {items.map((item, index) => {
              const isActive = index === activeIndex;

              const textColor = item.disabled
                ? 'text-content-label opacity-50 cursor-not-allowed'
                : item.variant === 'danger'
                  ? `text-danger-500 ${isActive ? 'bg-danger-500/10 border-primary-500' : 'hover:bg-danger-500/10'}`
                  : item.variant === 'secondary'
                    ? `text-content-secondary ${isActive ? 'bg-primary-700/20 border-primary-500' : 'hover:bg-primary-700/20 hover:border-primary-500'}`
                    : `text-content-primary ${isActive ? 'bg-primary-700/20 border-primary-500 text-primary-400' : 'hover:bg-layer-3'}`;

              return (
                <div key={item.id}>
                  {item.separatorBefore ? (
                    <div className="my-1 border-t border-border-default" role="separator" />
                  ) : null}
                  <button
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    tabIndex={isActive ? 0 : -1}
                    aria-disabled={item.disabled || undefined}
                    onClick={() => {
                      if (item.disabled || !item.onClick) return;
                      closeMenu();
                      item.onClick();
                    }}
                    className={`
                      flex w-full items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg text-left transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
                      border border-transparent
                      ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                      ${textColor}
                    `.trim()}
                  >
                    <span>{item.label}</span>
                    {item.secondaryLabel ? (
                      <span className="text-xs text-content-label shrink-0 opacity-80">{item.secondaryLabel}</span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
}
