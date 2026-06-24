import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { runRules, runOrgRules } from '@/lib/rule-engine';
import type { OperationalAlert } from '@/app/(app)/types';

export async function generateAlerts(releaseId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  const findings = await runRules(releaseId);
  const now = Timestamp.now();

  for (const f of findings) {
    const existing = await getDocs(
      query(
        collection(db, 'operational_alerts'),
        where('releaseId', '==', releaseId),
        where('rule', '==', f.rule),
        where('entityId', '==', f.entityId),
        where('resolved', '==', false),
      ),
    );
    if (!existing.empty) continue;

    await addDoc(collection(db, 'operational_alerts'), {
      releaseId,
      rule: f.rule,
      priority: f.priority,
      message: f.message,
      entityType: f.entityType,
      entityId: f.entityId,
      resolved: false,
      createdAt: now,
    });
  }
}

export async function generateOrgAlerts(orgId: string): Promise<void> {
  const findings = await runOrgRules(orgId);
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();

  for (const f of findings) {
    const existing = await getDocs(
      query(
        collection(db, 'operational_alerts'),
        where('releaseId', '==', f.releaseId),
        where('rule', '==', f.rule),
        where('entityId', '==', f.entityId),
        where('resolved', '==', false),
      ),
    );
    if (!existing.empty) continue;

    await addDoc(collection(db, 'operational_alerts'), {
      releaseId: f.releaseId,
      rule: f.rule,
      priority: f.priority,
      message: f.message,
      entityType: f.entityType,
      entityId: f.entityId,
      resolved: false,
      createdAt: now,
    });
  }
}

export async function getActiveAlerts(orgId: string): Promise<OperationalAlert[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'releases'),
      where('organizationId', '==', orgId),
    ),
  );
  const ids = snap.docs.map((d) => d.id);
  if (ids.length === 0) return [];

  const allAlerts: OperationalAlert[] = [];
  for (const rid of ids) {
    const alertSnap = await getDocs(
      query(
        collection(db, 'operational_alerts'),
        where('releaseId', '==', rid),
        where('resolved', '==', false),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc'),
      ),
    );
    allAlerts.push(...alertSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as OperationalAlert));
  }
  return allAlerts;
}

export async function resolveAlert(alertId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'operational_alerts', alertId), { resolved: true });
}
