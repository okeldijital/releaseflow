import {
  doc, getDoc, getDocs, addDoc, updateDoc, writeBatch,
  collection, query, where, orderBy, limit, startAfter, Timestamp,
  onSnapshot,
  type QueryDocumentSnapshot, type DocumentData, type Unsubscribe,
} from '@firebase/firestore';
import { getDb } from './firebase';

/** NOT-001 deliveryStatus — in-app row is always "delivered" once written. */
export type NotificationDeliveryStatus =
  | 'pending'
  | 'delivered'
  | 'failed'
  | 'partial';

export interface UserNotificationRecord {
  id: string;
  organizationId: string;
  userId: string;
  eventId: string;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  assignmentId: string | null;
  releaseId: string | null;
  actorId: string;
  actorName: string;
  isRead: boolean;
  readAt: Timestamp | null;
  createdAt: Timestamp;
  /** NOT-001 — overall multi-channel status for this inbox row */
  deliveryStatus: NotificationDeliveryStatus;
  /** Channels attempted / queued for this notification */
  channels: {
    inApp: boolean;
    emailQueued: boolean;
    pushQueued: boolean;
  };
}

export interface CreateUserNotificationFields {
  organizationId: string;
  userId: string;
  eventId: string;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  assignmentId?: string | null;
  releaseId?: string | null;
  actorId: string;
  actorName: string;
  deliveryStatus?: NotificationDeliveryStatus;
  channels?: {
    inApp?: boolean;
    emailQueued?: boolean;
    pushQueued?: boolean;
  };
}

function toRecord(id: string, data: Record<string, unknown>): UserNotificationRecord {
  const channels = (data.channels as UserNotificationRecord['channels'] | undefined) ?? {
    inApp: true,
    emailQueued: false,
    pushQueued: false,
  };
  return {
    id,
    organizationId: data.organizationId as string,
    userId: data.userId as string,
    eventId: data.eventId as string,
    type: data.type as string,
    title: data.title as string,
    message: data.message as string,
    entityType: data.entityType as string,
    entityId: data.entityId as string,
    assignmentId: (data.assignmentId as string | null) ?? null,
    releaseId: (data.releaseId as string | null) ?? null,
    actorId: data.actorId as string,
    actorName: (data.actorName as string) ?? 'Someone',
    isRead: (data.isRead as boolean) ?? false,
    readAt: (data.readAt as Timestamp | null) ?? null,
    createdAt: data.createdAt as Timestamp,
    deliveryStatus: (data.deliveryStatus as NotificationDeliveryStatus) ?? 'delivered',
    channels: {
      inApp: channels.inApp ?? true,
      emailQueued: channels.emailQueued ?? false,
      pushQueued: channels.pushQueued ?? false,
    },
  };
}

export async function findUserNotificationByEvent(
  userId: string,
  eventId: string,
): Promise<UserNotificationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, 'user_notifications'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  if (!d) return null;
  return toRecord(d.id, d.data() as Record<string, unknown>);
}

export async function createUserNotification(
  fields: CreateUserNotificationFields,
): Promise<UserNotificationRecord> {
  const existing = await findUserNotificationByEvent(fields.userId, fields.eventId);
  if (existing) return existing;

  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const channels = {
    inApp: fields.channels?.inApp ?? true,
    emailQueued: fields.channels?.emailQueued ?? false,
    pushQueued: fields.channels?.pushQueued ?? false,
  };
  const data = {
    organizationId: fields.organizationId,
    userId: fields.userId,
    eventId: fields.eventId,
    type: fields.type,
    title: fields.title,
    message: fields.message,
    entityType: fields.entityType,
    entityId: fields.entityId,
    assignmentId: fields.assignmentId ?? null,
    releaseId: fields.releaseId ?? null,
    actorId: fields.actorId,
    actorName: fields.actorName,
    isRead: false,
    readAt: null,
    createdAt: now,
    deliveryStatus: fields.deliveryStatus ?? 'delivered',
    channels,
  };
  const ref = await addDoc(collection(db, 'user_notifications'), data);
  return toRecord(ref.id, { ...data, id: ref.id });
}

export async function getUserNotification(
  notificationId: string,
): Promise<UserNotificationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'user_notifications', notificationId));
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as Record<string, unknown>);
}

export async function listUserNotifications(
  userId: string,
  opts?: {
    organizationId?: string;
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData>;
    unreadOnly?: boolean;
  },
): Promise<{
  notifications: UserNotificationRecord[];
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> {
  const db = getDb();
  if (!db) return { notifications: [], hasMore: false, lastDoc: null };
  const pageSize = opts?.pageSize ?? 50;

  const constraints = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1),
  ] as const;

  // Note: organization filter applied client-side when provided to avoid
  // requiring an extra composite index for every combination.
  const q = opts?.cursor
    ? query(collection(db, 'user_notifications'), ...constraints, startAfter(opts.cursor))
    : query(collection(db, 'user_notifications'), ...constraints);

  const snap = await getDocs(q);
  let docs = snap.docs;
  const hasMore = docs.length > pageSize;
  if (hasMore) docs = docs.slice(0, pageSize);

  let notifications = docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  if (opts?.organizationId) {
    notifications = notifications.filter((n) => n.organizationId === opts.organizationId);
  }
  if (opts?.unreadOnly) {
    notifications = notifications.filter((n) => !n.isRead);
  }

  const lastDoc = docs.length > 0 ? docs[docs.length - 1] ?? null : null;
  return { notifications, hasMore, lastDoc };
}

export async function getUnreadUserNotificationCount(
  userId: string,
  organizationId?: string,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const snap = await getDocs(
    query(
      collection(db, 'user_notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false),
    ),
  );
  if (!organizationId) return snap.size;
  return snap.docs.filter((d) => (d.data() as { organizationId?: string }).organizationId === organizationId).length;
}

export async function markUserNotificationRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  const existing = await getUserNotification(notificationId);
  if (!existing) throw new Error('Notification not found');
  if (existing.userId !== userId) throw new Error('Cannot modify another user\'s notification');
  if (existing.isRead) return;
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'user_notifications', notificationId), {
    isRead: true,
    readAt: Timestamp.now(),
  });
}

export async function markAllUserNotificationsRead(
  userId: string,
  organizationId?: string,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const snap = await getDocs(
    query(
      collection(db, 'user_notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false),
    ),
  );
  const now = Timestamp.now();
  let count = 0;
  const batch = writeBatch(db);
  for (const d of snap.docs) {
    const data = d.data() as { organizationId?: string };
    if (organizationId && data.organizationId !== organizationId) continue;
    batch.update(d.ref, { isRead: true, readAt: now });
    count++;
  }
  if (count > 0) await batch.commit();
  return count;
}

/**
 * NOT-001 — live unread count for badge (no 60s-only lag).
 * Filters org client-side when organizationId is provided.
 */
export function subscribeUnreadCount(
  userId: string,
  onCount: (count: number) => void,
  organizationId?: string,
): Unsubscribe {
  const db = getDb();
  if (!db || !userId) {
    onCount(0);
    return () => {};
  }
  return onSnapshot(
    query(
      collection(db, 'user_notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false),
    ),
    (snap) => {
      if (!organizationId) {
        onCount(snap.size);
        return;
      }
      onCount(
        snap.docs.filter(
          (d) => (d.data() as { organizationId?: string }).organizationId === organizationId,
        ).length,
      );
    },
    () => {
      // keep last known via no-op; caller may poll as fallback
    },
  );
}
