/**
 * PROF-001 — Self-service account profile updates.
 *
 * Updates propagate to:
 * - Firebase Auth (displayName, photoURL) → shell / live user
 * - users/{uid} profile document
 * - people/{personId} when the user is linked in the active org
 */

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  type User,
} from '@firebase/auth';
import { doc, updateDoc, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';
import { updateUserProfile } from './user-profile-repository';
import {
  uploadImageFile,
  getAvatarThumbnailUrl,
} from '@/components/common/image-upload/image-upload-service';
import { requestPasswordReset } from './auth/password-reset-service';

export function hasPasswordProvider(user: User): boolean {
  return (user.providerData ?? []).some((p) => p.providerId === 'password');
}

export async function updateMyDisplayName(
  user: User,
  displayName: string,
  opts?: { personId?: string | null },
): Promise<string> {
  const name = displayName.trim();
  if (!name) throw new Error('Display name is required');
  if (name.length > 80) throw new Error('Display name is too long');

  await updateProfile(user, { displayName: name });
  await updateUserProfile(user.uid, { displayName: name });

  if (opts?.personId) {
    const db = getDb();
    if (db) {
      await updateDoc(doc(db, 'people', opts.personId), {
        displayName: name,
        updatedAt: Timestamp.now(),
      });
    }
  }

  return name;
}

export async function updateMyAvatar(
  user: User,
  file: File,
  organizationId: string,
  opts?: { personId?: string | null },
): Promise<string> {
  if (!organizationId) throw new Error('Organization is required to upload a photo');

  const result = await uploadImageFile(file, {
    entityType: 'avatar',
    entityId: user.uid,
    organizationId,
    tags: [`user:${user.uid}`, `org:${organizationId}`],
  });
  const photoURL = getAvatarThumbnailUrl(result.publicId);

  await updateProfile(user, { photoURL });
  await updateUserProfile(user.uid, {
    avatarUrl: photoURL,
    avatarPublicId: result.publicId,
  });

  if (opts?.personId) {
    const db = getDb();
    if (db) {
      await updateDoc(doc(db, 'people', opts.personId), {
        avatarUrl: photoURL,
        avatarPublicId: result.publicId,
        updatedAt: Timestamp.now(),
      });
    }
  }

  return photoURL;
}

export async function removeMyAvatar(
  user: User,
  opts?: { personId?: string | null },
): Promise<void> {
  await updateProfile(user, { photoURL: null });
  await updateUserProfile(user.uid, {
    avatarUrl: null,
    avatarPublicId: null,
  });

  if (opts?.personId) {
    const db = getDb();
    if (db) {
      await updateDoc(doc(db, 'people', opts.personId), {
        avatarUrl: null,
        avatarPublicId: null,
        updatedAt: Timestamp.now(),
      });
    }
  }
}

export async function changeMyPassword(
  user: User,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (!user.email) throw new Error('No email on this account');
  if (!hasPasswordProvider(user)) {
    throw new Error('This account does not use email/password sign-in');
  }
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (currentPassword === newPassword) {
    throw new Error('New password must be different from the current password');
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function sendMyPasswordResetEmail(email: string): Promise<void> {
  await requestPasswordReset(email);
}
