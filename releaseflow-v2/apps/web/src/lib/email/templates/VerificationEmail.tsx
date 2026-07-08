import React from 'react';
import { Logo } from './components/Logo';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { Footer } from './components/Footer';

interface VerificationEmailProps {
  verifyUrl: string;
  orgName?: string;
}

export function VerificationEmail({ verifyUrl, orgName }: VerificationEmailProps) {
  return (
    <div style={{
      maxWidth: '560px', margin: '0 auto', padding: '24px',
      backgroundColor: '#ffffff', borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <Logo />
      <Header title="Verify Your Email" orgName={orgName} />
      <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6', margin: '0 0 24px' }}>
        Please verify your email address to get started with ReleaseFlow.
      </p>
      <div style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <Button href={verifyUrl}>Verify Email</Button>
      </div>
      <Footer orgName={orgName} />
    </div>
  );
}
