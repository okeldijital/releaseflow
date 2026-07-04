import { describe, it, expect } from 'vitest';

describe('TrackRepository contract', () => {
  it('exports canonical repository functions', async () => {
    const mod = await import('@/lib/track-repository');
    expect(typeof mod.createTrack).toBe('function');
    expect(typeof mod.getTrack).toBe('function');
    expect(typeof mod.getTracksByOrg).toBe('function');
    expect(typeof mod.updateTrack).toBe('function');
    expect(typeof mod.archiveTrack).toBe('function');
    expect(typeof mod.deleteTrack).toBe('function');
  });

  it('exports track service facade aligned with repository', async () => {
    const mod = await import('@/lib/track-service');
    expect(typeof mod.createNewTrack).toBe('function');
    expect(typeof mod.fetchTracksByOrg).toBe('function');
    expect(typeof mod.fetchTrack).toBe('function');
    expect(typeof mod.editTrack).toBe('function');
    expect(typeof mod.removeTrack).toBe('function');
    expect(typeof mod.archiveTrackById).toBe('function');
  });

  it('removeTrack requires trackId', async () => {
    const { removeTrack } = await import('@/lib/track-service');
    await expect(removeTrack('')).rejects.toThrow('Track ID is required');
  });
});