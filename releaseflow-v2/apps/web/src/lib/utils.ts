import { Timestamp } from '@firebase/firestore';

export function fmtDate(ts: unknown): string {
  if (!ts) return '';
  if (ts instanceof Timestamp) return ts.toDate().toLocaleDateString();
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts) return new Date((ts as { seconds: number }).seconds * 1000).toLocaleDateString();
  if (typeof ts === 'string') return new Date(ts).toLocaleDateString();
  return '';
}
