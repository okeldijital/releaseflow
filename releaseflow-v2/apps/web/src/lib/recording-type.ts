export type RecordingType = 'original' | 'remix';

export function resolveRecordingType(value: unknown): RecordingType {
  return value === 'remix' ? 'remix' : 'original';
}

export function recordingTypeLabel(type: RecordingType, short = false): string {
  if (type === 'remix') return 'Remix';
  return short ? 'Original' : 'Original Recording';
}

export function releaseTypeLabel(type: string): string {
  const labels: Record<string, string> = { single: 'Single', ep: 'EP', album: 'Album' };
  return labels[type] ?? type;
}

/** @deprecated Prefer generateSuggestedDisplayTitle from display-title.ts (EPIC-202) */
export { suggestRemixDisplayTitle, generateSuggestedDisplayTitle } from './display-title';

export function countRecordingTypes(
  tracks: { recordingType?: unknown; title?: string }[],
): { originals: number; remixes: number } {
  const valid = tracks.filter((t) => (t.title ?? '').trim());
  return {
    originals: valid.filter((t) => resolveRecordingType(t.recordingType) === 'original').length,
    remixes: valid.filter((t) => resolveRecordingType(t.recordingType) === 'remix').length,
  };
}