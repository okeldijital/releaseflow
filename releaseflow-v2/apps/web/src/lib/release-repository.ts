import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  collection, query, where, orderBy, writeBatch, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';
import { recordActivity } from './activity-service';
import type { ReleaseStatus, ReleaseLifecycle, ReleaseType } from '@/app/(app)/types';
import type { Artwork } from '@/lib/artwork/artwork-types';

const LIFECYCLE_ORDER: Record<string, number> = {
  draft: 0,
  planning: 1,
  in_production: 2,
  ready_for_distribution: 3,
  released: 4,
  archived: 5,
  on_hold: 6,
  cancelled: 7,
};

function getDateValue(date: unknown): number {
  if (!date) return 0;
  if (typeof date === 'object' && date !== null) {
    const d = date as { seconds?: number; toDate?: () => Date };
    if (typeof d.toDate === 'function') return d.toDate().getTime();
    if (typeof d.seconds === 'number') return new Date(d.seconds * 1000).getTime();
  }
  if (typeof date === 'string' || typeof date === 'number') return new Date(date).getTime();
  return 0;
}

export interface ReleaseRecord {
  id: string;
  title: string;
  displayTitle?: string;
  releaseType: ReleaseType;
  status: ReleaseStatus;
  lifecycle: ReleaseLifecycle;
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
  releaseLink?: string | null;
  createdAt: unknown;
  updatedAt?: unknown;
  artwork: Artwork | null;
  wizardData?: Record<string, unknown> | null;
  version?: number;
}

export interface CreateReleaseFields {
  title: string;
  releaseType: ReleaseType;
  status: ReleaseStatus;
  lifecycle: ReleaseLifecycle;
  organizationId: string;
  createdBy: string;
  targetReleaseDate?: Date | null;
  estimatedReleaseDate?: Date | null;
  upc?: string;
  label?: string;
  genre?: string;
  releaseLink?: string | null;
}

export interface UpdateReleaseFields {
  title?: string;
  releaseType?: ReleaseType;
  status?: ReleaseStatus;
  lifecycle?: ReleaseLifecycle;
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
  releaseLink?: string | null;
}

export async function getRelease(releaseId: string): Promise<ReleaseRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'releases', releaseId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), artwork: null } as ReleaseRecord;
}

export async function getAllReleases(orgId: string): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(
    collection(db, 'releases'),
    where('organizationId', '==', orgId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), artwork: null }) as ReleaseRecord);
}

export interface ReleaseQueryOptions {
  lifecycle?: string[];
  status?: string[];
  search?: string;
  sort?: 'newest' | 'oldest' | 'releaseDate' | 'alpha' | 'status';
  pagination?: { limit: number; offset: number };
  userId?: string;
}

export async function getReleases(orgId: string, options: ReleaseQueryOptions = {}): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db) return [];
  const { lifecycle, status, userId } = options;

  let q = query(
    collection(db, 'releases'),
    where('organizationId', '==', orgId),
  );

  if (lifecycle && lifecycle.length > 0) {
    if (lifecycle.length === 1) {
      const lifecycleValue = lifecycle[0];
      if (lifecycleValue) {
        q = query(collection(db, 'releases'), where('organizationId', '==', orgId), where('lifecycle', '==', lifecycleValue));
      }
    } else {
      const all = await getReleasesByOrganization(orgId);
      return all.filter((r) => lifecycle.includes(r.lifecycle));
    }
  }

  if (status && status.length === 1) {
    const statusValue = status[0];
    if (statusValue) {
      q = query(collection(db, 'releases'), where('organizationId', '==', orgId), where('status', '==', statusValue));
    }
  }

  if (userId) {
    q = query(collection(db, 'releases'), where('organizationId', '==', orgId), where('createdBy', '==', userId));
  }

  const snap = await getDocs(q);
  let results = snap.docs.map((d) => ({ id: d.id, ...d.data(), artwork: null }) as ReleaseRecord);

  if (lifecycle && lifecycle.length > 1) {
    results = results.filter((r) => lifecycle.includes(r.lifecycle));
  }

  if (status && status.length > 1) {
    results = results.filter((r) => status.includes(r.status));
  }

  if (options.search) {
    const term = options.search.toLowerCase();
    results = results.filter((r) =>
      (r.title ?? '').toLowerCase().includes(term) ||
      (r.upc ?? '').toLowerCase().includes(term) ||
      (r.catalogNumber ?? '').toLowerCase().includes(term)
    );
  }

  if (options.sort) {
    switch (options.sort) {
      case 'newest':
        results.sort((a, b) => getDateValue(b.createdAt) - getDateValue(a.createdAt));
        break;
      case 'oldest':
        results.sort((a, b) => getDateValue(a.createdAt) - getDateValue(b.createdAt));
        break;
      case 'releaseDate':
        results.sort((a, b) => getDateValue(b.targetReleaseDate) - getDateValue(a.targetReleaseDate));
        break;
      case 'alpha':
        results.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
        break;
      case 'status':
        results.sort((a, b) => {
          const aOrder = LIFECYCLE_ORDER[a.lifecycle] ?? LIFECYCLE_ORDER[a.status] ?? 99;
          const bOrder = LIFECYCLE_ORDER[b.lifecycle] ?? LIFECYCLE_ORDER[b.status] ?? 99;
          return aOrder - bOrder;
        });
        break;
    }
  }

  if (options.pagination) {
    const { limit, offset } = options.pagination;
    results = results.slice(offset, offset + limit);
  }

  return results;
}

export async function getDraftReleases(orgId: string, userId?: string): Promise<ReleaseRecord[]> {
  return getReleases(orgId, { lifecycle: ['draft'], userId });
}

export async function getActiveReleases(orgId: string): Promise<ReleaseRecord[]> {
  return getReleases(orgId, { lifecycle: ['active'] });
}

export async function getArchivedReleases(orgId: string): Promise<ReleaseRecord[]> {
  return getReleases(orgId, { lifecycle: ['archived'] });
}

export async function getReleasedReleases(orgId: string): Promise<ReleaseRecord[]> {
  return getReleases(orgId, { status: ['released'] });
}

export async function getExpiredReleases(orgId: string): Promise<ReleaseRecord[]> {
  return getReleases(orgId, { lifecycle: ['expired'] });
}

export async function duplicateRelease(releaseId: string, actorId: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const srcSnap = await getDoc(doc(db, 'releases', releaseId));
  if (!srcSnap.exists()) throw new Error('Release not found');
  const src = srcSnap.data() as Record<string, unknown>;
  const organizationId = src.organizationId as string;
  const now = Timestamp.now();
  const newRef = doc(collection(db, 'releases'));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _omit, ...rest } = src as Record<string, unknown>;
  const payload: Record<string, unknown> = {
    ...rest,
    title: `Copy of ${src.title as string}`,
    lifecycle: 'draft',
    status: 'planning',
    version: 1,
    createdAt: now,
    updatedAt: now,
    wizardData: src.wizardData ?? null,
  };
  await setDoc(newRef, payload);
  await recordActivity({
    entityType: 'release',
    entityId: newRef.id,
    organizationId,
    actorId,
    action: 'release.draft.duplicated',
    metadata: { sourceReleaseId: releaseId },
    details: 'Draft duplicated',
  });
  return newRef.id;
}

export async function renameDraft(
  releaseId: string,
  newTitle: string,
  actorId: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  if (!releaseSnap.exists()) throw new Error('Draft not found');
  const organizationId = (releaseSnap.data() as Record<string, unknown> | undefined)?.organizationId as string | undefined ?? '';
  await updateDoc(doc(db, 'releases', releaseId), {
    title: newTitle.trim(),
    updatedAt: Timestamp.now(),
  });
  await recordActivity({
    entityType: 'release',
    entityId: releaseId,
    organizationId,
    actorId,
    action: 'release.draft.renamed',
    metadata: { newTitle: newTitle.trim() },
    details: 'Draft renamed',
  });
}

export async function deleteDraft(
  releaseId: string,
  actorId: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  if (!releaseSnap.exists()) return;
  const data = releaseSnap.data() as Record<string, unknown>;
  const organizationId = (data.organizationId as string | undefined) ?? '';
  await deleteDoc(doc(db, 'releases', releaseId));
  await recordActivity({
    entityType: 'release',
    entityId: releaseId,
    organizationId,
    actorId,
    action: 'release.draft.deleted',
    metadata: { title: data.title as string },
    details: 'Draft deleted',
  });
}

export async function getReleasesByOrganization(orgId: string): Promise<ReleaseRecord[]> {
  return getAllReleases(orgId);
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
    if (snap.exists()) releases.push({ id: snap.id, ...snap.data(), artwork: null } as ReleaseRecord);
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data(), artwork: null }) as ReleaseRecord);
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
    releaseLink: fields.releaseLink ?? null,
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
  if (fields.releaseLink !== undefined) updateData.releaseLink = fields.releaseLink;
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

export async function getDraftByUser(orgId: string, userId: string): Promise<ReleaseRecord | null> {
  const db = getDb();
  if (!db) return null;
  const q = query(
    collection(db, 'releases'),
    where('organizationId', '==', orgId),
    where('createdBy', '==', userId),
    where('lifecycle', '==', 'draft'),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, ...doc.data(), artwork: null } as ReleaseRecord;
}

export async function getDraftsByUser(orgId: string, userId: string): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(
    collection(db, 'releases'),
    where('organizationId', '==', orgId),
    where('createdBy', '==', userId),
    where('lifecycle', '==', 'draft'),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), artwork: null }) as ReleaseRecord);
}

export async function createReleaseDraft(
  fields: CreateReleaseFields,
  wizardData: Record<string, unknown>,
  actorId: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const ref = await addDoc(collection(db, 'releases'), {
    ...fields,
    status: 'planning',
    lifecycle: 'draft',
    version: 1,
    wizardData,
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
    action: 'release.draft.created',
    metadata: { title: fields.title, releaseType: fields.releaseType },
    details: 'Draft created',
  });
  return ref.id;
}

export async function updateReleaseDraft(
  releaseId: string,
  wizardData: Record<string, unknown>,
  actorId: string,
  expectedVersion?: number,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  if (!releaseSnap.exists()) throw new Error('Draft not found');
  const currentVersion = (releaseSnap.data() as Record<string, unknown> | undefined)?.version as number | undefined ?? 0;
  if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
    throw new Error('Draft was updated elsewhere. Please reload.');
  }
  const nextVersion = currentVersion + 1;
  await updateDoc(doc(db, 'releases', releaseId), {
    wizardData,
    version: nextVersion,
    updatedAt: Timestamp.now(),
  });
  const organizationId = (releaseSnap.data() as Record<string, unknown> | undefined)?.organizationId as string | undefined ?? '';
  await recordActivity({
    entityType: 'release',
    entityId: releaseId,
    organizationId,
    actorId,
    action: 'release.draft.saved',
    metadata: { version: nextVersion },
    details: 'Draft saved',
  });
}

export async function completeDraft(
  releaseId: string,
  actorId: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  const organizationId = (releaseSnap.data() as Record<string, unknown> | undefined)?.organizationId as string | undefined ?? '';
  const { AuthorizationService } = await import('@/lib/auth/authorization-service');
  if (organizationId) {
    await AuthorizationService.requireEditRelease(organizationId, actorId);
  }
  await updateDoc(doc(db, 'releases', releaseId), {
    lifecycle: 'active',
    wizardData: null,
    version: 0,
    updatedAt: Timestamp.now(),
  });
  await recordActivity({
    entityType: 'release',
    entityId: releaseId,
    organizationId,
    actorId,
    action: 'release.draft.completed',
    metadata: { newStatus: 'planning' },
    details: 'Draft completed',
  });
}

export async function markExpiredDrafts(olderThanDays = 180): Promise<{ marked: number }> {
  const db = getDb();
  if (!db) return { marked: 0 };
  const cutoff = Timestamp.fromDate(new Date(Date.now() - olderThanDays * 86400000));
  const q = query(
    collection(db, 'releases'),
    where('lifecycle', '==', 'draft'),
    where('updatedAt', '<', cutoff),
  );
  const snap = await getDocs(q);
  if (snap.empty) return { marked: 0 };
  const batch = writeBatch(db);
  let count = 0;
  for (const docSnap of snap.docs) {
    batch.update(docSnap.ref, {
      lifecycle: 'expired',
      updatedAt: Timestamp.now(),
    });
    count++;
  }
  await batch.commit();
  return { marked: count };
}

export async function updateReleaseLifecycle(
  releaseId: string,
  lifecycle: ReleaseLifecycle,
  actorId: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  await updateDoc(doc(db, 'releases', releaseId), {
    lifecycle,
    updatedAt: Timestamp.now(),
  });
  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  const organizationId = (releaseSnap.data() as Record<string, unknown> | undefined)?.organizationId as string | undefined ?? '';
  await recordActivity({
    entityType: 'release',
    entityId: releaseId,
    organizationId,
    actorId,
    action: 'release.lifecycle.changed',
    metadata: { newLifecycle: lifecycle },
  });
}

export async function migrateDraftsToLifecycle(): Promise<{ migrated: number }> {
  const db = getDb();
  if (!db) return { migrated: 0 };
  const q = query(
    collection(db, 'releases'),
    where('status', '==', 'draft'),
  );
  const snap = await getDocs(q);
  if (snap.empty) return { migrated: 0 };
  const batch = writeBatch(db);
  let count = 0;
  for (const docSnap of snap.docs) {
    batch.update(docSnap.ref, {
      lifecycle: 'draft',
      status: 'planning',
      updatedAt: Timestamp.now(),
    });
    count++;
  }
  await batch.commit();
  return { migrated: count };
}

export async function createWorkflowForRelease(
  releaseId: string,
  stageTemplates: { name: string; order: number; assignedRole?: string }[],
  requirementNames: string[],
  actorId: string,
): Promise<{ workflowId: string | null }> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const batch = writeBatch(db);

  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  const releaseType = (releaseSnap.data() as Record<string, unknown> | undefined)?.releaseType as string | undefined ?? 'single';

  const workflowRef = doc(collection(db, 'workflows'));
  const workflowId = workflowRef.id;
  batch.set(workflowRef, {
    releaseId,
    templateId: releaseType,
    status: 'in_progress',
    progress: 0,
    currentStageId: null,
    startedAt: now,
    updatedAt: now,
  });

  let firstStageId: string | null = null;

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

  for (const reqName of requirementNames) {
    const reqRef = doc(collection(db, 'release_requirements'));
    batch.set(reqRef, {
      releaseId,
      name: reqName,
      status: 'required',
      createdAt: now,
      updatedAt: now,
    });
  }

  const organizationId = (releaseSnap.data() as Record<string, unknown> | undefined)?.organizationId as string | undefined ?? '';
  await recordActivity({
    entityType: 'release',
    entityId: releaseId,
    organizationId,
    actorId,
    action: 'workflow.generated',
    metadata: { stageCount: stageTemplates.length },
    batch,
  });

  await batch.commit();
  return { workflowId };
}
