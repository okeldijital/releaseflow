import React from 'react';
import { Logo } from './components/Logo';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { Footer } from './components/Footer';

interface ReviewRequestEmailProps {
  requesterName: string;
  entityType: string;
  entityTitle: string;
  reviewUrl: string;
  orgName?: string;
}

export function ReviewRequestEmail({
  requesterName, entityType, entityTitle,
  reviewUrl, orgName,
}: ReviewRequestEmailProps) {
  return (
    <div style={{
      maxWidth: '560px', margin: '0 auto', padding: '24px',
      backgroundColor: '#ffffff', borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <Logo />
      <Header title="Review Requested" orgName={orgName} />
      <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }}>
        {requesterName} is requesting your review on <strong>{entityTitle}</strong> ({entityType}).
      </p>
      <div style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <Button href={reviewUrl}>Review Now</Button>
      </div>
      <Footer orgName={orgName} />
    </div>
  );
}
