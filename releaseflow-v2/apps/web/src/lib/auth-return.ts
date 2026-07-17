/**
 * ARCH-001 — Invitation token is the only client-side invitation state.
 *
 * sessionStorage may hold navigation state only:
 *   - invitationToken
 *   - returnUrl
 *   - pendingInvitation
 *
 * Business data (organizationId, roles, email, status, expiry, etc.) must
 * always be loaded from the Firestore invitation document. Never cache it
 * in the browser as a source of truth.
 */

const RETURN_KEY = 'auth_return_to';
const INVITE_TOKEN_KEY = 'invitation_token';
const PENDING_INVITE_KEY = 'pending_invitation';
/** Legacy key from UAT-005 — purged on read/write so business fields never linger. */
const LEGACY_INVITE_CONTEXT_KEY = 'invitation_context';

const FLOW_LOG = '[Invitation Flow]';

/** Navigation-only state for resuming the invitation flow. */
export interface InvitationNavigationState {
  token: string;
  returnUrl: string;
  pendingInvitation: true;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/** Remove any legacy business-data blob from sessionStorage. */
function purgeLegacyInvitationContext(): void {
  if (!isBrowser()) return;
  if (sessionStorage.getItem(LEGACY_INVITE_CONTEXT_KEY) != null) {
    sessionStorage.removeItem(LEGACY_INVITE_CONTEXT_KEY);
    console.log(FLOW_LOG, '· Purged legacy invitation_context (business data not allowed client-side)');
  }
}

/**
 * Persist navigation state so auth can resume the invite flow.
 * Stores only token + returnUrl + pending flag — never roles or org metadata.
 */
export function storeInvitationToken(token: string, returnUrl?: string): void {
  if (!isBrowser()) return;
  purgeLegacyInvitationContext();

  const normalizedToken = token.trim();
  if (!normalizedToken) return;

  const path = returnUrl || `/invite/${normalizedToken}`;
  sessionStorage.setItem(INVITE_TOKEN_KEY, normalizedToken);
  sessionStorage.setItem(RETURN_KEY, path);
  sessionStorage.setItem(PENDING_INVITE_KEY, 'true');

  console.log(FLOW_LOG, '✓ Token stored (navigation only)', {
    tokenPrefix: normalizedToken.slice(0, 8),
    returnUrl: path,
  });
}

/**
 * @deprecated Use storeInvitationToken. Kept for call sites that pass a return path.
 * Never accepts or stores organization/role/email fields.
 */
export function storeInvitationContext(nav: {
  token: string;
  returnUrl?: string;
  /** @deprecated Ignored — business data must come from Firestore. */
  organizationId?: string;
  invitedEmail?: string;
  platformRole?: string;
  professionalRole?: string;
}): void {
  storeInvitationToken(nav.token, nav.returnUrl);
}

/**
 * Read navigation state only (token + return URL).
 * Does not include organization, roles, or invitation metadata.
 */
export function getInvitationNavigationState(): InvitationNavigationState | null {
  if (!isBrowser()) return null;
  purgeLegacyInvitationContext();

  const token = sessionStorage.getItem(INVITE_TOKEN_KEY)?.trim();
  if (!token) return null;

  const returnUrl = sessionStorage.getItem(RETURN_KEY) || `/invite/${token}`;
  return {
    token,
    returnUrl,
    pendingInvitation: true,
  };
}

/**
 * @deprecated Prefer getInvitationNavigationState / getStoredInvitationToken.
 * Returns navigation-only shape (token + returnUrl). Business fields are never present.
 */
export function getInvitationContext(): {
  token: string;
  returnUrl: string;
} | null {
  const nav = getInvitationNavigationState();
  if (!nav) return null;
  return { token: nav.token, returnUrl: nav.returnUrl };
}

/** True when a pending invitation token must take precedence over generic onboarding. */
export function hasPendingInvitation(): boolean {
  if (!isBrowser()) return false;
  purgeLegacyInvitationContext();
  const token = sessionStorage.getItem(INVITE_TOKEN_KEY)?.trim();
  if (token) return true;
  return sessionStorage.getItem(PENDING_INVITE_KEY) === 'true' && !!token;
}

export function clearInvitationContext(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(LEGACY_INVITE_CONTEXT_KEY);
  sessionStorage.removeItem(INVITE_TOKEN_KEY);
  sessionStorage.removeItem(PENDING_INVITE_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  console.log(FLOW_LOG, '✓ Invitation navigation state cleared');
}

/**
 * Persist return path for post-auth redirect. When invitationToken is provided,
 * also marks pending invitation (token only — no business data).
 */
export function storeAuthReturn(path: string, invitationToken?: string): void {
  if (!isBrowser()) return;
  purgeLegacyInvitationContext();
  sessionStorage.setItem(RETURN_KEY, path);
  if (invitationToken) {
    storeInvitationToken(invitationToken, path);
  } else {
    console.log(FLOW_LOG, '✓ Return path stored', { path });
  }
}

/**
 * Resolve post-auth destination without losing the invitation token.
 * Does not clear token (needed by /auth/resolve and /invite accept).
 */
export function consumeAuthReturn(): string | null {
  if (!isBrowser()) return null;
  purgeLegacyInvitationContext();

  const fromUrl = new URLSearchParams(window.location.search).get('return');
  if (fromUrl) {
    console.log(FLOW_LOG, '✓ Return from query', { fromUrl });
    sessionStorage.setItem(RETURN_KEY, fromUrl);
    const tokenMatch = fromUrl.match(/^\/invite\/([^/?#]+)/);
    if (tokenMatch?.[1]) {
      const token = decodeURIComponent(tokenMatch[1]);
      storeInvitationToken(token, fromUrl);
      console.log(FLOW_LOG, '✓ Token restored', { tokenPrefix: token.slice(0, 8) });
    }
    return fromUrl;
  }

  const nav = getInvitationNavigationState();
  if (nav) {
    console.log(FLOW_LOG, '✓ Token restored', {
      tokenPrefix: nav.token.slice(0, 8),
      returnUrl: nav.returnUrl,
    });
    return nav.returnUrl;
  }

  const fromSession = sessionStorage.getItem(RETURN_KEY);
  if (fromSession) {
    console.log(FLOW_LOG, '✓ Return from sessionStorage', { fromSession });
    return fromSession;
  }

  console.log(FLOW_LOG, '· No return path found');
  return null;
}

export function clearAuthReturn(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(RETURN_KEY);
}

export function clearInvitationToken(): void {
  clearInvitationContext();
}

export function getStoredInvitationToken(): string | null {
  if (!isBrowser()) return null;
  purgeLegacyInvitationContext();
  return sessionStorage.getItem(INVITE_TOKEN_KEY)?.trim() || null;
}

/** Workspace destination after invitation acceptance (role from Firestore result only). */
export function collaboratorWorkspacePath(platformRole: string): string {
  return platformRole === 'collaborator' ? '/home' : '/dashboard';
}
