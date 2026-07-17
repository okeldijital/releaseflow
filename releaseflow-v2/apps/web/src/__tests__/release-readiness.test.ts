import { describe, it, expect } from 'vitest';
import {
  DEFAULT_READINESS_WEIGHTS,
  normalizeWeights,
  recommendationFromScore,
} from '@/lib/release-readiness-config';
import { computeReleaseReadiness } from '@/lib/release-readiness-service';
import type { AssignmentRecord } from '@/lib/assignment-repository';
import type { ReleaseRecord } from '@/lib/release-repository';

function release(partial: Partial<ReleaseRecord> = {}): ReleaseRecord {
  return {
    id: 'r1',
    title: 'Test Album',
    releaseType: 'album',
    status: 'in_production',
    organizationId: 'org1',
    createdBy: 'u1',
    artwork: null,
    genre: 'Pop',
    label: 'Label',
    upc: '123',
    targetReleaseDate: new Date(Date.now() + 10 * 86400000),
    createdAt: new Date(),
    ...partial,
  } as ReleaseRecord;
}

function assignment(partial: Partial<AssignmentRecord> & { id: string }): AssignmentRecord {
  return {
    organizationId: 'org1',
    title: partial.title ?? `A-${partial.id}`,
    entityType: 'release',
    entityId: 'r1',
    assigneeId: 'p1',
    assignerId: 'p2',
    role: 'mixer',
    priority: 'medium',
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as AssignmentRecord;
}

describe('CE-009 readiness weights', () => {
  it('defaults sum to 1', () => {
    const w = DEFAULT_READINESS_WEIGHTS;
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('normalizes custom weights', () => {
    const n = normalizeWeights({
      assignmentCompletion: 2,
      noOverdueWork: 2,
      noBlockers: 2,
      approvalsComplete: 2,
      metadataComplete: 1,
      artworkComplete: 1,
    });
    const sum = Object.values(n).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('recommendation uses thresholds and blockers', () => {
    expect(recommendationFromScore(90, false)).toBe('ready');
    expect(recommendationFromScore(70, false)).toBe('needs_attention');
    expect(recommendationFromScore(90, true)).toBe('not_ready');
    expect(recommendationFromScore(40, false)).toBe('not_ready');
  });
});

describe('CE-009 computeReleaseReadiness', () => {
  it('scores high when work complete with artwork and metadata', () => {
    const model = computeReleaseReadiness({
      release: release(),
      assignments: [
        assignment({ id: '1', status: 'completed' }),
        assignment({ id: '2', status: 'completed' }),
      ],
      milestones: [],
      activities: [],
      artwork: { secureUrl: 'https://example.com/a.jpg' } as never,
    });
    expect(model.readinessScore).toBeGreaterThanOrEqual(85);
    expect(model.recommendation).toBe('ready');
    expect(model.blockers.filter((b) => b.code === 'missing_artwork')).toHaveLength(0);
  });

  it('blocks on missing artwork and blocked assignments', () => {
    const model = computeReleaseReadiness({
      release: release({ upc: undefined, genre: undefined, label: undefined }),
      assignments: [
        assignment({ id: '1', status: 'blocked', title: 'Mix' }),
      ],
      milestones: [],
      activities: [],
      artwork: null,
    });
    expect(model.blockers.some((b) => b.code === 'assignment_blocked')).toBe(true);
    expect(model.blockers.some((b) => b.code === 'missing_artwork')).toBe(true);
    expect(model.recommendation).toBe('not_ready');
  });

  it('identifies critical path for required incomplete work', () => {
    const due = new Date(Date.now() + 2 * 86400000);
    const model = computeReleaseReadiness({
      release: release(),
      assignments: [
        assignment({
          id: '1',
          status: 'in_progress',
          priority: 'urgent',
          dueDate: due,
          title: 'Master',
        }),
      ],
      milestones: [],
      activities: [],
      artwork: { secureUrl: 'https://x.com/a.png' } as never,
    });
    expect(model.criticalPath.length).toBeGreaterThan(0);
    expect(model.criticalPath[0]?.assignmentId).toBe('1');
  });

  it('builds milestone progress and countdown', () => {
    const model = computeReleaseReadiness({
      release: release(),
      assignments: [assignment({ id: '1', status: 'completed' })],
      milestones: [],
      activities: [],
      artwork: { secureUrl: 'https://x.com/a.png' } as never,
    });
    expect(model.milestoneProgress.map((m) => m.key)).toEqual(
      expect.arrayContaining(['planning', 'production', 'artwork', 'metadata', 'reviews', 'delivery']),
    );
    expect(model.countdown.releaseDate).toBeTruthy();
    expect(model.countdown.days).not.toBeNull();
  });

  it('never stores score — pure compute', () => {
    const a = computeReleaseReadiness({
      release: release(),
      assignments: [],
      milestones: [],
      activities: [],
      artwork: null,
    });
    const b = computeReleaseReadiness({
      release: release(),
      assignments: [],
      milestones: [],
      activities: [],
      artwork: null,
    });
    expect(a.readinessScore).toBe(b.readinessScore);
  });
});

describe('CE-009 modules', () => {
  it('exports service surface', async () => {
    const mod = await import('@/lib/release-readiness-service');
    expect(typeof mod.computeReleaseReadiness).toBe('function');
    expect(typeof mod.getReleaseReadiness).toBe('function');
    expect(typeof mod.getOrgReadinessSummaries).toBe('function');
    expect(typeof mod.loadReleaseAssignments).toBe('function');
  });

  it('registers release notification events', async () => {
    const { getNotificationTypeDefinition } = await import('@/lib/notification-type-registry');
    expect(getNotificationTypeDefinition('release.ready')?.title).toBe('Release Ready');
    expect(getNotificationTypeDefinition('release.blocker_added')).toBeTruthy();
  });
});
