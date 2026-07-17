import { doc, getDoc, setDoc, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';

export const PROCESSOR_VERSION = '1.0.0';

export interface NotificationProcessingRecord {
  eventId: string;
  processedAt: Timestamp;
  processorVersion: string;
}

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const snap = await getDoc(doc(db, 'notification_processing', eventId));
  return snap.exists();
}

export async function markEventProcessed(eventId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await setDoc(doc(db, 'notification_processing', eventId), {
    eventId,
    processedAt: Timestamp.now(),
    processorVersion: PROCESSOR_VERSION,
  });
}
