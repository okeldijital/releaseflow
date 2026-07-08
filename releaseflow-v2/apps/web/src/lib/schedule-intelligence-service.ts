import type { ReleaseRecord } from './release-repository';
import type { MilestoneRecord } from './milestone-repository';

export interface MilestoneProgress {
  title: string;
  percentage: number;
  status: string;
}

export interface ReleaseReadinessScore {
  releaseId: string;
  title: string;
  overall: number;
  categories: {
    metadata: number;
    artwork: number;
    master: number;
    marketing: number;
    distribution: number;
  };
  milestones: MilestoneProgress[];
  missing: string[];
  conflicts: string[];
}

export function calculateReleaseReadiness(
  release: ReleaseRecord,
  milestones: MilestoneRecord[],
): ReleaseReadinessScore {
  const overdue = milestones.filter((m) => m.status === 'overdue').length;

  const milestoneProgress = milestones.map((m) => ({
    title: m.title,
    percentage: m.status === 'completed' ? 100 : m.status === 'overdue' ? 25 : 0,
    status: m.status,
  }));

  const metadataScore = calculateMetadataScore(release);
  const artworkScore = milestones.some((m) => m.title.includes('Artwork') && m.status === 'completed') ? 100 : 80;
  const masterScore = milestones.some((m) => m.title.includes('Master') && m.status === 'completed') ? 100 : 60;
  const marketingScore = milestones.some((m) => m.title.includes('Marketing') && m.status === 'completed') ? 100 : 50;
  const distributionScore = milestones.some((m) => m.title.includes('Distribution') && m.status === 'completed') ? 100 : 80;

  const weights = { metadata: 0.2, artwork: 0.2, master: 0.2, marketing: 0.2, distribution: 0.2 };
  const overall = Math.round(
    metadataScore * weights.metadata +
    artworkScore * weights.artwork +
    masterScore * weights.master +
    marketingScore * weights.marketing +
    distributionScore * weights.distribution,
  );

  const missing: string[] = [];
  if (!release.upc) missing.push('UPC');
  if (!release.label) missing.push('Label');
  if (!release.genre) missing.push('Genre');
  if (!release.estimatedReleaseDate) missing.push('Release Date');
  if (milestones.length === 0) missing.push('Milestones');

  const conflicts: string[] = [];
  if (overdue > 0) conflicts.push(`${overdue} overdue milestone(s)`);
  if (!release.upc) conflicts.push('Missing UPC');

  return {
    releaseId: release.id,
    title: release.title,
    overall,
    categories: {
      metadata: metadataScore, artwork: artworkScore,
      master: masterScore, marketing: marketingScore, distribution: distributionScore,
    },
    milestones: milestoneProgress,
    missing,
    conflicts,
  };
}

function calculateMetadataScore(release: ReleaseRecord): number {
  let score = 0;
  const checks = [
    !!release.title, !!release.upc, !!release.label,
    !!release.genre, !!release.copyright,
    !!release.estimatedReleaseDate,
  ];
  for (const check of checks) if (check) score += 100 / checks.length;
  return Math.round(score);
}

export function detectConflicts(
  releases: ReleaseRecord[],
): { type: string; severity: 'warning' | 'error'; message: string; releaseIds: string[] }[] {
  const conflicts: { type: string; severity: 'warning' | 'error'; message: string; releaseIds: string[] }[] = [];

  const dateMap = new Map<string, string[]>();
  for (const r of releases) {
    const date = r.estimatedReleaseDate || r.targetReleaseDate;
    if (date) {
      const key = String(date);
      const ids = dateMap.get(key) || [];
      ids.push(r.id);
      dateMap.set(key, ids);
    }
  }

  for (const ids of dateMap.values()) {
    if (ids.length > 1) {
      conflicts.push({
        type: 'same_day_release',
        severity: 'warning',
        message: `${ids.length} releases scheduled on the same day`,
        releaseIds: ids,
      });
    }
  }

  const noDate = releases.filter((r) => !r.estimatedReleaseDate && !r.targetReleaseDate);
  if (noDate.length > 0) {
    conflicts.push({
      type: 'missing_date',
      severity: 'warning',
      message: `${noDate.length} release(s) without a scheduled date`,
      releaseIds: noDate.map((r) => r.id),
    });
  }

  return conflicts;
}

export function getScheduleHealth(releases: ReleaseRecord[], milestones: MilestoneRecord[]): {
  totalReleases: number;
  onTrack: number;
  atRisk: number;
  overdue: number;
  completedThisMonth: number;
  upcomingThisMonth: number;
} {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const upcomingThisMonth = releases.filter((r) => {
    const d = r.estimatedReleaseDate || r.targetReleaseDate;
    if (!d) return false;
    const date = dateFromUnknown(d);
    return date >= startOfMonth && date <= endOfMonth;
  }).length;

  const completedThisMonth = milestones.filter((m) => {
    if (m.status !== 'completed' || !m.completedAt) return false;
    const date = dateFromUnknown(m.completedAt);
    return date >= startOfMonth && date <= endOfMonth;
  }).length;

  const overdue = milestones.filter((m) => m.status === 'overdue').length;
  const atRisk = milestones.filter((m) => {
    if (m.status !== 'pending' || !m.dueDate) return false;
    const date = dateFromUnknown(m.dueDate);
    return date < now && date > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }).length;

  return {
    totalReleases: releases.length,
    onTrack: releases.length - Math.ceil(overdue / 2) - atRisk,
    atRisk,
    overdue,
    completedThisMonth,
    upcomingThisMonth,
  };
}

function dateFromUnknown(d: unknown): Date {
  if (d && typeof d === 'object' && 'toDate' in d) return (d as { toDate: () => Date }).toDate();
  if (d instanceof Date) return d;
  return new Date(String(d));
}

export function calculateCapacity(orgId: string, releases: ReleaseRecord[], milestones: MilestoneRecord[], assignments: { dueDate?: unknown; estimatedHours?: number | null }[]): {
  releasesPerMonth: { month: string; count: number }[];
  workload: number;
  assignmentLoad: number;
} {
  const monthMap = new Map<string, number>();
  for (const r of releases) {
    const d = r.estimatedReleaseDate || r.targetReleaseDate;
    if (d) {
      const date = dateFromUnknown(d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
  }

  const releasesPerMonth = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const assignmentLoad = assignments.reduce((s, a) => s + (a.estimatedHours ?? 0), 0);
  const overdue = milestones.filter((m) => m.status === 'overdue').length;

  return {
    releasesPerMonth,
    workload: releases.length * 10 + overdue * 5,
    assignmentLoad,
  };
}
