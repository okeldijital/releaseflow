import { collection, doc, addDoc, getDocs, getDoc, query, where, orderBy, limit, updateDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getRequirementsByRelease } from '@/lib/requirement-service';
import { getDeliverablesByRelease } from '@/lib/deliverable-service';
import { getBlockingDependencies } from '@/lib/dependency-service';
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
  dependenciesReady: boolean;
  missingMetadata: string[];
  missingDeliverables: number;
  missingRequirements: number;
  missingDependencies: number;
}

export function checkDistributionReadiness(release: Release, deliverablesCount: number, approvedDeliverables: number, reqTotal: number, reqApproved: number, blockingDepCount: number, blockingDepCompleted: number): DistributionReadiness {
  const missingMetadata = REQUIRED_METADATA_FIELDS.filter(
    (f) => !release[f],
  );

  const metadataReady = missingMetadata.length === 0;
  const deliverablesReady = approvedDeliverables === deliverablesCount;
  const requirementsReady = reqApproved === reqTotal;
  const dependenciesReady = blockingDepCompleted === blockingDepCount;

  const weights = 4;
  let score = 0;
  if (metadataReady) score++;
  if (deliverablesReady) score++;
  if (requirementsReady) score++;
  if (dependenciesReady) score++;
  const completeness = Math.round((score / weights) * 100);

  return {
    canDistribute: metadataReady && deliverablesReady && requirementsReady && dependenciesReady,
    completeness,
    metadataReady,
    deliverablesReady,
    requirementsReady,
    dependenciesReady,
    missingMetadata,
    missingDeliverables: deliverablesCount - approvedDeliverables,
    missingRequirements: reqTotal - reqApproved,
    missingDependencies: blockingDepCount - blockingDepCompleted,
  };
}

export async function generateDistributionPackage(releaseId: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const [relSnap, reqs, dels, blockingDeps] = await Promise.all([
    getDoc(doc(db, 'releases', releaseId)),
    getRequirementsByRelease(releaseId),
    getDeliverablesByRelease(releaseId),
    getBlockingDependencies(releaseId),
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
    blockingDeps.length,
    blockingDeps.filter((d) => d.status === 'completed').length,
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
