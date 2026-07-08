import { describe, it, expect } from 'vitest';
import { calculateReleaseReadiness, detectConflicts, getScheduleHealth, calculateCapacity } from '@/lib/schedule-intelligence-service';
import type { ReleaseRecord } from '@/lib/release-repository';
import type { MilestoneRecord } from '@/lib/milestone-repository';

const mkRelease = (overrides: Partial<ReleaseRecord>): ReleaseRecord => ({
  id: 'r1', title: 'Test Release', releaseType: 'single', status: 'draft',
  organizationId: 'org1', createdBy: 'u1',
  estimatedReleaseDate: new Date('2026-06-15'),
  upc: '123456789012', label: 'Test Label', genre: 'Pop',
  copyright: '2026 Test', createdAt: new Date(),
  ...overrides,
});

const mkMilestone = (overrides: Partial<MilestoneRecord> & { title: string }): MilestoneRecord => ({
  id: 'm1', releaseId: 'r1', organizationId: 'org1',
  status: 'pending', sortOrder: 0,
  createdAt: null as unknown as undefined, updatedAt: null as unknown as undefined,
  ...overrides,
});

describe('ScheduleIntelligence — calculateReleaseReadiness', () => {
  it('returns 100% for complete release with all milestones done', () => {
    const release = mkRelease({});
    const milestones = [
      mkMilestone({ title: 'Master Approved', status: 'completed' }),
      mkMilestone({ title: 'Artwork Approved', status: 'completed' }),
      mkMilestone({ title: 'Marketing Starts', status: 'completed' }),
      mkMilestone({ title: 'Distribution Submitted', status: 'completed' }),
    ];
    const score = calculateReleaseReadiness(release, milestones);
    expect(score.overall).toBeGreaterThanOrEqual(80);
    expect(score.milestones.every((m) => m.percentage === 100)).toBe(true);
  });

  it('returns lower score for incomplete milestones', () => {
    const release = mkRelease({});
    const milestones = [
      mkMilestone({ title: 'Master Approved', status: 'pending' }),
      mkMilestone({ title: 'Artwork Approved', status: 'completed' }),
      mkMilestone({ title: 'Marketing Starts', status: 'pending' }),
      mkMilestone({ title: 'Distribution Submitted', status: 'pending' }),
    ];
    const score = calculateReleaseReadiness(release, milestones);
    expect(score.overall).toBeLessThan(80);
  });

  it('has baseline score from category defaults even with no data', () => {
    const release = mkRelease({ title: '', upc: undefined, label: undefined, genre: undefined, estimatedReleaseDate: undefined, copyright: undefined });
    const score = calculateReleaseReadiness(release, []);
    expect(score.overall).toBe(54);
    expect(score.missing).toContain('UPC');
    expect(score.missing).toContain('Label');
  });

  it('identifies missing fields', () => {
    const release = mkRelease({ upc: undefined, label: undefined });
    const score = calculateReleaseReadiness(release, []);
    expect(score.missing).toContain('UPC');
    expect(score.missing).toContain('Label');
  });

  it('identifies conflicts from overdue milestones', () => {
    const release = mkRelease({});
    const milestones = [mkMilestone({ title: 'Master', status: 'overdue' })];
    const score = calculateReleaseReadiness(release, milestones);
    expect(score.conflicts.length).toBeGreaterThan(0);
    expect(score.conflicts.some((c) => c.includes('overdue'))).toBe(true);
  });

  it('returns milestone progress array', () => {
    const release = mkRelease({});
    const milestones = [
      mkMilestone({ title: 'Step 1', status: 'completed' }),
      mkMilestone({ title: 'Step 2', status: 'overdue' }),
      mkMilestone({ title: 'Step 3', status: 'pending' }),
    ];
    const score = calculateReleaseReadiness(release, milestones);
    expect(score.milestones).toHaveLength(3);
    expect(score.milestones[0]!.percentage).toBe(100);
    expect(score.milestones[1]!.percentage).toBe(25);
    expect(score.milestones[2]!.percentage).toBe(0);
  });

  it('handles empty milestones array gracefully', () => {
    const release = mkRelease({});
    const score = calculateReleaseReadiness(release, []);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.milestones).toHaveLength(0);
  });
});

describe('ScheduleIntelligence — detectConflicts', () => {
  it('detects same-day releases', () => {
    const releases = [
      mkRelease({ id: 'r1', estimatedReleaseDate: new Date('2026-06-15') }),
      mkRelease({ id: 'r2', estimatedReleaseDate: new Date('2026-06-15') }),
      mkRelease({ id: 'r3', estimatedReleaseDate: new Date('2026-06-20') }),
    ];
    const conflicts = detectConflicts(releases);
    expect(conflicts.some((c) => c.type === 'same_day_release')).toBe(true);
  });

  it('does not flag different-day releases', () => {
    const releases = [
      mkRelease({ id: 'r1', estimatedReleaseDate: new Date('2026-06-15') }),
      mkRelease({ id: 'r2', estimatedReleaseDate: new Date('2026-06-20') }),
    ];
    const conflicts = detectConflicts(releases);
    expect(conflicts.filter((c) => c.type === 'same_day_release')).toHaveLength(0);
  });

  it('detects releases without dates', () => {
    const releases = [
      mkRelease({ id: 'r1', estimatedReleaseDate: undefined, targetReleaseDate: undefined }),
    ];
    const conflicts = detectConflicts(releases);
    expect(conflicts.some((c) => c.type === 'missing_date')).toBe(true);
  });

  it('assigns correct severity', () => {
    const releases = [
      mkRelease({ id: 'r1', estimatedReleaseDate: new Date('2026-06-15') }),
      mkRelease({ id: 'r2', estimatedReleaseDate: new Date('2026-06-15') }),
    ];
    const conflicts = detectConflicts(releases);
    expect(conflicts[0]!.severity).toBe('warning');
  });

  it('includes release IDs in conflict', () => {
    const releases = [
      mkRelease({ id: 'r1', estimatedReleaseDate: new Date('2026-06-15') }),
      mkRelease({ id: 'r2', estimatedReleaseDate: new Date('2026-06-15') }),
    ];
    const conflicts = detectConflicts(releases);
    expect(conflicts[0]!.releaseIds).toContain('r1');
    expect(conflicts[0]!.releaseIds).toContain('r2');
  });
});

describe('ScheduleIntelligence — getScheduleHealth', () => {
  it('returns zero counts for empty data', () => {
    const health = getScheduleHealth([], []);
    expect(health.totalReleases).toBe(0);
    expect(health.onTrack).toBe(0);
    expect(health.atRisk).toBe(0);
    expect(health.overdue).toBe(0);
    expect(health.completedThisMonth).toBe(0);
    expect(health.upcomingThisMonth).toBe(0);
  });

  it('counts overdue milestones', () => {
    const milestones = [mkMilestone({ title: 'Late', status: 'overdue' })];
    const health = getScheduleHealth([mkRelease({})], milestones);
    expect(health.overdue).toBe(1);
  });

  it('counts upcoming releases this month', () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);
    const releases = [mkRelease({ estimatedReleaseDate: thisMonth })];
    const health = getScheduleHealth(releases, []);
    expect(health.upcomingThisMonth).toBe(1);
  });

  it('does not count releases in other months', () => {
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15);
    const releases = [mkRelease({ estimatedReleaseDate: nextMonth })];
    const health = getScheduleHealth(releases, []);
    expect(health.upcomingThisMonth).toBe(0);
  });
});

describe('ScheduleIntelligence — calculateCapacity', () => {
  it('returns releases grouped by month', () => {
    const releases = [
      mkRelease({ estimatedReleaseDate: new Date('2026-06-15') }),
      mkRelease({ estimatedReleaseDate: new Date('2026-06-20') }),
      mkRelease({ estimatedReleaseDate: new Date('2026-07-01') }),
    ];
    const capacity = calculateCapacity('org1', releases, [], []);
    expect(capacity.releasesPerMonth.some((m) => m.month === '2026-06')).toBe(true);
    expect(capacity.releasesPerMonth.some((m) => m.month === '2026-07')).toBe(true);
    const june = capacity.releasesPerMonth.find((m) => m.month === '2026-06');
    expect(june?.count).toBe(2);
  });

  it('returns zero workload for no data', () => {
    const capacity = calculateCapacity('org1', [], [], []);
    expect(capacity.releasesPerMonth).toHaveLength(0);
    expect(capacity.workload).toBe(0);
    expect(capacity.assignmentLoad).toBe(0);
  });

  it('calculates workload from releases and overdue count', () => {
    const milestones = [mkMilestone({ title: 'Late', status: 'overdue' })];
    const releases = [mkRelease({})];
    const capacity = calculateCapacity('org1', releases, milestones, []);
    expect(capacity.workload).toBeGreaterThan(0);
  });

  it('calculates assignment load from hours', () => {
    const assignments = [
      { estimatedHours: 10 },
      { estimatedHours: 20 },
    ];
    const capacity = calculateCapacity('org1', [], [], assignments);
    expect(capacity.assignmentLoad).toBe(30);
  });
});
