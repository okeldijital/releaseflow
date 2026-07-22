/**
 * BUILD-014D — Media pipeline consolidation checks
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const webRoot = join(__dirname, '..');
const repoWeb = webRoot;

describe('BUILD-014D structure', () => {
  it('removes artwork-upload.ts', () => {
    expect(existsSync(join(repoWeb, 'lib/artwork/artwork-upload.ts'))).toBe(false);
  });

  it('removes feature destroy routes', () => {
    expect(existsSync(join(repoWeb, 'app/api/artwork/destroy/route.ts'))).toBe(false);
    expect(existsSync(join(repoWeb, 'app/api/avatar/destroy/route.ts'))).toBe(false);
    expect(existsSync(join(repoWeb, 'app/api/media/destroy/route.ts'))).toBe(true);
  });

  it('artwork-service uses uploadFile and destroyFile only', () => {
    const src = readFileSync(join(repoWeb, 'lib/artwork/artwork-service.ts'), 'utf8');
    expect(src).toContain("from '@/lib/media/media-upload'");
    expect(src).toContain('uploadFile');
    expect(src).toContain('destroyFile');
    expect(src).not.toContain('artwork-upload');
    expect(src).not.toContain('/api/artwork/destroy');
  });

  it('media-upload is the single client transport', async () => {
    const mod = await import('@/lib/media/media-upload');
    expect(typeof mod.uploadFile).toBe('function');
    expect(typeof mod.destroyFile).toBe('function');
    expect(typeof mod.MediaUrlService).toBe('object');
    expect(typeof mod.MediaUrlService.avatar).toBe('function');
  });

  it('image-upload-service delegates to uploadFile', () => {
    const src = readFileSync(
      join(repoWeb, 'components/common/image-upload/image-upload-service.ts'),
      'utf8',
    );
    expect(src).toContain('uploadFile');
    expect(src).toContain('MediaUrlService');
    expect(src).not.toContain('cloudinaryConfig');
  });
});

describe('BUILD-014D browser must not import cloudinaryConfig from feature media code', () => {
  const paths = [
    'lib/media/media-upload.ts',
    'lib/artwork/artwork-service.ts',
    'components/common/image-upload/image-upload-service.ts',
    'lib/profile-service.ts',
    'lib/artist-media-service.ts',
    'lib/person-media-service.ts',
  ];

  for (const rel of paths) {
    it(`${rel} does not import cloudinaryConfig`, () => {
      const src = readFileSync(join(repoWeb, rel), 'utf8');
      expect(src).not.toMatch(/cloudinaryConfig/);
    });
  }
});

describe('BUILD-014D destroy signature rule', () => {
  it('media destroy signs public_id + timestamp only', () => {
    const src = readFileSync(join(repoWeb, 'app/api/media/destroy/route.ts'), 'utf8');
    expect(src).toContain('public_id=');
    expect(src).toContain('timestamp=');
    // Must not put api_key in the string-to-sign pairs
    expect(src).toMatch(/paramPairs\s*=\s*\[[\s\S]*public_id[\s\S]*timestamp/);
    expect(src).not.toMatch(/paramPairs\s*=\s*\[[\s\S]*api_key=/);
  });
});
