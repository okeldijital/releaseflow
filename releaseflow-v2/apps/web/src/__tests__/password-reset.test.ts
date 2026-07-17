/**
 * UAT-006 / UAT-006A — Password recovery helpers.
 */

import { describe, expect, it } from 'vitest';
import {
  normalizeEmail,
  isValidEmailFormat,
  PasswordResetError,
  buildActionCodeSettings,
  userFacingPasswordError,
} from '@/lib/auth/password-reset-service';

describe('UAT-006 password recovery helpers', () => {
  it('normalizes email with trim and lowercase', () => {
    expect(normalizeEmail('  Alice@Example.COM ')).toBe('alice@example.com');
  });

  it('validates email format', () => {
    expect(isValidEmailFormat('user@domain.com')).toBe(true);
    expect(isValidEmailFormat('not-an-email')).toBe(false);
    expect(isValidEmailFormat('')).toBe(false);
  });

  it('PasswordResetError carries code', () => {
    const err = new PasswordResetError('google_only', 'Use Google');
    expect(err.code).toBe('google_only');
    expect(err.message).toBe('Use Google');
  });
});

describe('UAT-006A diagnostics helpers', () => {
  it('buildActionCodeSettings uses origin + /auth/action', () => {
    // jsdom location is typically http://localhost:3000
    const settings = buildActionCodeSettings();
    expect(settings).not.toBeNull();
    if (!settings) return;
    expect(settings.url).toMatch(/\/auth\/action$/);
    expect(settings.handleCodeInApp).toBe(false);
  });

  it('userFacingPasswordError surfaces Unauthorized Continue URL with firebase code', () => {
    const err = new PasswordResetError(
      'unauthorized_continue_uri',
      'Unauthorized Continue URL',
      'auth/unauthorized-continue-uri',
      'Firebase: Error (auth/unauthorized-continue-uri).',
    );
    const text = userFacingPasswordError(err);
    expect(text).toContain('Unauthorized Continue URL');
    expect(text).toContain('auth/unauthorized-continue-uri');
  });

  it('userFacingPasswordError surfaces Email/Password disabled copy', () => {
    const err = new PasswordResetError(
      'operation_not_allowed',
      'Email/Password authentication is disabled.',
      'auth/operation-not-allowed',
      'Firebase: Error (auth/operation-not-allowed).',
    );
    const text = userFacingPasswordError(err);
    expect(text).toContain('Email/Password authentication is disabled.');
    expect(text).toContain('auth/operation-not-allowed');
  });

  it('userFacingPasswordError does not mask unknown firebase codes', () => {
    const err = new PasswordResetError(
      'unknown',
      'auth/internal-error: Something exploded',
      'auth/internal-error',
      'Something exploded',
    );
    const text = userFacingPasswordError(err);
    expect(text).toContain('auth/internal-error');
    expect(text).not.toBe('Could not complete password recovery.');
  });
});
