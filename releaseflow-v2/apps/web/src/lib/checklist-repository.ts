import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type ChecklistCategory = 'mastering' | 'artwork' | 'video' | 'general';

export interface ChecklistItemDefinition {
  key: string;
  label: string;
  required: boolean;
}

export interface ChecklistTemplateRecord {
  id: string;
  organizationId: string;
  name: string;
  category: ChecklistCategory;
  items: ChecklistItemDefinition[];
  createdAt: unknown;
}

export interface ChecklistItem {
  key: string;
  label: string;
  checked: boolean;
  required: boolean;
}

export interface ChecklistRecord {
  id: string;
  trackId: string;
  organizationId: string;
  templateId?: string | null;
  category: ChecklistCategory;
  items: ChecklistItem[];
  completedAt?: unknown | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateChecklistTemplateFields {
  organizationId: string;
  name: string;
  category: ChecklistCategory;
  items: ChecklistItemDefinition[];
}

export interface CreateChecklistFields {
  trackId: string;
  organizationId: string;
  templateId?: string | null;
  category: ChecklistCategory;
  items: ChecklistItem[];
}

export async function createChecklistTemplate(
  fields: CreateChecklistTemplateFields,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'production_checklist_templates'), {
    organizationId: fields.organizationId,
    name: fields.name,
    category: fields.category,
    items: fields.items,
    createdAt: now,
  });

  return ref.id;
}

export async function getChecklistTemplates(
  orgId: string,
): Promise<ChecklistTemplateRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'production_checklist_templates'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChecklistTemplateRecord);
}

export async function getChecklistTemplate(
  templateId: string,
): Promise<ChecklistTemplateRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'production_checklist_templates', templateId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ChecklistTemplateRecord;
}

export async function createChecklist(fields: CreateChecklistFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'production_checklists'), {
    trackId: fields.trackId,
    organizationId: fields.organizationId,
    templateId: fields.templateId ?? null,
    category: fields.category,
    items: fields.items,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function getChecklist(checklistId: string): Promise<ChecklistRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'production_checklists', checklistId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ChecklistRecord;
}

export async function toggleChecklistItem(
  checklistId: string,
  itemKey: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const checklist = await getChecklist(checklistId);
  if (!checklist) return;
  const updatedItems = checklist.items.map((item) =>
    item.key === itemKey ? { ...item, checked: !item.checked } : item,
  );
  await updateDoc(doc(db, 'production_checklists', checklistId), {
    items: updatedItems,
    updatedAt: Timestamp.now(),
  });
}

export async function completeChecklist(checklistId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'production_checklists', checklistId), {
    completedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function getChecklistByTrack(trackId: string): Promise<ChecklistRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'production_checklists'),
      where('trackId', '==', trackId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChecklistRecord);
}
