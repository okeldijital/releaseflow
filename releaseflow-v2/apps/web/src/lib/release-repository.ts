import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, writeBatch, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';
import { recordActivity } from './activity-service';
import type { ReleaseStatus, ReleaseType } from '@/app/(app)/types';
import type { Artwork } from '@/lib/artwork/artwork-types';

export interface ReleaseRecord {
  id: string;
  title: string;
  displayTitle?: string;
  releaseType: ReleaseType;
  status: ReleaseStatus;
  organizationId: string;
  createdBy: string;
  targetReleaseDate?: unknown;
  estimatedReleaseDate?: unknown;
  upc?: string;
  catalogNumber?: string;
  label?: string;
  copyright?: string;
  pLine?: string;
  cLine?: string;
  genre?: string;
  subgenre?: string;
  language?: string;
  explicit?: boolean;
  createdAt: unknown;
  updatedAt?: unknown;
  artwork?: Artwork | null;
}

export interface CreateReleaseFields {
  title: string;
  releaseType: ReleaseType;
  status: ReleaseStatus;
  organizationId: string;
  createdBy: string;
  targetReleaseDate?: Date | null;
  estimatedReleaseDate?: Date | null;
  upc?: string;
  label?: string;
  genre?: string;
}

export interface UpdateReleaseFields {
  title?: string;
  releaseType?: ReleaseType;
  status?: ReleaseStatus;
  targetReleaseDate?: Date | null;
  estimatedReleaseDate?: Date | null;
  upc?: string | null;
  catalogNumber?: string | null;
  label?: string | null;
  copyright?: string | null;
  pLine?: string | null;
  cLine?: string | null;
  genre?: string | null;
  subgenre?: string | null;
  language?: string | null;
  explicit?: boolean | null;
}

export async function getRelease(releaseId: string): Promise<ReleaseRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'releases', releaseId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ReleaseRecord;
}

export async function getReleasesByOrganization(orgId: string): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(
    collection(db, 'releases'),
    where('organizationId', '==', orgId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseRecord);
}

export async function getReleasesByArtist(artistId: string): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db) return [];
  const relArtistsSnap = await getDocs(
    query(collection(db, 'release_artists'), where('artistId', '==', artistId)),
  );
  const releaseIds = relArtistsSnap.docs.map((d) => (d.data() as { releaseId: string }).releaseId);
  if (releaseIds.length === 0) return [];
  const releases: ReleaseRecord[] = [];
  for (const rid of releaseIds) {
    const snap = await getDoc(doc(db, 'releases', rid));
    if (snap.exists()) releases.push({ id: snap.id, ...snap.data() } as ReleaseRecord);
  }
  return releases;
}

export async function getReleasesByStatus(
  orgId: string,
  statuses: ReleaseStatus[],
): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db) return [];
  if (statuses.length === 0) return [];
  if (statuses.length === 1) {
    const q = query(
      collection(db, 'releases'),
      where('organizationId', '==', orgId),
      where('status', '==', statuses[0]),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseRecord);
  }
  const all = await getReleasesByOrganization(orgId);
  return all.filter((r) => statuses.includes(r.status));
}

export async function createRelease(
  fields: CreateReleaseFields,
  actorId: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const ref = await addDoc(collection(db, 'releases'), {
    ...fields,
    targetReleaseDate: fields.targetReleaseDate
      ? Timestamp.fromDate(fields.targetReleaseDate)
      : null,
    estimatedReleaseDate: fields.estimatedReleaseDate
      ? Timestamp.fromDate(fields.estimatedReleaseDate)
      : null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  await recordActivity({
    entityType: 'release',
    entityId: ref.id,
    organizationId: fields.organizationId,
    actorId,
    action: 'release.created',
    metadata: { title: fields.title, releaseType: fields.releaseType },
  });
  return ref.id;
}

export async function createReleaseWithWorkflow(
  fields: CreateReleaseFields,
  stageTemplates: { name: string; order: number; assignedRole?: string }[],
  requirementNames: string[],
  actorId: string,
): Promise<{ releaseId: string; workflowId: string | null }> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const batch = writeBatch(db);

  const releaseRef = doc(collection(db, 'releases'));
  batch.set(releaseRef, {
    ...fields,
    targetReleaseDate: fields.targetReleaseDate
      ? Timestamp.fromDate(fields.targetReleaseDate)
      : null,
    estimatedReleaseDate: fields.estimatedReleaseDate
      ? Timestamp.fromDate(fields.estimatedReleaseDate)
      : null,
    createdAt: now,
    updatedAt: now,
  });

  let workflowId: string | null = null;
  let firstStageId: string | null = null;

  if (stageTemplates.length > 0) {
    const workflowRef = doc(collection(db, 'workflows'));
    workflowId = workflowRef.id;
    batch.set(workflowRef, {
      releaseId: releaseRef.id,
      templateId: fields.releaseType,
      status: 'in_progress',
      progress: 0,
      currentStageId: null,
      startedAt: now,
      updatedAt: now,
    });
    for (const tpl of stageTemplates) {
      const stageRef = doc(collection(db, 'stages'));
      if (tpl.order === 1) firstStageId = stageRef.id;
      batch.set(stageRef, {
        workflowId: workflowRef.id,
        name: tpl.name,
        order: tpl.order,
        status: tpl.order === 1 ? 'in_progress' : 'not_started',
        startedAt: tpl.order === 1 ? now : null,
        dueDate: null,
        assignedRole: tpl.assignedRole ?? null,
        completedAt: null,
      });
    }
    if (firstStageId) {
      batch.update(workflowRef, { currentStageId: firstStageId });
    }
  }

  for (const reqName of requirementNames) {
    const reqRef = doc(collection(db, 'release_requirements'));
    batch.set(reqRef, {
      releaseId: releaseRef.id,
      name: reqName,
      status: 'required',
      createdAt: now,
      updatedAt: now,
    });
  }

  await recordActivity({
    entityType: 'release',
    entityId: releaseRef.id,
    organizationId: fields.organizationId,
    actorId,
    action: 'release.created',
    metadata: { title: fields.title, releaseType: fields.releaseType },
    batch,
  });

  if (workflowId) {
    await recordActivity({
      entityType: 'release',
      entityId: releaseRef.id,
      organizationId: fields.organizationId,
      actorId,
      action: 'workflow.generated',
      metadata: { stageCount: stageTemplates.length },
      batch,
    });
  }

  await batch.commit();
  return { releaseId: releaseRef.id, workflowId };
}

export async function updateRelease(
  releaseId: string,
  fields: UpdateReleaseFields,
  actorId: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.title !== undefined) updateData.title = fields.title;
  if (fields.releaseType !== undefined) updateData.releaseType = fields.releaseType;
  if (fields.status !== undefined) updateData.status = fields.status;
  if (fields.targetReleaseDate !== undefined) {
    updateData.targetReleaseDate = fields.targetReleaseDate
      ? Timestamp.fromDate(fields.targetReleaseDate)
      : null;
  }
  if (fields.estimatedReleaseDate !== undefined) {
    updateData.estimatedReleaseDate = fields.estimatedReleaseDate
      ? Timestamp.fromDate(fields.estimatedReleaseDate)
      : null;
  }
  if (fields.upc !== undefined) updateData.upc = fields.upc;
  if (fields.catalogNumber !== undefined) updateData.catalogNumber = fields.catalogNumber;
  if (fields.label !== undefined) updateData.label = fields.label;
  if (fields.copyright !== undefined) updateData.copyright = fields.copyright;
  if (fields.pLine !== undefined) updateData.pLine = fields.pLine;
  if (fields.cLine !== undefined) updateData.cLine = fields.cLine;
  if (fields.genre !== undefined) updateData.genre = fields.genre;
  if (fields.subgenre !== undefined) updateData.subgenre = fields.subgenre;
  if (fields.language !== undefined) updateData.language = fields.language;
  if (fields.explicit !== undefined) updateData.explicit = fields.explicit;
  await updateDoc(doc(db, 'releases', releaseId), updateData);
  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  const organizationId = (releaseSnap.data() as Record<string, unknown> | undefined)?.organizationId as string | undefined ?? '';
  await recordActivity({
    entityType: 'release',
    entityId: releaseId,
    organizationId,
    actorId,
    action: 'release.updated',
    metadata: { changes: Object.keys(updateData).filter((k) => k !== 'updatedAt') },
  });
}

export async function updateReleaseStatus(
  releaseId: string,
  status: ReleaseStatus,
  actorId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  await updateDoc(doc(db, 'releases', releaseId), { status, updatedAt: Timestamp.now() });
  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  const organizationId = (releaseSnap.data() as Record<string, unknown> | undefined)?.organizationId as string | undefined ?? '';
  await recordActivity({
    entityType: 'release',
    entityId: releaseId,
    organizationId,
    actorId,
    action: 'release.status.changed',
    metadata: { newStatus: status, ...metadata },
  });
}

export async function deleteRelease(releaseId: string, organizationId?: string, actorId?: string, deleteReason?: string): Promise<void> {
  if (organizationId && actorId) {
    const { softDelete } = await import('@/lib/retention/lifecycle-service');
    await softDelete({ entityType: 'release', entityId: releaseId, organizationId, actorId, deleteReason });
    return;
  }
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  await deleteDoc(doc(db, 'releases', releaseId));
}
