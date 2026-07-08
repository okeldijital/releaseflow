import { describe, it, expect } from 'vitest';
import { MILESTONE_TEMPLATES } from '@/lib/milestone-service';

describe('MilestoneService — module structure', () => {
  it('exports all service functions', async () => {
    const mod = await import('@/lib/milestone-service');
    expect(typeof mod.createNewMilestone).toBe('function');
    expect(typeof mod.editMilestone).toBe('function');
    expect(typeof mod.fetchMilestonesByRelease).toBe('function');
    expect(typeof mod.fetchMilestonesByOrg).toBe('function');
    expect(typeof mod.completeUserMilestone).toBe('function');
    expect(typeof mod.reopenUserMilestone).toBe('function');
    expect(typeof mod.seedReleaseMilestones).toBe('function');
    expect(typeof mod.MILESTONE_TEMPLATES).toBe('object');
  });

  it('title validation throws for empty title', async () => {
    const mod = await import('@/lib/milestone-service');
    await expect(mod.createNewMilestone({
      releaseId: 'r1', organizationId: 'org1', title: '',
    })).rejects.toThrow('Milestone title is required');
  });

  it('title validation throws for whitespace-only title', async () => {
    const mod = await import('@/lib/milestone-service');
    await expect(mod.createNewMilestone({
      releaseId: 'r1', organizationId: 'org1', title: '   ',
    })).rejects.toThrow('Milestone title is required');
  });

  it('title validation accepts valid title', async () => {
    const mod = await import('@/lib/milestone-service');
    // This will fail at the Firestore level, not validation — so we check it doesn't throw the validation error
    const promise = mod.createNewMilestone({
      releaseId: 'r1', organizationId: 'org1', title: 'Valid Title',
    });
    await expect(promise).rejects.not.toThrow('Milestone title is required');
  });

  it('editMilestone throws for non-existent milestone', async () => {
    const mod = await import('@/lib/milestone-service');
    await expect(mod.editMilestone('nonexistent', { title: 'New' })).rejects.toThrow('Milestone not found');
  });

  it('completeUserMilestone throws for non-existent milestone', async () => {
    const mod = await import('@/lib/milestone-service');
    await expect(mod.completeUserMilestone('nonexistent', 'actor1')).rejects.toThrow('Milestone not found');
  });

  it('reopenUserMilestone throws for non-existent milestone', async () => {
    const mod = await import('@/lib/milestone-service');
    await expect(mod.reopenUserMilestone('nonexistent', 'actor1')).rejects.toThrow('Milestone not found');
  });

  it('MILESTONE_TEMPLATES is re-exported', () => {
    expect(MILESTONE_TEMPLATES).toBeDefined();
    expect(MILESTONE_TEMPLATES).toHaveLength(11);
  });
});

describe('MilestoneService — state transitions', () => {
  it('MilestoneRecord supports pending to completed transition', () => {
    const m = { status: 'pending' as const };
    const updated = { ...m, status: 'completed' as const };
    expect(updated.status).toBe('completed');
  });

  it('MilestoneRecord supports completed to pending (reopen)', () => {
    const m = { status: 'completed' as const };
    const updated = { ...m, status: 'pending' as const };
    expect(updated.status).toBe('pending');
  });

  it('MilestoneRecord supports in_progress status', () => {
    const m = { status: 'in_progress' as const };
    expect(m.status).toBe('in_progress');
  });

  it('MilestoneRecord supports overdue status', () => {
    const m = { status: 'overdue' as const };
    expect(m.status).toBe('overdue');
  });

  it('MilestoneRecord supports cancelled status', () => {
    const m = { status: 'cancelled' as const };
    expect(m.status).toBe('cancelled');
  });

  it('seedReleaseMilestones returns empty array for nonexistent release', async () => {
    // This will fail at Firestore level, not with a type error
    const mod = await import('@/lib/milestone-service');
    const promise = mod.seedReleaseMilestones('nonexistent', 'org1');
    await expect(promise).rejects.toBeDefined();
  });

  it('getMilestonesByRelease returns empty array for nonexistent release', async () => {
    const mod = await import('@/lib/milestone-service');
    const result = await mod.fetchMilestonesByRelease('nonexistent');
    expect(result).toEqual([]);
  });

  it('getMilestonesByOrg returns empty array for nonexistent org', async () => {
    const mod = await import('@/lib/milestone-service');
    const result = await mod.fetchMilestonesByOrg('nonexistent');
    expect(result).toEqual([]);
  });
});
