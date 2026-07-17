import {
  Timestamp, collection, addDoc, getDocs, query, where, orderBy, limit,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { NotificationRegistryKey } from './notification-type-registry';

/** All event types the processor understands (extends CE-005). */
export type NotificationEventType = NotificationRegistryKey;

export interface NotificationEvent {
  id: string;
  type: NotificationEventType | string;
  organizationId: string;
  actorId: string;
  recipientId?: string | null;
  entityId: string;
  entityType: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Timestamp;
  deliveredAt?: Timestamp | null;
}

export async function generateNotificationEvent(fields: {
  type: NotificationEventType | string;
  organizationId: string;
  actorId: string;
  recipientId?: string;
  entityId: string;
  entityType: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const data = {
    type: fields.type,
    organizationId: fields.organizationId,
    actorId: fields.actorId,
    recipientId: fields.recipientId ?? null,
    entityId: fields.entityId,
    entityType: fields.entityType,
    metadata: fields.metadata ?? null,
    createdAt: Timestamp.now(),
    deliveredAt: null,
  };

  const ref = await addDoc(collection(db, 'notification_events'), data);
  return ref.id;
}

export async function getRecentNotificationEvents(
  organizationId: string,
  maxCount = 100,
): Promise<NotificationEvent[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'notification_events'),
      where('organizationId', '==', organizationId),
      orderBy('createdAt', 'desc'),
      limit(maxCount),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as NotificationEvent);
}

/**
 * System-generated events (e.g. due reminders) may use actorId = 'system'.
 * Firestore rules require actorId == auth.uid for creates; client-side
 * reminder engine uses the current user's uid as actor with metadata.system=true
 * when rules block system actor. Prefer generateNotificationEvent with actor.
 */
export async function generateSystemNotificationEvent(fields: {
  type: NotificationEventType | string;
  organizationId: string;
  actorId: string;
  recipientId?: string;
  entityId: string;
  entityType: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  return generateNotificationEvent({
    ...fields,
    metadata: { ...(fields.metadata ?? {}), system: true },
  });
}
