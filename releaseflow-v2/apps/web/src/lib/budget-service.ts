import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { ReleaseBudget, CostItem, CostCategory, BudgetStatus } from '@/app/(app)/types';

export async function initializeBudget(releaseId: string, plannedBudget: number): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'release_budgets'), {
    releaseId,
    plannedBudget,
    actualCost: 0,
    remainingBudget: plannedBudget,
    variance: 0,
    status: 'on_budget',
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getBudgetByRelease(releaseId: string): Promise<ReleaseBudget | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(collection(db, 'release_budgets'), where('releaseId', '==', releaseId), orderBy('createdAt', 'desc')),
  );
  if (snap.empty) return null;
  const firstDoc = snap.docs[0];
  if (!firstDoc) return null;
  return { id: firstDoc.id, ...firstDoc.data() } as ReleaseBudget;
}

export async function addCostItem(releaseId: string, fields: {
  category: CostCategory;
  description: string;
  amount: number;
  vendor?: string;
  status?: string;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'cost_items'), {
    releaseId,
    category: fields.category,
    vendor: fields.vendor ?? null,
    description: fields.description,
    amount: fields.amount,
    status: fields.status ?? 'planned',
    dueDate: null,
    createdAt: Timestamp.now(),
  });
  await recalculateBudget(releaseId);
  return ref.id;
}

export async function getCostItemsByRelease(releaseId: string): Promise<CostItem[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'cost_items'), where('releaseId', '==', releaseId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CostItem);
}

export async function recalculateBudget(releaseId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const budget = await getBudgetByRelease(releaseId);
  if (!budget) return;
  const items = await getCostItemsByRelease(releaseId);
  const incurred = items.filter((i) => i.status === 'incurred' || i.status === 'paid');
  const actualCost = incurred.reduce((sum, i) => sum + i.amount, 0);
  const planned = budget.plannedBudget;
  const remaining = planned - actualCost;
  const variance = planned - actualCost;
  const status = computeBudgetHealth(actualCost, planned);

  await updateDoc(doc(db, 'release_budgets', budget.id), {
    actualCost,
    remainingBudget: remaining,
    variance,
    status,
    updatedAt: Timestamp.now(),
  });
}

export function computeBudgetHealth(actualCost: number, plannedBudget: number): BudgetStatus {
  if (actualCost > plannedBudget) return 'over_budget';
  if (plannedBudget > 0 && actualCost > plannedBudget * 0.8) return 'at_risk';
  return 'on_budget';
}

interface BudgetSummary {
  budgetId: string | null;
  planned: number;
  actual: number;
  remaining: number;
  status: BudgetStatus;
  costItems: { total: number; planned: number; incurred: number; paid: number };
}

export async function getBudgetSummary(releaseId: string): Promise<BudgetSummary> {
  const [budget, items] = await Promise.all([
    getBudgetByRelease(releaseId),
    getCostItemsByRelease(releaseId),
  ]);
  const incurred = items.filter((i) => i.status === 'incurred' || i.status === 'paid');
  const actual = incurred.reduce((sum, i) => sum + i.amount, 0);
  const planned = budget?.plannedBudget ?? 0;
  return {
    budgetId: budget?.id ?? null,
    planned,
    actual,
    remaining: planned - actual,
    status: budget?.status ?? 'on_budget',
    costItems: {
      total: items.length,
      planned: items.filter((i) => i.status === 'planned').length,
      incurred: items.filter((i) => i.status === 'incurred').length,
      paid: items.filter((i) => i.status === 'paid').length,
    },
  };
}
