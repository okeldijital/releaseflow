/**
 * CE-009 — Store only meaningful readiness transitions (not every calculation).
 */

import {
  addDoc, collection, getDocs, query, where, orderBy, limit, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';
import type { Recommendation } from './release-readiness-config';

export interface ReadinessHistoryRecord {
  id: string;
  releaseId: string;
  organizationId: string;
  readinessScore: number;
  recommendation: Recommendation;
  blockerCount: number;
  warningCount: number;
  createdAt: Timestamp;
}

export async function getLastReadinessSnapshot(
  releaseId: string,
): Promise<ReadinessHistoryRecord | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'release_readiness_history'),
        where('releaseId', '==', releaseId),
        orderBy('createdAt', 'desc'),
        limit(1),
      ),
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    if (!d) return null;
    return { id: d.id, ...d.data() } as ReadinessHistoryRecord;
  } catch {
    return null;
  }
}

export async function listReadinessHistory(
  releaseId: string,
  maxCount = 20,
): Promise<ReadinessHistoryRecord[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'release_readiness_history'),
        where('releaseId', '==', releaseId),
        orderBy('createdAt', 'desc'),
        limit(maxCount),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReadinessHistoryRecord);
  } catch {
    return [];
  }
}

export async function saveReadinessTransition(fields: {
  releaseId: string;
  organizationId: string;
  readinessScore: number;
  recommendation: Recommendation;
  blockerCount: number;
  warningCount: number;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'release_readiness_history'), {
    ...fields,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}
