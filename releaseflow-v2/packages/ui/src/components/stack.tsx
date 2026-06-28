import { type ReactNode } from 'react';

type StackDirection = 'row' | 'column';
type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type StackJustify = 'start' | 'center' | 'end' | 'stretch' | 'between' | 'around' | 'evenly';
type StackSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface StackProps {
  direction?: StackDirection;
  size?: StackSize;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  responsiveDirection?: StackDirection;
  children: ReactNode;
  className?: string;
}

const alignClasses: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyClasses: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  stretch: 'justify-stretch',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const sizeClasses: Record<StackSize, string> = {
  none: 'gap-0',
  sm:   'gap-2',
  md:   'gap-4',
  lg:   'gap-6',
  xl:   'gap-8',
};

export function Stack({
  direction = 'column',
  size = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  responsiveDirection,
  children,
  className = '',
}: StackProps) {
  return (
    <div
      className={`flex flex-${direction === 'row' ? 'row' : 'col'} ${alignClasses[align]} ${justifyClasses[justify]} ${sizeClasses[size]} ${wrap ? 'flex-wrap' : ''} ${responsiveDirection ? `sm:flex-${responsiveDirection === 'row' ? 'row' : 'col'}` : ''} ${className}`}
    >
      {children}
    </div>
  );
}
