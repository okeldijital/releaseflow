import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, limit, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface DistributionScheduleRecord {
  id: string;
  releaseId: string;
  organizationId: string;
  announcementDate?: string | null;
  presaveDate?: string | null;
  distributionDate?: string | null;
  releaseDate: string;
  embargoEnd?: string | null;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface CreateDistributionScheduleFields {
  releaseId: string;
  organizationId: string;
  releaseDate: string;
  announcementDate?: string | null;
  presaveDate?: string | null;
  distributionDate?: string | null;
  embargoEnd?: string | null;
}

export interface UpdateDistributionScheduleFields {
  releaseDate?: string;
  announcementDate?: string | null;
  presaveDate?: string | null;
  distributionDate?: string | null;
  embargoEnd?: string | null;
}

export async function getDistributionSchedule(scheduleId: string): Promise<DistributionScheduleRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'distribution_schedules', scheduleId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as DistributionScheduleRecord;
}

export async function getScheduleByRelease(releaseId: string): Promise<DistributionScheduleRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, 'distribution_schedules'),
      where('releaseId', '==', releaseId),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  if (!d) return null;
  return { id: d.id, ...d.data() } as DistributionScheduleRecord;
}

export async function createDistributionSchedule(
  fields: CreateDistributionScheduleFields,
): Promise<DistributionScheduleRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const data = {
    releaseId: fields.releaseId,
    organizationId: fields.organizationId,
    releaseDate: fields.releaseDate,
    announcementDate: fields.announcementDate ?? null,
    presaveDate: fields.presaveDate ?? null,
    distributionDate: fields.distributionDate ?? null,
    embargoEnd: fields.embargoEnd ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, 'distribution_schedules'), data);
  return { id: ref.id, ...data } as DistributionScheduleRecord;
}

export async function updateDistributionSchedule(
  scheduleId: string,
  fields: UpdateDistributionScheduleFields,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.releaseDate !== undefined) updateData.releaseDate = fields.releaseDate;
  if (fields.announcementDate !== undefined) updateData.announcementDate = fields.announcementDate;
  if (fields.presaveDate !== undefined) updateData.presaveDate = fields.presaveDate;
  if (fields.distributionDate !== undefined) updateData.distributionDate = fields.distributionDate;
  if (fields.embargoEnd !== undefined) updateData.embargoEnd = fields.embargoEnd;
  await updateDoc(doc(db, 'distribution_schedules', scheduleId), updateData);
}

export async function deleteDistributionSchedule(scheduleId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'distribution_schedules', scheduleId));
}
