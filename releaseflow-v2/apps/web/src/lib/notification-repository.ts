import {
  doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';
import type { NotificationType, NotificationStatus } from '@/app/(app)/types';

export interface NotificationRecord {
  id: string;
  organizationId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  recipientId: string;
  recipientEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: unknown | null;
  sentAt?: unknown | null;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface CreateNotificationFields {
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  recipientEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

function toRecord(id: string, data: Record<string, unknown>): NotificationRecord {
  return {
    id,
    organizationId: data.organizationId as string,
    type: data.type as NotificationType,
    status: (data.status as NotificationStatus) || 'unread',
    title: data.title as string,
    message: data.message as string,
    recipientId: data.recipientId as string,
    recipientEmail: data.recipientEmail as string | null | undefined,
    entityType: data.entityType as string | null | undefined,
    entityId: data.entityId as string | null | undefined,
    readAt: data.readAt,
    sentAt: data.sentAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createNotification(fields: CreateNotificationFields): Promise<NotificationRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'notifications'), {
    organizationId: fields.organizationId,
    type: fields.type,
    status: 'unread',
    title: fields.title,
    message: fields.message,
    recipientId: fields.recipientId,
    recipientEmail: fields.recipientEmail ?? null,
    entityType: fields.entityType ?? null,
    entityId: fields.entityId ?? null,
    readAt: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  });
  return toRecord(ref.id, { ...fields, id: ref.id, status: 'unread', createdAt: now, updatedAt: now });
}

export async function getNotification(notificationId: string): Promise<NotificationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'notifications', notificationId));
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as Record<string, unknown>);
}

export async function getUserNotifications(
  recipientId: string,
  opts?: { maxCount?: number; status?: NotificationStatus },
): Promise<NotificationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const constraints = [
    where('recipientId', '==', recipientId),
    orderBy('createdAt', 'desc'),
    limit(opts?.maxCount ?? 50),
  ];
  const snap = await getDocs(query(collection(db, 'notifications'), ...constraints));
  let results = snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
  if (opts?.status) results = results.filter((n) => n.status === opts.status);
  return results;
}

export async function getNotificationsByOrg(
  orgId: string,
  maxCount = 50,
): Promise<NotificationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc'),
      limit(maxCount),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'notifications', notificationId), {
    status: 'read', readAt: Timestamp.now(), updatedAt: Timestamp.now(),
  });
}

export async function archiveNotification(notificationId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'notifications', notificationId), {
    status: 'archived', updatedAt: Timestamp.now(),
  });
}

export async function markNotificationsSent(notificationIds: string[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  for (const id of notificationIds) {
    await updateDoc(doc(db, 'notifications', id), { sentAt: now, updatedAt: now });
  }
}

export async function getUnreadNotificationCount(recipientId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const snap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('recipientId', '==', recipientId),
      where('status', '==', 'unread'),
    ),
  );
  return snap.size;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'notifications', notificationId));
}
