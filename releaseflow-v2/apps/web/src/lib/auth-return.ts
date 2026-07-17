/**
 * UAT-005 — Invitation context persistence across authentication & redirects.
 *
 * The invitation itself is the onboarding context. These values must survive
 * sign-up, sign-in, email verification, profile creation, redirects, and
 * page refreshes until the invitation is accepted.
 */

const RETURN_KEY = 'auth_return_to';
const INVITE_TOKEN_KEY = 'invitation_token';
const INVITE_CONTEXT_KEY = 'invitation_context';

const FLOW_LOG = '[Invitation Flow]';

export interface InvitationContext {
  token: string;
  organizationId: string;
  invitedEmail: string;
  platformRole: string;
  professionalRole: string;
  returnUrl: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Persist the full invitation context before leaving the invite page for auth.
 * Also mirrors token + return path for backward-compatible consumers.
 */
export function storeInvitationContext(ctx: InvitationContext): void {
  if (!isBrowser()) return;

  const normalized: InvitationContext = {
    token: ctx.token.trim(),
    organizationId: ctx.organizationId,
    invitedEmail: ctx.invitedEmail.trim().toLowerCase(),
    platformRole: ctx.platformRole,
    professionalRole: ctx.professionalRole,
    returnUrl: ctx.returnUrl || `/invite/${ctx.token.trim()}`,
  };

  sessionStorage.setItem(INVITE_CONTEXT_KEY, JSON.stringify(normalized));
  sessionStorage.setItem(INVITE_TOKEN_KEY, normalized.token);
  sessionStorage.setItem(RETURN_KEY, normalized.returnUrl);

  console.log(FLOW_LOG, '✓ Invitation context stored', {
    tokenPrefix: normalized.token.slice(0, 8),
    organizationId: normalized.organizationId,
    invitedEmail: normalized.invitedEmail,
    platformRole: normalized.platformRole,
    professionalRole: normalized.professionalRole,
    returnUrl: normalized.returnUrl,
  });
}

/**
 * Read invitation context without clearing it.
 * Reconstructs a minimal context from token-only storage when needed.
 */
export function getInvitationContext(): InvitationContext | null {
  if (!isBrowser()) return null;

  const raw = sessionStorage.getItem(INVITE_CONTEXT_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as InvitationContext;
      if (parsed?.token) {
        return {
          token: parsed.token,
          organizationId: parsed.organizationId ?? '',
          invitedEmail: (parsed.invitedEmail ?? '').trim().toLowerCase(),
          platformRole: parsed.platformRole ?? '',
          professionalRole: parsed.professionalRole ?? '',
          returnUrl: parsed.returnUrl || `/invite/${parsed.token}`,
        };
      }
    } catch {
      console.warn(FLOW_LOG, '· Invitation context JSON parse failed — falling back to token');
    }
  }

  const token = sessionStorage.getItem(INVITE_TOKEN_KEY);
  if (token) {
    const returnUrl = sessionStorage.getItem(RETURN_KEY) || `/invite/${token}`;
    return {
      token,
      organizationId: '',
      invitedEmail: '',
      platformRole: '',
      professionalRole: '',
      returnUrl,
    };
  }

  return null;
}

/** True when a pending invitation must take precedence over generic onboarding. */
export function hasPendingInvitation(): boolean {
  const ctx = getInvitationContext();
  return !!ctx?.token;
}

export function clearInvitationContext(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(INVITE_CONTEXT_KEY);
  sessionStorage.removeItem(INVITE_TOKEN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  console.log(FLOW_LOG, '✓ Invitation context cleared');
}

/**
 * @deprecated Prefer storeInvitationContext. Kept for call sites that only have a path.
 */
export function storeAuthReturn(path: string, invitationToken?: string): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(RETURN_KEY, path);
  if (invitationToken) {
    sessionStorage.setItem(INVITE_TOKEN_KEY, invitationToken);
    // Merge into existing context if present so we don't drop org/role fields.
    const existing = getInvitationContext();
    if (existing && existing.token === invitationToken) {
      storeInvitationContext({ ...existing, returnUrl: path, token: invitationToken });
    } else if (!existing || !existing.organizationId) {
      // Minimal context when only token is known (e.g. sign-in page capture).
      const minimal: InvitationContext = {
        token: invitationToken,
        organizationId: existing?.organizationId ?? '',
        invitedEmail: existing?.invitedEmail ?? '',
        platformRole: existing?.platformRole ?? '',
        professionalRole: existing?.professionalRole ?? '',
        returnUrl: path,
      };
      sessionStorage.setItem(INVITE_CONTEXT_KEY, JSON.stringify(minimal));
      sessionStorage.setItem(INVITE_TOKEN_KEY, invitationToken);
      sessionStorage.setItem(RETURN_KEY, path);
    }
  }
  console.log(FLOW_LOG, '✓ Token/return stored for auth', {
    path,
    hasToken: !!invitationToken,
    tokenPrefix: invitationToken?.slice(0, 8),
  });
}

/**
 * Resolve post-auth destination without losing invitation context.
 * Does not clear invitation token/context (needed by /auth/resolve and /invite accept).
 */
export function consumeAuthReturn(): string | null {
  if (!isBrowser()) return null;

  const fromUrl = new URLSearchParams(window.location.search).get('return');
  if (fromUrl) {
    console.log(FLOW_LOG, '✓ Return from query', { fromUrl });
    sessionStorage.setItem(RETURN_KEY, fromUrl);
    const tokenMatch = fromUrl.match(/^\/invite\/([^/?#]+)/);
    if (tokenMatch?.[1]) {
      const token = decodeURIComponent(tokenMatch[1]);
      sessionStorage.setItem(INVITE_TOKEN_KEY, token);
      const existing = getInvitationContext();
      if (!existing || existing.token !== token) {
        sessionStorage.setItem(
          INVITE_CONTEXT_KEY,
          JSON.stringify({
            token,
            organizationId: existing?.organizationId ?? '',
            invitedEmail: existing?.invitedEmail ?? '',
            platformRole: existing?.platformRole ?? '',
            professionalRole: existing?.professionalRole ?? '',
            returnUrl: fromUrl,
          } satisfies InvitationContext),
        );
      }
    }
    return fromUrl;
  }

  const ctx = getInvitationContext();
  if (ctx?.returnUrl) {
    console.log(FLOW_LOG, '✓ Invitation context restored', {
      returnUrl: ctx.returnUrl,
      tokenPrefix: ctx.token.slice(0, 8),
      organizationId: ctx.organizationId,
    });
    return ctx.returnUrl;
  }

  const fromSession = sessionStorage.getItem(RETURN_KEY);
  if (fromSession) {
    console.log(FLOW_LOG, '✓ Return from sessionStorage', { fromSession });
    return fromSession;
  }

  const inviteToken = sessionStorage.getItem(INVITE_TOKEN_KEY);
  if (inviteToken) {
    const path = `/invite/${inviteToken}`;
    console.log(FLOW_LOG, '✓ Return reconstructed from invitation_token');
    return path;
  }

  console.log(FLOW_LOG, '· No return path found');
  return null;
}

export function clearAuthReturn(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(RETURN_KEY);
}

export function clearInvitationToken(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(INVITE_TOKEN_KEY);
  sessionStorage.removeItem(INVITE_CONTEXT_KEY);
}

export function getStoredInvitationToken(): string | null {
  if (!isBrowser()) return null;
  const ctx = getInvitationContext();
  if (ctx?.token) return ctx.token;
  return sessionStorage.getItem(INVITE_TOKEN_KEY);
}

/** Workspace destination after invitation acceptance (never generic onboarding). */
export function collaboratorWorkspacePath(platformRole: string): string {
  return platformRole === 'collaborator' ? '/home' : '/dashboard';
}
