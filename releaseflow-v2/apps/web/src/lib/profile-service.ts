/**
 * BUILD-014B — Single profile update pipeline.
 *
 * Canonical write order:
 *   1. users/{uid} (source of truth)
 *   2. Firebase Auth mirror (compat only — not for UI reads)
 *   3. Linked Person sync (if personId provided)
 *   4. Invalidate identity cache (caller refreshes CurrentUser)
 *
 * No other module may update profile/avatar fields directly.
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
import {
  updateUserProfile,
  getUserProfile,
  type UserProfileRecord,
  type UserProfilePatch,
} from './user-profile-repository';
import {
  uploadImageFile,
  getAvatarThumbnailUrl,
} from '@/components/common/image-upload/image-upload-service';
import { attemptDestroyFile } from '@/lib/media/media-upload';
import { requestPasswordReset } from './auth/password-reset-service';
import { clearIdentityCache } from './identity-service';

export type { UserProfileRecord };

export function hasPasswordProvider(user: User): boolean {
  return (user.providerData ?? []).some((p) => p.providerId === 'password');
}

async function syncLinkedPerson(
  personId: string | null | undefined,
  fields: {
    displayName?: string;
    avatarUrl?: string | null;
    avatarPublicId?: string | null;
  },
): Promise<void> {
  if (!personId) return;
  const db = getDb();
  if (!db) return;
  const patch: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.displayName !== undefined) patch.displayName = fields.displayName;
  if (fields.avatarUrl !== undefined) patch.avatarUrl = fields.avatarUrl;
  if (fields.avatarPublicId !== undefined) patch.avatarPublicId = fields.avatarPublicId;
  await updateDoc(doc(db, 'people', personId), patch);
}

/** Best-effort Auth mirror — never the source of truth for UI. */
async function mirrorAuth(
  user: User,
  fields: { displayName?: string | null; photoURL?: string | null },
): Promise<void> {
  try {
    await updateProfile(user, fields);
  } catch (err) {
    console.warn('[profile-service] Auth mirror failed (non-fatal)', err);
  }
}

export async function updateMyDisplayName(
  user: User,
  displayName: string,
  opts?: { personId?: string | null },
): Promise<string> {
  const name = displayName.trim();
  if (!name) throw new Error('Display name is required');
  if (name.length > 80) throw new Error('Display name is too long');

  await updateUserProfile(user.uid, { displayName: name });
  await mirrorAuth(user, { displayName: name });
  await syncLinkedPerson(opts?.personId, { displayName: name });
  clearIdentityCache(user.uid);
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
  const avatarUrl = getAvatarThumbnailUrl(result.publicId);

  // 1. Canonical profile
  await updateUserProfile(user.uid, {
    avatarUrl,
    avatarPublicId: result.publicId,
  });
  // 2. Auth mirror
  await mirrorAuth(user, { photoURL: avatarUrl });
  // 3. Linked Person
  await syncLinkedPerson(opts?.personId, {
    avatarUrl,
    avatarPublicId: result.publicId,
  });
  clearIdentityCache(user.uid);
  return avatarUrl;
}

export async function removeMyAvatar(
  user: User,
  opts?: { personId?: string | null; organizationId?: string | null },
): Promise<void> {
  // Best-effort Cloudinary destroy before clearing profile pointers
  try {
    const existing = await getUserProfile(user.uid);
    if (existing?.avatarPublicId && opts?.organizationId) {
      await attemptDestroyFile({
        publicId: existing.avatarPublicId,
        organizationId: opts.organizationId,
        entityType: 'avatar',
      });
    }
  } catch {
    /* non-fatal */
  }

  await updateUserProfile(user.uid, {
    avatarUrl: null,
    avatarPublicId: null,
  });
  await mirrorAuth(user, { photoURL: null });
  await syncLinkedPerson(opts?.personId, {
    avatarUrl: null,
    avatarPublicId: null,
  });
  clearIdentityCache(user.uid);
}

/**
 * General profile fields (biography, locale, timezone, displayName).
 * Single path for Profile + Administration.
 */
export async function updateMyProfile(
  user: User,
  fields: UserProfilePatch,
  opts?: { personId?: string | null },
): Promise<UserProfileRecord | null> {
  const patch: UserProfilePatch = { ...fields };
  if (fields.displayName !== undefined) {
    const name = fields.displayName.trim();
    if (!name) throw new Error('Display name is required');
    if (name.length > 80) throw new Error('Display name is too long');
    patch.displayName = name;
  }

  await updateUserProfile(user.uid, patch);

  if (patch.displayName !== undefined) {
    await mirrorAuth(user, { displayName: patch.displayName });
    await syncLinkedPerson(opts?.personId, { displayName: patch.displayName });
  }

  clearIdentityCache(user.uid);
  return getUserProfile(user.uid);
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

export async function loadMyProfile(userId: string): Promise<UserProfileRecord | null> {
  return getUserProfile(userId);
}
