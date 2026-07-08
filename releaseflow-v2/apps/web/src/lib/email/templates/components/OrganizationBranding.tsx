import React from 'react';

interface OrganizationBrandingProps {
  orgName?: string;
  orgLogoUrl?: string;
}

export function OrganizationBranding({ orgName, orgLogoUrl }: OrganizationBrandingProps) {
  if (!orgName && !orgLogoUrl) return null;
  return (
    <div style={{ textAlign: 'center' as const, padding: '4px 0 16px' }}>
      {orgLogoUrl && (
        <img
          src={orgLogoUrl}
          alt={orgName || 'Organization'}
          style={{ maxHeight: '40px', maxWidth: '160px' }}
        />
      )}
      {orgName && !orgLogoUrl && (
        <span style={{
          fontSize: '14px', color: '#6b7280',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          {orgName}
        </span>
      )}
    </div>
  );
}
