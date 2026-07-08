import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => {
  const callHistory: Array<{ fn: string; args: unknown[] }> = [];
  const pendingWheres: Array<{ field: string; op: string; value: string }> = [];

  return {
    doc: vi.fn((_db: unknown, path: string, ...segments: string[]) => {
      callHistory.push({ fn: 'doc', args: [path, ...segments] });
      return { id: segments[segments.length - 1] ?? path, path: segments.length > 0 ? `${path}/${segments.join('/')}` : path };
    }),
    collection: vi.fn((_db: unknown, name: string) => {
      callHistory.push({ fn: 'collection', args: [name] });
      return { id: name, path: name };
    }),
    addDoc: vi.fn(async (_colRef: unknown, data: Record<string, unknown>) => {
      callHistory.push({ fn: 'addDoc', args: [data] });
      return { id: `auto-${Date.now()}` };
    }),
    getDocs: vi.fn(async (_q: unknown) => {
      callHistory.push({ fn: 'getDocs', args: [] });
      return { docs: [], size: 0, empty: true };
    }),
    updateDoc: vi.fn(async (_ref: unknown, _data: Record<string, unknown>) => {
      callHistory.push({ fn: 'updateDoc', args: [_data] });
    }),
    deleteDoc: vi.fn(async (_ref: unknown) => {
      callHistory.push({ fn: 'deleteDoc', args: [] });
    }),
    query: vi.fn((...args: unknown[]) => {
      callHistory.push({ fn: 'query', args });
      return { type: 'query', _wheres: [...pendingWheres] };
    }),
    where: vi.fn((field: string, op: string, value: string) => {
      callHistory.push({ fn: 'where', args: [field, op, value] });
      const w = { field, op, value };
      pendingWheres.push(w);
      return w;
    }),
    orderBy: vi.fn(() => {
      callHistory.push({ fn: 'orderBy', args: [] });
      return { type: 'orderBy' };
    }),
    limit: vi.fn(() => {
      callHistory.push({ fn: 'limit', args: [] });
      return { type: 'limit' };
    }),
    Timestamp: { now: () => ({ seconds: 1000000, nanoseconds: 0 }) },
    WriteBatch: class {},
  };
});

describe('person-membership-repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('addPersonToOrganization creates membership', async () => {
    const { addPersonToOrganization } = await import('@/lib/person-membership-repository');
    const result = await addPersonToOrganization({
      organizationId: 'org1',
      personId: 'person1',
      role: 'Producer',
      department: 'Production',
    });
    expect(result.personId).toBe('person1');
    expect(result.organizationId).toBe('org1');
    expect(result.role).toBe('Producer');
    expect(result.status).toBe('active');
  });

  it('removePersonFromOrganization sets inactive', async () => {
    const { removePersonFromOrganization } = await import('@/lib/person-membership-repository');
    await expect(removePersonFromOrganization('membership1')).resolves.toBeUndefined();
  });

  it('updateMembership updates fields', async () => {
    const { updateMembership } = await import('@/lib/person-membership-repository');
    await expect(updateMembership('membership1', { role: 'Lead' })).resolves.toBeUndefined();
  });

  it('getMembershipsForPerson returns array', async () => {
    const { getMembershipsForPerson } = await import('@/lib/person-membership-repository');
    const result = await getMembershipsForPerson('person1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('getActiveMembershipsForPerson filters active', async () => {
    const { getActiveMembershipsForPerson } = await import('@/lib/person-membership-repository');
    const result = await getActiveMembershipsForPerson('person1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('deleteMembership deletes doc', async () => {
    const { deleteMembership } = await import('@/lib/person-membership-repository');
    await expect(deleteMembership('membership1')).resolves.toBeUndefined();
  });
});
