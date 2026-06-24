import { describe, it, expect } from 'vitest';
import { auditPermissions } from '@/lib/permission-audit';
import { auditActivityCoverage } from '@/lib/activity-audit';
import { reviewPerformance } from '@/lib/performance-review';
import { auditSecurityRules } from '@/lib/security-audit';

describe('SecurityAudit — 29 collections fully defined', () => {
  it('all 29 collections are fully defined', () => {
    const report = auditSecurityRules();
    expect(report.summary.total).toBe(29);
    expect(report.summary.defined).toBe(29);
    expect(report.summary.partial).toBe(0);
    expect(report.summary.coverage).toBe(100);
  });

  it('no collection has status other than defined', () => {
    const report = auditSecurityRules();
    const nonDefined = report.rules.filter((r) => r.status !== 'defined');
    expect(nonDefined).toHaveLength(0);
  });

  it('includes deployment recommendations', () => {
    const report = auditSecurityRules();
    expect(report.recommendations).toContain('All 29 collections now have fully-defined rules — 0 partials');
  });
});

describe('PermissionAudit — route coverage', () => {
  it('reports 13 routes tracked', () => {
    const report = auditPermissions();
    expect(report.coverage).toBeGreaterThan(0);
  });

  it('each gap has a recommendation', () => {
    const report = auditPermissions();
    for (const g of report.gaps) {
      expect(g.recommendation).toBeTruthy();
      expect(g.severity).toMatch(/high|medium|low/);
    }
  });

  it('coverage is above 40%', () => {
    const report = auditPermissions();
    expect(report.coverage).toBeGreaterThanOrEqual(40);
  });
});

describe('ActivityAudit — coverage', () => {
  it('reports at least 25 actions tracked', () => {
    const report = auditActivityCoverage();
    expect(report.total).toBeGreaterThanOrEqual(25);
  });

  it('coverage is above 70%', () => {
    const report = auditActivityCoverage();
    expect(report.coverage).toBeGreaterThanOrEqual(70);
  });

  it('each gap has a recommendation with severity', () => {
    const report = auditActivityCoverage();
    for (const g of report.gaps) {
      expect(g.domain).toBeTruthy();
      expect(g.recommendation).toBeTruthy();
    }
  });
});

describe('PerformanceReview — index suggestions', () => {
  it('reports at least 15 suggested indexes', () => {
    const report = reviewPerformance();
    expect(report.suggestedIndexes.length).toBeGreaterThanOrEqual(15);
  });

  it('includes optimization recommendations', () => {
    const report = reviewPerformance();
    expect(report.recommendations.length).toBeGreaterThanOrEqual(5);
  });

  it('all suggested indexes have fields array', () => {
    const report = reviewPerformance();
    for (const idx of report.suggestedIndexes) {
      expect(idx.fields.length).toBeGreaterThan(0);
      expect(idx.collection).toBeTruthy();
    }
  });
});
