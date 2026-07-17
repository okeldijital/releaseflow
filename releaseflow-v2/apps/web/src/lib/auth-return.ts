/**
 * UAT-002 — Persist invitation return path across authentication.
 * Prefer query `return`, fall back to sessionStorage. Never drop invite context.
 */

const RETURN_KEY = 'auth_return_to';
const INVITE_TOKEN_KEY = 'invitation_token';

export function storeAuthReturn(path: string, invitationToken?: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(RETURN_KEY, path);
  if (invitationToken) {
    sessionStorage.setItem(INVITE_TOKEN_KEY, invitationToken);
  }
  console.log('[Invitation Acceptance] ✓ Token/return stored for auth', {
    path,
    hasToken: !!invitationToken,
    tokenPrefix: invitationToken?.slice(0, 8),
  });
}

/**
 * Resolve post-auth destination without losing invitation context.
 * Does not clear invitation_token (needed by /auth/resolve and /invite accept).
 */
export function consumeAuthReturn(): string | null {
  if (typeof window === 'undefined') return null;

  const fromUrl = new URLSearchParams(window.location.search).get('return');
  if (fromUrl) {
    console.log('[Invitation Acceptance] ✓ Return from query', { fromUrl });
    // Keep session copy until accept succeeds
    sessionStorage.setItem(RETURN_KEY, fromUrl);
    return fromUrl;
  }

  const fromSession = sessionStorage.getItem(RETURN_KEY);
  if (fromSession) {
    console.log('[Invitation Acceptance] ✓ Return from sessionStorage', { fromSession });
    return fromSession;
  }

  const inviteToken = sessionStorage.getItem(INVITE_TOKEN_KEY);
  if (inviteToken) {
    const path = `/invite/${inviteToken}`;
    console.log('[Invitation Acceptance] ✓ Return reconstructed from invitation_token');
    return path;
  }

  console.log('[Invitation Acceptance] · No return path found');
  return null;
}

export function clearAuthReturn(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(RETURN_KEY);
}

export function clearInvitationToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(INVITE_TOKEN_KEY);
}

export function getStoredInvitationToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(INVITE_TOKEN_KEY);
}
