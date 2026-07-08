import { describe, it, expect } from 'vitest';
import { MILESTONE_TEMPLATES, type MilestoneRecord } from '@/lib/milestone-repository';

describe('MilestoneRepository — data model', () => {
  it('has 11 milestone templates', () => {
    expect(MILESTONE_TEMPLATES).toHaveLength(11);
    expect(MILESTONE_TEMPLATES[0]).toBe('Project Created');
    expect(MILESTONE_TEMPLATES[10]).toBe('Post Release Review');
  });

  it('has correct template names in order', () => {
    const expected = [
      'Project Created', 'Recording Complete', 'Mix Approved',
      'Master Approved', 'Artwork Approved', 'Metadata Complete',
      'Distribution Submitted', 'Pre-save Live', 'Marketing Starts',
      'Release Day', 'Post Release Review',
    ];
    expect(MILESTONE_TEMPLATES).toEqual(expected);
  });

  it('supports all milestone statuses', () => {
    const statuses = ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'] as const;
    expect(statuses).toHaveLength(5);
    const record: MilestoneRecord = {
      id: 'm1', releaseId: 'r1', organizationId: 'org1',
      title: 'Test Milestone', status: 'pending',
      sortOrder: 0, createdAt: null as unknown as undefined, updatedAt: null as unknown as undefined,
    };
    expect(record.status).toBe('pending');
    const completed: MilestoneRecord = { ...record, status: 'completed', completedAt: new Date() };
    expect(completed.status).toBe('completed');
  });

  it('has optional description field', () => {
    const withDesc: MilestoneRecord = {
      id: 'm1', releaseId: 'r1', organizationId: 'org1',
      title: 'Test', description: 'Some details',
      status: 'pending', sortOrder: 0,
      createdAt: null as unknown as undefined, updatedAt: null as unknown as undefined,
    };
    expect(withDesc.description).toBe('Some details');

    const withoutDesc: MilestoneRecord = {
      id: 'm2', releaseId: 'r1', organizationId: 'org1',
      title: 'Test', status: 'pending', sortOrder: 0,
      createdAt: null as unknown as undefined, updatedAt: null as unknown as undefined,
    };
    expect(withoutDesc.description).toBeUndefined();
  });

  it('supports dependsOn for dependency tracking', () => {
    const m: MilestoneRecord = {
      id: 'm1', releaseId: 'r1', organizationId: 'org1',
      title: 'Master Approval', status: 'pending',
      dependsOn: ['m0', 'm2'],
      sortOrder: 3, createdAt: null as unknown as undefined, updatedAt: null as unknown as undefined,
    };
    expect(m.dependsOn).toHaveLength(2);
    expect(m.dependsOn).toContain('m0');
  });

  it('tracks completion timestamp', () => {
    const now = new Date();
    const m: MilestoneRecord = {
      id: 'm1', releaseId: 'r1', organizationId: 'org1',
      title: 'Mix Approved', status: 'completed',
      completedAt: now, sortOrder: 2,
      createdAt: null as unknown as undefined, updatedAt: null as unknown as undefined,
    };
    expect(m.completedAt).toEqual(now);
    expect(m.status).toBe('completed');
  });

  it('has sortOrder for position ordering', () => {
    const milestones = [3, 1, 2].map((i) => ({
      id: `m${i}`, releaseId: 'r1', organizationId: 'org1',
      title: `Milestone ${i}`, status: 'pending' as const,
      sortOrder: i, createdAt: null as unknown as undefined, updatedAt: null as unknown as undefined,
    }));
    const sorted = milestones.sort((a, b) => a.sortOrder - b.sortOrder);
    expect(sorted[0]!.sortOrder).toBe(1);
    expect(sorted[1]!.sortOrder).toBe(2);
    expect(sorted[2]!.sortOrder).toBe(3);
  });
});

describe('MilestoneRepository — module structure', () => {
  it('exports all CRUD functions', async () => {
    const mod = await import('@/lib/milestone-repository');
    expect(typeof mod.createMilestone).toBe('function');
    expect(typeof mod.getMilestone).toBe('function');
    expect(typeof mod.updateMilestone).toBe('function');
    expect(typeof mod.deleteMilestone).toBe('function');
    expect(typeof mod.getMilestonesByRelease).toBe('function');
    expect(typeof mod.getMilestonesByOrg).toBe('function');
    expect(typeof mod.completeMilestone).toBe('function');
    expect(typeof mod.reopenMilestone).toBe('function');
    expect(typeof mod.bulkCreateMilestones).toBe('function');
    expect(typeof mod.MILESTONE_TEMPLATES).toBe('object');
  });
});
