import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getRequirementNamesForReleaseType } from '@/lib/requirement-templates';
import type { ReleaseRequirement } from '@/app/(app)/types';

export async function generateRequirementsForRelease(
  releaseId: string,
  releaseType: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const names = getRequirementNamesForReleaseType(releaseType as never);
  const now = Timestamp.now();
  for (const name of names) {
    await addDoc(collection(db, 'release_requirements'), {
      releaseId,
      name,
      status: 'required',
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function getRequirementsByRelease(releaseId: string): Promise<ReleaseRequirement[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'release_requirements'),
      where('releaseId', '==', releaseId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseRequirement);
}

export async function submitRequirement(reqId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'release_requirements', reqId), {
    status: 'submitted',
    updatedAt: Timestamp.now(),
  });
}

export async function approveRequirement(reqId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'release_requirements', reqId), {
    status: 'approved',
    updatedAt: Timestamp.now(),
  });
}

export async function resetRequirement(reqId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'release_requirements', reqId), {
    status: 'required',
    updatedAt: Timestamp.now(),
  });
}
