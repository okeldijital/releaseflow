import { type ReactNode } from 'react';

type ContainerSize = 'narrow' | 'standard' | 'wide';

interface ContainerProps {
  size?: ContainerSize;
  children: ReactNode;
  className?: string;
}

const sizeClasses: Record<ContainerSize, string> = {
  narrow: 'max-w-2xl',
  standard: 'max-w-5xl',
  wide: 'max-w-7xl',
};

export function Container({
  size = 'standard',
  children,
  className = '',
}: ContainerProps) {
  return (
    <div className={`mx-auto px-4 md:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}
