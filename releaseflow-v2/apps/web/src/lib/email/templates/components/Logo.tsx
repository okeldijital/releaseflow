import React from 'react';

/**
 * BRAND-001 — Email logo references the canonical public asset.
 * Absolute URL required for email clients; falls back to product name text
 * only when NEXT_PUBLIC_APP_URL is unset (local template preview).
 */
const LOGO_PATH = '/icons/ReleaseFlow-Logo.svg';

function logoSrc(): string | null {
  const base =
    process.env.NEXT_PUBLIC_APP_URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || process.env.VERCEL_PROJECT_PRODUCTION_URL
    || '';
  if (!base) return null;
  const origin = base.startsWith('http') ? base.replace(/\/$/, '') : `https://${base.replace(/\/$/, '')}`;
  return `${origin}${LOGO_PATH}`;
}

export function Logo() {
  const src = logoSrc();
  return (
    <div style={{ textAlign: 'center' as const, padding: '12px 0' }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          width={96}
          height={96}
          alt="ReleaseFlow"
          style={{
            display: 'inline-block',
            width: 96,
            height: 'auto',
            maxWidth: 96,
            border: 0,
          }}
        />
      ) : (
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#B14512',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          letterSpacing: '-0.3px',
        }}>
          ReleaseFlow
        </span>
      )}
    </div>
  );
}
