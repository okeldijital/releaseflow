import { describe, it, expect } from 'vitest';
import { computeBudgetHealth } from '@/lib/budget-service';

describe('BudgetHealth — comprehensive', () => {
  it('on_budget at 0% spend', () => expect(computeBudgetHealth(0, 10000)).toBe('on_budget'));
  it('on_budget at 50% spend', () => expect(computeBudgetHealth(5000, 10000)).toBe('on_budget'));
  it('on_budget at exactly 80%', () => expect(computeBudgetHealth(8000, 10000)).toBe('on_budget'));
  it('at_risk at 81%', () => expect(computeBudgetHealth(8100, 10000)).toBe('at_risk'));
  it('at_risk at 99%', () => expect(computeBudgetHealth(9900, 10000)).toBe('at_risk'));
  it('at_risk at exactly 100%', () => expect(computeBudgetHealth(10000, 10000)).toBe('at_risk'));
  it('over_budget at 101%', () => expect(computeBudgetHealth(10100, 10000)).toBe('over_budget'));
  it('over_budget at 200%', () => expect(computeBudgetHealth(20000, 10000)).toBe('over_budget'));
  it('on_budget at 0/0 (zero budget)', () => expect(computeBudgetHealth(0, 0)).toBe('on_budget'));
  it('over_budget with zero planned but actual > 0', () => expect(computeBudgetHealth(1, 0)).toBe('over_budget'));
  it('at_risk at exactly 80.1%', () => expect(computeBudgetHealth(8001, 10000)).toBe('at_risk'));
  it('on_budget at 79.9%', () => expect(computeBudgetHealth(7999, 10000)).toBe('on_budget'));
});

describe('BudgetHealth — stress', () => {
  it('handles large numbers', () => {
    expect(computeBudgetHealth(800000, 1000000)).toBe('on_budget');
    expect(computeBudgetHealth(810000, 1000000)).toBe('at_risk');
  });
  it('handles small numbers', () => {
    expect(computeBudgetHealth(80, 100)).toBe('on_budget');
    expect(computeBudgetHealth(81, 100)).toBe('at_risk');
  });
  it('handles negative budget (over_budget)', () => {
    expect(computeBudgetHealth(-100, 500)).toBe('on_budget');
  });
});
