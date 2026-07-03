import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { getDb } from './firebase';

export interface AuditRecord {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: unknown;
  ipAddress?: string | null;
}

export interface RecordAuditFields {
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function recordAudit(fields: RecordAuditFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const ref = await addDoc(collection(db, 'organization_audit'), {
    organizationId: fields.organizationId,
    userId: fields.userId,
    action: fields.action,
    entityType: fields.entityType,
    entityId: fields.entityId,
    before: fields.before ?? null,
    after: fields.after ?? null,
    timestamp: new Date().toISOString(),
    ipAddress: fields.ipAddress ?? null,
  });
  return ref.id;
}

export async function getAuditByOrg(orgId: string, maxCount = 50): Promise<AuditRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'organization_audit'),
      where('organizationId', '==', orgId),
      orderBy('timestamp', 'desc'),
      limit(maxCount),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditRecord);
}

export async function getAuditByUser(userId: string, maxCount = 50): Promise<AuditRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'organization_audit'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxCount),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditRecord);
}

export async function getAuditByEntity(entityType: string, entityId: string): Promise<AuditRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'organization_audit'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditRecord);
}
