/**
 * UAT-006 / UAT-006A / BUG-004A — Password recovery & identity helpers.
 *
 * BUG-004A: Firebase Console "Reset password" delivers mail for the same
 * Email/Password users while the client SDK path did not when it passed
 * ActionCodeSettings. Console does not attach client continue URLs; it uses
 * Authentication → Templates → Password reset action URL.
 *
 * Primary send path therefore matches Console:
 *   sendPasswordResetEmail(auth, email)
 * with NO ActionCodeSettings. Link host comes from the Console template.
 *
 * Scope: password reset only. Do not change invitation / RBAC / sign-in flows.
 */

import {
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  fetchSignInMethodsForEmail,
  type Auth,
  type ActionCodeSettings,
} from '@firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { getAppBaseUrl } from '@/lib/invitation-token';

const LOG = '[Password Recovery]';
const CONFIG_LOG = 'Password Recovery Configuration';

export type PasswordResetErrorCode =
  | 'auth_unavailable'
  | 'invalid_email'
  | 'user_not_found'
  | 'google_only'
  | 'too_many_requests'
  | 'expired_code'
  | 'invalid_code'
  | 'weak_password'
  | 'network'
  | 'invalid_continue_uri'
  | 'unauthorized_continue_uri'
  | 'operation_not_allowed'
  | 'invalid_api_key'
  | 'unknown';

export class PasswordResetError extends Error {
  constructor(
    public readonly code: PasswordResetErrorCode,
    message: string,
    /** Raw Firebase Auth error code, e.g. auth/unauthorized-continue-uri */
    public readonly firebaseCode?: string,
    public readonly firebaseMessage?: string,
  ) {
    super(message);
    this.name = 'PasswordResetError';
  }
}

/** Normalize email for comparison and Auth APIs. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function getAuthRuntimeDomainAndProject(auth?: Auth | null): {
  authDomain: string | undefined;
  projectId: string | undefined;
} {
  const options = auth?.app?.options as
    | { authDomain?: string; projectId?: string }
    | undefined;
  return {
    authDomain:
      options?.authDomain ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:
      options?.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
}

/**
 * Safe public Firebase env snapshot (no secrets beyond public client config).
 * Used by the forgot-password page and requestPasswordReset logging.
 */
export function getPublicAuthRuntimeConfig(): {
  origin: string | undefined;
  nextPublicAppUrl: string;
  /** Documented template action URL — not attached to SDK send (BUG-004A). */
  templateActionUrlExpected: string;
  authDomain: string | undefined;
  projectId: string | undefined;
  apiKeyPresent: boolean;
  appUrl: string;
  originDiffersFromAppUrl: boolean;
  sendUsesActionCodeSettings: boolean;
} {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const auth = typeof window !== 'undefined' ? getAuthInstance() : undefined;
  const { authDomain, projectId } = getAuthRuntimeDomainAndProject(auth);
  const nextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL || '(empty)';
  const appUrl = getAppBaseUrl() || '(empty)';

  return {
    origin,
    nextPublicAppUrl,
    templateActionUrlExpected: 'https://flow.okeldijital.africa/auth/action',
    authDomain,
    projectId,
    apiKeyPresent: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    appUrl,
    originDiffersFromAppUrl: Boolean(
      origin && appUrl && appUrl !== '(empty)' && origin !== appUrl,
    ),
    sendUsesActionCodeSettings: false,
  };
}

/**
 * UAT-006A §2 — log runtime configuration in a fixed, greppable format
 * visible in the production browser console.
 */
export function logPasswordRecoveryConfiguration(auth?: Auth | null): void {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const nextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL || '(empty)';
  const { authDomain, projectId } = getAuthRuntimeDomainAndProject(auth);
  const options = auth?.app?.options as { apiKey?: string } | undefined;

  console.log(
    [
      CONFIG_LOG,
      `origin: ${origin ?? '(ssr/unavailable)'}`,
      `NEXT_PUBLIC_APP_URL: ${nextPublicAppUrl}`,
      `authDomain: ${authDomain ?? '(unset)'}`,
      `projectId: ${projectId ?? '(unset)'}`,
      `apiKeyPresent: ${Boolean(options?.apiKey ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY)}`,
      'sendMode: sendPasswordResetEmail(auth, email) — no ActionCodeSettings (BUG-004A / Console parity)',
      'templateActionUrl (Console): https://flow.okeldijital.africa/auth/action',
    ].join('\n'),
  );

  if (origin && nextPublicAppUrl !== '(empty)' && origin !== nextPublicAppUrl.replace(/\/$/, '')) {
    console.warn(LOG, '· NEXT_PUBLIC_APP_URL differs from window.location.origin', {
      origin,
      NEXT_PUBLIC_APP_URL: nextPublicAppUrl,
    });
  }
}

/**
 * UAT-006A §1 — structured Firebase error log (no masking).
 * Matches the required shape: code, message, customData, stack.
 */
function logFirebaseError(err: unknown): void {
  const anyErr = err as {
    code?: string;
    message?: string;
    customData?: unknown;
    stack?: string;
  };

  console.error({
    code: anyErr?.code,
    message: anyErr?.message ?? String(err),
    customData: anyErr?.customData,
    stack: anyErr?.stack,
  });

  // Also log under the recovery prefix for console filtering.
  console.error(LOG, '✗ Firebase error', {
    code: anyErr?.code ?? '(no code)',
    message: anyErr?.message ?? String(err),
    customData: anyErr?.customData ?? null,
    stack: anyErr?.stack,
  });
}

/**
 * UAT-006A §3 — temporarily intercept fetch to capture Identity Toolkit
 * error bodies (HTTP status, error.message, error.errors[], full JSON).
 * Scoped only around password-reset Auth calls; restored in finally.
 */
async function withIdentityToolkitCapture<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return fn();
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const response = await originalFetch(input, init);
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (url.includes('identitytoolkit.googleapis.com')) {
      // Fresh clone per read attempt — body stream can only be consumed once.
      let body: unknown;
      try {
        body = await response.clone().json();
      } catch {
        try {
          body = await response.clone().text();
        } catch {
          body = '(unreadable body)';
        }
      }

      const errorObj =
        body && typeof body === 'object' && body !== null && 'error' in body
          ? (body as { error?: { message?: string; errors?: unknown[] } }).error
          : undefined;

      if (!response.ok) {
        console.error(LOG, '✗ Identity Toolkit response', {
          url,
          httpStatus: response.status,
          statusText: response.statusText,
          errorMessage: errorObj?.message ?? null,
          errors: errorObj?.errors ?? null,
          responseJSON: body,
        });

        // Explicit visibility for the two most common production misconfigs.
        const msg = String(errorObj?.message ?? '');
        if (msg.includes('UNAUTHORIZED_CONTINUE_URI') || msg === 'UNAUTHORIZED_CONTINUE_URI') {
          console.error(LOG, '✗ Identity Toolkit: UNAUTHORIZED_CONTINUE_URI');
        }
        if (msg.includes('OPERATION_NOT_ALLOWED') || msg === 'OPERATION_NOT_ALLOWED') {
          console.error(LOG, '✗ Identity Toolkit: OPERATION_NOT_ALLOWED');
        }
      } else {
        console.log(LOG, '· Identity Toolkit OK', {
          url,
          httpStatus: response.status,
        });
      }
    }

    return response;
  };

  try {
    return await fn();
  } finally {
    window.fetch = originalFetch;
  }
}

function mapFirebaseError(err: unknown): PasswordResetError {
  logFirebaseError(err);

  const code = (err as { code?: string })?.code ?? '';
  const message = err instanceof Error ? err.message : String(err);

  if (code === 'auth/invalid-email') {
    return new PasswordResetError(
      'invalid_email',
      'Please enter a valid email address.',
      code,
      message,
    );
  }
  if (code === 'auth/user-not-found') {
    return new PasswordResetError(
      'user_not_found',
      'No account was found with this email address.',
      code,
      message,
    );
  }
  if (code === 'auth/too-many-requests') {
    return new PasswordResetError(
      'too_many_requests',
      'Too many attempts. Please wait a few minutes and try again.',
      code,
      message,
    );
  }
  if (code === 'auth/expired-action-code') {
    return new PasswordResetError(
      'expired_code',
      'This password reset link has expired. Please request a new one.',
      code,
      message,
    );
  }
  if (code === 'auth/invalid-action-code') {
    return new PasswordResetError(
      'invalid_code',
      'This password reset link is invalid or has already been used. Please request a new one.',
      code,
      message,
    );
  }
  if (code === 'auth/weak-password') {
    return new PasswordResetError(
      'weak_password',
      'Password is too weak. Use at least 8 characters with a mix of letters and numbers.',
      code,
      message,
    );
  }
  if (code === 'auth/network-request-failed' || /network/i.test(message)) {
    return new PasswordResetError(
      'network',
      'Network error. Check your connection and try again.',
      code,
      message,
    );
  }
  // UAT-006A §1 — specific UI copy (do not generic-mask).
  if (code === 'auth/invalid-continue-uri' || code === 'auth/missing-continue-uri') {
    return new PasswordResetError(
      'invalid_continue_uri',
      'Invalid Continue URL',
      code,
      message,
    );
  }
  if (code === 'auth/unauthorized-continue-uri') {
    return new PasswordResetError(
      'unauthorized_continue_uri',
      'Unauthorized Continue URL',
      code,
      message,
    );
  }
  if (code === 'auth/operation-not-allowed') {
    return new PasswordResetError(
      'operation_not_allowed',
      'Email/Password authentication is disabled.',
      code,
      message,
    );
  }
  if (
    code === 'auth/invalid-api-key'
    || code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.'
  ) {
    return new PasswordResetError(
      'invalid_api_key',
      'Firebase API key is invalid for this project. Check NEXT_PUBLIC_FIREBASE_API_KEY.',
      code,
      message,
    );
  }

  // Never hide the real Firebase code/message behind a single generic string.
  return new PasswordResetError(
    'unknown',
    code
      ? `${code}: ${message}`
      : message || 'Password recovery failed with an unknown error.',
    code || undefined,
    message,
  );
}

function requireAuth(): Auth {
  const auth = getAuthInstance();
  if (!auth) {
    throw new PasswordResetError(
      'auth_unavailable',
      'Authentication is unavailable. Please refresh and try again.',
    );
  }
  return auth;
}

export type SignInMethodInfo = {
  methods: string[];
  hasPassword: boolean;
  hasGoogle: boolean;
  isGoogleOnly: boolean;
  exists: boolean;
};

/** Audit which providers are linked to an email (for recovery UX). */
export async function getSignInMethodsForEmail(email: string): Promise<SignInMethodInfo> {
  const normalized = normalizeEmail(email);
  if (!isValidEmailFormat(normalized)) {
    throw new PasswordResetError('invalid_email', 'Please enter a valid email address.');
  }
  const auth = requireAuth();
  try {
    const methods = await withIdentityToolkitCapture(() =>
      fetchSignInMethodsForEmail(auth, normalized),
    );
    const hasPassword = methods.includes('password');
    const hasGoogle = methods.includes('google.com');
    return {
      methods,
      hasPassword,
      hasGoogle,
      isGoogleOnly: hasGoogle && !hasPassword,
      exists: methods.length > 0,
    };
  } catch (err) {
    throw mapFirebaseError(err);
  }
}

/**
 * Expected Console template continue/action URL for documentation and diagnostics.
 * BUG-004A: this is NOT passed to sendPasswordResetEmail. Firebase Console template
 * owns the action URL when the SDK is called with (auth, email) only.
 *
 * Production template should be: https://flow.okeldijital.africa/auth/action
 */
export function buildActionCodeSettings(): ActionCodeSettings | null {
  const origin =
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '')
    || getAppBaseUrl();

  if (!origin || !/^https?:\/\//i.test(origin)) {
    return null;
  }

  return {
    url: `${origin.replace(/\/$/, '')}/auth/action`,
    handleCodeInApp: false,
  };
}

/** BUG-004A — result after SDK accepts the password-reset request. */
export type PasswordResetRequestResult = {
  email: string;
  projectId: string | undefined;
  authDomain: string | undefined;
  /** Always false after BUG-004A — Console-parity path */
  usedActionCodeSettings: boolean;
  identityAuditInconclusive: boolean;
  identity: SignInMethodInfo | null;
  /** Template URL recommended in Console (not attached to this request) */
  expectedTemplateActionUrl: string;
};

/**
 * Request a password reset email for an email/password account.
 *
 * BUG-004A — matches Firebase Console reset behaviour:
 *   await sendPasswordResetEmail(auth, email)
 * No ActionCodeSettings. No retry wrapper that can hide the original error.
 * Action links use Authentication → Templates → Password reset action URL.
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
  const normalized = normalizeEmail(email);
  if (!isValidEmailFormat(normalized)) {
    throw new PasswordResetError('invalid_email', 'Please enter a valid email address.');
  }

  const auth = requireAuth();
  const appOptions = auth.app.options as {
    projectId?: string;
    authDomain?: string;
    apiKey?: string;
  };
  const projectId = appOptions.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomain = appOptions.authDomain ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;

  // BUG-004A Phase 2 — log exact Auth instance (no secrets beyond public apiKey presence).
  console.log(LOG, 'Password Reset Request (auth instance)', {
    projectId,
    authDomain,
    apiKeyPresent: Boolean(appOptions.apiKey),
    origin,
    expectedProjectId: 'releaseflow-prod',
    projectIdMatch: projectId === 'releaseflow-prod',
  });

  if (projectId && projectId !== 'releaseflow-prod') {
    console.error(LOG, '✗ Auth projectId is not releaseflow-prod — wrong Firebase app?', {
      projectId,
    });
  }

  logPasswordRecoveryConfiguration(auth);

  // Identity audit when methods are available (may be empty under enumeration protection).
  let identity: SignInMethodInfo | null = null;
  try {
    identity = await getSignInMethodsForEmail(normalized);
    console.log(LOG, '· Sign-in methods', {
      email: normalized,
      methods: identity.methods,
      hasPassword: identity.hasPassword,
      isGoogleOnly: identity.isGoogleOnly,
    });
    if (identity.methods.length === 0) {
      console.warn(
        LOG,
        '· Identity audit inconclusive (empty methods). Continuing send — Console template path.',
      );
    }
  } catch (err) {
    if (err instanceof PasswordResetError && err.code === 'invalid_email') throw err;
    logFirebaseError(err);
    console.warn(LOG, '· fetchSignInMethodsForEmail failed — continuing to send attempt');
  }

  if (identity?.isGoogleOnly) {
    throw new PasswordResetError(
      'google_only',
      'This account uses Google Sign-In. Please continue with Google.',
    );
  }

  if (identity?.exists && !identity.hasPassword) {
    throw new PasswordResetError(
      'google_only',
      'This account does not use an email password. Please sign in with the original provider (e.g. Google).',
    );
  }

  const expectedTemplateActionUrl = 'https://flow.okeldijital.africa/auth/action';

  try {
    // BUG-004A Phase 4 — Console parity: no ActionCodeSettings, no retry, no wrapper args.
    console.log(LOG, '✓ sendPasswordResetEmail(auth, email) — no ActionCodeSettings', {
      email: normalized,
      projectId,
      authDomain,
    });

    await withIdentityToolkitCapture(() =>
      sendPasswordResetEmail(auth, normalized),
    );

    console.log(LOG, '✓ sendPasswordResetEmail resolved (SDK success)', {
      email: normalized,
      projectId,
      actionCodeSettings: null,
    });

    return {
      email: normalized,
      projectId,
      authDomain,
      usedActionCodeSettings: false,
      identityAuditInconclusive: Boolean(identity && identity.methods.length === 0),
      identity,
      expectedTemplateActionUrl,
    };
  } catch (err) {
    // Surface original Firebase error only — no alternate path.
    logFirebaseError(err);
    throw mapFirebaseError(err);
  }
}

/** Verify oobCode and return the email it was issued for. */
export async function verifyResetCode(oobCode: string): Promise<string> {
  if (!oobCode?.trim()) {
    throw new PasswordResetError('invalid_code', 'Missing reset code. Open the link from your email.');
  }
  const auth = requireAuth();
  try {
    const email = await withIdentityToolkitCapture(() =>
      verifyPasswordResetCode(auth, oobCode.trim()),
    );
    console.log(LOG, '✓ Reset code verified', { email: normalizeEmail(email) });
    return email;
  } catch (err) {
    throw mapFirebaseError(err);
  }
}

/** Complete password reset with a new password. */
export async function completePasswordReset(
  oobCode: string,
  newPassword: string,
): Promise<void> {
  if (!oobCode?.trim()) {
    throw new PasswordResetError('invalid_code', 'Missing reset code. Open the link from your email.');
  }
  if (!newPassword || newPassword.length < 8) {
    throw new PasswordResetError(
      'weak_password',
      'Password must be at least 8 characters.',
    );
  }

  const auth = requireAuth();
  try {
    await withIdentityToolkitCapture(() =>
      confirmPasswordReset(auth, oobCode.trim(), newPassword),
    );
    console.log(LOG, '✓ Password updated via reset code');
  } catch (err) {
    throw mapFirebaseError(err);
  }
}

export function userFacingPasswordError(err: unknown): string {
  if (err instanceof PasswordResetError) {
    // Always include Firebase code when present for diagnostics (UAT-006A).
    if (err.firebaseCode && !err.message.includes(err.firebaseCode)) {
      return `${err.message} [${err.firebaseCode}]`;
    }
    return err.message;
  }
  return mapFirebaseError(err).message;
}
