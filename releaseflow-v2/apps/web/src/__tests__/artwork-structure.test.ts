import { describe, it, expect } from 'vitest';
import { Timestamp } from '@firebase/firestore';
import type { Artwork } from '@/lib/artwork/artwork-types';

describe('Artwork types', () => {
  it('defines the Artwork interface shape', () => {
    const artwork: Artwork = {
      id: 'artwork-1',
      organizationId: 'org-1',
      releaseId: 'release-1',
      publicId: 'releaseflow/org-1/releases/release-1/artwork',
      secureUrl: 'https://res.cloudinary.com/...',
      createdBy: 'user-1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    expect(artwork.id).toBe('artwork-1');
    expect(artwork.organizationId).toBe('org-1');
    expect(artwork.releaseId).toBe('release-1');
    expect(artwork.publicId).toBe('releaseflow/org-1/releases/release-1/artwork');
    expect(artwork.secureUrl).toContain('https://');
    expect(artwork.createdBy).toBe('user-1');
  });
});

describe('Artwork repository — module structure', () => {
  it('exports exist and match signatures', async () => {
    const mod = await import('@/lib/artwork/artwork-repository');
    expect(typeof mod.createArtwork).toBe('function');
    expect(typeof mod.updateArtwork).toBe('function');
    expect(typeof mod.deleteArtwork).toBe('function');
    expect(typeof mod.getArtwork).toBe('function');
    expect(typeof mod.getArtworksByRelease).toBe('function');
  });
});

describe('Artwork service — module structure', () => {
  it('exports exist and match signatures', async () => {
    const mod = await import('@/lib/artwork/artwork-service');
    expect(typeof mod.uploadArtwork).toBe('function');
    expect(typeof mod.replaceArtwork).toBe('function');
    expect(typeof mod.removeArtwork).toBe('function');
    expect(typeof mod.getArtworkByRelease).toBe('function');
  });
});
