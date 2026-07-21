/**
 * BUILD-011 — Remix Original Work Metadata
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  normalizeOriginalWork,
  serializeOriginalWork,
} from '@/lib/track-repository';
import { validateOriginalWorkForRecordingType } from '@/lib/track-service';

describe('BUILD-011 — originalWork pure helpers', () => {
  it('normalizeOriginalWork returns null for empty/missing', () => {
    expect(normalizeOriginalWork(null)).toBeNull();
    expect(normalizeOriginalWork(undefined)).toBeNull();
    expect(normalizeOriginalWork({})).toBeNull();
    expect(normalizeOriginalWork({ title: '', primaryArtistId: '', featuredArtistIds: [] })).toBeNull();
  });

  it('normalizeOriginalWork hydrates nested object', () => {
    expect(
      normalizeOriginalWork({
        title: 'Dreams',
        primaryArtistId: 'a1',
        featuredArtistIds: ['a2', '', 'a3'],
      }),
    ).toEqual({
      title: 'Dreams',
      primaryArtistId: 'a1',
      featuredArtistIds: ['a2', 'a3'],
    });
  });

  it('serializeOriginalWork is null for non-remix', () => {
    expect(
      serializeOriginalWork('original', {
        title: 'Dreams',
        primaryArtistId: 'a1',
        featuredArtistIds: [],
      }),
    ).toBeNull();
  });

  it('serializeOriginalWork returns nested object for remix', () => {
    expect(
      serializeOriginalWork('remix', {
        title: '  Dreams  ',
        primaryArtistId: 'a1',
        featuredArtistIds: ['a2'],
      }),
    ).toEqual({
      title: 'Dreams',
      primaryArtistId: 'a1',
      featuredArtistIds: ['a2'],
    });
  });

  it('validation only applies to remix', () => {
    expect(validateOriginalWorkForRecordingType('original', null)).toBeNull();
    expect(validateOriginalWorkForRecordingType('remix', null)).toMatch(/Original Song Title/);
    expect(
      validateOriginalWorkForRecordingType('remix', {
        title: 'Dreams',
        primaryArtistId: '',
        featuredArtistIds: [],
      }),
    ).toMatch(/Original Primary Artist/);
    expect(
      validateOriginalWorkForRecordingType('remix', {
        title: 'Dreams',
        primaryArtistId: 'a1',
        featuredArtistIds: ['a2'],
      }),
    ).toBeNull();
  });
});

describe('BUILD-011 — source contracts', () => {
  const root = resolve(__dirname, '..');

  it('repository persists and hydrates originalWork', () => {
    const src = readFileSync(resolve(root, 'lib/track-repository.ts'), 'utf8');
    expect(src).toContain('originalWork');
    expect(src).toContain('serializeOriginalWork');
    expect(src).toContain('normalizeOriginalWork');
    expect(src).toContain('interface OriginalWork');
  });

  it('create wizard shows Original Work only for remix', () => {
    const src = readFileSync(resolve(root, 'app/(app)/tracks/new/page.tsx'), 'utf8');
    expect(src).toContain('Original Work');
    expect(src).toContain('Original Song Title');
    expect(src).toContain('originalWorkTitle');
    expect(src).toContain("recordingType === 'remix'");
    expect(src).toContain('originalWork:');
  });

  it('track workspace edit and details expose Original Work for remix', () => {
    const src = readFileSync(resolve(root, 'components/track-workspace.tsx'), 'utf8');
    expect(src).toContain('Original Work');
    expect(src).toContain('Original Song');
    expect(src).toContain('originalWorkTitle');
    expect(src).toContain("recordingType === 'remix'");
    expect(src).toContain('track.originalWork');
  });

  it('does not introduce a separate original-work repository or service file', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    expect(fs.existsSync(resolve(root, 'lib/original-work-repository.ts'))).toBe(false);
    expect(fs.existsSync(resolve(root, 'lib/original-work-service.ts'))).toBe(false);
  });
});
