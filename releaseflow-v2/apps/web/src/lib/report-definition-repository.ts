import {
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';
import type { ReportDomain } from './reporting-service';

export interface ReportDefinitionRecord {
  id: string;
  orgId: string;
  name: string;
  domain: ReportDomain;
  filters: Record<string, string>;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface SaveReportDefinitionFields {
  orgId: string;
  name: string;
  domain: ReportDomain;
  filters: Record<string, string>;
  createdBy: string;
}

export async function saveReportDefinition(
  fields: SaveReportDefinitionFields,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'report_definitions'), {
    orgId: fields.orgId,
    name: fields.name,
    domain: fields.domain,
    filters: fields.filters,
    createdBy: fields.createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getReportDefinitions(
  orgId: string,
): Promise<ReportDefinitionRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'report_definitions'),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as ReportDefinitionRecord,
  );
}

export async function deleteReportDefinition(
  definitionId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'report_definitions', definitionId));
}
