import { type ReactNode } from 'react';

type DividerOrientation = 'horizontal' | 'vertical';

interface DividerProps {
  orientation?: DividerOrientation;
  label?: ReactNode;
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  label,
  className = '',
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`w-px self-stretch bg-surface-200 shrink-0 ${className}`}
      />
    );
  }

  if (label) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <hr className="flex-1 border-0 border-t border-surface-200" />
        <span className="text-xs text-text-400 shrink-0">{label}</span>
        <hr className="flex-1 border-0 border-t border-surface-200" />
      </div>
    );
  }

  return (
    <hr className={`border-0 border-t border-surface-200 ${className}`} role="separator" />
  );
}
