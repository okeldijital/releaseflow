import { collection, doc, addDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { ResourceAssignment } from '@/app/(app)/types';

export async function assignResource(releaseId: string, userId: string, role: string, capacity: number): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'resource_assignments'), {
    userId,
    releaseId,
    role,
    capacity,
    utilization: 0,
  });
  return ref.id;
}

export async function updateUtilization(assignmentId: string, utilization: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'resource_assignments', assignmentId), { utilization });
}

export async function getAssignmentsByUser(userId: string): Promise<ResourceAssignment[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'resource_assignments'), where('userId', '==', userId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResourceAssignment);
}

export async function getAssignmentsByRelease(releaseId: string): Promise<ResourceAssignment[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'resource_assignments'), where('releaseId', '==', releaseId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResourceAssignment);
}

export interface ResourceUtilization {
  userId: string;
  totalCapacity: number;
  totalUtilization: number;
  assignmentCount: number;
  overloaded: boolean;
  available: boolean;
}

export async function getUserUtilization(userId: string): Promise<ResourceUtilization> {
  const assignments = await getAssignmentsByUser(userId);
  const totalCapacity = assignments.reduce((s, a) => s + a.capacity, 0);
  const totalUtilization = assignments.reduce((s, a) => s + a.utilization, 0);
  return {
    userId,
    totalCapacity,
    totalUtilization,
    assignmentCount: assignments.length,
    overloaded: totalUtilization > totalCapacity,
    available: totalUtilization < totalCapacity,
  };
}

export async function getOrgResourceSummary(organizationId: string): Promise<{
  overloaded: ResourceUtilization[];
  available: ResourceUtilization[];
  activeReleases: number;
}> {
  const db = getDb();
  if (!db) return { overloaded: [], available: [], activeReleases: 0 };

  const releasesSnap = await getDocs(
    query(collection(db, 'releases'), where('organizationId', '==', organizationId)),
  );
  const releaseIds = releasesSnap.docs.map((d) => d.id);

  const userIds = new Set<string>();
  const allAssignments: ResourceAssignment[] = [];
  for (const rid of releaseIds) {
    const asgns = await getAssignmentsByRelease(rid);
    for (const a of asgns) {
      allAssignments.push(a);
      userIds.add(a.userId);
    }
  }

  const results: ResourceUtilization[] = [];
  for (const uid of userIds) {
    const ua = allAssignments.filter((a) => a.userId === uid);
    const cap = ua.reduce((s, a) => s + a.capacity, 0);
    const util = ua.reduce((s, a) => s + a.utilization, 0);
    results.push({
      userId: uid,
      totalCapacity: cap,
      totalUtilization: util,
      assignmentCount: ua.length,
      overloaded: util > cap,
      available: util < cap,
    });
  }

  return {
    overloaded: results.filter((r) => r.overloaded),
    available: results.filter((r) => r.available),
    activeReleases: releaseIds.length,
  };
}
