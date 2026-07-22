/**
 * Canonical track.duration is total seconds (number).
 * UI display / input uses M:SS or MM:SS.
 */

/** Parse user duration input (M:SS / MM:SS) → seconds, or null if invalid. */
export function parseDurationInput(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match || match[1] === undefined || match[2] === undefined) return null;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  if (mins > 99) return null;
  if (mins === 0 && secs === 0) return null;
  return mins * 60 + secs;
}

/** Format seconds for display as M:SS (e.g. 3:42, 0:45). Empty if null/0. */
export function formatDurationDisplay(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Format seconds as zero-padded MM:SS (e.g. 03:42). */
export function formatDurationMmSs(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export const DURATION_INVALID_MESSAGE = 'Invalid duration format. Use mm:ss (e.g. 3:45)';
export const DURATION_REQUIRED_MESSAGE = 'Duration is required.';
