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

export function suggestRemixDisplayTitle(trackTitle: string, remixerName: string): string {
  const title = trackTitle.trim();
  const remixer = remixerName.trim();
  if (!title || !remixer) return title;
  return `${title} (${remixer} Remix)`;
}

export function countRecordingTypes(
  tracks: { recordingType?: unknown; title?: string }[],
): { originals: number; remixes: number } {
  const valid = tracks.filter((t) => (t.title ?? '').trim());
  return {
    originals: valid.filter((t) => resolveRecordingType(t.recordingType) === 'original').length,
    remixes: valid.filter((t) => resolveRecordingType(t.recordingType) === 'remix').length,
  };
}