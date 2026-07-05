import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ReleaseTrackRepository contract', () => {
  it('exports canonical repository functions', async () => {
    const mod = await import('@/lib/release-track-repository');
    expect(typeof mod.getTracksByRelease).toBe('function');
    expect(typeof mod.addTrackToRelease).toBe('function');
    expect(typeof mod.removeTrackFromRelease).toBe('function');
    expect(typeof mod.getReleasesByTrack).toBe('function');
    expect(typeof mod.reorderTrack).toBe('function');
  });
});

describe('getTracksByRelease orphan tolerance', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('skips orphaned release_tracks and returns only valid tracks', async () => {
    const mockGetDocs = vi.fn();
    const mockGetDoc = vi.fn();

    vi.doMock('@/lib/firebase', () => ({
      getDb: () => ({ _mock: true }),
    }));

    vi.doMock('firebase/firestore', () => ({
      getDoc: mockGetDoc,
      getDocs: mockGetDocs,
      doc: (_db: unknown, _collection: string, id: string) => ({ id }),
      collection: (_db: unknown, name: string) => name,
      query: (...args: unknown[]) => args,
      where: (...args: unknown[]) => args,
      orderBy: (...args: unknown[]) => args,
      Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0 }) },
    }));

    const { getTracksByRelease } = await import('@/lib/release-track-repository');

    mockGetDocs.mockResolvedValue({
      size: 3,
      docs: [
        { id: 'linkA', data: () => ({ releaseId: 'r1', trackId: 'trackA', position: 1 }) },
        { id: 'linkB', data: () => ({ releaseId: 'r1', trackId: 'orphanTrack', position: 2 }) },
        { id: 'linkC', data: () => ({ releaseId: 'r1', trackId: 'trackC', position: 3 }) },
      ],
    });

    mockGetDoc.mockImplementation(async ({ id }: { id: string }) => {
      if (id === 'orphanTrack') {
        return { exists: () => false };
      }
      if (id === 'trackA') {
        return {
          exists: () => true,
          id: 'trackA',
          data: () => ({ title: 'Track A', organizationId: 'org1', status: 'draft' }),
        };
      }
      if (id === 'trackC') {
        return {
          exists: () => true,
          id: 'trackC',
          data: () => ({ title: 'Track C', organizationId: 'org1', status: 'draft' }),
        };
      }
      return { exists: () => false };
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const results = await getTracksByRelease('r1');

    expect(results).toHaveLength(2);
    expect(results[0]?.track?.title).toBe('Track A');
    expect(results[1]?.track?.title).toBe('Track C');

    expect(warnSpy).toHaveBeenCalledWith(
      '[release_tracks] orphan detected',
      'linkB',
      'orphanTrack',
    );

    warnSpy.mockRestore();
  });

  it('returns empty array when all release_tracks are orphaned', async () => {
    const mockGetDocs = vi.fn();
    const mockGetDoc = vi.fn();

    vi.doMock('@/lib/firebase', () => ({
      getDb: () => ({ _mock: true }),
    }));

    vi.doMock('firebase/firestore', () => ({
      getDoc: mockGetDoc,
      getDocs: mockGetDocs,
      doc: (_db: unknown, _collection: string, id: string) => ({ id }),
      collection: (_db: unknown, name: string) => name,
      query: (...args: unknown[]) => args,
      where: (...args: unknown[]) => args,
      orderBy: (...args: unknown[]) => args,
      Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0 }) },
    }));

    const { getTracksByRelease } = await import('@/lib/release-track-repository');

    mockGetDocs.mockResolvedValue({
      size: 2,
      docs: [
        { id: 'linkX', data: () => ({ releaseId: 'r1', trackId: 'missing1', position: 1 }) },
        { id: 'linkY', data: () => ({ releaseId: 'r1', trackId: 'missing2', position: 2 }) },
      ],
    });

    mockGetDoc.mockResolvedValue({ exists: () => false });

    const results = await getTracksByRelease('r1');
    expect(results).toHaveLength(0);
  });
});
