'use client';

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export interface OverflowMenuItem {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  secondaryLabel?: string;
  variant?: 'default' | 'secondary' | 'danger';
  separatorBefore?: boolean;
  icon?: ReactNode;
}

interface PortalProps {
  children: ReactNode;
  container?: HTMLElement | null;
}

function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, container ?? document.body);
}

const MENU_PANEL =
  'fixed w-56 rounded-xl border border-border-default bg-layer-2 p-1.5 shadow-modal z-modal animate-fade-in';

const MENU_ITEM_BASE =
  'flex w-full items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg text-left transition-colors duration-150 ' +
  'border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40';

function itemTextColor(item: OverflowMenuItem, isActive: boolean): string {
  if (item.disabled) return 'text-content-label opacity-50 cursor-not-allowed';
  if (item.variant === 'danger') {
    return `text-danger-500 ${isActive ? 'bg-danger-500/10 border-primary-500' : 'hover:bg-danger-500/10'}`;
  }
  if (item.variant === 'secondary') {
    return `text-content-secondary ${isActive ? 'bg-primary-700/20 border-primary-500' : 'hover:bg-primary-700/20 hover:border-primary-500'}`;
  }
  return `text-content-primary ${isActive ? 'bg-primary-700/20 border-primary-500 text-primary-400' : 'hover:bg-layer-3'}`;
}

interface MenuItemsProps {
  items: OverflowMenuItem[];
  activeIndex: number;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  onSelect: (item: OverflowMenuItem) => void;
}

function MenuItems({ items, activeIndex, itemRefs, onSelect }: MenuItemsProps) {
  return (
    <>
      {items.map((item, index) => {
        const isActive = index === activeIndex;
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
              onClick={() => onSelect(item)}
              className={`
                ${MENU_ITEM_BASE}
                ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${itemTextColor(item, isActive)}
              `.trim()}
            >
              <span className="flex items-center gap-2 min-w-0">
                {item.icon ? (
                  <span className="shrink-0 text-content-label">{item.icon}</span>
                ) : null}
                <span className="truncate">{item.label}</span>
              </span>
              {item.secondaryLabel ? (
                <span className="text-xs text-content-label shrink-0 opacity-80">
                  {item.secondaryLabel}
                </span>
              ) : null}
            </button>
          </div>
        );
      })}
    </>
  );
}

export interface OverflowMenuPosition {
  top: number;
  left?: number;
  right?: number;
}

export interface OverflowMenuPanelProps {
  items: OverflowMenuItem[];
  position: OverflowMenuPosition;
  activeIndex: number;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  onSelect: (item: OverflowMenuItem) => void;
  onClose: () => void;
  ariaLabel?: string;
  header?: ReactNode;
  /** Close when a pointerdown lands outside the panel. */
  dismissOnOutsideClick?: boolean;
}

/**
 * The shared dropdown panel rendered by every menu in ReleaseFlow.
 * Renders the same dark surface, spacing, corner radius, hover states and
 * active colours regardless of whether it is an overflow menu or the account
 * menu. Keep all menu styling here so a single implementation covers every menu.
 */
export function OverflowMenuPanel({
  items,
  position,
  activeIndex,
  itemRefs,
  onSelect,
  onClose,
  ariaLabel,
  header,
  dismissOnOutsideClick = true,
}: OverflowMenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dismissOnOutsideClick) return;
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [dismissOnOutsideClick, onClose]);

  return (
    <Portal>
      <div
        ref={panelRef}
        className={MENU_PANEL}
        style={
          position.left !== undefined
            ? { top: position.top, left: position.left }
            : { top: position.top, right: position.right }
        }
        role="menu"
        aria-orientation="vertical"
        aria-label={ariaLabel}
      >
        {header}
        <MenuItems
          items={items}
          activeIndex={activeIndex}
          itemRefs={itemRefs}
          onSelect={onSelect}
        />
      </div>
    </Portal>
  );
}

export { Portal as OverflowMenuPortal };
