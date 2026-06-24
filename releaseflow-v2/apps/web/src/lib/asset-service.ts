import { collection, doc, addDoc, deleteDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { AssetReference } from '@/app/(app)/types';

export async function addAssetReference(
  deliverableId: string,
  provider: string,
  url: string,
  filename: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = await addDoc(collection(db, 'asset_references'), {
    deliverableId,
    provider,
    url,
    filename,
    uploadedAt: Timestamp.now(),
  });

  return ref.id;
}

export async function getAssetReferencesByDeliverable(deliverableId: string): Promise<AssetReference[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'asset_references'),
      where('deliverableId', '==', deliverableId),
      orderBy('uploadedAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssetReference);
}

export async function deleteAssetReference(assetId: string) {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'asset_references', assetId));
}
