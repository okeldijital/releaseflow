/**
 * BUG-009 — Draft Save Discovery regression tests
 *
 * Create → Save Draft → discoverable → Continue resumes same id → Delete removes.
 */
import { describe, it, expect } from 'vitest';
import {
  filterDiscoverableDrafts,
  isDiscoverableDraft,
  isRemovedFromDraftList,
  buildDraftSavePatch,
  resolveDraftDisplayTitle,
  resumeDraftId,
  createDraftJourneyStore,
  journeyCreateDraft,
  journeySaveDraft,
  journeyListDrafts,
  journeyResume,
  journeyComplete,
  journeyDocumentCount,
  journeyActiveReleases,
} from '@/lib/draft-discovery';

describe('BUG-009 draft discovery rules', () => {
  it('Test 1: saved draft (lifecycle=draft) is discoverable in draft list', () => {
    const afterSave = [
      { id: 'd1', title: 'Lefa EP', lifecycle: 'draft', status: 'planning' },
      { id: 'a1', title: 'Active', lifecycle: 'active', status: 'planning' },
    ];
    const drafts = filterDiscoverableDrafts(afterSave);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.id).toBe('d1');
    const first = afterSave[0];
    expect(first && isDiscoverableDraft(first)).toBe(true);
  });

  it('Test 2: dashboard draft widget uses same discoverable filter', () => {
    const catalogue = [
      { id: 'd1', title: 'Lefa EP', lifecycle: 'draft' },
      { id: 'd2', title: 'Other Draft', lifecycle: 'draft' },
      { id: 'x', title: 'Released', lifecycle: 'active' },
    ];
    const widget = filterDiscoverableDrafts(catalogue).slice(0, 5);
    expect(widget.map((d) => d.id)).toEqual(['d1', 'd2']);
  });

  it('Test 3: Continue resumes the same draft id (no new release)', () => {
    const savedId = 'draft-abc';
    expect(resumeDraftId(savedId)).toBe('draft-abc');
    expect(resumeDraftId(savedId)).not.toBe('new');
  });

  it('Test 4: Delete removes draft from discoverable set', () => {
    let list = [
      { id: 'd1', title: 'A', lifecycle: 'draft' },
      { id: 'd2', title: 'B', lifecycle: 'draft' },
    ];
    list = list.filter((d) => d.id !== 'd1');
    expect(filterDiscoverableDrafts(list).map((d) => d.id)).toEqual(['d2']);
  });

  it('Test 5: two drafts both appear', () => {
    const drafts = filterDiscoverableDrafts([
      { id: 'd1', title: 'One', lifecycle: 'draft' },
      { id: 'd2', title: 'Two', lifecycle: 'draft' },
      { id: 'a1', title: 'Active', lifecycle: 'active' },
    ]);
    expect(drafts).toHaveLength(2);
  });

  it('Test 6: completing a release removes it from draft list', () => {
    const before = { id: 'd1', title: 'Lefa EP', lifecycle: 'draft' as const };
    const afterComplete = { id: 'd1', title: 'Lefa EP', lifecycle: 'active' as const };
    expect(isDiscoverableDraft(before)).toBe(true);
    expect(isRemovedFromDraftList(afterComplete)).toBe(true);
    expect(filterDiscoverableDrafts([afterComplete])).toHaveLength(0);
  });
});

describe('BUG-009 save patch', () => {
  it('syncs title from wizardData.releaseTitle', () => {
    const patch = buildDraftSavePatch(
      { releaseTitle: 'Lefa EP', currentStep: 2 },
      3,
    );
    expect(patch.title).toBe('Lefa EP');
    expect(patch.version).toBe(3);
    expect(patch.wizardData).toEqual({ releaseTitle: 'Lefa EP', currentStep: 2 });
  });

  it('does not set empty title', () => {
    const patch = buildDraftSavePatch({ releaseTitle: '   ', currentStep: 0 }, 1);
    expect(patch.title).toBeUndefined();
  });

  it('resolveDraftDisplayTitle prefers document then wizard', () => {
    expect(resolveDraftDisplayTitle({ id: '1', title: 'Doc', lifecycle: 'draft' })).toBe('Doc');
    expect(
      resolveDraftDisplayTitle({
        id: '1',
        title: '',
        lifecycle: 'draft',
        wizardData: { releaseTitle: 'From Wizard' },
      }),
    ).toBe('From Wizard');
    expect(resolveDraftDisplayTitle({ id: '1', title: '', lifecycle: 'draft' })).toBe(
      'Untitled Draft',
    );
  });
});

describe('BUG-009 source contracts', () => {
  it('draft list page uses organization draft fetch', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../app/(app)/releases/new/page.tsx'),
      'utf8',
    );
    expect(src).toContain('fetchOrganizationDrafts');
    expect(src).toContain('Continue');
    expect(src).toContain('Delete Draft');
    expect(src).toContain('Last saved');
  });

  it('updateReleaseDraft uses buildDraftSavePatch for title sync', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../lib/release-repository.ts'),
      'utf8',
    );
    expect(src).toContain('buildDraftSavePatch');
    expect(src).toContain('getOrganizationDrafts');
  });

  it('wizard resume binds currentDraftId to resumeDraftId', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../components/release/wizard/useReleaseWizard.ts'),
      'utf8',
    );
    expect(src).toContain('currentDraftId.current = resumeDraftId');
  });

  it('getDraftReleases does not use broken getReleases userId path alone', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../lib/release-repository.ts'),
      'utf8',
    );
    const fn = src.slice(src.indexOf('export async function getDraftReleases'));
    const body = fn.slice(0, fn.indexOf('export async function getActiveReleases'));
    expect(body).toContain('getOrganizationDrafts');
    expect(body).toContain('getDraftsByUser');
    expect(body).not.toContain("getReleases(orgId, { lifecycle: ['draft'], userId })");
  });

  it('Dashboard and Draft page both call fetchOrganizationDrafts', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const draftPage = fs.readFileSync(
      path.resolve(__dirname, '../app/(app)/releases/new/page.tsx'),
      'utf8',
    );
    const dash = fs.readFileSync(
      path.resolve(__dirname, '../app/(app)/dashboard/page.tsx'),
      'utf8',
    );
    expect(draftPage).toContain('fetchOrganizationDrafts');
    expect(dash).toContain('fetchOrganizationDrafts');
  });
});

describe('BUG-009A Test 14 — Complete Draft Journey', () => {
  it('create → save → list → resume → re-save ×3 → complete removes draft, keeps one id', () => {
    const store = createDraftJourneyStore();

    // Step 1–3: Create + Save Draft
    const id = journeyCreateDraft(store, {
      title: 'Lefa EP',
      releaseType: 'ep',
      primaryArtist: 'Lefa',
      currentStep: 1,
    });
    expect(journeyDocumentCount(store)).toBe(1);
    expect(journeyListDrafts(store)).toHaveLength(1);
    expect(journeyListDrafts(store)[0]?.id).toBe(id);
    expect(journeyListDrafts(store)[0]?.lifecycle).toBe('draft');
    expect(resolveDraftDisplayTitle(journeyListDrafts(store)[0]!)).toBe('Lefa EP');

    // Step 4–5: Navigate away / return — draft still discoverable
    const listAfterNav = journeyListDrafts(store);
    expect(listAfterNav).toHaveLength(1);
    expect(listAfterNav[0]?.id).toBe(id);

    // Step 6: Dashboard uses same list criteria → same count
    const dashboardDrafts = journeyListDrafts(store).slice(0, 5);
    expect(dashboardDrafts).toHaveLength(listAfterNav.length);
    expect(dashboardDrafts[0]?.title).toBe(listAfterNav[0]?.title);

    // Step 7: Continue — same id, wizard fields restored
    const resumed = journeyResume(store, resumeDraftId(id));
    expect(resumed.id).toBe(id);
    expect(resumed.wizardData?.releaseTitle).toBe('Lefa EP');
    expect(resumed.wizardData?.releaseType).toBe('ep');
    expect(resumed.wizardData?.primaryArtist).toBe('Lefa');
    expect(resumed.wizardData?.currentStep).toBe(1);
    expect(journeyDocumentCount(store)).toBe(1);

    // Step 8: Modify title + save — same document, list title updates
    const afterRename = journeySaveDraft(store, id, {
      releaseTitle: 'Lefa EP (Updated)',
      releaseType: 'ep',
      primaryArtist: 'Lefa',
      currentStep: 2,
    });
    expect(afterRename.id).toBe(id);
    expect(journeyDocumentCount(store)).toBe(1);
    expect(journeyListDrafts(store)).toHaveLength(1);
    expect(resolveDraftDisplayTitle(journeyListDrafts(store)[0]!)).toBe('Lefa EP (Updated)');
    expect(journeyListDrafts(store)[0]?.wizardData?.currentStep).toBe(2);

    // Step 9: Three consecutive saves — still one draft, one id
    for (let i = 0; i < 3; i++) {
      journeySaveDraft(store, id, {
        releaseTitle: 'Lefa EP (Updated)',
        releaseType: 'ep',
        primaryArtist: 'Lefa',
        currentStep: 3 + i,
      });
    }
    expect(journeyDocumentCount(store)).toBe(1);
    expect(journeyListDrafts(store)).toHaveLength(1);
    expect(journeyListDrafts(store)[0]?.id).toBe(id);

    // Step 10: Complete — draft removed, active release visible
    const active = journeyComplete(store, id);
    expect(active.lifecycle).toBe('active');
    expect(active.id).toBe(id);
    expect(journeyListDrafts(store)).toHaveLength(0);
    expect(journeyActiveReleases(store)).toHaveLength(1);
    expect(journeyActiveReleases(store)[0]?.id).toBe(id);
    expect(journeyDocumentCount(store)).toBe(1);
  });
});
