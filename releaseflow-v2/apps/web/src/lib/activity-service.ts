import {
  getDocs, addDoc, deleteDoc, doc,
  collection, query, where, orderBy, limit,
  Timestamp, WriteBatch,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface ActivityEventRecord {
  id: string;

  organizationId: string;

  entityType: 'release' | 'track' | 'task' | 'specification' | 'asset' | 'distribution_package' | 'comment' | 'approval' | 'ownership' | 'credit' | 'right';

  entityId: string;

  action: string;

  actorId: string;

  metadata?: Record<string, unknown> | null;

  createdAt: Timestamp;
}

export interface RecordActivityFields {
  entityType: ActivityEventRecord['entityType'];
  entityId: string;
  organizationId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown> | null;
  details?: string | null;
  batch?: WriteBatch;
}

export async function recordActivity(fields: RecordActivityFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const metadata: Record<string, unknown> = { ...(fields.metadata ?? {}) };
  if (fields.details !== undefined) metadata.details = fields.details ?? null;
  const data = {
    entityType: fields.entityType,
    entityId: fields.entityId,
    organizationId: fields.organizationId,
    actorId: fields.actorId,
    action: fields.action,
    metadata,
    createdAt: now,
  };
  if (fields.batch) {
    const ref = doc(collection(db, 'activity_events'));
    fields.batch.set(ref, data);
    return ref.id;
  }
  const ref = await addDoc(collection(db, 'activity_events'), data);
  return ref.id;
}

export async function getActivityByEntity(
  organizationId: string,
  entityType: ActivityEventRecord['entityType'],
  entityId: string,
): Promise<ActivityEventRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'activity_events'),
      where('organizationId', '==', organizationId),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityEventRecord);
}

export async function getRecentActivity(
  orgId: string,
  maxCount = 50,
): Promise<ActivityEventRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'activity_events'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc'),
      limit(maxCount),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityEventRecord);
}

export async function deleteActivityEvent(eventId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'activity_events', eventId));
}

export async function getActivityByUser(
  actorId: string,
  maxCount = 50,
): Promise<ActivityEventRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'activity_events'),
      where('actorId', '==', actorId),
      orderBy('createdAt', 'desc'),
      limit(maxCount),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityEventRecord);
}
