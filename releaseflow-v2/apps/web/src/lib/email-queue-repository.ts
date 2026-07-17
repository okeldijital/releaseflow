import { addDoc, collection, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';

export type EmailQueueStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface EmailQueueRecord {
  id?: string;
  notificationId: string;
  recipient: string;
  subject: string;
  template: string;
  payload: Record<string, unknown>;
  status: EmailQueueStatus;
  createdAt: Timestamp;
}

/** Enqueue an email job — never sends. Worker is a future milestone. */
export async function enqueueEmailJob(fields: {
  notificationId: string;
  recipient: string;
  subject: string;
  template: string;
  payload?: Record<string, unknown>;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const data = {
    notificationId: fields.notificationId,
    recipient: fields.recipient,
    subject: fields.subject,
    template: fields.template,
    payload: fields.payload ?? {},
    status: 'pending' as EmailQueueStatus,
    createdAt: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, 'email_queue'), data);
  return ref.id;
}
