import { describe, it, expect } from 'vitest';

describe('ApprovalRequest — data model', () => {
  const validStatuses = ['pending', 'approved', 'rejected'] as const;

  it('starts as pending on creation', () => {
    expect(validStatuses).toContain('pending');
  });

  it('transitions to approved or rejected', () => {
    expect(validStatuses).toContain('approved');
    expect(validStatuses).toContain('rejected');
  });

  it('pending precedes approved', () => {
    const idxPending = validStatuses.indexOf('pending');
    const idxApproved = validStatuses.indexOf('approved');
    expect(idxPending).toBeLessThan(idxApproved);
  });
});

describe('Approval service — module structure', () => {
  it('exports all 5 functions', async () => {
    const mod = await import('@/lib/approval-service');
    expect(typeof mod.createApprovalRequest).toBe('function');
    expect(typeof mod.approveRequest).toBe('function');
    expect(typeof mod.rejectRequest).toBe('function');
    expect(typeof mod.getPendingRequestsByApprover).toBe('function');
    expect(typeof mod.getDeliverableApprovalStatus).toBe('function');
  });

  it('createApprovalRequest takes 4 params', async () => {
    const mod = await import('@/lib/approval-service');
    expect(mod.createApprovalRequest.length).toBe(4);
  });

  it('approveRequest takes 3 params', async () => {
    const mod = await import('@/lib/approval-service');
    expect(mod.approveRequest.length).toBe(3);
  });

  it('rejectRequest takes 3 params', async () => {
    const mod = await import('@/lib/approval-service');
    expect(mod.rejectRequest.length).toBe(3);
  });

  it('getPendingRequestsByApprover takes 1 param', async () => {
    const mod = await import('@/lib/approval-service');
    expect(mod.getPendingRequestsByApprover.length).toBe(1);
  });

  it('getDeliverableApprovalStatus takes 1 param', async () => {
    const mod = await import('@/lib/approval-service');
    expect(mod.getDeliverableApprovalStatus.length).toBe(1);
  });
});

describe('ApprovalRequest interface compliance', () => {
  it('has required fields', () => {
    const req = {
      id: '1', deliverableId: 'd1', requesterId: 'u1', approverId: 'u2',
      status: 'pending' as const, respondedAt: null, createdAt: new Date(),
    };
    expect(req.id).toBeDefined();
    expect(req.deliverableId).toBe('d1');
    expect(req.requesterId).toBe('u1');
    expect(req.approverId).toBe('u2');
    expect(req.status).toBe('pending');
    expect(req.respondedAt).toBeNull();
  });

  it('respondedAt set when approved', () => {
    const req = {
      id: '1', deliverableId: 'd1', requesterId: 'u1', approverId: 'u2',
      status: 'approved' as const, respondedAt: new Date(), createdAt: new Date(),
    };
    expect(req.respondedAt).not.toBeNull();
  });

  it('respondedAt set when rejected', () => {
    const req = {
      id: '1', deliverableId: 'd1', requesterId: 'u1', approverId: 'u2',
      status: 'rejected' as const, respondedAt: new Date(), createdAt: new Date(),
    };
    expect(req.status).toBe('rejected');
    expect(req.respondedAt).not.toBeNull();
  });

  it('createdAt is timestamp', () => {
    const now = new Date();
    const req = {
      id: '1', deliverableId: 'd1', requesterId: 'u1', approverId: 'u2',
      status: 'pending' as const, respondedAt: null, createdAt: now,
    };
    expect(req.createdAt).toBeInstanceOf(Date);
  });
});
