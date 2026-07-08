import React from 'react';

interface FooterProps {
  orgName?: string;
}

export function Footer({ orgName }: FooterProps) {
  return (
    <div style={{
      padding: '24px 0', textAlign: 'center' as const,
      borderTop: '1px solid #e5e7eb', marginTop: '24px',
    }}>
      <p style={{
        fontSize: '12px', color: '#9ca3af', margin: '0 0 4px',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        {orgName ? `${orgName} ` : ''}&mdash; ReleaseFlow
      </p>
      <p style={{
        fontSize: '12px', color: '#9ca3af', margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        You received this email because you have an account with ReleaseFlow.
      </p>
    </div>
  );
}
