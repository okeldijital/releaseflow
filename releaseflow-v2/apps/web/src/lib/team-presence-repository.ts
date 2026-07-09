import { doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc, Timestamp } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface TeamPresenceRecord {
  id: string;
  entityType: string;
  entityId: string;
  organizationId: string;
  personId: string;
  role: 'assigned' | 'reviewer' | 'contributor' | 'approver';
  lastActiveAt: unknown;
  createdAt: unknown;
}

const COLLECTION = 'team_presence';

function presenceId(entityType: string, entityId: string, personId: string): string {
  return `presence_${entityType}_${entityId}_${personId}`;
}

export async function recordPresence(
  entityType: string,
  entityId: string,
  orgId: string,
  personId: string,
  role: TeamPresenceRecord['role'],
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const id = presenceId(entityType, entityId, personId);
  const docRef = doc(db, COLLECTION, id);
  const snap = await getDoc(docRef);
  const now = Timestamp.now();

  const data: Record<string, unknown> = {
    entityType,
    entityId,
    organizationId: orgId,
    personId,
    role,
    lastActiveAt: now,
  };

  if (!snap.exists()) {
    data.createdAt = now;
  }

  await setDoc(docRef, data, { merge: true });
}

export async function getPresenceByEntity(
  entityType: string,
  entityId: string,
): Promise<TeamPresenceRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamPresenceRecord);
}

export async function removePresence(
  personId: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const id = presenceId(entityType, entityId, personId);
  await deleteDoc(doc(db, COLLECTION, id));
}
