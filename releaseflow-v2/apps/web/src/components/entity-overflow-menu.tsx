'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OverflowMenuPanel,
  type OverflowMenuItem,
  type OverflowMenuPosition,
} from '@releaseflow/ui';

export type EntityOverflowMenuItem = OverflowMenuItem;

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
  const [position, setPosition] = useState<OverflowMenuPosition | null>(null);
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

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    return () => {
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
        <OverflowMenuPanel
          items={items}
          position={position}
          activeIndex={activeIndex}
          itemRefs={itemRefs}
          ariaLabel={ariaLabel}
          onSelect={(item) => {
            if (item.disabled || !item.onClick) return;
            closeMenu();
            item.onClick();
          }}
          onClose={() => closeMenu(false)}
        />
      )}
    </div>
  );
}
