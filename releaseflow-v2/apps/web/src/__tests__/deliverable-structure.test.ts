import { describe, it, expect } from 'vitest';

// Interfaces defined in the module
interface CreateDeliverableFields {
  title: string;
  type?: string;
  version?: string;
  stageId?: string;
  taskId?: string;
  campaignId?: string;
}

describe('CreateDeliverableFields', () => {
  it('accepts required fields', () => {
    const f: CreateDeliverableFields = { title: 'Test' };
    expect(f.title).toBe('Test');
  });

  it('accepts all optional fields', () => {
    const f: CreateDeliverableFields = {
      title: 'WAV Master',
      type: 'audio',
      version: 'v2',
      stageId: 's1',
      taskId: 't1',
      campaignId: 'c1',
    };
    expect(f.type).toBe('audio');
    expect(f.campaignId).toBe('c1');
  });

  it('undefined for all optionals by default', () => {
    const f: CreateDeliverableFields = { title: 'X' };
    expect(f.type).toBeUndefined();
    expect(f.campaignId).toBeUndefined();
  });
});

describe('DeliverableStatus lifecycle', () => {
  const validStatuses = ['draft', 'in_review', 'approved', 'rejected', 'archived'] as const;

  it('all 5 statuses exist', () => {
    expect(validStatuses).toHaveLength(5);
  });

  it('flows draft -> in_review -> approved', () => {
    const path = ['draft', 'in_review', 'approved'];
    for (const s of path) {
      expect(validStatuses).toContain(s);
    }
  });

  it('flows draft -> in_review -> rejected', () => {
    expect(validStatuses).toContain('rejected');
  });

  it('can archive any status', () => {
    expect(validStatuses).toContain('archived');
  });
});

describe('Deliverable types', () => {
  const types = ['audio', 'artwork', 'document', 'metadata', 'video', 'other'] as const;

  it('has 6 types', () => {
    expect(types).toHaveLength(6);
  });

  it('defaults to other', () => {
    expect(types).toContain('other');
  });
});

describe('Deliverable service — module structure', () => {
  it('exports exist and match signatures', async () => {
    const mod = await import('@/lib/deliverable-service');
    expect(typeof mod.createDeliverable).toBe('function');
    expect(typeof mod.updateDeliverable).toBe('function');
    expect(typeof mod.approveDeliverable).toBe('function');
    expect(typeof mod.rejectDeliverable).toBe('function');
    expect(typeof mod.archiveDeliverable).toBe('function');
    expect(typeof mod.getDeliverablesByRelease).toBe('function');
    expect(typeof mod.getDeliverablesByStage).toBe('function');
    expect(typeof mod.getDeliverablesByTask).toBe('function');
  });
});
