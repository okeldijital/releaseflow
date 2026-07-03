import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface DistributionPackageRecord {
  id: string;
  releaseId: string;
  status: string;
  completeness: number;
  metadataReady: boolean;
  deliverablesReady: boolean;
  requirementsReady: boolean;
  generatedAt: unknown;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface DistributionEventRecord {
  id: string;
  packageId: string;
  event: string;
  metadata?: Record<string, unknown> | null;
  createdAt: unknown;
}

export async function createPackage(
  releaseId: string,
  status: string,
  completeness: number,
  metadataReady: boolean,
  deliverablesReady: boolean,
  requirementsReady: boolean,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'distribution_packages'), {
    releaseId,
    status,
    completeness,
    metadataReady,
    deliverablesReady,
    requirementsReady,
    generatedAt: now,
    createdAt: now,
  });
  return ref.id;
}

export async function updatePackage(packageId: string, fields: { completeness?: number; metadataReady?: boolean; deliverablesReady?: boolean; requirementsReady?: boolean; status?: string; generatedAt?: unknown }): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'distribution_packages', packageId), { ...fields, updatedAt: Timestamp.now() } as Record<string, unknown>);
}

export async function getLatestPackage(releaseId: string): Promise<DistributionPackageRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(collection(db, 'distribution_packages'), where('releaseId', '==', releaseId), orderBy('createdAt', 'desc'), limit(1)),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  if (!d) return null;
  return { id: d.id, ...d.data() } as DistributionPackageRecord;
}

export async function getPackagesByRelease(releaseId: string): Promise<DistributionPackageRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'distribution_packages'), where('releaseId', '==', releaseId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DistributionPackageRecord);
}

export async function getReleaseData(releaseId: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'releases', releaseId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Record<string, unknown>;
}

export async function recordEvent(
  packageId: string,
  event: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await addDoc(collection(db, 'distribution_events'), {
    packageId,
    event,
    metadata: metadata ?? null,
    createdAt: Timestamp.now(),
  });
}

export async function getEvents(packageId: string): Promise<DistributionEventRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'distribution_events'), where('packageId', '==', packageId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DistributionEventRecord);
}

export interface DistributionHistoryRecord {
  id: string;
  packageId: string;
  releaseId: string;
  actor: string;
  destination: string;
  result: 'success' | 'failed' | 'scheduled' | 'delivered' | 'published';
  notes?: string;
  timestamp: unknown;
}

export async function recordDistributionEvent(
  packageId: string,
  releaseId: string,
  actor: string,
  destination: string,
  result: DistributionHistoryRecord['result'],
  notes?: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'distribution_history'), {
    packageId,
    releaseId,
    actor,
    destination,
    result,
    notes: notes ?? null,
    timestamp: Timestamp.now(),
  });
  return ref.id;
}

export async function getDistributionHistory(releaseId: string): Promise<DistributionHistoryRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'distribution_history'), where('releaseId', '==', releaseId), orderBy('timestamp', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DistributionHistoryRecord);
}
