import {
  doc, getDoc, setDoc, updateDoc, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface UserProfileRecord {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
  roleCategory?: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: unknown | null;
  defaultOrganizationId?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export async function getUserProfile(userId: string): Promise<UserProfileRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfileRecord;
}

export async function createUserProfile(
  userId: string,
  fields: { displayName: string; email: string; avatarUrl?: string | null },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await setDoc(doc(db, 'users', userId), {
    displayName: fields.displayName,
    email: fields.email,
    avatarUrl: fields.avatarUrl ?? null,
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
