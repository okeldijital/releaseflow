/**
 * BUILD-014B — Canonical application profile: users/{uid}
 * Source of truth for UI identity (displayName, avatarUrl).
 */
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, Timestamp,
  type Unsubscribe,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface UserProfileRecord {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  biography?: string | null;
  timezone?: string | null;
  locale?: string | null;
  /** Optional org context; not always present on legacy docs. */
  organisationId?: string | null;
  organizationId?: string | null;
  role?: string | null;
  roleCategory?: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: unknown | null;
  defaultOrganizationId?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export type UserProfilePatch = {
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  biography?: string | null;
  timezone?: string | null;
  locale?: string | null;
  organisationId?: string | null;
  organizationId?: string | null;
  defaultOrganizationId?: string | null;
};

function toRecord(id: string, data: Record<string, unknown>): UserProfileRecord {
  return {
    id,
    displayName: (data.displayName as string) || '',
    email: (data.email as string) || '',
    avatarUrl: (data.avatarUrl as string | null | undefined) ?? null,
    avatarPublicId: (data.avatarPublicId as string | null | undefined) ?? null,
    biography: (data.biography as string | null | undefined) ?? null,
    timezone: (data.timezone as string | null | undefined) ?? null,
    locale: (data.locale as string | null | undefined) ?? null,
    organisationId: (data.organisationId as string | null | undefined) ?? null,
    organizationId: (data.organizationId as string | null | undefined) ?? null,
    role: (data.role as string | null | undefined) ?? null,
    roleCategory: (data.roleCategory as string | null | undefined) ?? null,
    onboardingCompleted: Boolean(data.onboardingCompleted),
    onboardingCompletedAt: data.onboardingCompletedAt ?? null,
    defaultOrganizationId: (data.defaultOrganizationId as string | null | undefined) ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getUserProfile(userId: string): Promise<UserProfileRecord | null> {
  const db = getDb();
  if (!db || !userId) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Real-time subscription to users/{uid}. Single listener for CurrentUserProvider.
 */
export function subscribeUserProfile(
  userId: string,
  onData: (profile: UserProfileRecord | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = getDb();
  if (!db || !userId) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(toRecord(snap.id, snap.data() as Record<string, unknown>));
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      onData(null);
    },
  );
}

export async function createUserProfile(
  userId: string,
  fields: {
    displayName: string;
    email: string;
    avatarUrl?: string | null;
    organisationId?: string | null;
  },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await setDoc(doc(db, 'users', userId), {
    displayName: fields.displayName,
    email: fields.email,
    avatarUrl: fields.avatarUrl ?? null,
    avatarPublicId: null,
    biography: null,
    timezone: null,
    locale: null,
    organisationId: fields.organisationId ?? null,
    role: null,
    roleCategory: null,
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    defaultOrganizationId: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function completeUserOnboarding(
  userId: string,
  fields: { role: string; roleCategory: string; defaultOrganizationId: string | null },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'users', userId), {
    role: fields.role,
    roleCategory: fields.roleCategory,
    defaultOrganizationId: fields.defaultOrganizationId,
    onboardingCompleted: true,
    onboardingCompletedAt: now,
    updatedAt: now,
  });
}

export async function updateUserDefaultOrg(userId: string, orgId: string | null): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'users', userId), {
    defaultOrganizationId: orgId,
    updatedAt: Timestamp.now(),
  });
}

/**
 * BUILD-014B — Canonical profile write. Creates doc if missing (merge).
 */
export async function updateUserProfile(
  userId: string,
  fields: UserProfilePatch,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  const now = Timestamp.now();
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: fields.displayName ?? '',
      email: fields.email ?? '',
      avatarUrl: fields.avatarUrl ?? null,
      avatarPublicId: fields.avatarPublicId ?? null,
      biography: fields.biography ?? null,
      timezone: fields.timezone ?? null,
      locale: fields.locale ?? null,
      organisationId: fields.organisationId ?? fields.organizationId ?? null,
      role: null,
      roleCategory: null,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      defaultOrganizationId: fields.defaultOrganizationId ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }
  const patch: Record<string, unknown> = { updatedAt: now };
  if (fields.displayName !== undefined) patch.displayName = fields.displayName;
  if (fields.email !== undefined) patch.email = fields.email;
  if (fields.avatarUrl !== undefined) patch.avatarUrl = fields.avatarUrl;
  if (fields.avatarPublicId !== undefined) patch.avatarPublicId = fields.avatarPublicId;
  if (fields.biography !== undefined) patch.biography = fields.biography;
  if (fields.timezone !== undefined) patch.timezone = fields.timezone;
  if (fields.locale !== undefined) patch.locale = fields.locale;
  if (fields.organisationId !== undefined) patch.organisationId = fields.organisationId;
  if (fields.organizationId !== undefined) patch.organizationId = fields.organizationId;
  if (fields.defaultOrganizationId !== undefined) {
    patch.defaultOrganizationId = fields.defaultOrganizationId;
  }
  await updateDoc(ref, patch);
}
