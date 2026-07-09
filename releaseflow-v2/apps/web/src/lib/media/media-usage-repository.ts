import {
  doc, getDocs, addDoc, deleteDoc,
  collection, query, where, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { MediaUsage } from './media-types';

/** organizations/{orgId}/media_usage/{usageId} */
const SUBCOLLECTION = 'media_usage';

function usageCol(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string) {
  return collection(db, 'organizations', organizationId, SUBCOLLECTION);
}

function usageDoc(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string, id: string) {
  return doc(db, 'organizations', organizationId, SUBCOLLECTION, id);
}

export async function trackMediaUsage(
  organizationId: string,
  fields: Omit<MediaUsage, 'id' | 'createdAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(usageCol(db, organizationId), {
    ...fields,
    organizationId,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getUsageByAsset(organizationId: string, assetId: string): Promise<MediaUsage[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(usageCol(db, organizationId), where('assetId', '==', assetId)),
  );
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      assetId: data.assetId as string,
      contextType: data.contextType as string,
      contextId: data.contextId as string,
      contextLabel: data.contextLabel as string,
      organizationId: data.organizationId as string | undefined,
      createdAt: data.createdAt as Timestamp,
    };
  });
}

export async function removeUsageRecord(organizationId: string, id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(usageDoc(db, organizationId, id));
}

export async function getAssetIdsInUse(
  organizationId: string,
  contextType: string,
  contextId: string,
): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      usageCol(db, organizationId),
      where('contextType', '==', contextType),
      where('contextId', '==', contextId),
    ),
  );
  return snap.docs.map((d) => (d.data() as Record<string, unknown>).assetId as string);
}
