import { RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import { fmtDate } from '@/lib/utils';
import type { Release } from '@/app/(app)/types';

export function buildReleaseMetadataItems(release: Release): string[] {
  const items: string[] = [];

  if (release.releaseType) {
    items.push(RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType);
  }
  if (release.language) {
    items.push(release.language);
  }
  if (release.explicit) {
    items.push('Explicit');
  }
  if (release.targetReleaseDate) {
    items.push(fmtDate(release.targetReleaseDate));
  }
  if (release.label) {
    items.push(release.label);
  }

  return items;
}

export function formatReleaseMetadata(release: Release): string {
  return buildReleaseMetadataItems(release).join(' • ');
}
