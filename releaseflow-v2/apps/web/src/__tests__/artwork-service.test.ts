import { describe, it, expect } from 'vitest';
import { hasPermission, type MembershipResolver } from '@/lib/auth/authorization-service';
import { PERMISSIONS } from '@releaseflow/core/auth/permissions';

describe('BUILD-032 — Artwork permissions', () => {
  function makeResolver(map: Record<string, string | null>): MembershipResolver {
    return async (orgId, userId) => map[`${orgId}:${userId}`] ?? null;
  }

  it('allows Owner artwork.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-owner': 'owner' });
    await expect(hasPermission('org-1', 'u-owner', PERMISSIONS.ArtworkUpload, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('allows Administrator artwork.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-admin': 'administrator' });
    await expect(hasPermission('org-1', 'u-admin', PERMISSIONS.ArtworkUpload, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('allows Designer artwork.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-designer': 'designer' });
    await expect(hasPermission('org-1', 'u-designer', PERMISSIONS.ArtworkUpload, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('allows Producer artwork.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-producer': 'producer' });
    await expect(hasPermission('org-1', 'u-producer', PERMISSIONS.ArtworkUpload, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('denies Viewer artwork.upload', async () => {
    const resolver = makeResolver({ 'org-1:u-viewer': 'viewer' });
    await expect(hasPermission('org-1', 'u-viewer', PERMISSIONS.ArtworkUpload, { membershipResolver: resolver })).resolves.toBe(false);
  });

  it('allows Owner artwork.replace', async () => {
    const resolver = makeResolver({ 'org-1:u-owner': 'owner' });
    await expect(hasPermission('org-1', 'u-owner', PERMISSIONS.ArtworkReplace, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('denies Producer artwork.replace', async () => {
    const resolver = makeResolver({ 'org-1:u-producer': 'producer' });
    await expect(hasPermission('org-1', 'u-producer', PERMISSIONS.ArtworkReplace, { membershipResolver: resolver })).resolves.toBe(false);
  });

  it('allows Owner artwork.delete', async () => {
    const resolver = makeResolver({ 'org-1:u-owner': 'owner' });
    await expect(hasPermission('org-1', 'u-owner', PERMISSIONS.ArtworkDelete, { membershipResolver: resolver })).resolves.toBe(true);
  });

  it('denies Designer artwork.delete', async () => {
    const resolver = makeResolver({ 'org-1:u-designer': 'designer' });
    await expect(hasPermission('org-1', 'u-designer', PERMISSIONS.ArtworkDelete, { membershipResolver: resolver })).resolves.toBe(false);
  });

  it('denies anonymous (no user)', async () => {
    const resolver = makeResolver({ 'org-1:anon': 'owner' });
    await expect(hasPermission('org-1', null, PERMISSIONS.ArtworkUpload, { membershipResolver: resolver })).resolves.toBe(false);
    await expect(hasPermission('org-1', undefined, PERMISSIONS.ArtworkUpload, { membershipResolver: resolver })).resolves.toBe(false);
    await expect(hasPermission('org-1', '', PERMISSIONS.ArtworkUpload, { membershipResolver: resolver })).resolves.toBe(false);
  });
});
