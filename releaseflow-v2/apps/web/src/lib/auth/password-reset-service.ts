/**
 * UAT-006 — Password recovery & identity helpers.
 *
 * Uses Firebase Auth email/password reset APIs. Never trusts raw email strings.
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
  | 'unknown';

export class PasswordResetError extends Error {
  constructor(
    public readonly code: PasswordResetErrorCode,
    message: string,
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
  // Practical validation — not RFC-perfect.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function mapFirebaseError(err: unknown): PasswordResetError {
  const code = (err as { code?: string })?.code ?? '';
  const message = err instanceof Error ? err.message : String(err);

  if (code === 'auth/invalid-email') {
    return new PasswordResetError('invalid_email', 'Please enter a valid email address.');
  }
  if (code === 'auth/user-not-found') {
    return new PasswordResetError(
      'user_not_found',
      'No account was found with this email address.',
    );
  }
  if (code === 'auth/too-many-requests') {
    return new PasswordResetError(
      'too_many_requests',
      'Too many attempts. Please wait a few minutes and try again.',
    );
  }
  if (code === 'auth/expired-action-code') {
    return new PasswordResetError(
      'expired_code',
      'This password reset link has expired. Please request a new one.',
    );
  }
  if (code === 'auth/invalid-action-code') {
    return new PasswordResetError(
      'invalid_code',
      'This password reset link is invalid or has already been used. Please request a new one.',
    );
  }
  if (code === 'auth/weak-password') {
    return new PasswordResetError(
      'weak_password',
      'Password is too weak. Use at least 8 characters with a mix of letters and numbers.',
    );
  }
  if (code === 'auth/network-request-failed' || /network/i.test(message)) {
    return new PasswordResetError(
      'network',
      'Network error. Check your connection and try again.',
    );
  }
  if (code === 'auth/missing-continue-uri' || code === 'auth/invalid-continue-uri') {
    return new PasswordResetError(
      'unknown',
      'Password reset is misconfigured. Please contact support.',
    );
  }

  console.error(LOG, '✗ Unmapped Firebase error', { code, message });
  return new PasswordResetError(
    'unknown',
    'Could not complete password recovery. Please try again.',
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
    const methods = await fetchSignInMethodsForEmail(auth, normalized);
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

function buildActionCodeSettings(): ActionCodeSettings {
  const base = getAppBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '');
  // After Firebase (or our handler) completes, continue to sign-in.
  const continueUrl = `${base.replace(/\/$/, '')}/sign-in`;
  return {
    url: continueUrl,
    handleCodeInApp: false,
  };
}

/**
 * Request a password reset email for an email/password account.
 * Blocks Google-only accounts with a clear message.
 */
export async function requestPasswordReset(email: string): Promise<{ email: string }> {
  const normalized = normalizeEmail(email);
  if (!isValidEmailFormat(normalized)) {
    throw new PasswordResetError('invalid_email', 'Please enter a valid email address.');
  }

  const auth = requireAuth();

  // Identity audit — do not offer password reset for Google-only accounts.
  let identity: SignInMethodInfo;
  try {
    identity = await getSignInMethodsForEmail(normalized);
  } catch (err) {
    if (err instanceof PasswordResetError) throw err;
    throw mapFirebaseError(err);
  }

  if (identity.isGoogleOnly) {
    console.log(LOG, '· Google-only account — password reset blocked', {
      email: normalized,
    });
    throw new PasswordResetError(
      'google_only',
      'This account uses Google Sign-In. Please continue with Google.',
    );
  }

  // Provider list non-empty but no password (e.g. only phone / other IdP).
  if (identity.exists && !identity.hasPassword) {
    throw new PasswordResetError(
      'google_only',
      'This account does not use an email password. Please sign in with the original provider (e.g. Google).',
    );
  }

  // identity.exists === false can mean either "no user" OR Firebase Email
  // Enumeration Protection is enabled (methods always empty). Still attempt
  // sendPasswordResetEmail; Firebase may return user-not-found or silently
  // succeed. UI success copy stays non-leaky when needed.

  try {
    const settings = buildActionCodeSettings();
    console.log(LOG, '✓ Sending password reset email', {
      email: normalized,
      continueUrl: settings.url,
      methodsKnown: identity.exists,
      hasPassword: identity.hasPassword,
    });
    await sendPasswordResetEmail(auth, normalized, settings);
    console.log(LOG, '✓ Password reset email requested');
    return { email: normalized };
  } catch (err) {
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
    const email = await verifyPasswordResetCode(auth, oobCode.trim());
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
    await confirmPasswordReset(auth, oobCode.trim(), newPassword);
    console.log(LOG, '✓ Password updated via reset code');
  } catch (err) {
    throw mapFirebaseError(err);
  }
}

export function userFacingPasswordError(err: unknown): string {
  if (err instanceof PasswordResetError) return err.message;
  return mapFirebaseError(err).message;
}
