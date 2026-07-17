/**
 * UAT-006 — Password recovery helpers.
 */

import { describe, expect, it } from 'vitest';
import {
  normalizeEmail,
  isValidEmailFormat,
  PasswordResetError,
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
