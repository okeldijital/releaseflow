import { collection, doc, addDoc, getDocs, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { RightsHolder, RightsHolderType, ReleaseOwnership, TrackOwnership, OwnershipType } from '@/app/(app)/types';

export async function createRightsHolder(name: string, type: RightsHolderType, contact?: string, territory?: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'rights_holders'), {
    name,
    type,
    contact: contact ?? null,
    territory: territory ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getRightsHolders(): Promise<RightsHolder[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, 'rights_holders'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RightsHolder);
}

export async function getRightsHolder(id: string): Promise<RightsHolder | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'rights_holders', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RightsHolder;
}

export async function addReleaseOwnership(
  releaseId: string,
  rightsHolderId: string,
  ownershipType: OwnershipType,
  percentage: number,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'release_ownerships'), {
    releaseId,
    rightsHolderId,
    ownershipType,
    percentage,
  });
  return ref.id;
}

export async function getReleaseOwnerships(releaseId: string): Promise<ReleaseOwnership[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'release_ownerships'), where('releaseId', '==', releaseId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseOwnership);
}

export async function addTrackOwnership(
  trackId: string,
  rightsHolderId: string,
  ownershipType: OwnershipType,
  percentage: number,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'track_ownerships'), {
    trackId,
    rightsHolderId,
    ownershipType,
    percentage,
  });
  return ref.id;
}

export async function getTrackOwnerships(trackId: string): Promise<TrackOwnership[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_ownerships'), where('trackId', '==', trackId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackOwnership);
}

export interface OwnershipValidation {
  valid: boolean;
  masterPct: number;
  publishingPct: number;
  mechanicalPct: number;
  neighbouringPct: number;
  issues: string[];
}

export async function validateReleaseOwnership(releaseId: string): Promise<OwnershipValidation> {
  const ownerships = await getReleaseOwnerships(releaseId);

  const masterTotal = sumByType(ownerships, 'master');
  const publishingTotal = sumByType(ownerships, 'publishing');
  const mechanicalTotal = sumByType(ownerships, 'mechanical');
  const neighbouringTotal = sumByType(ownerships, 'neighbouring');

  const issues: string[] = [];

  if (masterTotal > 0 && masterTotal !== 100) {
    issues.push(`Master: ${masterTotal}% (needs 100%)`);
  }
  if (publishingTotal > 0 && publishingTotal !== 100) {
    issues.push(`Publishing: ${publishingTotal}% (needs 100%)`);
  }
  if (masterTotal === 0 && publishingTotal === 0) {
    issues.push('No ownership defined');
  }

  return {
    valid: issues.length === 0 && (ownerships.length > 0),
    masterPct: masterTotal,
    publishingPct: publishingTotal,
    mechanicalPct: mechanicalTotal,
    neighbouringPct: neighbouringTotal,
    issues,
  };
}

export async function validateTrackOwnership(trackId: string): Promise<OwnershipValidation> {
  const db = getDb();
  if (!db) return { valid: false, masterPct: 0, publishingPct: 0, mechanicalPct: 0, neighbouringPct: 0, issues: ['Firestore not available'] };
  const snap = await getDocs(
    query(collection(db, 'track_ownerships'), where('trackId', '==', trackId)),
  );
  const ownerships = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackOwnership);

  const masterTotal = sumByType(ownerships as never, 'master');
  const publishingTotal = sumByType(ownerships as never, 'publishing');

  const issues: string[] = [];
  if (masterTotal > 0 && masterTotal !== 100) issues.push(`Master: ${masterTotal}% (needs 100%)`);
  if (publishingTotal > 0 && publishingTotal !== 100) issues.push(`Publishing: ${publishingTotal}% (needs 100%)`);
  if (masterTotal === 0 && publishingTotal === 0) issues.push('No ownership defined');

  return {
    valid: issues.length === 0 && (ownerships.length > 0),
    masterPct: masterTotal,
    publishingPct: publishingTotal,
    mechanicalPct: 0,
    neighbouringPct: 0,
    issues,
  };
}

function sumByType(items: { ownershipType: string; percentage: number }[], type: string): number {
  return items.filter((i) => i.ownershipType === type).reduce((sum, i) => sum + i.percentage, 0);
}
