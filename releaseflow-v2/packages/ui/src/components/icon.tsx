import { type ReactNode } from 'react';

type IconSize = 'sm' | 'md' | 'lg';

interface IconProps {
  children: ReactNode;
  size?: IconSize;
  className?: string;
  color?: string;
  label?: string;
}

const sizeClasses: Record<IconSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function Icon({
  children,
  size = 'md',
  className = '',
  color = 'text-text-500',
  label,
}: IconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${color} ${className}`}
      aria-hidden={!label ? true : undefined}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {children}
    </span>
  );
}
