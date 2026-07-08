import {
  doc, getDocs, getDoc, addDoc, updateDoc,
  collection, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  referenceId?: string | null;
  referenceType?: string | null;
  assignmentId?: string | null;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface CreateNotificationFields {
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: string | null;
  assignmentId?: string | null;
}

export async function createNotification(fields: CreateNotificationFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'notifications'), {
    userId: fields.userId,
    type: fields.type,
    title: fields.title,
    message: fields.message,
    read: false,
    archived: false,
    referenceId: fields.referenceId ?? null,
    referenceType: fields.referenceType ?? null,
    assignmentId: fields.assignmentId ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getNotification(notificationId: string): Promise<NotificationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'notifications', notificationId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as NotificationRecord;
}

export async function getUserNotifications(userId: string, opts?: { maxCount?: number; includeRead?: boolean }): Promise<NotificationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const constraints = [
    where('userId', '==', userId),
    where('archived', '==', false),
    orderBy('createdAt', 'desc'),
    limit(opts?.maxCount ?? 50),
  ];
  const snap = await getDocs(query(collection(db, 'notifications'), ...constraints));
  let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as NotificationRecord);
  if (!opts?.includeRead) results = results.filter((n) => !n.read);
  return results;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'notifications', notificationId), { read: true, updatedAt: Timestamp.now() });
}

export async function archiveNotification(notificationId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'notifications', notificationId), { archived: true, updatedAt: Timestamp.now() });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
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

export async function createAssignmentNotification(
  userId: string,
  assignmentId: string,
  title: string,
  message: string,
  type = 'assignment',
): Promise<string> {
  return createNotification({
    userId, type, title, message,
    referenceId: assignmentId,
    referenceType: 'assignment',
    assignmentId,
  });
}
