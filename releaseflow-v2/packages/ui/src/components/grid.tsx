import { type ReactNode } from 'react';

type GridSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface GridProps {
  cols?: number;
  colsSm?: number;
  colsMd?: number;
  colsLg?: number;
  gap?: GridSize;
  children: ReactNode;
  className?: string;
}

const sizeClasses: Record<GridSize, string> = {
  none: 'gap-0',
  sm:   'gap-2',
  md:   'gap-4',
  lg:   'gap-6',
  xl:   'gap-8',
};

export function Grid({
  cols = 1,
  colsSm,
  colsMd,
  colsLg,
  gap = 'md',
  children,
  className = '',
}: GridProps) {
  const colsClass = `grid-cols-${cols}`;
  const smClass = colsSm ? `sm:grid-cols-${colsSm}` : '';
  const mdClass = colsMd ? `md:grid-cols-${colsMd}` : '';
  const lgClass = colsLg ? `lg:grid-cols-${colsLg}` : '';

  return (
    <div className={`grid ${colsClass} ${smClass} ${mdClass} ${lgClass} ${sizeClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}
