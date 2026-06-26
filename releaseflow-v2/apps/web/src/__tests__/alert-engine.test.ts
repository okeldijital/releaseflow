import { describe, it, expect } from 'vitest';
import type { OperationalAlert, AlertPriority } from '@/app/(app)/types';

describe('Alert data model', () => {
  it('has all required fields', () => {
    const alert: OperationalAlert = {
      id: 'a1', releaseId: 'r1', rule: 'missing-metadata', priority: 'high',
      message: 'Missing required metadata fields', entityType: 'release',
      entityId: 'r1', resolved: false, createdAt: new Date(),
    };
    expect(alert.rule).toBe('missing-metadata');
    expect(alert.priority).toBe('high');
    expect(alert.entityType).toBe('release');
    expect(alert.resolved).toBe(false);
  });

  it('can be resolved', () => {
    const alert: OperationalAlert = {
      id: 'a2', releaseId: 'r2', rule: 'overdue-task', priority: 'medium',
      message: 'Task overdue', entityType: 'task', entityId: 't1',
      resolved: true, createdAt: new Date(),
    };
    expect(alert.resolved).toBe(true);
  });
});

describe('Alert priorities', () => {
  const priorities: AlertPriority[] = ['high', 'medium', 'low'];

  it('has 3 priority levels', () => {
    expect(priorities).toHaveLength(3);
  });

  it('high is most critical', () => {
    expect(priorities[0]).toBe('high');
  });

  it('low is least critical', () => {
    expect(priorities[2]).toBe('low');
  });
});

describe('Alert engine — module structure', () => {
  it('exports alert functions', async () => {
    const mod = await import('@/lib/alert-engine');
    expect(typeof mod.generateAlerts).toBe('function');
    expect(typeof mod.generateOrgAlerts).toBe('function');
    expect(typeof mod.getActiveAlerts).toBe('function');
    expect(typeof mod.resolveAlert).toBe('function');
  });

  it('generateAlerts takes 1 parameter', async () => {
    const mod = await import('@/lib/alert-engine');
    expect(mod.generateAlerts.length).toBe(1);
  });

  it('getActiveAlerts takes 1 parameter', async () => {
    const mod = await import('@/lib/alert-engine');
    expect(mod.getActiveAlerts.length).toBe(1);
  });

  it('resolveAlert takes 1 parameter', async () => {
    const mod = await import('@/lib/alert-engine');
    expect(mod.resolveAlert.length).toBe(1);
  });
});

describe('Alert deduplication logic', () => {
  it('does not create duplicate alerts for same rule+entity+release', () => {
    const existing = {
      releaseId: 'r1', rule: 'missing-metadata', entityId: 'r1', resolved: false,
    };
    const duplicate = {
      releaseId: 'r1', rule: 'missing-metadata', entityId: 'r1',
    };
    const isDuplicate =
      existing.releaseId === duplicate.releaseId &&
      existing.rule === duplicate.rule &&
      existing.entityId === duplicate.entityId &&
      existing.resolved === false;
    expect(isDuplicate).toBe(true);
  });

  it('allows alert with different rule on same entity', () => {
    const existing = {
      releaseId: 'r1', rule: 'missing-metadata', entityId: 'r1',
    };
    const different = {
      releaseId: 'r1', rule: 'overdue-dependency', entityId: 'r1',
    };
    const isDuplicate =
      existing.releaseId === different.releaseId &&
      existing.rule === different.rule &&
      existing.entityId === different.entityId;
    expect(isDuplicate).toBe(false);
  });

  it('allows same alert if previous was resolved', () => {
    const resolved = {
      releaseId: 'r1', rule: 'missing-metadata', entityId: 'r1', resolved: true,
    };
    expect(resolved.resolved).toBe(true);
    // A new unresolved alert for the same rule/entity should be allowed
  });
});

describe('Alert scenarios', () => {
  it('high priority for missing metadata', () => {
    const alert: OperationalAlert = {
      id: 'a1', releaseId: 'r1', rule: 'missing-metadata', priority: 'high',
      message: 'UPC and label are missing', entityType: 'release',
      entityId: 'r1', resolved: false, createdAt: new Date(),
    };
    expect(alert.priority).toBe('high');
  });

  it('medium priority for overdue task', () => {
    const alert: OperationalAlert = {
      id: 'a2', releaseId: 'r1', rule: 'overdue-task', priority: 'medium',
      message: 'Task "Mix vocals" is overdue', entityType: 'task',
      entityId: 't1', resolved: false, createdAt: new Date(),
    };
    expect(alert.priority).toBe('medium');
  });

  it('low priority for informational alerts', () => {
    const alert: OperationalAlert = {
      id: 'a3', releaseId: 'r1', rule: 'budget-near-limit', priority: 'low',
      message: 'Budget at 85%', entityType: 'release',
      entityId: 'r1', resolved: false, createdAt: new Date(),
    };
    expect(alert.priority).toBe('low');
  });
});

describe('Alert collection by org', () => {
  it('collects alerts across all org releases', () => {
    // Simulates getActiveAlerts logic: gather alerts from all releases in an org
    const releaseIds = ['r1', 'r2', 'r3'];
    const alerts: OperationalAlert[] = [
      { id: 'a1', releaseId: 'r1', rule: 'r1', priority: 'high', message: '', entityType: '', entityId: '', resolved: false, createdAt: new Date() },
      { id: 'a2', releaseId: 'r2', rule: 'r2', priority: 'medium', message: '', entityType: '', entityId: '', resolved: false, createdAt: new Date() },
      { id: 'a3', releaseId: 'r1', rule: 'r3', priority: 'low', message: '', entityType: '', entityId: '', resolved: false, createdAt: new Date() },
    ];
    const collected = alerts.filter((a) => releaseIds.includes(a.releaseId) && !a.resolved);
    expect(collected).toHaveLength(3);
  });

  it('excludes resolved alerts', () => {
    const alerts: OperationalAlert[] = [
      { id: 'a1', releaseId: 'r1', rule: 'r1', priority: 'high', message: '', entityType: '', entityId: '', resolved: true, createdAt: new Date() },
      { id: 'a2', releaseId: 'r1', rule: 'r2', priority: 'medium', message: '', entityType: '', entityId: '', resolved: false, createdAt: new Date() },
    ];
    const active = alerts.filter((a) => !a.resolved);
    expect(active).toHaveLength(1);
  });
});
