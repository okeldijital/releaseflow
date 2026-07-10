import {
  doc, getDoc, getDocs, updateDoc,
  collection, query, where, orderBy, limit,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface WorkflowRecord {
  id: string;
  releaseId: string;
  templateId: string;
  status: string;
  progress: number;
  currentStageId: string | null;
  health?: unknown;
  startedAt?: unknown;
  updatedAt?: unknown;
}

export interface StageRecord {
  id: string;
  workflowId: string;
  name: string;
  order: number;
  status: string;
  assignedRole?: string | null;
  dueDate?: unknown;
  startedAt?: unknown;
  completedAt?: unknown;
  daysInStage?: number;
}

export async function getWorkflow(releaseId: string): Promise<WorkflowRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(collection(db, 'workflows'), where('releaseId', '==', releaseId), limit(1)),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  if (!d) return null;
  return { id: d.id, ...d.data() } as WorkflowRecord;
}

export async function getWorkflowById(workflowId: string): Promise<WorkflowRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'workflows', workflowId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as WorkflowRecord;
}

export async function getStages(workflowId: string): Promise<StageRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'stages'), where('workflowId', '==', workflowId), orderBy('order', 'asc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StageRecord);
}

export async function updateStage(
  stageId: string,
  fields: { status?: string; startedAt?: unknown; completedAt?: unknown; dueDate?: unknown; daysInStage?: number },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'stages', stageId), fields as Record<string, unknown>);
}

export async function updateWorkflow(
  workflowId: string,
  fields: { status?: string; currentStageId?: string | null; progress?: number; health?: unknown; updatedAt?: unknown },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'workflows', workflowId), fields as Record<string, unknown>);
}
