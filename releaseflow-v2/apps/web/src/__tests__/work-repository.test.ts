import { describe, it, expect } from 'vitest';

describe('WorkRepository contract', () => {
  it('exports core CRUD functions', async () => {
    const mod = await import('@/lib/work-repository');
    expect(typeof mod.createWork).toBe('function');
    expect(typeof mod.getWork).toBe('function');
    expect(typeof mod.updateWork).toBe('function');
    expect(typeof mod.deleteWork).toBe('function');
    expect(typeof mod.listWorks).toBe('function');
    expect(typeof mod.searchWorks).toBe('function');
  });

  it('exports archive and restore functions', async () => {
    const mod = await import('@/lib/work-repository');
    expect(typeof mod.archiveWork).toBe('function');
    expect(typeof mod.restoreWork).toBe('function');
  });

  it('exports writer split functions', async () => {
    const mod = await import('@/lib/work-repository');
    expect(typeof mod.addWriter).toBe('function');
    expect(typeof mod.updateWriter).toBe('function');
    expect(typeof mod.removeWriter).toBe('function');
    expect(typeof mod.getWriters).toBe('function');
    expect(typeof mod.validateSplits).toBe('function');
  });

  it('exports publisher functions', async () => {
    const mod = await import('@/lib/work-repository');
    expect(typeof mod.addPublisher).toBe('function');
    expect(typeof mod.updatePublisher).toBe('function');
    expect(typeof mod.removePublisher).toBe('function');
    expect(typeof mod.getPublishers).toBe('function');
  });

  it('exports track linking functions', async () => {
    const mod = await import('@/lib/work-repository');
    expect(typeof mod.linkTrack).toBe('function');
    expect(typeof mod.unlinkTrack).toBe('function');
    expect(typeof mod.getLinkedTracks).toBe('function');
  });

  it('exports duplicate detection', async () => {
    const mod = await import('@/lib/work-repository');
    expect(typeof mod.findDuplicateWorks).toBe('function');
  });

  it('archiveWork takes 1 argument (workId)', async () => {
    const mod = await import('@/lib/work-repository');
    expect(mod.archiveWork.length).toBe(1);
  });

  it('restoreWork takes 1 argument (workId)', async () => {
    const mod = await import('@/lib/work-repository');
    expect(mod.restoreWork.length).toBe(1);
  });

  it('createWork throws Firestore unavailable when no db', async () => {
    const mod = await import('@/lib/work-repository');
    await expect(mod.createWork({ organizationId: 'test', title: 'Test' })).rejects.toThrow('Firestore unavailable');
  });
});
