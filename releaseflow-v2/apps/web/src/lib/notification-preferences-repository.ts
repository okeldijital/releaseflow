import { doc, getDoc, setDoc, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';
import {
  DEFAULT_PREFERENCE_FLAGS,
  type PreferenceKey,
} from './notification-type-registry';

export interface NotificationPreferencesRecord {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  preferences: Record<PreferenceKey, boolean>;
  updatedAt: Timestamp;
}

function defaults(userId: string): NotificationPreferencesRecord {
  return {
    userId,
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
    preferences: { ...DEFAULT_PREFERENCE_FLAGS },
    updatedAt: Timestamp.now(),
  };
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferencesRecord> {
  const db = getDb();
  if (!db) return defaults(userId);
  const snap = await getDoc(doc(db, 'notification_preferences', userId));
  if (!snap.exists()) {
    const d = defaults(userId);
    await setDoc(doc(db, 'notification_preferences', userId), d);
    return d;
  }
  const data = snap.data() as Record<string, unknown>;
  return {
    userId,
    emailEnabled: (data.emailEnabled as boolean) ?? true,
    pushEnabled: (data.pushEnabled as boolean) ?? false,
    inAppEnabled: (data.inAppEnabled as boolean) ?? true,
    preferences: {
      ...DEFAULT_PREFERENCE_FLAGS,
      ...((data.preferences as Record<PreferenceKey, boolean>) ?? {}),
    },
    updatedAt: (data.updatedAt as Timestamp) ?? Timestamp.now(),
  };
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<Pick<NotificationPreferencesRecord, 'emailEnabled' | 'pushEnabled' | 'inAppEnabled' | 'preferences'>>,
): Promise<NotificationPreferencesRecord> {
  const current = await getNotificationPreferences(userId);
  const next: NotificationPreferencesRecord = {
    ...current,
    emailEnabled: updates.emailEnabled ?? current.emailEnabled,
    pushEnabled: updates.pushEnabled ?? current.pushEnabled,
    inAppEnabled: updates.inAppEnabled ?? current.inAppEnabled,
    preferences: {
      ...current.preferences,
      ...(updates.preferences ?? {}),
    },
    updatedAt: Timestamp.now(),
  };
  const db = getDb();
  if (!db) return next;
  await setDoc(doc(db, 'notification_preferences', userId), next);
  return next;
}

export function isPreferenceEnabled(
  prefs: NotificationPreferencesRecord,
  preferenceKey: PreferenceKey,
  channel: 'inApp' | 'email' | 'push',
): boolean {
  if (channel === 'inApp' && !prefs.inAppEnabled) return false;
  if (channel === 'email' && !prefs.emailEnabled) return false;
  if (channel === 'push' && !prefs.pushEnabled) return false;
  return prefs.preferences[preferenceKey] !== false;
}
