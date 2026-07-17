/**
 * ARCH-001 — Invitation token is the only client-side invitation state.
 * Business data must never be stored in sessionStorage.
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  storeInvitationToken,
  storeInvitationContext,
  getInvitationNavigationState,
  getInvitationContext,
  hasPendingInvitation,
  clearInvitationContext,
  consumeAuthReturn,
  storeAuthReturn,
  getStoredInvitationToken,
  collaboratorWorkspacePath,
  clearInvitationToken,
} from '@/lib/auth-return';

describe('ARCH-001 invitation token (navigation only)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('stores only token, returnUrl, and pending flag', () => {
    storeInvitationToken('tok_abc123xyz', '/invite/tok_abc123xyz');

    expect(hasPendingInvitation()).toBe(true);
    expect(getStoredInvitationToken()).toBe('tok_abc123xyz');

    const nav = getInvitationNavigationState();
    expect(nav).toEqual({
      token: 'tok_abc123xyz',
      returnUrl: '/invite/tok_abc123xyz',
      pendingInvitation: true,
    });

    // Explicitly no business fields in sessionStorage.
    expect(sessionStorage.getItem('invitation_context')).toBeNull();
    const raw = JSON.stringify(sessionStorage);
    expect(raw).not.toMatch(/organizationId|platformRole|professionalRole|invitedEmail/);
  });

  it('storeInvitationContext ignores business fields (compat wrapper)', () => {
    storeInvitationContext({
      token: 'tok_ignore_biz',
      returnUrl: '/invite/tok_ignore_biz',
      organizationId: 'org_should_not_persist',
      invitedEmail: 'evil@example.com',
      platformRole: 'administrator',
      professionalRole: 'CEO',
    });

    expect(getStoredInvitationToken()).toBe('tok_ignore_biz');
    expect(sessionStorage.getItem('invitation_context')).toBeNull();
    // No key should hold the business payload.
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!;
      const val = sessionStorage.getItem(key) ?? '';
      expect(val).not.toContain('org_should_not_persist');
      expect(val).not.toContain('evil@example.com');
      expect(val).not.toContain('administrator');
      expect(val).not.toContain('CEO');
    }
  });

  it('survives consumeAuthReturn without clearing token', () => {
    storeInvitationToken('tok_persist', '/invite/tok_persist');
    const dest = consumeAuthReturn();
    expect(dest).toBe('/invite/tok_persist');
    expect(hasPendingInvitation()).toBe(true);
    expect(getStoredInvitationToken()).toBe('tok_persist');
  });

  it('clears all invitation navigation state after accept', () => {
    storeInvitationToken('tok_clear', '/invite/tok_clear');
    clearInvitationContext();
    expect(hasPendingInvitation()).toBe(false);
    expect(getInvitationNavigationState()).toBeNull();
    expect(getStoredInvitationToken()).toBeNull();
  });

  it('storeAuthReturn with token sets pending invitation', () => {
    storeAuthReturn('/invite/tok_merge', 'tok_merge');
    expect(getStoredInvitationToken()).toBe('tok_merge');
    expect(getInvitationContext()?.returnUrl).toBe('/invite/tok_merge');
  });

  it('reconstructs navigation from token-only storage', () => {
    sessionStorage.setItem('invitation_token', 'tok_only');
    sessionStorage.setItem('auth_return_to', '/invite/tok_only');
    expect(hasPendingInvitation()).toBe(true);
    expect(getInvitationNavigationState()?.token).toBe('tok_only');
    expect(consumeAuthReturn()).toBe('/invite/tok_only');
  });

  it('purges legacy invitation_context business blob', () => {
    sessionStorage.setItem(
      'invitation_context',
      JSON.stringify({
        token: 'tok_legacy',
        organizationId: 'org_legacy',
        invitedEmail: 'a@b.com',
        platformRole: 'collaborator',
        professionalRole: 'Mixer',
        returnUrl: '/invite/tok_legacy',
      }),
    );
    sessionStorage.setItem('invitation_token', 'tok_legacy');

    const nav = getInvitationNavigationState();
    expect(nav?.token).toBe('tok_legacy');
    expect(sessionStorage.getItem('invitation_context')).toBeNull();
  });

  it('maps platform roles to workspace paths (role comes from Firestore result)', () => {
    expect(collaboratorWorkspacePath('collaborator')).toBe('/home');
    expect(collaboratorWorkspacePath('release_manager')).toBe('/dashboard');
    expect(collaboratorWorkspacePath('administrator')).toBe('/dashboard');
  });

  it('clearInvitationToken clears navigation state', () => {
    storeInvitationToken('tok_x', '/invite/tok_x');
    clearInvitationToken();
    expect(hasPendingInvitation()).toBe(false);
  });
});
