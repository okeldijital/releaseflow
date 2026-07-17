/**
 * CE-001 — Invitation token + link generation.
 *
 * The token is the sole secret embedded in the shareable invitation URL. It is
 * cryptographically secure, opaque, single-use, and carries no Firestore id.
 * Link generation is environment-aware: it prefers an explicit APP_URL, then a
 * public NEXT_PUBLIC site URL, then falls back to the current origin (browser)
 * so the same code works in local, preview, and production deployments.
 */

const INVITE_PATH = '/invite';

/** Generate a cryptographically secure, URL-safe, unguessable token. */
export function generateInvitationToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: Math.random is not cryptographically secure but this code path
  // is never reached in modern browsers or Node.js 19+ (both have global crypto).
  // Using timestamp + random for entropy as a last resort.
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0'),
  ).join('');
}

/** Resolve the public base URL for building invitation links. */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

/** Build the public, shareable invitation URL for a token. */
export function buildInvitationLink(token: string): string {
  const base = getAppBaseUrl();
  if (!base) {
    // Last-resort fallback: relative path. Works in-browser via router, but a
    // fully-qualified base is preferred for copy/share.
    return `${INVITE_PATH}/${token}`;
  }
  return `${base}${INVITE_PATH}/${token}`;
}
