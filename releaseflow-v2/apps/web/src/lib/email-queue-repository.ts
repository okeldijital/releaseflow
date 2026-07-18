/**
 * NOT-002 — Email delivery queue.
 *
 * Processor enqueues only. Email worker (API / Admin) sends and updates status.
 * Business services and UI must never call the email provider for notification mail.
 */

import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type EmailQueueStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface EmailQueueRecord {
  id: string;
  organizationId: string;
  recipientUid: string;
  recipientEmail: string;
  notificationId: string;
  eventId: string;
  eventType: string;
  template: string;
  subject: string;
  payload: Record<string, unknown>;
  status: EmailQueueStatus;
  attempts: number;
  createdAt: Timestamp;
  sentAt: Timestamp | null;
  failedAt: Timestamp | null;
  lastError: string | null;
  /** Deduplication key: eventId + recipientUid */
  dedupeKey: string;
}

export interface EnqueueEmailJobFields {
  organizationId: string;
  recipientUid: string;
  recipientEmail: string;
  notificationId: string;
  eventId: string;
  eventType: string;
  template: string;
  subject: string;
  payload?: Record<string, unknown>;
}

const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

function toRecord(id: string, data: Record<string, unknown>): EmailQueueRecord {
  return {
    id,
    organizationId: (data.organizationId as string) ?? '',
    recipientUid: (data.recipientUid as string) ?? '',
    recipientEmail: (data.recipientEmail as string) ?? (data.recipient as string) ?? '',
    notificationId: data.notificationId as string,
    eventId: (data.eventId as string) ?? '',
    eventType: (data.eventType as string) ?? '',
    template: data.template as string,
    subject: data.subject as string,
    payload: (data.payload as Record<string, unknown>) ?? {},
    status: (data.status as EmailQueueStatus) ?? 'pending',
    attempts: (data.attempts as number) ?? 0,
    createdAt: data.createdAt as Timestamp,
    sentAt: (data.sentAt as Timestamp | null) ?? null,
    failedAt: (data.failedAt as Timestamp | null) ?? null,
    lastError: (data.lastError as string | null) ?? null,
    dedupeKey: (data.dedupeKey as string)
      ?? `${data.eventId ?? ''}:${data.recipientUid ?? data.recipient ?? ''}`,
  };
}

/**
 * Enqueue a notification email job.
 * Dedupes by notificationId and by eventId+recipientUid (recent window).
 * Never sends — worker only.
 */
export async function enqueueEmailJob(
  fields: EnqueueEmailJobFields,
): Promise<string | null> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const recipientEmail = fields.recipientEmail.trim().toLowerCase();
  if (!recipientEmail) return null;

  const dedupeKey = `${fields.eventId}:${fields.recipientUid}`;

  // Same notification → never double-queue
  try {
    const byNotif = await getDocs(
      query(
        collection(db, 'email_queue'),
        where('notificationId', '==', fields.notificationId),
        limit(1),
      ),
    );
    if (!byNotif.empty) {
      console.log('[email_queue] skip — notification already queued', fields.notificationId);
      return byNotif.docs[0]?.id ?? null;
    }
  } catch (err) {
    console.warn('[email_queue] dedupe by notificationId failed', err);
  }

  // Identical event+user within window
  try {
    const byKey = await getDocs(
      query(
        collection(db, 'email_queue'),
        where('dedupeKey', '==', dedupeKey),
        limit(5),
      ),
    );
    const now = Date.now();
    for (const d of byKey.docs) {
      const rec = toRecord(d.id, d.data() as Record<string, unknown>);
      const createdMs =
        rec.createdAt && typeof rec.createdAt.toMillis === 'function'
          ? rec.createdAt.toMillis()
          : 0;
      if (
        now - createdMs < DEDUPE_WINDOW_MS
        && (rec.status === 'pending' || rec.status === 'sending' || rec.status === 'sent')
      ) {
        console.log('[email_queue] skip — dedupe window', dedupeKey);
        return d.id;
      }
    }
  } catch (err) {
    console.warn('[email_queue] dedupe by key failed', err);
  }

  const data = {
    organizationId: fields.organizationId,
    recipientUid: fields.recipientUid,
    recipientEmail,
    // legacy field for older readers
    recipient: recipientEmail,
    notificationId: fields.notificationId,
    eventId: fields.eventId,
    eventType: fields.eventType,
    template: fields.template,
    subject: fields.subject,
    payload: fields.payload ?? {},
    status: 'pending' as EmailQueueStatus,
    attempts: 0,
    createdAt: Timestamp.now(),
    sentAt: null,
    failedAt: null,
    lastError: null,
    dedupeKey,
  };

  const ref = await addDoc(collection(db, 'email_queue'), data);
  console.log('[email_queue] queued', {
    id: ref.id,
    eventType: fields.eventType,
    recipientUid: fields.recipientUid,
    template: fields.template,
  });
  return ref.id;
}

/** Client-side list of pending jobs (worker prefers Admin). */
export async function listPendingEmailJobs(max = 25): Promise<EmailQueueRecord[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'email_queue'),
        where('status', '==', 'pending'),
        limit(max),
      ),
    );
    return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  } catch (err) {
    console.warn('[email_queue] list pending failed', err);
    return [];
  }
}
