import { describe, it, expect } from 'vitest';
import { computeProgress } from '@/lib/workflow-progress';
import { checkDependencyHealth } from '@/lib/dependency-health';
import type { Stage, Dependency } from '@/app/(app)/types';

describe('WorkflowProgress', () => {
  const mk = (status: string): Stage => ({ id: '1', workflowId: 'w1', name: 'A', order: 1, status: status as Stage['status'] });

  it('returns 0/0 for empty array', () => {
    const r = computeProgress([]);
    expect(r.completed).toBe(0);
    expect(r.total).toBe(0);
    expect(r.progress).toBe(0);
  });

  it('returns 100% for all completed', () => {
    const r = computeProgress([mk('completed'), mk('completed'), mk('completed')]);
    expect(r.completed).toBe(3);
    expect(r.total).toBe(3);
    expect(r.progress).toBe(100);
  });

  it('returns 50% for half completed', () => {
    const r = computeProgress([mk('completed'), mk('in_progress')]);
    expect(r.progress).toBe(50);
  });

  it('returns 33% for one of three', () => {
    const r = computeProgress([mk('completed'), mk('not_started'), mk('in_progress')]);
    expect(r.progress).toBe(33);
  });

  it('ignores blocked stages in count', () => {
    const r = computeProgress([mk('completed'), mk('blocked'), mk('not_started')]);
    expect(r.completed).toBe(1);
    expect(r.total).toBe(3);
    expect(r.progress).toBe(33);
  });

  it('returns 0 for all not_started', () => {
    const r = computeProgress([mk('not_started'), mk('not_started')]);
    expect(r.progress).toBe(0);
  });
});

describe('DependencyHealth edge cases', () => {
  it('handles null dueDate gracefully', () => {
    const deps: Dependency[] = [{ id: '1', releaseId: 'r1', title: 'T', category: 'legal', owner: 'u1', status: 'pending', blocking: false, createdAt: null, updatedAt: null }];
    const r = checkDependencyHealth(deps);
    expect(r.overdue).toHaveLength(0);
    expect(r.atRisk).toHaveLength(0);
  });

  it('all completed means no risks', () => {
    const deps: Dependency[] = [
      { id: '1', releaseId: 'r1', title: 'A', category: 'legal', owner: 'u1', status: 'completed', blocking: true, createdAt: null, updatedAt: null },
      { id: '2', releaseId: 'r1', title: 'B', category: 'licensing', owner: 'u1', status: 'completed', blocking: true, createdAt: null, updatedAt: null },
    ];
    const r = checkDependencyHealth(deps);
    expect(r.blocked).toHaveLength(0);
    expect(r.overdue).toHaveLength(0);
    expect(r.blockingIncomplete).toBe(0);
  });
});
