import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { logActivity } from '@/lib/workflow-service';
import type { Campaign, CampaignTask, CampaignTaskType, TaskPriority } from '@/app/(app)/types';

export async function createCampaign(fields: {
  releaseId: string;
  name: string;
  type: Campaign['type'];
  ownerId: string;
  actorId: string;
}) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'campaigns'), {
    releaseId: fields.releaseId,
    name: fields.name,
    type: fields.type,
    startDate: null,
    endDate: null,
    status: 'draft',
    ownerId: fields.ownerId,
    createdAt: now,
    updatedAt: now,
  });
  await logActivity({
    type: 'campaign.created',
    releaseId: fields.releaseId,
    actorId: fields.actorId,
    metadata: { campaignId: ref.id, name: fields.name, type: fields.type },
  });
  return ref.id;
}

export async function activateCampaign(campaignId: string, releaseId: string, actorId: string) {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'campaigns', campaignId), {
    status: 'active',
    startDate: now,
    updatedAt: now,
  });
  await logActivity({
    type: 'campaign.activated',
    releaseId,
    actorId,
    metadata: { campaignId },
  });
}

export async function completeCampaign(campaignId: string, releaseId: string, actorId: string) {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  await updateDoc(doc(db, 'campaigns', campaignId), {
    status: 'completed',
    endDate: now,
    updatedAt: now,
  });
  await logActivity({
    type: 'campaign.completed',
    releaseId,
    actorId,
    metadata: { campaignId },
  });
}

export async function getCampaignsByRelease(releaseId: string): Promise<Campaign[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'campaigns'), where('releaseId', '==', releaseId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign);
}

export async function createCampaignTask(fields: {
  campaignId: string;
  type: CampaignTaskType;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  releaseId: string;
  actorId: string;
}) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'campaign_tasks'), {
    campaignId: fields.campaignId,
    type: fields.type,
    title: fields.title,
    description: fields.description ?? null,
    status: 'todo',
    priority: fields.priority ?? 'medium',
    assigneeId: fields.assigneeId ?? null,
    dueDate: null,
    createdAt: now,
    updatedAt: now,
  });
  await logActivity({
    type: 'campaign.task.created',
    releaseId: fields.releaseId,
    actorId: fields.actorId,
    metadata: { campaignTaskId: ref.id, campaignId: fields.campaignId, title: fields.title },
  });
  return ref.id;
}

export async function completeCampaignTask(campaignTaskId: string, releaseId: string, actorId: string) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'campaign_tasks', campaignTaskId), {
    status: 'done',
    updatedAt: Timestamp.now(),
  });
  await logActivity({
    type: 'campaign.task.completed',
    releaseId,
    actorId,
    metadata: { campaignTaskId },
  });
}

export async function getCampaignTasksByCampaign(campaignId: string): Promise<CampaignTask[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'campaign_tasks'), where('campaignId', '==', campaignId), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CampaignTask);
}

export async function getDeliverablesByCampaign(campaignId: string) {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'deliverables'), where('campaignId', '==', campaignId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as { id: string; title: string; status: string }[];
}

export interface CampaignReadinessResult {
  canLaunch: boolean;
  completeness: number;
  nameFilled: boolean;
  tasksReady: boolean;
  assetsReady: boolean;
  missingTasks: number;
  missingAssets: number;
}

export async function checkCampaignReadiness(campaignId: string): Promise<CampaignReadinessResult> {
  const db = getDb();
  if (!db) return { canLaunch: false, completeness: 0, nameFilled: false, tasksReady: false, assetsReady: false, missingTasks: 0, missingAssets: 0 };
  const [tasks, assets] = await Promise.all([
    getCampaignTasksByCampaign(campaignId),
    getDeliverablesByCampaign(campaignId),
  ]);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const totalAssets = assets.length;
  const approvedAssets = assets.filter((a) => (a as { status?: string }).status === 'approved').length;
  const tasksReady = totalTasks > 0 && doneTasks === totalTasks;
  const assetsReady = totalAssets > 0 && approvedAssets === totalAssets;
  const weight = 2;
  let score = 0;
  if (tasksReady) score++;
  if (assetsReady) score++;
  return {
    canLaunch: tasksReady && assetsReady,
    completeness: totalTasks + totalAssets > 0 ? Math.round((score / weight) * 100) : 0,
    nameFilled: true,
    tasksReady,
    assetsReady,
    missingTasks: totalTasks - doneTasks,
    missingAssets: totalAssets - approvedAssets,
  };
}
