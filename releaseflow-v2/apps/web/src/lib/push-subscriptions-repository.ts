import {
  doc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  keys: { p256dh?: string; auth?: string } | Record<string, string>;
  platform: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Store a push subscription — delivery is a future milestone. */
export async function upsertPushSubscription(fields: {
  userId: string;
  endpoint: string;
  keys: Record<string, string>;
  platform?: string;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const existing = await getDocs(
    query(
      collection(db, 'push_subscriptions'),
      where('userId', '==', fields.userId),
      where('endpoint', '==', fields.endpoint),
    ),
  );
  const now = Timestamp.now();
  if (!existing.empty && existing.docs[0]) {
    await updateDoc(doc(db, 'push_subscriptions', existing.docs[0].id), {
      keys: fields.keys,
      platform: fields.platform ?? 'web',
      updatedAt: now,
    });
    return existing.docs[0].id;
  }
  const ref = await addDoc(collection(db, 'push_subscriptions'), {
    userId: fields.userId,
    endpoint: fields.endpoint,
    keys: fields.keys,
    platform: fields.platform ?? 'web',
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function listPushSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'push_subscriptions'), where('userId', '==', userId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PushSubscriptionRecord);
}

export async function removePushSubscription(subscriptionId: string, userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDocs(
    query(collection(db, 'push_subscriptions'), where('userId', '==', userId)),
  );
  const match = snap.docs.find((d) => d.id === subscriptionId);
  if (match) await deleteDoc(doc(db, 'push_subscriptions', match.id));
}
