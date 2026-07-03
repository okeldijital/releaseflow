import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, where, Timestamp } from 'firebase/firestore';
import { getDb } from './firebase';

export interface OrganizationPolicyRecord {
  id: string;
  orgId: string;
  policyType: 'feature_flag' | 'approval_rule' | 'metadata_default' | 'distribution_rule';
  key: string;
  value: string;
  enabled: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

function policyId(orgId: string, policyType: string, key: string): string {
  return `${orgId}:${policyType}:${key}`;
}

export async function setPolicy(
  orgId: string,
  policyType: OrganizationPolicyRecord['policyType'],
  key: string,
  value: string,
  enabled = true,
): Promise<OrganizationPolicyRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const id = policyId(orgId, policyType, key);
  const record: Omit<OrganizationPolicyRecord, 'id'> = {
    orgId,
    policyType,
    key,
    value,
    enabled,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'organization_policies', id), record);
  return { id, ...record };
}

export async function getPolicy(
  orgId: string,
  policyType: OrganizationPolicyRecord['policyType'],
  key: string,
): Promise<OrganizationPolicyRecord | null> {
  const db = getDb();
  if (!db) return null;
  const id = policyId(orgId, policyType, key);
  const snap = await getDoc(doc(db, 'organization_policies', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as OrganizationPolicyRecord;
}

export async function getPoliciesByOrg(orgId: string): Promise<OrganizationPolicyRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'organization_policies'), where('orgId', '==', orgId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrganizationPolicyRecord);
}

export async function getPolicyValue<T>(
  orgId: string,
  policyType: OrganizationPolicyRecord['policyType'],
  key: string,
  defaultValue: T,
): Promise<T> {
  const policy = await getPolicy(orgId, policyType, key);
  if (!policy) return defaultValue;
  try {
    return JSON.parse(policy.value) as T;
  } catch {
    return defaultValue;
  }
}

export async function deletePolicy(policyId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'organization_policies', policyId));
}
