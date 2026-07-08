import React from 'react';

interface HeaderProps {
  title: string;
  orgName?: string;
}

export function Header({ title, orgName }: HeaderProps) {
  return (
    <div style={{ padding: '32px 0 16px', textAlign: 'center' as const }}>
      <h1 style={{
        fontSize: '24px', fontWeight: 700, color: '#1a1a2e',
        margin: '0 0 8px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        {title}
      </h1>
      {orgName && (
        <p style={{
          fontSize: '14px', color: '#6b7280', margin: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          {orgName}
        </p>
      )}
    </div>
  );
}
