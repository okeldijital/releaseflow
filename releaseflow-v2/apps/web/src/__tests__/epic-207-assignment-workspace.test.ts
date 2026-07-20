/**
 * EPIC-207 — Assignment Workspace 2.0 regression suite
 *
 * Pipeline: filtered catalogue → workspace builder → AssignmentCard slots
 */
import { describe, it, expect } from 'vitest';
import {
  computeWorkScore,
  WORK_SCORE_WEIGHTS,
  resolveUrgency,
} from '@/lib/assignment-work-score';
import {
  buildAssignmentWorkspace,
  selectNeedsAttention,
  selectDueToday,
  selectAwaitingReview,
  checkAssignmentWorkspaceIntegrity,
  assertAssignmentWorkspaceIntegrity,
  countCanonicalAssignmentCards,
  formatAssignmentIntegrityError,
} from '@/lib/assignment-workspace';
import type { AssignmentWorkspaceRecord } from '@/lib/assignment-workspace-service';
import type { AssignmentRecord } from '@/lib/assignment-repository';

function makeAssignment(
  overrides: Partial<AssignmentRecord> & { id: string; title: string },
): AssignmentRecord {
  return {
    organizationId: 'org-1',
    description: null,
    entityType: 'release',
    entityId: 'rel-1',
    releaseId: 'rel-1',
    assigneeId: 'person-1',
    assignerId: 'person-2',
    role: 'mixer',
    priority: 'medium',
    status: 'in_progress',
    createdAt: { seconds: 1_700_000_000 },
    updatedAt: { seconds: 1_700_000_100 },
    ...overrides,
  };
}

function makeRecord(
  overrides: Partial<AssignmentWorkspaceRecord> & {
    assignment: AssignmentRecord;
  },
): AssignmentWorkspaceRecord {
  const baseFlags = {
    isBlocked: overrides.assignment.status === 'blocked',
    isDueToday: false,
    isOverdue: false,
    requiresReview: overrides.assignment.status === 'review',
    isAssignedToMe: true,
    updatedToday: false,
    isHighPriority:
      overrides.assignment.priority === 'high'
      || overrides.assignment.priority === 'urgent',
  };
  const flags = {
    isBlocked: overrides.isBlocked ?? baseFlags.isBlocked,
    isDueToday: overrides.isDueToday ?? baseFlags.isDueToday,
    isOverdue: overrides.isOverdue ?? baseFlags.isOverdue,
    requiresReview: overrides.requiresReview ?? baseFlags.requiresReview,
    isAssignedToMe: overrides.isAssignedToMe ?? baseFlags.isAssignedToMe,
    updatedToday: overrides.updatedToday ?? baseFlags.updatedToday,
    isHighPriority: overrides.isHighPriority ?? baseFlags.isHighPriority,
  };
  const workScore = overrides.workScore ?? computeWorkScore(flags);
  return {
    release: {
      id: 'rel-1',
      title: 'Lefa EP',
      lifecycle: 'active',
      status: 'planning',
      removed: false,
    },
    artwork: null,
    trackTitle: null,
    artistName: null,
    ownerName: 'Alex',
    urgency: resolveUrgency(workScore, flags),
    ...flags,
    workScore,
    ...overrides,
    assignment: overrides.assignment,
  };
}

describe('BUILD-004 Work Score', () => {
  it('sums weights deterministically', () => {
    expect(
      computeWorkScore({
        isOverdue: true,
        isBlocked: true,
        isDueToday: false,
        isHighPriority: true,
        requiresReview: false,
        isAssignedToMe: true,
        updatedToday: true,
      }),
    ).toBe(
      WORK_SCORE_WEIGHTS.overdue
        + WORK_SCORE_WEIGHTS.blocked
        + WORK_SCORE_WEIGHTS.highPriority
        + WORK_SCORE_WEIGHTS.assignedToMe
        + WORK_SCORE_WEIGHTS.updatedToday,
    );
  });
});

describe('EPIC-207 Tests 1–10', () => {
  it('Test 1: One Assignment → One canonical AssignmentCard slot', () => {
    const catalogue = [
      makeRecord({ assignment: makeAssignment({ id: 'a1', title: 'Mix Track 1' }) }),
    ];
    const ws = buildAssignmentWorkspace({ catalogue });
    expect(countCanonicalAssignmentCards(ws.sections)).toBe(1);
    expect(checkAssignmentWorkspaceIntegrity(catalogue, ws.sections).ok).toBe(true);
  });

  it('Test 2: Twenty Assignments → Twenty canonical cards', () => {
    const catalogue = Array.from({ length: 20 }, (_, i) =>
      makeRecord({
        assignment: makeAssignment({ id: `a${i + 1}`, title: `Task ${i + 1}` }),
      }),
    );
    const ws = buildAssignmentWorkspace({ catalogue });
    expect(countCanonicalAssignmentCards(ws.sections)).toBe(20);
    expect(ws.sections.find((s) => s.id === 'all')?.items).toHaveLength(20);
  });

  it('Test 3: Mixed statuses land in correct sections', () => {
    const blocked = makeRecord({
      assignment: makeAssignment({ id: 'b1', title: 'Blocked', status: 'blocked' }),
      isBlocked: true,
      workScore: 80,
    });
    const review = makeRecord({
      assignment: makeAssignment({ id: 'r1', title: 'Review me', status: 'review' }),
      requiresReview: true,
      workScore: 30,
    });
    const overdue = makeRecord({
      assignment: makeAssignment({ id: 'o1', title: 'Overdue', status: 'in_progress' }),
      isOverdue: true,
      workScore: 100,
    });
    const done = makeRecord({
      assignment: makeAssignment({ id: 'c1', title: 'Done', status: 'completed' }),
      workScore: 0,
    });
    const catalogue = [blocked, review, overdue, done];
    const ws = buildAssignmentWorkspace({ catalogue });

    const needs = selectNeedsAttention(catalogue).map((r) => r.assignment.id);
    expect(needs).toContain('b1');
    expect(needs).toContain('o1');
    expect(needs).toContain('r1');

    const awaiting = selectAwaitingReview(catalogue).map((r) => r.assignment.id);
    expect(awaiting).toEqual(['r1']);

    expect(ws.sections.find((s) => s.id === 'all')?.items).toHaveLength(4);
  });

  it('Test 4: Needs Attention sorted by Work Score DESC', () => {
    const catalogue = [
      makeRecord({
        assignment: makeAssignment({ id: 'low', title: 'Low score', status: 'review' }),
        requiresReview: true,
        workScore: 30,
      }),
      makeRecord({
        assignment: makeAssignment({ id: 'high', title: 'High score', status: 'blocked' }),
        isBlocked: true,
        isOverdue: true,
        workScore: 180,
      }),
      makeRecord({
        assignment: makeAssignment({ id: 'mid', title: 'Mid', priority: 'high' }),
        isHighPriority: true,
        workScore: 40,
      }),
    ];
    const ordered = selectNeedsAttention(catalogue).map((r) => r.assignment.id);
    expect(ordered[0]).toBe('high');
    expect(ordered.indexOf('high')).toBeLessThan(ordered.indexOf('mid'));
    expect(ordered.indexOf('mid')).toBeLessThan(ordered.indexOf('low'));
  });

  it('Test 5: Search filter leaves only matching catalogue (integrity holds)', () => {
    const all = [
      makeRecord({ assignment: makeAssignment({ id: 'a1', title: 'Mix vocals' }) }),
      makeRecord({ assignment: makeAssignment({ id: 'a2', title: 'Master album' }) }),
      makeRecord({ assignment: makeAssignment({ id: 'a3', title: 'Artwork brief' }) }),
    ];
    const filtered = all.filter((r) => r.assignment.title.toLowerCase().includes('mix'));
    const ws = buildAssignmentWorkspace({ catalogue: filtered });
    expect(countCanonicalAssignmentCards(ws.sections)).toBe(1);
    expect(ws.sections.find((s) => s.id === 'all')?.items[0]?.assignment.id).toBe('a1');
  });

  it('Test 6: Filters produce correct section counts', () => {
    const catalogue = [
      makeRecord({
        assignment: makeAssignment({ id: 'd1', title: 'Due', status: 'in_progress' }),
        isDueToday: true,
        workScore: 60,
      }),
      makeRecord({
        assignment: makeAssignment({ id: 'd2', title: 'Also due', status: 'assigned' }),
        isDueToday: true,
        workScore: 60,
      }),
      makeRecord({
        assignment: makeAssignment({ id: 'x1', title: 'Later', status: 'assigned' }),
        workScore: 0,
      }),
    ];
    expect(selectDueToday(catalogue)).toHaveLength(2);
    const ws = buildAssignmentWorkspace({ catalogue });
    expect(ws.sections.find((s) => s.id === 'due_today')?.items).toHaveLength(2);
    expect(ws.sections.find((s) => s.id === 'all')?.items).toHaveLength(3);
  });

  it('Test 7: Integrity — 15 in → 15 out; fails on silent drop', () => {
    const catalogue = Array.from({ length: 15 }, (_, i) =>
      makeRecord({
        assignment: makeAssignment({ id: `a${i + 1}`, title: `T${i + 1}` }),
      }),
    );
    const good = buildAssignmentWorkspace({ catalogue });
    expect(checkAssignmentWorkspaceIntegrity(catalogue, good.sections).ok).toBe(true);

    const broken = [
      {
        id: 'all' as const,
        title: 'All Assignments',
        items: catalogue.slice(0, 14),
        role: 'canonical' as const,
        rendersCards: true as const,
      },
    ];
    const bad = checkAssignmentWorkspaceIntegrity(catalogue, broken);
    expect(bad.ok).toBe(false);
    expect(bad.incoming).toBe(15);
    expect(bad.outgoing).toBe(14);
    expect(() => assertAssignmentWorkspaceIntegrity(catalogue, broken)).toThrow(
      /Assignment Workspace Integrity Error/,
    );
    expect(formatAssignmentIntegrityError(bad)).toContain('Incoming Assignments: 15');
  });

  it('Test 8: Dashboard My Work uses same builder projections', () => {
    const mine = [
      makeRecord({
        assignment: makeAssignment({ id: 'm1', title: 'Mine blocked', status: 'blocked' }),
        isBlocked: true,
        isAssignedToMe: true,
        workScore: 80,
      }),
      makeRecord({
        assignment: makeAssignment({ id: 'm2', title: 'Mine open', status: 'assigned' }),
        isAssignedToMe: true,
        workScore: 20,
      }),
    ];
    const ws = buildAssignmentWorkspace({ catalogue: mine });
    const needs = ws.sections.find((s) => s.id === 'needs_attention');
    expect(needs?.items.some((r) => r.assignment.id === 'm1')).toBe(true);
    expect(countCanonicalAssignmentCards(ws.sections)).toBe(2);
  });

  it('Test 9: Deleted release still renders with placeholder context', () => {
    const rec = makeRecord({
      assignment: makeAssignment({ id: 'orphan', title: 'Orphan work' }),
      release: {
        id: 'gone',
        title: 'Release Removed',
        lifecycle: 'unknown',
        status: 'unknown',
        removed: true,
      },
    });
    const ws = buildAssignmentWorkspace({ catalogue: [rec] });
    const item = ws.sections.find((s) => s.id === 'all')?.items[0];
    expect(item?.release?.removed).toBe(true);
    expect(item?.release?.title).toBe('Release Removed');
    expect(countCanonicalAssignmentCards(ws.sections)).toBe(1);
  });

  it('Test 10: AssignmentCard source never returns null; modes declared', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../components/assignments/cards/AssignmentCard.tsx'),
      'utf8',
    );
    expect(src.match(/return\s+null\s*;/g) ?? []).toHaveLength(0);
    for (const mode of ['workspace', 'compact', 'table', 'detailed', 'search']) {
      expect(src).toContain(`'${mode}'`);
    }
    expect(src).toContain('data-assignment-card');
  });
});

describe('EPIC-207 source contracts', () => {
  it('getAssignments composable API exists', async () => {
    const mod = await import('@/lib/assignment-repository');
    expect(typeof mod.getAssignments).toBe('function');
  });

  it('assignments page uses workspace builder + AssignmentCard', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../app/(app)/assignments/page.tsx'),
      'utf8',
    );
    expect(src).toContain('buildAssignmentWorkspace');
    expect(src).toContain('loadAssignmentWorkspaceRecords');
    expect(src).toContain('AssignmentCard');
    expect(src).toContain('Needs Attention');
    expect(src).toContain('All Assignments');
  });

  it('ADR-0009 documents the contract', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const adr = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../../docs/ARCHITECTURE-DECISION-RECORDS/ADR-0009-canonical-assignment-rendering.md',
      ),
      'utf8',
    );
    expect(adr).toContain('AssignmentCard');
    expect(adr).toContain('Work Score');
    expect(adr).toContain('Integrity');
  });
});
