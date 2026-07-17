/**
 * NOT-001 — Push delivery queue (FCM worker contract).
 *
 * Client enqueues only. A server worker (Cloud Function / Admin SDK) reads
 * pending jobs, resolves push_subscriptions, sends via FCM, and marks status.
 * Never send from the browser.
 */

import { addDoc, collection, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';

export type PushQueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'skipped';

export interface PushQueueRecord {
  id?: string;
  notificationId: string;
  userId: string;
  organizationId: string;
  title: string;
  body: string;
  deepLink: string;
  eventType: string;
  status: PushQueueStatus;
  createdAt: Timestamp;
  /** Idempotency: one job per notificationId */
  dedupeKey: string;
}

/** Enqueue an FCM push job — never sends. */
export async function enqueuePushJob(fields: {
  notificationId: string;
  userId: string;
  organizationId: string;
  title: string;
  body: string;
  deepLink: string;
  eventType: string;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const data = {
    notificationId: fields.notificationId,
    userId: fields.userId,
    organizationId: fields.organizationId,
    title: fields.title,
    body: fields.body,
    deepLink: fields.deepLink,
    eventType: fields.eventType,
    status: 'pending' as PushQueueStatus,
    dedupeKey: fields.notificationId,
    createdAt: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, 'push_queue'), data);
  return ref.id;
}
