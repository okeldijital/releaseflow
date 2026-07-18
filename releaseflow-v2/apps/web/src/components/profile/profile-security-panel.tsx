'use client';

/**
 * PROF-001 — Change password / reset email for email-password accounts.
 */

import { useState } from 'react';
import type { User } from '@firebase/auth';
import { Button, Input } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';
import {
  changeMyPassword,
  hasPasswordProvider,
  sendMyPasswordResetEmail,
} from '@/lib/profile-service';
import {
  PasswordResetError,
  userFacingPasswordError,
} from '@/lib/auth/password-reset-service';

interface ProfileSecurityPanelProps {
  user: User;
}

export function ProfileSecurityPanel({ user }: ProfileSecurityPanelProps) {
  const passwordAccount = hasPasswordProvider(user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await changeMyPassword(user, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setExpanded(false);
      toast.success('Password updated');
    } catch (e) {
      const msg = (e as { code?: string; message?: string })?.message
        || 'Could not change password';
      const code = (e as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Current password is incorrect');
      } else if (code === 'auth/weak-password') {
        toast.error('Choose a stronger password (8+ characters)');
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResetEmail() {
    if (!user.email) {
      toast.error('No email on this account');
      return;
    }
    setResetBusy(true);
    try {
      // Same service as /forgot-password — never swallow Firebase errors.
      await sendMyPasswordResetEmail(user.email);
      toast.success(
        'Reset requested',
        'If this account uses email/password, check inbox and spam. Delivery is via Firebase Auth, not Resend.',
      );
    } catch (e) {
      const msg = userFacingPasswordError(e);
      if (e instanceof PasswordResetError) {
        console.error('[Password Recovery] · Profile security reset failed', {
          code: e.code,
          firebaseCode: e.firebaseCode,
          firebaseMessage: e.firebaseMessage,
          stack: e.stack,
        });
      } else {
        console.error('[Password Recovery] · Profile security reset failed', e);
      }
      toast.error(msg);
    } finally {
      setResetBusy(false);
    }
  }

  if (!passwordAccount) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-content-secondary leading-relaxed">
          You signed in with an external provider. Password changes are managed by that provider.
        </p>
        {user.email ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full min-h-[44px]"
            loading={resetBusy}
            onClick={() => void handleResetEmail()}
          >
            Send password reset email
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!expanded ? (
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => setExpanded(true)}
          >
            Change password
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-full min-h-[44px]"
            loading={resetBusy}
            onClick={() => void handleResetEmail()}
          >
            Send password reset email
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="At least 8 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="primary"
              className="flex-1 min-h-[44px]"
              loading={busy}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              onClick={() => void handleChangePassword()}
            >
              Update password
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="min-h-[44px]"
              disabled={busy}
              onClick={() => {
                setExpanded(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
