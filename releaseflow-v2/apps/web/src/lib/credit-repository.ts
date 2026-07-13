import {
  doc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface CreditRecord {
  id: string;
  trackId: string;
  organizationId: string;
  personId: string;
  creditType: string;
  creditName?: string;
  displayOrder: number;
  visible: boolean;
  verified: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _CreateCreditFields {
  trackId: string;
  organizationId: string;
  personId: string;
  creditType: string;
  creditName?: string;
  displayOrder?: number;
  visible?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _UpdateCreditFields {
  creditType?: string;
  creditName?: string;
  displayOrder?: number;
  visible?: boolean;
  verified?: boolean;
}

export async function createCredit(fields: _CreateCreditFields): Promise<CreditRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const data = {
    trackId: fields.trackId,
    organizationId: fields.organizationId,
    personId: fields.personId,
    creditType: fields.creditType,
    creditName: fields.creditName ?? null,
    displayOrder: fields.displayOrder ?? 0,
    visible: fields.visible ?? true,
    verified: false,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, 'credits'), data);
  return {
    id: ref.id,
    trackId: data.trackId,
    organizationId: data.organizationId,
    personId: data.personId,
    creditType: data.creditType,
    creditName: data.creditName ?? undefined,
    displayOrder: data.displayOrder,
    visible: data.visible,
    verified: data.verified,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateCredit(creditId: string, fields: _UpdateCreditFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'credits', creditId), {
    ...fields,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCredit(creditId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'credits', creditId));
}

export async function getCreditsByTrack(trackId: string): Promise<CreditRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'credits'),
      where('trackId', '==', trackId),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CreditRecord);
}

export async function getCreditsByPerson(personId: string): Promise<CreditRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'credits'), where('personId', '==', personId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CreditRecord);
}
