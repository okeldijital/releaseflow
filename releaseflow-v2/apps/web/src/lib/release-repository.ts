import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  collection, query, where, orderBy, writeBatch, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';
import { recordActivity } from './activity-service';
import type { ReleaseStatus, ReleaseLifecycle, ReleaseType } from '@/app/(app)/types';
import type { Artwork } from '@/lib/artwork/artwork-types';
import type { RichTextDocument } from '@/lib/rich-text';

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
  /** BUILD-013 — structured editorial liner notes (not HTML) */
  linerNotes?: RichTextDocument | null;
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
  /** BUILD-013 */
  linerNotes?: RichTextDocument | null;
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
  owner?: string;
  updatedAfter?: Date;
  releaseBefore?: Date;
  readiness?: string[];
  hasArtwork?: boolean;
  hasTracks?: boolean;
  needsAttention?: boolean;
}

export async function getReleases(orgId: string, options: ReleaseQueryOptions = {}): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db) return [];
  const { lifecycle, status, userId, owner, updatedAfter, releaseBefore, readiness, hasArtwork, hasTracks, needsAttention, search, sort, pagination } = options;

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

  const ownerFilter = userId || owner;
  if (ownerFilter) {
    q = query(collection(db, 'releases'), where('organizationId', '==', orgId), where('createdBy', '==', ownerFilter));
  }

  const snap = await getDocs(q);
  let results = snap.docs.map((d) => ({ id: d.id, ...d.data(), artwork: null }) as ReleaseRecord);

  // BUG-009: always re-apply lifecycle/status in memory. Combining lifecycle + userId
  // previously overwrote the Firestore query and dropped the lifecycle constraint.
  if (lifecycle && lifecycle.length > 0) {
    results = results.filter((r) => lifecycle.includes(r.lifecycle));
  }

  if (status && status.length > 0) {
    results = results.filter((r) => status.includes(r.status));
  }

  if (search) {
    const term = search.toLowerCase();
    results = results.filter((r) =>
      (r.title ?? '').toLowerCase().includes(term) ||
      (r.upc ?? '').toLowerCase().includes(term) ||
      (r.catalogNumber ?? '').toLowerCase().includes(term)
    );
  }

  if (updatedAfter) {
    const cutoff = updatedAfter.getTime();
    results = results.filter((r) => getDateValue(r.updatedAt) > cutoff);
  }

  if (releaseBefore) {
    const cutoff = releaseBefore.getTime();
    results = results.filter((r) => {
      const ts = getDateValue(r.targetReleaseDate);
      return ts > 0 && ts < cutoff;
    });
  }

  if (readiness && readiness.length > 0) {
    results = results.filter((r) => {
      const rd = (r.wizardData as Record<string, unknown> | null | undefined)?.readiness as string | undefined;
      return readiness.includes(rd ?? 'ready');
    });
  }

  if (hasArtwork === true) {
    results = results.filter((r) => r.artwork !== null && r.artwork !== undefined);
  } else if (hasArtwork === false) {
    results = results.filter((r) => !r.artwork);
  }

  if (hasTracks === true) {
    results = results.filter((r) => {
      const wd = r.wizardData as Record<string, unknown> | null | undefined;
      return wd?.tracks && Array.isArray(wd.tracks) && wd.tracks.length > 0;
    });
  } else if (hasTracks === false) {
    results = results.filter((r) => {
      const wd = r.wizardData as Record<string, unknown> | null | undefined;
      return !wd?.tracks || !Array.isArray(wd.tracks) || wd.tracks.length === 0;
    });
  }

  if (needsAttention) {
    results = results.filter((r) => isReleaseNeedingAttention(r));
  }

  if (sort) {
    switch (sort) {
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

  if (pagination) {
    const { limit, offset } = pagination;
    results = results.slice(offset, offset + limit);
  }

  return results;
}

function isReleaseNeedingAttention(r: ReleaseRecord): boolean {
  if (!r.artwork) return true;
  const wd = r.wizardData as Record<string, unknown> | null | undefined;
  if (wd?.assignments && Array.isArray(wd.assignments)) {
    const blocked = (wd.assignments as unknown[]).some((a) => {
      const obj = a as Record<string, unknown>;
      return obj.status === 'blocked';
    });
    if (blocked) return true;
  }
  const requiredFields = ['releaseTitle', 'primaryArtist', 'upc', 'genre'];
  const missingMeta = requiredFields.some((f) => !(wd as Record<string, unknown> | null | undefined)?.[f]);
  if (missingMeta) return true;
  if (wd?.validationErrors && Array.isArray(wd.validationErrors) && (wd.validationErrors as unknown[]).length > 0) return true;
  return false;
}

export async function getReleasesNeedingAttention(orgId: string, userId?: string): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db) return [];
  let q = query(
    collection(db, 'releases'),
    where('organizationId', '==', orgId),
  );
  if (userId) {
    q = query(collection(db, 'releases'), where('organizationId', '==', orgId), where('createdBy', '==', userId));
  }
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data(), artwork: null }) as ReleaseRecord);
  return all.filter((r) => isReleaseNeedingAttention(r)).slice(0, 5);
}

export async function getContinueWorkingReleases(orgId: string, userId: string): Promise<ReleaseRecord[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const all = await getReleasesByOrganization(orgId);
  return all
    .filter((r) => {
      if (r.lifecycle === 'draft' && r.createdBy === userId) return true;
      if (r.lifecycle === 'active' && getDateValue(r.updatedAt) > sevenDaysAgo.getTime()) return true;
      return false;
    })
    .sort((a, b) => getDateValue(b.updatedAt) - getDateValue(a.updatedAt));
}

export async function getUpcomingReleases(orgId: string, withinDays = 30): Promise<ReleaseRecord[]> {
  const now = Date.now();
  const cutoff = now + withinDays * 24 * 60 * 60 * 1000;
  const all = await getReleasesByOrganization(orgId);
  return all
    .filter((r) => {
      const ts = getDateValue(r.targetReleaseDate);
      return ts > 0 && ts >= now && ts <= cutoff;
    })
    .sort((a, b) => getDateValue(a.targetReleaseDate) - getDateValue(b.targetReleaseDate))
    .slice(0, 10);
}

export async function getRecentlyUpdatedReleases(orgId: string, limit = 10): Promise<ReleaseRecord[]> {
  const all = await getReleasesByOrganization(orgId);
  return all
    .sort((a, b) => getDateValue(b.updatedAt) - getDateValue(a.updatedAt))
    .slice(0, limit);
}

export async function getDraftReleases(orgId: string, userId?: string): Promise<ReleaseRecord[]> {
  // BUG-009: dedicated draft queries with fallbacks (not getReleases, which dropped lifecycle when userId set).
  if (userId) return getDraftsByUser(orgId, userId);
  return getOrganizationDrafts(orgId);
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
  if (fields.linerNotes !== undefined) updateData.linerNotes = fields.linerNotes;
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

  const mapDocs = (docs: { id: string; data: () => Record<string, unknown> }[]) =>
    docs.map((d) => ({ id: d.id, ...d.data(), artwork: null }) as ReleaseRecord);

  try {
    const snap = await getDocs(
      query(
        collection(db, 'releases'),
        where('organizationId', '==', orgId),
        where('createdBy', '==', userId),
        where('lifecycle', '==', 'draft'),
        orderBy('updatedAt', 'desc'),
      ),
    );
    return mapDocs(snap.docs);
  } catch (err) {
    // BUG-009A Option A: primary path needs composite index
    // (organizationId, createdBy, lifecycle, updatedAt). Index is defined in
    // firestore.indexes.json. Fallback only if that query throws (undeployed index).
    // Membership filter is identical: org + lifecycle draft + createdBy (client-side).
    console.error('[drafts] getDraftsByUser ordered query failed; falling back', err);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'releases'),
          where('organizationId', '==', orgId),
          where('lifecycle', '==', 'draft'),
        ),
      );
      return mapDocs(snap.docs)
        .filter((r) => r.createdBy === userId)
        .sort((a, b) => getDateValue(b.updatedAt) - getDateValue(a.updatedAt));
    } catch (err2) {
      console.error('[drafts] getDraftsByUser fallback failed', err2);
      return [];
    }
  }
}

/**
 * BUG-009 — Org-scoped draft discovery (lifecycle == draft only).
 * No owner / readiness / assignment filters. Safe for Draft list + Dashboard.
 */
export async function getOrganizationDrafts(orgId: string): Promise<ReleaseRecord[]> {
  const db = getDb();
  if (!db || !orgId) return [];

  const mapDocs = (docs: { id: string; data: () => Record<string, unknown> }[]) =>
    docs.map((d) => ({ id: d.id, ...d.data(), artwork: null }) as ReleaseRecord);

  try {
    const snap = await getDocs(
      query(
        collection(db, 'releases'),
        where('organizationId', '==', orgId),
        where('lifecycle', '==', 'draft'),
        orderBy('updatedAt', 'desc'),
      ),
    );
    return mapDocs(snap.docs);
  } catch (err) {
    // BUG-009A Option A: primary path needs composite index
    // (organizationId ASC, lifecycle ASC, updatedAt DESC) — present in firestore.indexes.json.
    // Fallback: equality-only (org + lifecycle==draft) + client sort by updatedAt.
    // Document set membership is identical to the ordered query.
    console.error('[drafts] getOrganizationDrafts ordered query failed; falling back', err);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'releases'),
          where('organizationId', '==', orgId),
          where('lifecycle', '==', 'draft'),
        ),
      );
      return mapDocs(snap.docs).sort(
        (a, b) => getDateValue(b.updatedAt) - getDateValue(a.updatedAt),
      );
    } catch (err2) {
      console.error('[drafts] getOrganizationDrafts fallback failed', err2);
      return [];
    }
  }
}

/** BUG-009B: Firestore rejects `undefined` field values — strip before write. */
function sanitizeForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function createReleaseDraft(
  fields: CreateReleaseFields,
  wizardData: Record<string, unknown>,
  actorId: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const safeWizard = sanitizeForFirestore(wizardData);
  const ref = await addDoc(collection(db, 'releases'), {
    title: fields.title,
    releaseType: fields.releaseType,
    status: 'planning',
    lifecycle: 'draft',
    organizationId: fields.organizationId,
    createdBy: fields.createdBy,
    version: 1,
    wizardData: safeWizard,
    targetReleaseDate: fields.targetReleaseDate
      ? Timestamp.fromDate(fields.targetReleaseDate)
      : null,
    estimatedReleaseDate: fields.estimatedReleaseDate
      ? Timestamp.fromDate(fields.estimatedReleaseDate)
      : null,
    upc: fields.upc ?? null,
    label: fields.label ?? null,
    genre: fields.genre ?? null,
    releaseLink: fields.releaseLink ?? null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  try {
    await recordActivity({
      entityType: 'release',
      entityId: ref.id,
      organizationId: fields.organizationId,
      actorId,
      action: 'release.draft.created',
      metadata: { title: fields.title, releaseType: fields.releaseType },
      details: 'Draft created',
    });
  } catch (activityErr) {
    // Draft is already written — do not fail Save Draft if activity logging fails.
    console.error('[drafts] createReleaseDraft activity log failed (non-blocking)', activityErr);
  }
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
  // BUG-009: keep document title in sync with wizard so draft lists show the current name.
  const { buildDraftSavePatch } = await import('@/lib/draft-discovery');
  const safeWizard = sanitizeForFirestore(wizardData);
  const patch = {
    ...buildDraftSavePatch(safeWizard, nextVersion),
    updatedAt: Timestamp.now(),
  };
  await updateDoc(doc(db, 'releases', releaseId), patch);
  const organizationId = (releaseSnap.data() as Record<string, unknown> | undefined)?.organizationId as string | undefined ?? '';
  try {
    await recordActivity({
      entityType: 'release',
      entityId: releaseId,
      organizationId,
      actorId,
      action: 'release.draft.saved',
      metadata: { version: nextVersion },
      details: 'Draft saved',
    });
  } catch (activityErr) {
    console.error('[drafts] updateReleaseDraft activity log failed (non-blocking)', activityErr);
  }
}

export async function completeDraft(
  releaseId: string,
  actorId: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const releaseSnap = await getDoc(doc(db, 'releases', releaseId));
  const existing = (releaseSnap.data() as Record<string, unknown> | undefined) ?? {};
  const organizationId = (existing.organizationId as string | undefined) ?? '';
  const currentVersion = typeof existing.version === 'number' ? existing.version : 0;
  const { AuthorizationService } = await import('@/lib/auth/authorization-service');
  if (organizationId) {
    await AuthorizationService.requireEditRelease(organizationId, actorId);
  }
  // Firestore rules require request.resource.data.version >= resource.data.version.
  // Do not reset version to 0 — that rejects the complete write (BUG-009B live verify).
  await updateDoc(doc(db, 'releases', releaseId), {
    lifecycle: 'active',
    wizardData: null,
    version: currentVersion + 1,
    updatedAt: Timestamp.now(),
  });
  try {
    await recordActivity({
      entityType: 'release',
      entityId: releaseId,
      organizationId,
      actorId,
      action: 'release.draft.completed',
      metadata: { newStatus: 'planning' },
      details: 'Draft completed',
    });
  } catch (activityErr) {
    console.error('[drafts] completeDraft activity log failed (non-blocking)', activityErr);
  }
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
