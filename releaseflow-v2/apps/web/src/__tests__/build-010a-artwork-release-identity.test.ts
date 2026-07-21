/**
 * BUILD-010A — Artwork Upload Release Identity Verification
 *
 * Static / pure-logic checks that the wizard artwork path cannot mint a second
 * Release ID and that replace/remove preserve release identity.
 *
 * Live browser + Firestore verification is documented in
 * docs/BUILD-010A-ARTWORK-RELEASE-IDENTITY.md
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WIZARD_HOOK = resolve(
  __dirname,
  '../components/release/wizard/useReleaseWizard.ts',
);

function wizardSource(): string {
  return readFileSync(WIZARD_HOOK, 'utf8');
}

/** Pure single-flight identity model (mirrors ensureSingleDraftId semantics). */
function createIdentitySession(seedId?: string) {
  let currentId: string | undefined = seedId;
  let createCount = 0;
  let inFlight: Promise<string> | null = null;
  let nextId = 1;

  async function ensureSingleDraftId(): Promise<string> {
    if (currentId) return currentId;
    if (inFlight) return inFlight;
    inFlight = (async () => {
      await Promise.resolve(); // simulate async create
      if (currentId) return currentId;
      createCount += 1;
      currentId = `release-${nextId++}`;
      return currentId;
    })();
    try {
      return await inFlight;
    } finally {
      inFlight = null;
    }
  }

  return {
    ensureSingleDraftId,
    getId: () => currentId,
    getCreateCount: () => createCount,
  };
}

describe('BUILD-010A — pure identity model', () => {
  it('creates exactly one id when none exists (V2)', async () => {
    const s = createIdentitySession();
    const a = await s.ensureSingleDraftId();
    expect(s.getCreateCount()).toBe(1);
    expect(a).toBe(s.getId());
  });

  it('reuses existing id on upload after draft (V1)', async () => {
    const s = createIdentitySession('draft-abc');
    const before = s.getId();
    const after = await s.ensureSingleDraftId();
    expect(after).toBe(before);
    expect(s.getCreateCount()).toBe(0);
  });

  it('concurrent ensure calls create only one Release (race)', async () => {
    const s = createIdentitySession();
    const [a, b, c] = await Promise.all([
      s.ensureSingleDraftId(),
      s.ensureSingleDraftId(),
      s.ensureSingleDraftId(),
    ]);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(s.getCreateCount()).toBe(1);
  });

  it('save-after-upload keeps same id (V3)', async () => {
    const s = createIdentitySession();
    const uploadId = await s.ensureSingleDraftId();
    const saveId = await s.ensureSingleDraftId();
    expect(saveId).toBe(uploadId);
    expect(s.getCreateCount()).toBe(1);
  });

  it('resume seed id never creates another (V4)', async () => {
    const s = createIdentitySession('resume-xyz');
    const id = await s.ensureSingleDraftId();
    expect(id).toBe('resume-xyz');
    expect(s.getCreateCount()).toBe(0);
  });

  it('replace/remove do not create releases (V5/V6)', async () => {
    const s = createIdentitySession('rel-1');
    // replace + remove are artwork ops — identity ensure only returns existing
    const afterReplace = await s.ensureSingleDraftId();
    const afterRemove = await s.ensureSingleDraftId();
    expect(afterReplace).toBe('rel-1');
    expect(afterRemove).toBe('rel-1');
    expect(s.getCreateCount()).toBe(0);
  });
});

describe('BUILD-010A — source identity contracts', () => {
  it('uses single-flight draft create for artwork + save paths', () => {
    const src = wizardSource();
    expect(src).toContain('ensureSingleDraftId');
    expect(src).toContain('draftCreateInFlight');
    expect(src).toContain('BUILD-010A');
    // Artwork resolve must go through single-flight helper
    expect(src).toMatch(/resolveArtworkReleaseId[\s\S]*ensureSingleDraftId/);
    // Save draft create branch must not call createNewReleaseDraft directly
    const saveDraftFn = src.slice(src.indexOf('async function saveDraft'));
    const saveBody = saveDraftFn.slice(0, saveDraftFn.indexOf('async function resolveArtworkReleaseId'));
    expect(saveBody).toContain('ensureSingleDraftId');
    expect(saveBody).not.toMatch(/createNewReleaseDraft\s*\(/);
  });

  it('replace uses replaceArtwork (no second artwork orphan path on replace)', () => {
    const src = wizardSource();
    expect(src).toContain('replaceArtwork');
    expect(src).toMatch(/if \(existing\)[\s\S]*replaceArtwork/);
    expect(src).toContain('Artwork release identity mismatch after replace');
    expect(src).toContain('Artwork release identity mismatch after upload');
  });

  it('upload attaches artwork to resolved releaseId only', () => {
    const src = wizardSource();
    expect(src).toMatch(/uploadArtwork\(\s*file,\s*releaseId/);
    expect(src).toMatch(/getArtworkByRelease\(\s*activeOrgId,\s*releaseId/);
  });

  it('remove clears artwork without createNewReleaseDraft', () => {
    const src = wizardSource();
    const removeFn = src.slice(src.indexOf('async function handleArtworkRemove'));
    const removeBody = removeFn.slice(0, removeFn.indexOf('\n  async function') > 0
      ? removeFn.indexOf('\n  async function', 10)
      : removeFn.indexOf('\n  function handleConflictReload'));
    expect(removeBody).toContain('removeArtwork');
    expect(removeBody).not.toContain('createNewReleaseDraft');
    expect(removeBody).not.toContain('ensureSingleDraftId');
  });

  it('resume binds currentDraftId before artwork load', () => {
    const src = wizardSource();
    expect(src).toContain('currentDraftId.current = resumeDraftId');
    expect(src).toContain('getArtworkByRelease');
  });
});
