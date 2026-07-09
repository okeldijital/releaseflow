import {
  doc, getDocs, addDoc, deleteDoc,
  collection, query, where, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { MediaUsage } from './media-types';

const COLLECTION = 'media_usage';

export async function trackMediaUsage(
  fields: Omit<MediaUsage, 'id' | 'createdAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, COLLECTION), {
    ...fields,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getUsageByAsset(assetId: string): Promise<MediaUsage[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('assetId', '==', assetId)),
  );
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      assetId: data.assetId as string,
      contextType: data.contextType as string,
      contextId: data.contextId as string,
      contextLabel: data.contextLabel as string,
      createdAt: data.createdAt as Timestamp,
    };
  });
}

export async function removeUsageRecord(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function getAssetIdsInUse(contextType: string, contextId: string): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where('contextType', '==', contextType),
      where('contextId', '==', contextId),
    ),
  );
  return snap.docs.map((d) => (d.data() as Record<string, unknown>).assetId as string);
}
