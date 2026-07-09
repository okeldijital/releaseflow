import { collection, query, where, getDocs, limit } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';

interface QuerySnapshotMetric {
  collection: string;
  docCount: number;
  queryCount: number;
  estimatedReads: number;
  loadTimeMs: number;
}

interface BaselineMetrics {
  operationsCenter: QuerySnapshotMetric[];
  executiveDashboard: QuerySnapshotMetric[];
  dailyBrief: QuerySnapshotMetric[];
  totals: { totalQueries: number; totalReads: number; totalTimeMs: number };
  timestamp: string;
}

export async function measureBaseline(orgId: string): Promise<BaselineMetrics> {
  const db = getDb();
  if (!db) return { operationsCenter: [], executiveDashboard: [], dailyBrief: [], totals: { totalQueries: 0, totalReads: 0, totalTimeMs: 0 }, timestamp: new Date().toISOString() };

  const metric = async (label: string, collections: string[]): Promise<QuerySnapshotMetric[]> => {
    const results: QuerySnapshotMetric[] = [];
    for (const col of collections) {
      const t0 = performance.now();
      try {
        const snap = await getDocs(
          query(collection(db, col), where('releaseId', 'in', [orgId]), limit(100)),
        );
        const dt = performance.now() - t0;
        results.push({ collection: col, docCount: snap.size, queryCount: 1, estimatedReads: snap.size, loadTimeMs: Math.round(dt) });
      } catch {
        results.push({ collection: col, docCount: 0, queryCount: 1, estimatedReads: 0, loadTimeMs: Math.round(performance.now() - t0) });
      }
    }
    return results;
  };

  const opsCenter = await metric('Operations Center', ['tasks', 'stages', 'deliverables', 'dependencies', 'operational_alerts']);
  const execDash = await metric('Executive Dashboard', ['releases', 'campaigns', 'release_budgets', 'cost_items', 'distribution_packages']);
  const dailyBrief = await metric('Daily Brief', ['dependencies', 'operational_alerts', 'tasks', 'stages', 'campaign_tasks']);

  const totalQueries = opsCenter.length + execDash.length + dailyBrief.length;
  const totalReads = [...opsCenter, ...execDash, ...dailyBrief].reduce((s, m) => s + m.estimatedReads, 0);
  const totalTimeMs = [...opsCenter, ...execDash, ...dailyBrief].reduce((s, m) => s + m.loadTimeMs, 0);

  return { operationsCenter: opsCenter, executiveDashboard: execDash, dailyBrief, totals: { totalQueries, totalReads, totalTimeMs }, timestamp: new Date().toISOString() };
}
