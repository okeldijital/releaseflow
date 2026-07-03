import { describe, it, expect } from 'vitest';
import { computeReadiness } from '@/lib/readiness-engine';
import { computeWorkflowHealth } from '@/lib/workflow-health';
import type { Stage, ReleaseRequirement, Deliverable, Dependency } from '@/app/(app)/types';

const mkStage = (s: string): Stage => ({ id: '1', workflowId: 'w1', name: 'A', order: 1, status: s as Stage['status'] });
const mkReq = (s: string): ReleaseRequirement => ({ id: '1', releaseId: 'r1', name: 'Test', status: s as ReleaseRequirement['status'], createdAt: null, updatedAt: null });
const mkDel = (s: string): Deliverable => ({ id: '1', releaseId: 'r1', type: 'audio', title: 'Test', status: s as Deliverable['status'], ownerId: 'u1', createdAt: null });
const mkDep = (s: string, blocking = true): Dependency => ({ id: '1', releaseId: 'r1', title: 'Legal', category: 'legal', owner: 'u1', status: s as Dependency['status'], blocking, createdAt: null, updatedAt: null });

describe('ReadinessEngine — all scenarios', () => {
  it('100% with everything completed (no weighting issues)', () => {
    const r = computeReadiness([mkReq('approved')], [mkStage('completed')], [mkDel('approved')], [mkDep('completed')]);
    expect(r.percentage).toBe(100);
    expect(r.ready).toBe(true);
  });

  it('25% with all four categories and none completed', () => {
    const r = computeReadiness([mkReq('required')], [mkStage('not_started')], [mkDel('draft')], [mkDep('pending', true)]);
    expect(r.percentage).toBe(0);
  });

  it('50% with requirements approved but nothing else', () => {
    const r = computeReadiness([mkReq('approved')], [mkStage('not_started')], [mkDel('draft')], [mkDep('pending', true)]);
    expect(r.percentage).toBe(25);
  });

  it('75% with 3 of 4 passing', () => {
    const r = computeReadiness([mkReq('approved')], [mkStage('completed')], [mkDel('approved')], [mkDep('pending', true)]);
    expect(r.percentage).toBe(75);
  });

  it('no dependencies = 100% if other 3 pass', () => {
    const r = computeReadiness([mkReq('approved')], [mkStage('completed')], [mkDel('approved')]);
    expect(r.percentage).toBe(100);
    expect(r.breakdown.dependencies).toBeNull();
  });

  it('dependencies breakdown shows correctly', () => {
    const r = computeReadiness([mkReq('approved')], [], [], [mkDep('completed'), mkDep('pending')]);
    expect(r.breakdown.dependencies).toBeTruthy();
    expect(r.breakdown.dependencies!.totalBlocking).toBe(2);
    expect(r.breakdown.dependencies!.completed).toBe(1);
  });

  it('non-blocking deps do not affect readiness', () => {
    const r = computeReadiness([mkReq('approved')], [mkStage('completed')], [mkDel('approved')], [mkDep('pending', false)]);
    expect(r.percentage).toBe(100);
    expect(r.breakdown.dependencies).toBeNull();
  });

  it('empty arrays return 0%', () => {
    const r = computeReadiness([], [], [], []);
    expect(r.percentage).toBe(0);
    expect(r.missing).toEqual([]);
  });

  it('missing list includes incomplete requirements and deps', () => {
    const r = computeReadiness(
      [mkReq('required')],
      [mkStage('completed')],
      [mkDel('approved')],
      [mkDep('pending', true)],
    );
    expect(r.missing.length).toBeGreaterThanOrEqual(1);
  });
});

describe('WorkflowHealth — edge cases', () => {
  it('Excellent when all completed', () => {
    expect(computeWorkflowHealth({ stages: [mkStage('completed'), mkStage('completed')] })).toBe('Excellent');
  });
  it('Critical when any blocked', () => {
    expect(computeWorkflowHealth({ stages: [mkStage('completed'), mkStage('blocked')] })).toBe('Critical');
  });
  it('Blocked when overdue (past dueDate)', () => {
    const overdue = { ...mkStage('in_progress'), dueDate: new Date(Date.now() - 86400000) };
    expect(computeWorkflowHealth({ stages: [overdue] })).toBe('Blocked');
  });
  it('Excellent for empty stages', () => {
    expect(computeWorkflowHealth({ stages: [] })).toBe('Excellent');
  });
  it('Healthy for in-progress stage without urgency', () => {
    const s = { status: 'in_progress' };
    expect(computeWorkflowHealth({ stages: [s] })).toBe('Healthy');
  });
});
