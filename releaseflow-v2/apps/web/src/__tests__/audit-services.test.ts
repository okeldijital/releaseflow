import { describe, it, expect } from 'vitest';
import { auditSecurityRules } from '@/lib/security-audit';
import { auditActivityCoverage } from '@/lib/activity-audit';
import { auditPermissions } from '@/lib/permission-audit';
import { reviewPerformance } from '@/lib/performance-review';

describe('Security Audit', () => {
  it('covers all 28 collections', () => {
    const report = auditSecurityRules();
    expect(report.rules.length).toBe(28);
    expect(report.summary.total).toBe(28);
  });

  it('has at least 7 fully-defined rules', () => {
    const report = auditSecurityRules();
    expect(report.summary.defined).toBeGreaterThanOrEqual(7);
  });

  it('includes deployment recommendations', () => {
    const report = auditSecurityRules();
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});

describe('Activity Audit', () => {
  it('reports coverage percentage', () => {
    const report = auditActivityCoverage();
    expect(report.total).toBeGreaterThan(20);
    expect(report.coverage).toBeGreaterThan(50);
  });

  it('identifies gaps with recommendations', () => {
    const report = auditActivityCoverage();
    for (const g of report.gaps) {
      expect(g.recommendation).toBeTruthy();
      expect(g.severity).toMatch(/high|medium|low/);
    }
  });
});

describe('Permission Audit', () => {
  it('returns gaps for unscoped routes', () => {
    const result = auditPermissions();
    expect(result.gaps.length).toBeGreaterThan(0);
    for (const g of result.gaps) {
      expect(g.recommendation).toBeTruthy();
    }
  });
});

describe('Performance Review', () => {
  it('suggests composite indexes', () => {
    const report = reviewPerformance();
    expect(report.suggestedIndexes.length).toBeGreaterThan(10);
    for (const idx of report.suggestedIndexes) {
      expect(idx.fields.length).toBeGreaterThan(0);
    }
  });

  it('includes optimization recommendations', () => {
    const report = reviewPerformance();
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});
