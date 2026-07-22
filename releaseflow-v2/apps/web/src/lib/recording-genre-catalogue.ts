/**
 * BUILD-012C — centralized primary genre catalogue for Track recording metadata.
 * Add new genres here only; do not duplicate lists in UI components.
 */
export const RECORDING_GENRE_CATALOGUE = [
  'House',
  'Afro House',
  'Deep House',
  'Tech House',
  'Progressive House',
  'Amapiano',
  'Hip Hop',
  'Trap',
  'R&B',
  'Soul',
  'Pop',
  'Rock',
  'Jazz',
  'Electronic',
  'Dance',
  'Afrobeats',
  'Kwaito',
  'Maskandi',
  'Classical',
  'Other',
] as const;

export type RecordingGenre = (typeof RECORDING_GENRE_CATALOGUE)[number];

export function isRecordingGenre(value: string): boolean {
  return (RECORDING_GENRE_CATALOGUE as readonly string[]).includes(value);
}
