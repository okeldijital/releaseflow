/**
 * Canonical track.duration / track.previewStartTime are total seconds (number).
 * UI display / input uses M:SS or MM:SS.
 */

/** Parse MM:SS including 00:00. Returns seconds or null if invalid. */
export function parseTimeInput(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match || match[1] === undefined || match[2] === undefined) return null;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  if (mins > 99) return null;
  return mins * 60 + secs;
}

/** Parse user duration input (M:SS / MM:SS) → seconds, or null if invalid. Rejects 0:00. */
export function parseDurationInput(value: string): number | null {
  const seconds = parseTimeInput(value);
  if (seconds === null) return null;
  if (seconds === 0) return null;
  return seconds;
}

/** Format seconds for display as M:SS (e.g. 3:42, 0:45). Empty if null/undefined. */
export function formatDurationDisplay(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '';
  if (seconds === 0) return '0:00';
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
export const PREVIEW_START_INVALID_MESSAGE = 'Invalid time format. Use mm:ss (e.g. 1:18)';
export const PREVIEW_START_BEFORE_DURATION_MESSAGE =
  'Preview start time must be earlier than the track duration.';
