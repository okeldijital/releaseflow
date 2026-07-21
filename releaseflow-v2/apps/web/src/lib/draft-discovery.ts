/**
 * BUG-009 / BUG-009A — pure helpers for Draft Save Discovery.
 * No UI. Used by listing, dashboard, and regression tests.
 *
 * ## Query contract (Dashboard + Draft Releases)
 * Both views use organization + lifecycle == 'draft' only
 * via getOrganizationDrafts / fetchOrganizationDrafts.
 * No owner, readiness, assignment, or date filters.
 *
 * ## Firestore indexes (Option A — indexes defined)
 * Primary ordered query for org drafts:
 *   organizationId ASC, lifecycle ASC, updatedAt DESC
 * Defined in firestore.indexes.json (releases collection).
 *
 * Fallback (equality-only org + lifecycle, client sort by updatedAt):
 * - Runs only when the ordered query throws (index not yet deployed,
 *   rules denial surface as error, or transient Firestore failure).
 * - Returns the same document set as the primary query for lifecycle==draft
 *   (sort may differ only until ordered path works; membership is identical).
 * - Do not remove until the project’s Firebase indexes are confirmed deployed.
 */

export interface DraftLike {
  id: string;
  title: string;
  lifecycle: string;
  status?: string;
  wizardData?: Record<string, unknown> | null;
  updatedAt?: unknown;
  createdBy?: string;
  version?: number;
}

/** Phase 2: draft list includes only lifecycle === 'draft'. */
export function isDiscoverableDraft(release: DraftLike): boolean {
  return release.lifecycle === 'draft';
}

export function filterDiscoverableDrafts<T extends DraftLike>(releases: T[]): T[] {
  return releases.filter(isDiscoverableDraft);
}

/** After finalize/complete, draft must leave the draft list. */
export function isRemovedFromDraftList(release: DraftLike): boolean {
  return release.lifecycle !== 'draft';
}

/**
 * Build Firestore patch for save draft (title sync + wizardData + version + updatedAt marker).
 * Pure — no I/O.
 */
export function buildDraftSavePatch(
  wizardData: Record<string, unknown>,
  nextVersion: number,
): Record<string, unknown> {
  const titleFromWizard =
    typeof wizardData.releaseTitle === 'string' ? wizardData.releaseTitle.trim() : '';
  const patch: Record<string, unknown> = {
    wizardData,
    version: nextVersion,
  };
  if (titleFromWizard) {
    patch.title = titleFromWizard;
  }
  return patch;
}

/** Display title for draft cards: document title, then wizard title, then fallback. */
export function resolveDraftDisplayTitle(draft: DraftLike): string {
  if (draft.title?.trim()) return draft.title.trim();
  const wd = draft.wizardData;
  if (wd && typeof wd.releaseTitle === 'string' && wd.releaseTitle.trim()) {
    return wd.releaseTitle.trim();
  }
  return 'Untitled Draft';
}

/** Resume uses the same release id — never allocates a new id. */
export function resumeDraftId(existingId: string): string {
  return existingId;
}

/**
 * In-memory draft store for end-to-end journey tests (Test 14).
 * Mirrors create → save → list → resume → re-save → complete without Firestore.
 */
export interface DraftJourneyStore {
  documents: Map<string, DraftLike>;
  nextId: number;
}

export function createDraftJourneyStore(): DraftJourneyStore {
  return { documents: new Map(), nextId: 1 };
}

export function journeyCreateDraft(
  store: DraftJourneyStore,
  input: { title: string; releaseType: string; primaryArtist?: string; currentStep?: number },
): string {
  const id = `draft-${store.nextId++}`;
  const now = Date.now();
  store.documents.set(id, {
    id,
    title: input.title,
    lifecycle: 'draft',
    status: 'planning',
    version: 1,
    updatedAt: now,
    wizardData: {
      releaseTitle: input.title,
      releaseType: input.releaseType,
      primaryArtist: input.primaryArtist ?? '',
      currentStep: input.currentStep ?? 0,
    },
  });
  return id;
}

export function journeySaveDraft(
  store: DraftJourneyStore,
  id: string,
  wizardData: Record<string, unknown>,
): DraftLike {
  const existing = store.documents.get(id);
  if (!existing) throw new Error('Draft not found');
  if (existing.lifecycle !== 'draft') throw new Error('Not a draft');
  const nextVersion = (existing.version ?? 0) + 1;
  const patch = buildDraftSavePatch(wizardData, nextVersion);
  const updated: DraftLike = {
    ...existing,
    ...patch,
    id,
    lifecycle: 'draft',
    updatedAt: Date.now(),
    wizardData,
    version: nextVersion,
    title: (patch.title as string | undefined) ?? existing.title,
  };
  store.documents.set(id, updated);
  return updated;
}

export function journeyListDrafts(store: DraftJourneyStore): DraftLike[] {
  return filterDiscoverableDrafts(Array.from(store.documents.values()));
}

export function journeyResume(store: DraftJourneyStore, id: string): DraftLike {
  const doc = store.documents.get(id);
  if (!doc || doc.lifecycle !== 'draft') throw new Error('Draft not found');
  return doc;
}

export function journeyComplete(store: DraftJourneyStore, id: string): DraftLike {
  const existing = store.documents.get(id);
  if (!existing) throw new Error('Release not found');
  const active: DraftLike = {
    ...existing,
    lifecycle: 'active',
    wizardData: null,
    version: 0,
    updatedAt: Date.now(),
  };
  store.documents.set(id, active);
  return active;
}

export function journeyDelete(store: DraftJourneyStore, id: string): void {
  store.documents.delete(id);
}

export function journeyDocumentCount(store: DraftJourneyStore): number {
  return store.documents.size;
}

export function journeyActiveReleases(store: DraftJourneyStore): DraftLike[] {
  return Array.from(store.documents.values()).filter((d) => d.lifecycle === 'active');
}
