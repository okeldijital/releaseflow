/**
 * UAT-005 — Invitation context persistence & routing helpers.
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  storeInvitationContext,
  getInvitationContext,
  hasPendingInvitation,
  clearInvitationContext,
  consumeAuthReturn,
  storeAuthReturn,
  getStoredInvitationToken,
  collaboratorWorkspacePath,
  clearInvitationToken,
} from '@/lib/auth-return';

describe('UAT-005 invitation context', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('stores and restores full invitation context', () => {
    storeInvitationContext({
      token: 'tok_abc123xyz',
      organizationId: 'org_1',
      invitedEmail: '  Alice@Example.COM ',
      platformRole: 'collaborator',
      professionalRole: 'Mixing Engineer',
      returnUrl: '/invite/tok_abc123xyz',
    });

    expect(hasPendingInvitation()).toBe(true);
    const ctx = getInvitationContext();
    expect(ctx).not.toBeNull();
    expect(ctx!.token).toBe('tok_abc123xyz');
    expect(ctx!.organizationId).toBe('org_1');
    expect(ctx!.invitedEmail).toBe('alice@example.com');
    expect(ctx!.platformRole).toBe('collaborator');
    expect(ctx!.professionalRole).toBe('Mixing Engineer');
    expect(ctx!.returnUrl).toBe('/invite/tok_abc123xyz');
    expect(getStoredInvitationToken()).toBe('tok_abc123xyz');
  });

  it('survives consumeAuthReturn without clearing invitation context', () => {
    storeInvitationContext({
      token: 'tok_persist',
      organizationId: 'org_2',
      invitedEmail: 'bob@example.com',
      platformRole: 'release_manager',
      professionalRole: 'A&R',
      returnUrl: '/invite/tok_persist',
    });

    const dest = consumeAuthReturn();
    expect(dest).toBe('/invite/tok_persist');
    expect(hasPendingInvitation()).toBe(true);
    expect(getInvitationContext()?.organizationId).toBe('org_2');
  });

  it('clears context after acceptance cleanup', () => {
    storeInvitationContext({
      token: 'tok_clear',
      organizationId: 'org_3',
      invitedEmail: 'c@example.com',
      platformRole: 'collaborator',
      professionalRole: 'Writer',
      returnUrl: '/invite/tok_clear',
    });
    clearInvitationContext();
    expect(hasPendingInvitation()).toBe(false);
    expect(getInvitationContext()).toBeNull();
    expect(getStoredInvitationToken()).toBeNull();
  });

  it('storeAuthReturn merges with existing full context', () => {
    storeInvitationContext({
      token: 'tok_merge',
      organizationId: 'org_m',
      invitedEmail: 'm@example.com',
      platformRole: 'collaborator',
      professionalRole: 'Producer',
      returnUrl: '/invite/tok_merge',
    });
    storeAuthReturn('/invite/tok_merge', 'tok_merge');
    const ctx = getInvitationContext();
    expect(ctx?.organizationId).toBe('org_m');
    expect(ctx?.professionalRole).toBe('Producer');
  });

  it('reconstructs minimal context from token-only storage', () => {
    sessionStorage.setItem('invitation_token', 'tok_only');
    sessionStorage.setItem('auth_return_to', '/invite/tok_only');
    expect(hasPendingInvitation()).toBe(true);
    expect(getInvitationContext()?.token).toBe('tok_only');
    expect(consumeAuthReturn()).toBe('/invite/tok_only');
  });

  it('maps platform roles to collaborator workspace paths', () => {
    expect(collaboratorWorkspacePath('collaborator')).toBe('/home');
    expect(collaboratorWorkspacePath('release_manager')).toBe('/dashboard');
    expect(collaboratorWorkspacePath('administrator')).toBe('/dashboard');
  });

  it('clearInvitationToken also clears full context', () => {
    storeInvitationContext({
      token: 'tok_x',
      organizationId: 'org_x',
      invitedEmail: 'x@example.com',
      platformRole: 'collaborator',
      professionalRole: 'Artist',
      returnUrl: '/invite/tok_x',
    });
    clearInvitationToken();
    expect(hasPendingInvitation()).toBe(false);
  });
});
