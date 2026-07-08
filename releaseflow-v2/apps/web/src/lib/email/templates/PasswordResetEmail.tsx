import React from 'react';
import { Logo } from './components/Logo';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { Footer } from './components/Footer';

interface PasswordResetEmailProps {
  resetUrl: string;
  expiresInMinutes: number;
}

export function PasswordResetEmail({ resetUrl, expiresInMinutes }: PasswordResetEmailProps) {
  return (
    <div style={{
      maxWidth: '560px', margin: '0 auto', padding: '24px',
      backgroundColor: '#ffffff', borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <Logo />
      <Header title="Password Reset" />
      <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }}>
        We received a request to reset your password. Click the button below to set a new password.
      </p>
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 24px' }}>
        This link expires in {expiresInMinutes} minutes.
      </p>
      <div style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <Button href={resetUrl}>Reset Password</Button>
      </div>
      <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 8px' }}>
        If you didn&apos;t request a password reset, you can safely ignore this email.
      </p>
      <Footer />
    </div>
  );
}
