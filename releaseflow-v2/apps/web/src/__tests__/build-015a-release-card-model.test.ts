/**
 * BUILD-015A — ReleaseCardModel consistency
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  toReleaseCardModel,
  computeCardProgress,
  computeCardStageLabel,
} from '@/lib/release-card-model';
import type { ReleaseRecord } from '@/lib/release-repository';

function baseRelease(over: Partial<ReleaseRecord> = {}): ReleaseRecord {
  return {
    id: 'r1',
    title: 'Test',
    releaseType: 'single',
    status: 'planning',
    lifecycle: 'draft',
    organizationId: 'org1',
    createdBy: 'u1',
    createdAt: new Date(),
    artwork: null,
    wizardData: {
      releaseTitle: 'Test',
      currentStep: 2,
      tracks: [{ title: 'A' }],
    },
    ...over,
  };
}

describe('BUILD-015A mapper', () => {
  it('toReleaseCardModel attaches artwork and progress fields', () => {
    const art = {
      id: 'a1',
      organizationId: 'org1',
      releaseId: 'r1',
      publicId: 'p',
      secureUrl: 'https://example.com/art.jpg',
      width: 100,
      height: 100,
      format: 'jpg',
      createdAt: {} as never,
      updatedAt: {} as never,
    };
    const model = toReleaseCardModel(baseRelease(), art);
    expect(model.artwork?.secureUrl).toContain('example.com');
    expect(model.cardProgress).toBeGreaterThan(0);
    expect(model.cardStageLabel).toBeTruthy();
  });

  it('computeCardProgress is 100 for released', () => {
    expect(
      computeCardProgress(baseRelease({ lifecycle: 'active', status: 'released' })),
    ).toBe(100);
  });

  it('computeCardStageLabel for draft uses wizard step', () => {
    expect(computeCardStageLabel(baseRelease())).toBe('Artwork');
  });
});

describe('BUILD-015A service wiring', () => {
  it('fetchOrganizationDrafts uses toReleaseCardModels', () => {
    const src = readFileSync(
      join(__dirname, '../lib/release-service.ts'),
      'utf8',
    );
    expect(src).toContain('export async function fetchOrganizationDrafts');
    expect(src).toMatch(
      /fetchOrganizationDrafts[\s\S]*?toReleaseCardModels/,
    );
    // Repository still returns artwork:null; enrichment is in the service mapper
    const repo = readFileSync(
      join(__dirname, '../lib/release-repository.ts'),
      'utf8',
    );
    expect(repo).toContain('artwork: null');
  });

  it('fetchReleasesByOrg uses the same toReleaseCardModels', () => {
    const src = readFileSync(
      join(__dirname, '../lib/release-service.ts'),
      'utf8',
    );
    expect(src).toMatch(/fetchReleasesByOrg[\s\S]*?toReleaseCardModels/);
  });

  it('dashboard loads drafts via fetchOrganizationDrafts only', () => {
    const dash = readFileSync(
      join(__dirname, '../app/(app)/dashboard/page.tsx'),
      'utf8',
    );
    expect(dash).toContain('fetchOrganizationDrafts');
    expect(dash).not.toMatch(/artwork:\s*null/);
  });
});
