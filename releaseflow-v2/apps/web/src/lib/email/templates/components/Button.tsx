import React from 'react';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        padding: '12px 32px',
        backgroundColor: '#bb3928',
        color: '#ffffff',
        textDecoration: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {children}
    </a>
  );
}
