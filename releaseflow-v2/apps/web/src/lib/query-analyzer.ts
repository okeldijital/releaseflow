import { collection, query, where, getDocs, getCountFromServer, limit } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { reviewPerformance } from '@/lib/performance-review';

export interface QueryProfile {
  name: string;
  collection: string;
  estimatedCount: number;
  hasIndex: boolean;
  indexRecommendation: string;
}

export interface QueryReport {
  totalQueries: number;
  profiles: QueryProfile[];
  score: number;
  improvements: string[];
}

export async function analyzeQueries(orgId: string): Promise<QueryReport> {
  const db = getDb();
  if (!db) return { totalQueries: 0, profiles: [], score: 0, improvements: [] };

  const snap = await getDocs(
    query(collection(db, 'releases'), where('organizationId', '==', orgId), limit(10)),
  );
  const ids = snap.docs.map((d) => d.id);
  if (ids.length === 0) return { totalQueries: 0, profiles: [], score: 0, improvements: ['No releases found for this organization'] };

  const counts: { name: string; count: number }[] = [];
  for (const col of ['tasks', 'deliverables', 'stages', 'activities', 'notifications', 'operational_alerts', 'campaigns']) {
    try {
      const countSnap = await getCountFromServer(
        query(collection(db, col), where('releaseId', 'in', ids.slice(0, 10))),
      );
      counts.push({ name: col, count: countSnap.data().count });
    } catch {
      counts.push({ name: col, count: -1 });
    }
  }

  const perfReport = reviewPerformance();
  const profiles: QueryProfile[] = counts.map((c) => ({
    name: `${c.name} by releaseId`,
    collection: c.name,
    estimatedCount: c.count,
    hasIndex: perfReport.suggestedIndexes.some((idx) => idx.collection === c.name),
    indexRecommendation: perfReport.suggestedIndexes.find((idx) => idx.collection === c.name)?.fields.join(', ') ?? 'No index needed',
  }));

  const withoutIndex = profiles.filter((p) => !p.hasIndex && p.estimatedCount > 0);
  const score = profiles.length > 0 ? Math.round((profiles.filter((p) => p.hasIndex).length / profiles.length) * 100) : 0;

  const improvements: string[] = [];
  if (withoutIndex.length > 0) {
    improvements.push(`${withoutIndex.length} collections need composite indexes`);
    for (const p of withoutIndex) {
      improvements.push(`  ${p.collection}: ${p.estimatedCount} docs — add index: ${p.indexRecommendation}`);
    }
  }
  improvements.push(`Total estimated docs across sampled collections: ${profiles.reduce((s, p) => s + Math.max(0, p.estimatedCount), 0)}`);

  return { totalQueries: profiles.length, profiles, score, improvements };
}
