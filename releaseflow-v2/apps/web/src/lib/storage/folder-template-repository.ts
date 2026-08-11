/**
 * BUILD-301E — Folder Template repository.
 * Path: organizations/{organizationId}/folder_templates/{id}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  type Firestore,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type {
  CreateFolderTemplateInput,
  FolderTemplateRecord,
  UpdateFolderTemplateInput,
} from './folder-template-types';

const SUB = 'folder_templates';

function col(db: Firestore, organizationId: string) {
  return collection(db, 'organizations', organizationId, SUB);
}

function ref(db: Firestore, organizationId: string, id: string) {
  return doc(db, 'organizations', organizationId, SUB, id);
}

function toRecord(
  id: string,
  organizationId: string,
  data: Record<string, unknown>,
): FolderTemplateRecord {
  return {
    id,
    organizationId,
    name: String(data.name ?? ''),
    description:
      data.description === undefined || data.description === null
        ? null
        : String(data.description),
    structure: String(data.structure ?? ''),
    active: data.active !== false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listFolderTemplates(
  organizationId: string,
): Promise<FolderTemplateRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(col(db, organizationId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) =>
    toRecord(d.id, organizationId, d.data() as Record<string, unknown>),
  );
}

export async function getFolderTemplate(
  organizationId: string,
  id: string,
): Promise<FolderTemplateRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(ref(db, organizationId, id));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (data.organizationId && data.organizationId !== organizationId) {
    return null;
  }
  return toRecord(snap.id, organizationId, data);
}

export async function createFolderTemplate(
  organizationId: string,
  input: CreateFolderTemplateInput,
): Promise<FolderTemplateRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const payload = {
    organizationId,
    name: input.name.trim(),
    description:
      input.description === undefined || input.description === null
        ? null
        : String(input.description).trim() || null,
    structure: input.structure.trim(),
    active: input.active !== false,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(col(db, organizationId), payload);
  return toRecord(docRef.id, organizationId, payload);
}

export async function updateFolderTemplate(
  organizationId: string,
  id: string,
  input: UpdateFolderTemplateInput,
): Promise<FolderTemplateRecord | null> {
  const db = getDb();
  if (!db) return null;
  const existing = await getFolderTemplate(organizationId, id);
  if (!existing) return null;

  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (input.name !== undefined) update.name = input.name.trim();
  if (input.structure !== undefined) update.structure = input.structure.trim();
  if (input.description !== undefined) {
    update.description =
      input.description === null
        ? null
        : String(input.description).trim() || null;
  }
  if (input.active !== undefined) update.active = input.active;

  await updateDoc(ref(db, organizationId, id), update);
  return getFolderTemplate(organizationId, id);
}

export async function deleteFolderTemplate(
  organizationId: string,
  id: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const existing = await getFolderTemplate(organizationId, id);
  if (!existing) return false;
  await deleteDoc(ref(db, organizationId, id));
  return true;
}
