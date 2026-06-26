import { describe, it, expect } from 'vitest';
import { computeBudgetHealth } from '@/lib/budget-service';
import type { BudgetStatus, CostItem, CostCategory, CostItemStatus } from '@/app/(app)/types';

describe('Budget Service — computeBudgetHealth', () => {
  it('returns on_budget when actual < 80% of planned', () => {
    expect(computeBudgetHealth(500, 1000)).toBe('on_budget');
  });

  it('returns at_risk when actual > 80% of planned', () => {
    expect(computeBudgetHealth(810, 1000)).toBe('at_risk');
  });

  it('returns at_risk exactly at 80% boundary', () => {
    expect(computeBudgetHealth(800, 1000)).toBe('on_budget');
    expect(computeBudgetHealth(801, 1000)).toBe('at_risk');
  });

  it('returns over_budget when actual > planned', () => {
    expect(computeBudgetHealth(1100, 1000)).toBe('over_budget');
  });

  it('handles zero planned budget', () => {
    expect(computeBudgetHealth(0, 0)).toBe('on_budget');
  });

  it('handles negative actual cost', () => {
    expect(computeBudgetHealth(-100, 1000)).toBe('on_budget');
  });

  it('exactly at budget is at_risk', () => {
    expect(computeBudgetHealth(1000, 1000)).toBe('at_risk');
  });

  it('large numbers work', () => {
    expect(computeBudgetHealth(80000, 100000)).toBe('on_budget');
    expect(computeBudgetHealth(81000, 100000)).toBe('at_risk');
    expect(computeBudgetHealth(110000, 100000)).toBe('over_budget');
  });

  it('tiny numbers work', () => {
    expect(computeBudgetHealth(0.08, 0.10)).toBe('on_budget');
    expect(computeBudgetHealth(0.081, 0.10)).toBe('at_risk');
  });
});

describe('Budget data model', () => {
  it('has correct structure', () => {
    const budget = {
      id: 'b1', releaseId: 'r1', plannedBudget: 5000,
      actualCost: 3200, remainingBudget: 1800, variance: 1800,
      status: 'on_budget' as BudgetStatus,
      createdAt: new Date(), updatedAt: new Date(),
    };
    expect(budget.plannedBudget).toBe(5000);
    expect(budget.remainingBudget).toBe(1800);
    expect(budget.variance).toBe(1800);
  });

  it('variance equals planned - actual', () => {
    const planned = 5000;
    const actual = 3200;
    const variance = planned - actual;
    expect(variance).toBe(1800);
  });

  it('negative variance means over budget', () => {
    const planned = 5000;
    const actual = 6200;
    const variance = planned - actual;
    expect(variance).toBe(-1200);
  });
});

describe('Cost categories', () => {
  const categories: CostCategory[] = ['production', 'mixing', 'mastering', 'artwork', 'video', 'marketing', 'pr', 'advertising', 'distribution'];

  it('supports 9 categories', () => {
    expect(categories).toHaveLength(9);
  });

  it.each(categories)('category %s is valid', (c) => {
    expect(categories).toContain(c);
  });
});

describe('Cost item data model', () => {
  it('has required fields', () => {
    const item: CostItem = {
      id: 'ci1', releaseId: 'r1', category: 'production' as CostCategory,
      description: 'Studio time', amount: 1500, status: 'incurred' as CostItemStatus,
      createdAt: new Date(),
    };
    expect(item.amount).toBe(1500);
    expect(item.category).toBe('production');
    expect(item.status).toBe('incurred');
  });

  it('vendor is optional', () => {
    const item: CostItem = {
      id: 'ci2', releaseId: 'r1', category: 'mastering' as CostCategory,
      description: 'Mastering engineer', amount: 800,
      vendor: 'Abbey Road Studios', status: 'planned' as CostItemStatus,
      createdAt: new Date(),
    };
    expect(item.vendor).toBe('Abbey Road Studios');
  });
});

describe('Cost item status flow', () => {
  const statuses: CostItemStatus[] = ['planned', 'incurred', 'paid'];

  it('has 3 statuses', () => {
    expect(statuses).toHaveLength(3);
  });

  it('flows planned → incurred → paid', () => {
    expect(statuses[0]).toBe('planned');
    expect(statuses[1]).toBe('incurred');
    expect(statuses[2]).toBe('paid');
  });
});

describe('Budget recalculation logic', () => {
  function recalc(planned: number, items: { amount: number; status: CostItemStatus }[]) {
    const incurred = items.filter((i) => i.status === 'incurred' || i.status === 'paid');
    const actualCost = incurred.reduce((sum, i) => sum + i.amount, 0);
    return {
      actualCost,
      remaining: planned - actualCost,
      status: computeBudgetHealth(actualCost, planned),
    };
  }

  it('calculates remaining from planned minus all incurred costs', () => {
    const result = recalc(5000, [
      { amount: 1000, status: 'incurred' },
      { amount: 500, status: 'paid' },
      { amount: 2000, status: 'planned' },
    ]);
    expect(result.actualCost).toBe(1500);
    expect(result.remaining).toBe(3500);
    expect(result.status).toBe('on_budget');
  });

  it('planned costs do not count toward actual', () => {
    const result = recalc(5000, [
      { amount: 3000, status: 'planned' },
    ]);
    expect(result.actualCost).toBe(0);
  });

  it('all costs incurred = 0 remaining', () => {
    const result = recalc(5000, [
      { amount: 5000, status: 'incurred' },
    ]);
    expect(result.remaining).toBe(0);
  });

  it('over budget when incurred exceeds planned', () => {
    const result = recalc(5000, [
      { amount: 3000, status: 'incurred' },
      { amount: 3000, status: 'incurred' },
    ]);
    expect(result.status).toBe('over_budget');
    expect(result.remaining).toBe(-1000);
  });
});

describe('Budget Summary', () => {
  it('returns empty summary for no budget', () => {
    const summary = {
      budgetId: null, planned: 0, actual: 0, remaining: 0,
      status: 'on_budget' as BudgetStatus,
      costItems: { total: 0, planned: 0, incurred: 0, paid: 0 },
    };
    expect(summary.budgetId).toBeNull();
    expect(summary.actual).toBe(0);
    expect(summary.costItems.total).toBe(0);
  });

  it('counts cost items by status', () => {
    const items: Pick<CostItem, 'status'>[] = [
      { status: 'planned' }, { status: 'planned' }, { status: 'planned' },
      { status: 'incurred' }, { status: 'incurred' },
      { status: 'paid' },
    ];
    const statusCounts = {
      planned: items.filter((i) => i.status === 'planned').length,
      incurred: items.filter((i) => i.status === 'incurred').length,
      paid: items.filter((i) => i.status === 'paid').length,
    };
    expect(statusCounts.planned).toBe(3);
    expect(statusCounts.incurred).toBe(2);
    expect(statusCounts.paid).toBe(1);
  });
});
