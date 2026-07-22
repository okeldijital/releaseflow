/**
 * BUILD-011 — Remix Original Work Metadata
 * BUILD-012 — Canonical TrackEditor is the single UI source for create paths
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
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

describe('BUILD-011 / BUILD-012 — source contracts', () => {
  const root = resolve(__dirname, '..');

  it('repository persists and hydrates originalWork', () => {
    const src = readFileSync(resolve(root, 'lib/track-repository.ts'), 'utf8');
    expect(src).toContain('originalWork');
    expect(src).toContain('serializeOriginalWork');
    expect(src).toContain('normalizeOriginalWork');
    expect(src).toContain('interface OriginalWork');
  });

  it('canonical TrackEditor owns BUILD-011C Original Work UI', () => {
    const src = readFileSync(resolve(root, 'components/track-editor/TrackEditor.tsx'), 'utf8');
    expect(src).toContain('Original Work');
    expect(src).toContain('Original Song Title');
    expect(src).toContain('Original Primary Artist');
    expect(src).toContain('Original Featured Artists');
    expect(src).toContain('Information about the original song being remixed.');
    expect(src).toContain("recordingType === 'remix'");
    expect(src).toContain('label="Primary Artist"');
    // Forbidden terminology in the canonical editor
    expect(src).not.toContain('label="Original Artists"');
    expect(src).not.toContain('role="original"');
    expect(src).not.toContain('role="remix"');
  });

  it('create wizard uses TrackEditor and binds originalWork (BUILD-011C + BUILD-012)', () => {
    const src = readFileSync(resolve(root, 'app/(app)/tracks/new/page.tsx'), 'utf8');
    expect(src).toContain('TrackEditor');
    expect(src).toContain('originalWorkTitle');
    expect(src).toContain('originalWork:');
    // Group A binding (Original Work — never track.primaryArtistId)
    expect(src).toContain('primaryArtistId: originalWorkPrimaryArtistId');
    expect(src).toContain('featuredArtistIds: originalWorkFeaturedArtists');
    // Group B — recording credit uses Primary Artist → track.primaryArtistId (separate state)
    expect(src).toContain('primaryArtistId: recordingPrimaryId');
    expect(src).toContain('originalWorkPrimaryArtistId');
    expect(src).toMatch(/const \[primaryArtistId, setPrimaryArtistId\]/);
    // Forbidden intermediate lists on create page
    expect(src).not.toContain('label="Original Artists"');
    expect(src).not.toContain('setOriginalArtists');
    expect(src).not.toContain('setRemixArtists');
  });

  it('release wizard tracks step uses TrackEditor (BUILD-012)', () => {
    const src = readFileSync(resolve(root, 'components/release/wizard/TracksStep.tsx'), 'utf8');
    expect(src).toContain('TrackEditor');
    expect(src).not.toContain('label="Original Artists"');
    expect(src).not.toContain('role="original"');
    expect(src).not.toContain('role="remix"');
  });

  it('track workspace edit reuses OriginalWorkSection from TrackEditor', () => {
    const src = readFileSync(resolve(root, 'components/track-workspace.tsx'), 'utf8');
    expect(src).toContain('OriginalWorkSection');
    expect(src).toContain('originalWorkTitle');
    expect(src).toContain("recordingType === 'remix'");
    expect(src).toContain('track.originalWork');
  });

  it('does not introduce a separate original-work repository or service file', () => {
    expect(existsSync(resolve(root, 'lib/original-work-repository.ts'))).toBe(false);
    expect(existsSync(resolve(root, 'lib/original-work-service.ts'))).toBe(false);
  });
});
