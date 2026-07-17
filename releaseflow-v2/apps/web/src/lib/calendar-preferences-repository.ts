import { doc, getDoc, setDoc, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';

export type CalendarViewMode = 'agenda' | 'day' | 'week' | 'month';

export interface CalendarPreferencesRecord {
  userId: string;
  defaultView: CalendarViewMode;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showWeekends: boolean;
  compactMode: boolean;
  updatedAt: Timestamp;
}

function defaults(userId: string): CalendarPreferencesRecord {
  return {
    userId,
    defaultView: 'week',
    weekStartsOn: 1,
    showWeekends: true,
    compactMode: false,
    updatedAt: Timestamp.now(),
  };
}

export async function getCalendarPreferences(
  userId: string,
): Promise<CalendarPreferencesRecord> {
  const db = getDb();
  if (!db) return defaults(userId);
  const snap = await getDoc(doc(db, 'calendar_preferences', userId));
  if (!snap.exists()) {
    const d = defaults(userId);
    await setDoc(doc(db, 'calendar_preferences', userId), d);
    return d;
  }
  const data = snap.data() as Record<string, unknown>;
  return {
    userId,
    defaultView: (data.defaultView as CalendarViewMode) ?? 'week',
    weekStartsOn: (data.weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6) ?? 1,
    showWeekends: data.showWeekends !== false,
    compactMode: data.compactMode === true,
    updatedAt: (data.updatedAt as Timestamp) ?? Timestamp.now(),
  };
}

export async function updateCalendarPreferences(
  userId: string,
  updates: Partial<Pick<CalendarPreferencesRecord, 'defaultView' | 'weekStartsOn' | 'showWeekends' | 'compactMode'>>,
): Promise<CalendarPreferencesRecord> {
  const current = await getCalendarPreferences(userId);
  const next: CalendarPreferencesRecord = {
    ...current,
    ...updates,
    userId,
    updatedAt: Timestamp.now(),
  };
  const db = getDb();
  if (!db) return next;
  await setDoc(doc(db, 'calendar_preferences', userId), next);
  return next;
}
