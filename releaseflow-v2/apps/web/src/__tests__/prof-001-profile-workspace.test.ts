/**
 * PROF-001 — Mobile Profile Workspace
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('PROF-001 profile workspace structure', () => {
  it('profile page has header, edit, security, notifications, account, preferences, sign out', () => {
    const page = read('app/(app)/profile/page.tsx');
    expect(page).toContain('PROF-001');
    expect(page).toContain('Edit Profile');
    expect(page).toContain('Security');
    expect(page).toContain('Notifications');
    expect(page).toContain('Account Information');
    expect(page).toContain('Preferences');
    expect(page).toContain('Sign Out');
    expect(page).toContain('size="2xl"');
    expect(page).toContain('ProfileSecurityPanel');
    expect(page).toContain('NotificationPreferencesPanel');
  });

  it('profile service updates auth + profile + person', () => {
    const src = read('lib/profile-service.ts');
    expect(src).toContain('updateMyDisplayName');
    expect(src).toContain('updateMyAvatar');
    expect(src).toContain('removeMyAvatar');
    expect(src).toContain('changeMyPassword');
    expect(src).toContain('updateProfile');
    expect(src).toContain('updateUserProfile');
    expect(src).toContain("doc(db, 'people'");
  });

  it('user profile repository supports partial updates', () => {
    const src = read('lib/user-profile-repository.ts');
    expect(src).toContain('updateUserProfile');
    expect(src).toContain('avatarUrl');
    expect(src).toContain('displayName');
  });

  it('notification prefs are grouped by domain', () => {
    const src = read('components/profile/notification-preferences-panel.tsx');
    expect(src).toContain('Assignments');
    expect(src).toContain('Comments');
    expect(src).toContain('Releases');
    expect(src).toContain('Channels');
    expect(src).toContain('PREF_GROUPS');
  });

  it('security panel supports password change and reset email', () => {
    const src = read('components/profile/profile-security-panel.tsx');
    expect(src).toContain('changeMyPassword');
    expect(src).toContain('sendMyPasswordResetEmail');
    expect(src).toContain('hasPasswordProvider');
  });
});

describe('PROF-001 avatar size for profile header', () => {
  it('Avatar supports 2xl (~80px)', () => {
    const uiRoot = join(__dirname, '../../../../packages/ui/src/components/avatar.tsx');
    const src = readFileSync(uiRoot, 'utf8');
    expect(src).toContain("'2xl'");
    expect(src).toContain('h-20 w-20');
  });
});
