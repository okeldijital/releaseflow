import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WorkRecord, CreateWorkFields } from '@/lib/work-repository';

vi.mock('@/lib/work-repository', () => {
  const mockWork: Record<string, unknown> = {
    id: 'w1', organizationId: 'org1', title: 'Test Work', status: 'active',
    registrationStatus: 'unregistered', iswc: null, pro: null,
  };
  return {
    createWork: vi.fn(() => Promise.resolve({ ...mockWork })),
    getWork: vi.fn(() => Promise.resolve(null)),
    updateWork: vi.fn(() => Promise.resolve()),
    listWorks: vi.fn(() => Promise.resolve([])),
    searchWorks: vi.fn(() => Promise.resolve([])),
    archiveWork: vi.fn(() => Promise.resolve()),
    restoreWork: vi.fn(() => Promise.resolve()),
    findDuplicateWorks: vi.fn(() => Promise.resolve([])),
    addWriter: vi.fn(() => Promise.resolve('s1')),
    updateWriter: vi.fn(() => Promise.resolve()),
    removeWriter: vi.fn(() => Promise.resolve()),
    getWriters: vi.fn(() => Promise.resolve([])),
    validateSplits: vi.fn(() => Promise.resolve({ total: 0, valid: false, message: 'No writers' })),
    addPublisher: vi.fn(() => Promise.resolve('p1')),
    updatePublisher: vi.fn(() => Promise.resolve()),
    removePublisher: vi.fn(() => Promise.resolve()),
    getPublishers: vi.fn(() => Promise.resolve([])),
    linkTrack: vi.fn(() => Promise.resolve('t1')),
    unlinkTrack: vi.fn(() => Promise.resolve()),
    getLinkedTracks: vi.fn(() => Promise.resolve([])),
  };
});

describe('WorkService', () => {
  let service: typeof import('@/lib/work-service');
  let repo: typeof import('@/lib/work-repository');

  beforeEach(async () => {
    vi.clearAllMocks();
    service = await import('@/lib/work-service');
    repo = await import('@/lib/work-repository');
  });

  it('createNewWork rejects empty title', async () => {
    await expect(service.createNewWork({ organizationId: 'org1', title: '' })).rejects.toThrow('Work title is required');
  });

  it('createNewWork rejects missing organizationId', async () => {
    await expect(service.createNewWork({ title: 'Test' } as unknown as CreateWorkFields)).rejects.toThrow('Organization ID is required');
  });

  it('createNewWork delegates to repo on valid input', async () => {
    const result = await service.createNewWork({ organizationId: 'org1', title: 'Valid Work' });
    expect(repo.createWork).toHaveBeenCalledOnce();
    expect(result.title).toBe('Test Work');
  });

  it('fetchWork delegates to getWork', async () => {
    await service.fetchWork('w1');
    expect(repo.getWork).toHaveBeenCalledWith('w1');
  });

  it('fetchWorks delegates to listWorks', async () => {
    await service.fetchWorks('org1');
    expect(repo.listWorks).toHaveBeenCalledWith('org1');
  });

  it('archiveWork throws when work not found', async () => {
    await expect(service.archiveWork('w1')).rejects.toThrow('Work not found');
  });

  it('archiveWork succeeds when work is active', async () => {
    vi.mocked(repo.getWork).mockResolvedValueOnce({
      id: 'w1', organizationId: 'org1', title: 'T', registrationStatus: 'unregistered', status: 'active',
    } as WorkRecord);
    await service.archiveWork('w1');
    expect(repo.archiveWork).toHaveBeenCalledWith('w1');
  });

  it('checkWorkReadiness returns not-ready for missing work', async () => {
    const result = await service.checkWorkReadiness('w1');
    expect(result.ready).toBe(false);
    expect(result.missing).toContain('Work not found');
  });

  it('checkWorkReadiness returns readiness summary for valid work', async () => {
    vi.mocked(repo.getWork).mockResolvedValueOnce({
      id: 'w1', organizationId: 'org1', title: 'My Song', iswc: 'T-123', pro: 'ASCAP',
      registrationStatus: 'registered', status: 'active',
    } as WorkRecord);
    vi.mocked(repo.getWriters).mockResolvedValueOnce([{
      id: 's1', workId: 'w1', personId: 'p1', role: 'Writer', ownershipShare: 100,
      collectionShare: 100, publisherShare: 0, administrationShare: 0, position: 0, isPrimary: true,
    }]);
    vi.mocked(repo.getPublishers).mockResolvedValueOnce([{
      id: 'p1', workId: 'w1', publisherId: 'pub1', share: 100,
    }]);
    vi.mocked(repo.getLinkedTracks).mockResolvedValueOnce([{ trackId: 't1', linkedAt: null }]);
    vi.mocked(repo.validateSplits).mockResolvedValueOnce({ total: 100, valid: true, message: 'OK' });

    const result = await service.checkWorkReadiness('w1');
    expect(result.ready).toBe(true);
    expect(result.percentage).toBe(100);
  });

  it('checkDuplicateWorks returns isDuplicate=true when matches exist', async () => {
    vi.mocked(repo.findDuplicateWorks).mockResolvedValueOnce([{
      id: 'w2', organizationId: 'org1', title: 'Existing', registrationStatus: 'unregistered', status: 'active',
    }] as WorkRecord[]);
    const result = await service.checkDuplicateWorks('org1', 'Existing');
    expect(result.isDuplicate).toBe(true);
    expect(result.matches).toHaveLength(1);
  });
});
