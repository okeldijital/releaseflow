/**
 * BUILD-015A — Canonical ReleaseCard view model.
 *
 * Every page that renders ReleaseCard must obtain models via this mapper
 * (or a release-service method that uses it). No page-level assembly.
 *
 * Firestore → Release Service → ReleaseCardModel → ReleaseCard
 */
import type { ReleaseRecord } from './release-repository';
import type { Artwork } from './artwork/artwork-types';
import { getArtworksByReleaseIds } from './artwork/artwork-repository';
import type { WizardDraftData } from '@/components/release/wizard/release-wizard-types';

/**
 * Fully populated release for presentation.
 * Same shape as ReleaseRecord with artwork always resolved (null if none).
 */
export type ReleaseCardModel = ReleaseRecord & {
  artwork: Artwork | null;
  /** Precomputed 0–100 for consistent progress display across pages */
  cardProgress: number;
  /** Metadata line segment (stage / lifecycle label) */
  cardStageLabel: string;
};

function draftCompletion(wizardData: Record<string, unknown> | null | undefined): number {
  if (!wizardData) return 0;
  const wd = wizardData as Partial<WizardDraftData>;
  let completed = 0;
  const total = 7;
  if (wd.releaseTitle?.trim()) completed++;
  if (wd.hasArtwork !== null || wd.commissionArtwork !== null) completed++;
  if (wd.tracks?.some((t: { title: string }) => t.title.trim())) completed++;
  if (wd.primaryArtist || wd.featuredArtists?.length) completed++;
  if (wd.recordLabel || wd.upc || wd.primaryGenre) completed++;
  if (wd.promoAssets?.length || wd.socialRows?.some((r: { url: string }) => r.url)) completed++;
  if (wd.hasEmail !== null) completed++;
  return Math.round((completed / total) * 100);
}

function draftStageLabel(wizardData: Record<string, unknown> | null | undefined): string {
  if (!wizardData) return 'Draft';
  const wd = wizardData as Partial<WizardDraftData>;
  const idx = typeof wd.currentStep === 'number' ? wd.currentStep : 0;
  const keys = ['type', 'details', 'artwork', 'tracks', 'release_info', 'promotion', 'email', 'review'];
  const labels: Record<string, string> = {
    type: 'Release Type',
    details: 'Details',
    artwork: 'Artwork',
    tracks: 'Tracks',
    release_info: 'Release Info',
    promotion: 'Promotion',
    email: 'Email',
    review: 'Review',
  };
  return labels[keys[idx] ?? ''] ?? 'Draft';
}

export function computeCardProgress(release: Pick<ReleaseRecord, 'lifecycle' | 'status' | 'wizardData'>): number {
  if (release.lifecycle === 'draft') return draftCompletion(release.wizardData);
  if (release.status === 'released' || release.lifecycle === 'archived') return 100;
  if (release.status === 'cancelled') return 0;
  const map: Record<string, number> = {
    planning: 15,
    in_production: 45,
    on_hold: 40,
    ready_for_distribution: 85,
    released: 100,
    archived: 100,
  };
  return map[release.status] ?? 50;
}

export function computeCardStageLabel(
  release: Pick<ReleaseRecord, 'lifecycle' | 'status' | 'wizardData'>,
): string {
  if (release.lifecycle === 'draft') return draftStageLabel(release.wizardData);
  if (release.status === 'released') return 'Released';
  if (release.lifecycle === 'archived') return 'Archived';
  const stage = release.status.replace(/_/g, ' ');
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

/**
 * Map a repository record + optional artwork into the canonical card model.
 * No Firestore I/O.
 */
export function toReleaseCardModel(
  release: ReleaseRecord,
  artwork?: Artwork | null,
): ReleaseCardModel {
  return {
    ...release,
    artwork: artwork !== undefined ? artwork : (release.artwork ?? null),
    cardProgress: computeCardProgress(release),
    cardStageLabel: computeCardStageLabel(release),
  };
}

/**
 * Canonical enrichment: batch-load artwork and map to ReleaseCardModel[].
 * Used by Dashboard drafts, Releases catalogue, and all list fetchers.
 */
export async function toReleaseCardModels(
  organizationId: string,
  releases: ReleaseRecord[],
): Promise<ReleaseCardModel[]> {
  if (releases.length === 0) return [];
  const ids = releases.map((r) => r.id);
  const artworks = await getArtworksByReleaseIds(organizationId, ids);
  const map = new Map<string, Artwork>();
  for (const a of artworks) {
    if (!map.has(a.releaseId)) map.set(a.releaseId, a);
  }
  return releases.map((r) => toReleaseCardModel(r, map.get(r.id) ?? null));
}
