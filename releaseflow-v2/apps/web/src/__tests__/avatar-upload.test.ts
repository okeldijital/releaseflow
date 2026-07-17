import { describe, it, expect } from 'vitest';
import { validateAvatarFile } from '@/components/common/image-upload/image-upload-service';

describe('BUILD-119A — Profile Avatar Upload', () => {
  describe('validateAvatarFile', () => {
    it('accepts JPEG files', () => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      expect(validateAvatarFile(file)).toBeNull();
    });

    it('accepts PNG files', () => {
      const file = new File([''], 'photo.png', { type: 'image/png' });
      expect(validateAvatarFile(file)).toBeNull();
    });

    it('accepts WEBP files', () => {
      const file = new File([''], 'photo.webp', { type: 'image/webp' });
      expect(validateAvatarFile(file)).toBeNull();
    });

    it('rejects unsupported file types', () => {
      const file = new File([''], 'photo.gif', { type: 'image/gif' });
      expect(validateAvatarFile(file)).toContain('Unsupported');
    });

    it('rejects files larger than 5 MB', () => {
      const oversized = new ArrayBuffer(6 * 1024 * 1024);
      const file = new File([oversized], 'photo.jpg', { type: 'image/jpeg' });
      expect(validateAvatarFile(file)).toContain('too large');
    });

    it('accepts files under 5 MB', () => {
      const small = new ArrayBuffer(1024);
      const file = new File([small], 'photo.jpg', { type: 'image/jpeg' });
      expect(validateAvatarFile(file)).toBeNull();
    });
  });

  describe('module exports', () => {
    it('exports expected functions and constants', async () => {
      const mod = await import('@/components/common/image-upload/image-upload-service');
      expect(typeof mod.uploadImageFile).toBe('function');
      expect(typeof mod.getAvatarThumbnailUrl).toBe('function');
      expect(typeof mod.AVATAR_ALLOWED_TYPES).toBe('object');
      expect(typeof mod.AVATAR_MAX_SIZE).toBe('number');
    });
  });
});