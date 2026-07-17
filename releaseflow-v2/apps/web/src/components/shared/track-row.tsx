'use client';

import { type ReactNode } from 'react';

/**
 * Shared TrackRow / TrackList
 * ───────────────────────────────────────────────────────────────────────
 * Consolidates the hover, focus and selected styling for every track row in
 * the app (Release → Tracks, Tracks Library, picker dialogs, link dialogs).
 *
 * Root cause of BUILD-117: individual pages applied `hover:bg-surface-50`
 * (a near-white light surface) inside dark `bg-layer-2` containers that hold
 * light `text-content-*` text. That produced light-on-light / white-on-white
 * rows. The hover surface is now owned here and always resolves to the dark
 * elevated surface (`layer-3`), so text and icons stay readable on hover.
 */

const ROW_BASE =
  'group w-full text-left flex items-center gap-4 px-5 py-3 transition-colors duration-100 outline-none ' +
  'focus-visible:bg-layer-3 focus-visible:ring-2 focus-visible:ring-primary-500/40 ' +
  'hover:bg-layer-3';

const ROW_SELECTED = 'bg-layer-3';

export interface TrackRowProps {
  children: ReactNode;
  /** Render as a native interactive element. Defaults to `button`. */
  as?: 'button' | 'div';
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  selected?: boolean;
  className?: string;
  'aria-label'?: string;
  role?: string;
  tabIndex?: number;
}

/**
 * The interactive row primitive. Owns the hover/focus/selected surface and the
 * content hierarchy tokens. Pass any track content as `children`.
 */
export function TrackRow({
  children,
  as = 'button',
  onClick,
  onKeyDown,
  selected = false,
  className = '',
  role,
  tabIndex,
  ...rest
}: TrackRowProps) {
  const classes = `${ROW_BASE} ${selected ? ROW_SELECTED : ''} ${className}`.trim();

  if (as === 'div') {
    return (
      <div
        role={role ?? 'button'}
        tabIndex={tabIndex ?? 0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={classes}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes} {...rest}>
      {children}
    </button>
  );
}

export interface TrackListProps {
  children: ReactNode;
  className?: string;
  /** Divide rows with a hairline border. */
  divided?: boolean;
}

/**
 * Container that frames a set of TrackRow items. Mirrors the existing
 * `rounded-xl border bg-layer-2 overflow-hidden` card used across pages so
 * rows inherit a consistent dark surface.
 */
export function TrackList({ children, className = '', divided = true }: TrackListProps) {
  return (
    <div
      className={`rounded-xl border border-divider bg-layer-2 shadow-card overflow-hidden ${
        divided ? 'divide-y divide-divider' : ''
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}
