import { describe, it, expect } from 'vitest';
import { checkDependencyHealth, checkDependencyRules } from '@/lib/dependency-health';
import type { Dependency } from '@/app/(app)/types';

const mkDep = (overrides: Partial<Dependency>): Dependency => ({
  id: '1', releaseId: 'r1', title: 'Test', category: 'legal', owner: 'u1',
  status: 'pending', blocking: false, createdAt: null, updatedAt: null, ...overrides,
});

describe('DependencyHealth', () => {
  it('returns empty arrays for no dependencies', () => {
    const result = checkDependencyHealth([]);
    expect(result.total).toBe(0);
    expect(result.blocked).toEqual([]);
    expect(result.overdue).toEqual([]);
  });

  it('detects blocked dependencies', () => {
    const deps = [mkDep({ status: 'blocked', blocking: true })];
    const result = checkDependencyHealth(deps);
    expect(result.blocked).toHaveLength(1);
    expect(result.blockingIncomplete).toBe(1);
  });

  it('detects overdue dependencies', () => {
    const past = new Date(Date.now() - 86400000);
    const deps = [mkDep({ dueDate: past, status: 'pending' })];
    const result = checkDependencyHealth(deps);
    expect(result.overdue).toHaveLength(1);
  });

  it('detects at-risk dependencies', () => {
    const future = new Date(Date.now() + 3 * 86400000);
    const deps = [mkDep({ dueDate: future, status: 'pending' })];
    const result = checkDependencyHealth(deps);
    expect(result.atRisk).toHaveLength(1);
  });

  it('counts completed and total correctly', () => {
    const deps = [
      mkDep({ id: '1', status: 'completed' }),
      mkDep({ id: '2', status: 'pending' }),
      mkDep({ id: '3', status: 'completed' }),
    ];
    const result = checkDependencyHealth(deps);
    expect(result.total).toBe(3);
    expect(result.completed).toBe(2);
  });

  it('blocking count includes only blocking deps', () => {
    const deps = [
      mkDep({ id: '1', blocking: true }),
      mkDep({ id: '2', blocking: false }),
      mkDep({ id: '3', blocking: true, status: 'completed' }),
    ];
    const result = checkDependencyHealth(deps);
    expect(result.blockingCount).toBe(2);
    expect(result.blockingIncomplete).toBe(1);
  });
});

describe('DependencyRules', () => {
  it('generates high-priority rule for blocked dep', () => {
    const deps = [mkDep({ status: 'blocked' })];
    const rules = checkDependencyRules('r1', deps);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.priority).toBe('high');
    expect(rules[0]!.rule).toBe('dependency_blocked');
  });

  it('generates high-priority rule for overdue dep', () => {
    const deps = [mkDep({ dueDate: new Date(Date.now() - 1) })];
    const rules = checkDependencyRules('r1', deps);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.rule).toBe('dependency_overdue');
  });

  it('generates medium-priority for at-risk', () => {
    const deps = [mkDep({ dueDate: new Date(Date.now() + 86400000) })];
    const rules = checkDependencyRules('r1', deps);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.priority).toBe('medium');
  });

  it('returns empty for all completed', () => {
    const deps = [mkDep({ status: 'completed' })];
    expect(checkDependencyRules('r1', deps)).toHaveLength(0);
  });
});
