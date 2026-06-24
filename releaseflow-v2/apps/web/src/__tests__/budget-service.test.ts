import { describe, it, expect } from 'vitest';
import { computeBudgetHealth } from '@/lib/budget-service';

describe('computeBudgetHealth', () => {
  it('returns on_budget when actual is within 80% of planned', () => {
    expect(computeBudgetHealth(5000, 10000)).toBe('on_budget');
    expect(computeBudgetHealth(8000, 10000)).toBe('on_budget');
    expect(computeBudgetHealth(0, 10000)).toBe('on_budget');
  });

  it('returns at_risk when actual exceeds 80% of planned', () => {
    expect(computeBudgetHealth(8001, 10000)).toBe('at_risk');
    expect(computeBudgetHealth(9999, 10000)).toBe('at_risk');
    expect(computeBudgetHealth(10000, 10000)).toBe('at_risk');
  });

  it('returns over_budget when actual exceeds planned', () => {
    expect(computeBudgetHealth(10001, 10000)).toBe('over_budget');
    expect(computeBudgetHealth(20000, 10000)).toBe('over_budget');
  });

  it('handles zero planned budget', () => {
    expect(computeBudgetHealth(0, 0)).toBe('on_budget');
    expect(computeBudgetHealth(1, 0)).toBe('over_budget');
  });
});
