import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { logActivity } from '@/lib/workflow-service';
import type { ReleaseStatus } from '@/app/(app)/types';

export async function updateReleaseStatus(
  releaseId: string,
  status: ReleaseStatus,
  actorId: string,
  metadata?: Record<string, unknown>,
) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  await updateDoc(doc(db, 'releases', releaseId), {
    status,
    updatedAt: Timestamp.now(),
  });

  await logActivity({
    type: 'release.status.changed',
    releaseId,
    actorId,
    metadata: { newStatus: status, ...metadata },
  });
}
