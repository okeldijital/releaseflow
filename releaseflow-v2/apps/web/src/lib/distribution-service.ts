import { collection, doc, addDoc, getDocs, getDoc, query, where, orderBy, limit, updateDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getRequirementsByRelease } from '@/lib/requirement-service';
import { getDeliverablesByRelease } from '@/lib/deliverable-service';
import type { Release, DistributionPackage } from '@/app/(app)/types';

const REQUIRED_METADATA_FIELDS: (keyof Release)[] = [
  'upc',
  'catalogNumber',
  'label',
  'copyright',
  'pLine',
  'cLine',
  'genre',
  'language',
];

export interface DistributionReadiness {
  canDistribute: boolean;
  completeness: number;
  metadataReady: boolean;
  deliverablesReady: boolean;
  requirementsReady: boolean;
  missingMetadata: string[];
  missingDeliverables: number;
  missingRequirements: number;
}

export function checkDistributionReadiness(release: Release, deliverablesCount: number, approvedDeliverables: number, reqTotal: number, reqApproved: number): DistributionReadiness {
  const missingMetadata = REQUIRED_METADATA_FIELDS.filter(
    (f) => !release[f],
  );

  const metadataReady = missingMetadata.length === 0;
  const deliverablesReady = deliverablesCount > 0 && approvedDeliverables === deliverablesCount;
  const requirementsReady = reqTotal > 0 && reqApproved === reqTotal;

  const weights = 3;
  let score = 0;
  if (metadataReady) score++;
  if (deliverablesReady) score++;
  if (requirementsReady) score++;
  const completeness = Math.round((score / weights) * 100);

  return {
    canDistribute: metadataReady && deliverablesReady && requirementsReady,
    completeness,
    metadataReady,
    deliverablesReady,
    requirementsReady,
    missingMetadata,
    missingDeliverables: deliverablesCount - approvedDeliverables,
    missingRequirements: reqTotal - reqApproved,
  };
}

export async function generateDistributionPackage(releaseId: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const [relSnap, reqs, dels] = await Promise.all([
    getDoc(doc(db, 'releases', releaseId)),
    getRequirementsByRelease(releaseId),
    getDeliverablesByRelease(releaseId),
  ]);

  if (!relSnap.exists()) throw new Error('Release not found');

  const release = { id: relSnap.id, ...relSnap.data() } as Release;
  const approvedDels = dels.filter((d) => d.status === 'approved').length;
  const approvedReqs = reqs.filter((r) => r.status === 'approved').length;

  const readiness = checkDistributionReadiness(
    release,
    dels.length,
    approvedDels,
    reqs.length,
    approvedReqs,
  );

  const existingSnap = await getDocs(
    query(
      collection(db, 'distribution_packages'),
      where('releaseId', '==', releaseId),
      orderBy('createdAt', 'desc'),
      limit(1),
    ),
  );

  if (!existingSnap.empty) {
    const existingDoc = existingSnap.docs[0];
    if (existingDoc) {
      await updateDoc(doc(db, 'distribution_packages', existingDoc.id), {
        completeness: readiness.completeness,
        metadataReady: readiness.metadataReady,
        deliverablesReady: readiness.deliverablesReady,
        requirementsReady: readiness.requirementsReady,
        generatedAt: Timestamp.now(),
      });
      return existingDoc.id;
    }
  }

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'distribution_packages'), {
    releaseId,
    status: readiness.canDistribute ? 'generated' : 'draft',
    completeness: readiness.completeness,
    metadataReady: readiness.metadataReady,
    deliverablesReady: readiness.deliverablesReady,
    requirementsReady: readiness.requirementsReady,
    generatedAt: now,
    createdAt: now,
  });

  return ref.id;
}

export async function getLatestDistributionPackage(releaseId: string): Promise<DistributionPackage | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, 'distribution_packages'),
      where('releaseId', '==', releaseId),
      orderBy('createdAt', 'desc'),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  const firstDoc = snap.docs[0];
  if (!firstDoc) return null;
  return { id: firstDoc.id, ...firstDoc.data() } as DistributionPackage;
}
