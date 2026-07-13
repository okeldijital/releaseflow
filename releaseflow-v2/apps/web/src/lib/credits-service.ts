import type { TrackCredit } from '@/app/(app)/types';
import {
  getCreditsByTrack,
  addTrackCredit,
  removeTrackCredit,
} from './credit-repository';

export type { TrackCredit };

export async function addCreditToTrack(
  trackId: string,
  _orgId: string,
  name: string,
  role: string,
): Promise<void> {
  if (!trackId) throw new Error('Track ID is required');
  if (!role.trim()) throw new Error('Credit role is required');
  if (!name.trim()) throw new Error('Credit name is required');

  return addTrackCredit(trackId, { role: role.trim(), name: name.trim() });
}

export async function removeCredit(trackId: string, index: number): Promise<void> {
  if (!trackId) throw new Error('Track ID is required');
  return removeTrackCredit(trackId, index);
}

export async function fetchCreditsByTrack(trackId: string): Promise<TrackCredit[]> {
  if (!trackId) throw new Error('Track ID is required');
  return getCreditsByTrack(trackId);
}
