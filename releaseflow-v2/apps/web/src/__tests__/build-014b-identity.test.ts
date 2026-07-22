/**
 * BUILD-014B — Canonical identity unit tests
 */
import { describe, it, expect } from 'vitest';
import { identityFromProfile } from '@/lib/identity-service';
import type { UserProfileRecord } from '@/lib/user-profile-repository';

describe('BUILD-014B identityFromProfile', () => {
  it('maps users/{uid} fields to Identity', () => {
    const profile: UserProfileRecord = {
      id: 'uid1',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      avatarUrl: 'https://res.cloudinary.com/x/image/upload/a.jpg',
      avatarPublicId: 'avatars/a',
      onboardingCompleted: true,
      createdAt: null,
      updatedAt: null,
    };
    const id = identityFromProfile(profile);
    expect(id.id).toBe('uid1');
    expect(id.displayName).toBe('Ada Lovelace');
    expect(id.avatarUrl).toContain('cloudinary');
    expect(id.email).toBe('ada@example.com');
    expect(id.isUserProfile).toBe(true);
  });

  it('falls back displayName from email local-part', () => {
    const profile: UserProfileRecord = {
      id: 'uid2',
      displayName: '  ',
      email: 'bob@example.com',
      avatarUrl: null,
      onboardingCompleted: false,
      createdAt: null,
      updatedAt: null,
    };
    const id = identityFromProfile(profile);
    expect(id.displayName).toBe('bob');
    expect(id.avatarUrl).toBeNull();
  });
});

describe('BUILD-014B module structure', () => {
  it('exports identity + profile service APIs', async () => {
    const identity = await import('@/lib/identity-service');
    expect(typeof identity.resolveIdentity).toBe('function');
    expect(typeof identity.resolvePersonIdentity).toBe('function');
    expect(typeof identity.clearIdentityCache).toBe('function');

    const profile = await import('@/lib/profile-service');
    expect(typeof profile.updateMyAvatar).toBe('function');
    expect(typeof profile.updateMyProfile).toBe('function');
    expect(typeof profile.removeMyAvatar).toBe('function');
  });

  it('user-profile-repository exposes subscribeUserProfile', async () => {
    const repo = await import('@/lib/user-profile-repository');
    expect(typeof repo.subscribeUserProfile).toBe('function');
    expect(typeof repo.getUserProfile).toBe('function');
    expect(typeof repo.updateUserProfile).toBe('function');
  });
});
