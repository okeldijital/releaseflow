import {
  doc, getDoc, setDoc, updateDoc,
  Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface NotificationSettingsRecord {
  id: string;
  organizationId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  assignmentEmails: boolean;
  reminderEmails: boolean;
  weeklyDigest: boolean;
  branding: {
    primaryColor?: string;
    logoUrl?: string;
  };
  updatedAt: unknown;
}

const DEFAULT_SETTINGS: Omit<NotificationSettingsRecord, 'id' | 'organizationId' | 'updatedAt'> = {
  emailEnabled: true,
  inAppEnabled: true,
  assignmentEmails: true,
  reminderEmails: true,
  weeklyDigest: false,
  branding: {},
};

export async function getNotificationSettings(orgId: string): Promise<NotificationSettingsRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');

  const ref = doc(db, 'organizations', orgId, 'settings', 'notifications');
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const now = Timestamp.now();
    const defaults: NotificationSettingsRecord = {
      id: 'notifications',
      organizationId: orgId,
      ...DEFAULT_SETTINGS,
      updatedAt: now,
    };
    await setDoc(ref, { ...defaults, id: undefined, organizationId: undefined });
    return defaults;
  }

  return { id: snap.id, ...snap.data() } as NotificationSettingsRecord;
}

export async function updateNotificationSettings(
  orgId: string,
  updates: Partial<Omit<NotificationSettingsRecord, 'id' | 'organizationId' | 'updatedAt'>>,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');

  await updateDoc(doc(db, 'organizations', orgId, 'settings', 'notifications'), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}
