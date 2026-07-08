import React from 'react';
import { Logo } from './components/Logo';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { Footer } from './components/Footer';
import { OrganizationBranding } from './components/OrganizationBranding';

interface InvitationEmailProps {
  orgName: string;
  inviterName: string;
  roleName: string;
  acceptUrl: string;
  expiresInDays: number;
  orgLogoUrl?: string;
}

export function InvitationEmail({
  orgName, inviterName, roleName,
  acceptUrl, expiresInDays, orgLogoUrl,
}: InvitationEmailProps) {
  return (
    <div style={{
      maxWidth: '560px', margin: '0 auto', padding: '24px',
      backgroundColor: '#ffffff', borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <Logo />
      <OrganizationBranding orgName={orgName} orgLogoUrl={orgLogoUrl} />
      <Header title={`Join ${orgName}`} />
      <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }}>
        {inviterName} has invited you to join <strong>{orgName}</strong> as <strong>{roleName}</strong>.
      </p>
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 24px' }}>
        This invitation expires in {expiresInDays} day{expiresInDays !== 1 ? 's' : ''}.
      </p>
      <div style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <Button href={acceptUrl}>Accept Invitation</Button>
      </div>
      <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 8px' }}>
        If you don&apos;t have an account yet, you&apos;ll be able to create one after clicking the button above.
      </p>
      <Footer orgName={orgName} />
    </div>
  );
}

export function renderInvitationEmail(props: InvitationEmailProps): string {
  return `<!DOCTYPE html>
<html><body><div style="max-width:560px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;font-family:sans-serif">
<div style="text-align:center;padding:8px 0"><span style="font-size:20px;font-weight:800;color:#6366f1">ReleaseFlow</span></div>
<div style="padding:32px 0 16px;text-align:center"><h1 style="font-size:24px;font-weight:700;color:#1a1a2e;margin:0 0 8px">Join ${props.orgName}</h1></div>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px">${props.inviterName} has invited you to join <strong>${props.orgName}</strong> as <strong>${props.roleName}</strong>.</p>
<p style="font-size:14px;color:#6b7280;margin:0 0 24px">This invitation expires in ${props.expiresInDays} days.</p>
<div style="text-align:center;margin:0 0 24px"><a href="${props.acceptUrl}" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Accept Invitation</a></div>
<p style="font-size:13px;color:#9ca3af;margin:0">If you don't have an account yet, you'll be able to create one after clicking the button above.</p>
<div style="padding:24px 0;text-align:center;border-top:1px solid #e5e7eb;margin-top:24px"><p style="font-size:12px;color:#9ca3af;margin:0">&mdash; ReleaseFlow</p></div>
</div></body></html>`;
}

