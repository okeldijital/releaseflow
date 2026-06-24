import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { logActivity } from '@/lib/workflow-service';
import type { Notification, NotificationType } from '@/app/(app)/types';

export async function createNotification(fields: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  releaseId?: string;
  referenceId?: string;
  referenceType?: string;
}) {
  const db = getDb();
  if (!db) return;
  const ref = await addDoc(collection(db, 'notifications'), {
    userId: fields.userId,
    type: fields.type,
    title: fields.title,
    message: fields.message,
    read: false,
    archived: false,
    referenceId: fields.referenceId ?? null,
    referenceType: fields.referenceType ?? null,
    createdAt: Timestamp.now(),
  });

  await logActivity({
    type: 'notification.created',
    releaseId: fields.releaseId ?? '',
    actorId: fields.userId,
    metadata: { notificationId: ref.id, type: fields.type },
  });

  return ref.id;
}

export async function markAsRead(notificationId: string, actorId: string) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });

  await logActivity({
    type: 'notification.read',
    releaseId: '',
    actorId,
    metadata: { notificationId },
  });
}

export async function archiveNotification(notificationId: string, actorId: string) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'notifications', notificationId), { archived: true });

  await logActivity({
    type: 'notification.archived',
    releaseId: '',
    actorId,
    metadata: { notificationId },
  });
}

export async function getNotificationsByUser(userId: string, maxCount = 20): Promise<Notification[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('archived', '==', false),
      orderBy('createdAt', 'desc'),
      limit(maxCount),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Notification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const snap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      where('archived', '==', false),
    ),
  );
  return snap.size;
}
