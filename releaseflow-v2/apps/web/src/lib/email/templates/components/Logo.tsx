import React from 'react';

export function Logo() {
  return (
    <div style={{ textAlign: 'center' as const, padding: '8px 0' }}>
      <span style={{
        fontSize: '20px', fontWeight: 800, color: '#6366f1',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        letterSpacing: '-0.5px',
      }}>
        ReleaseFlow
      </span>
    </div>
  );
}
