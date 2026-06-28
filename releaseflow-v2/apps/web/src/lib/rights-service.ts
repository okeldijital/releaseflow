import {
  createRightsHolder, getRightsHolders, getRightsHolder,
  addReleaseOwnership, getReleaseOwnerships,
  addTrackOwnership, getTrackOwnerships,
} from './rights-repository';
import type { RightsHolderRecord, ReleaseOwnershipRecord, TrackOwnershipRecord } from './rights-repository';

export type { RightsHolderRecord, ReleaseOwnershipRecord, TrackOwnershipRecord } from './rights-repository';

export interface OwnershipValidation {
  valid: boolean;
  masterPct: number;
  publishingPct: number;
  mechanicalPct: number;
  neighbouringPct: number;
  issues: string[];
}

export async function addRightsHolder(
  name: string,
  type: string,
  contact?: string,
  territory?: string,
): Promise<string> {
  if (!name.trim()) throw new Error('Rights holder name is required');
  return createRightsHolder(name.trim(), type, contact, territory);
}

export async function fetchRightsHolders(): Promise<RightsHolderRecord[]> {
  return getRightsHolders();
}

export async function fetchRightsHolder(id: string): Promise<RightsHolderRecord | null> {
  return getRightsHolder(id);
}

export async function addOwnership(
  releaseId: string,
  rightsHolderId: string,
  ownershipType: string,
  percentage: number,
): Promise<string> {
  if (percentage <= 0 || percentage > 100) throw new Error('Percentage must be between 1 and 100');
  const existing = await getReleaseOwnerships(releaseId);
  const typeTotal = sumByType(existing, ownershipType);
  if (typeTotal + percentage > 100) throw new Error(`Total ${ownershipType} ownership would exceed 100%`);
  return addReleaseOwnership(releaseId, rightsHolderId, ownershipType, percentage);
}

export async function fetchReleaseOwnerships(releaseId: string): Promise<ReleaseOwnershipRecord[]> {
  return getReleaseOwnerships(releaseId);
}

export async function addTrackOwnershipEntry(
  trackId: string,
  rightsHolderId: string,
  ownershipType: string,
  percentage: number,
): Promise<string> {
  if (percentage <= 0 || percentage > 100) throw new Error('Percentage must be between 1 and 100');
  return addTrackOwnership(trackId, rightsHolderId, ownershipType, percentage);
}

export async function fetchTrackOwnerships(trackId: string): Promise<TrackOwnershipRecord[]> {
  return getTrackOwnerships(trackId);
}

export async function validateReleaseOwnership(releaseId: string): Promise<OwnershipValidation> {
  const ownerships = await getReleaseOwnerships(releaseId);

  const masterTotal = sumByType(ownerships, 'master');
  const publishingTotal = sumByType(ownerships, 'publishing');
  const mechanicalTotal = sumByType(ownerships, 'mechanical');
  const neighbouringTotal = sumByType(ownerships, 'neighbouring');

  const issues: string[] = [];

  if (masterTotal > 0 && masterTotal !== 100) {
    issues.push(`Master: ${masterTotal}% (needs 100%)`);
  }
  if (publishingTotal > 0 && publishingTotal !== 100) {
    issues.push(`Publishing: ${publishingTotal}% (needs 100%)`);
  }
  if (masterTotal === 0 && publishingTotal === 0) {
    issues.push('No ownership defined');
  }

  return {
    valid: issues.length === 0 && (ownerships.length > 0),
    masterPct: masterTotal,
    publishingPct: publishingTotal,
    mechanicalPct: mechanicalTotal,
    neighbouringPct: neighbouringTotal,
    issues,
  };
}

export async function validateTrackOwnership(trackId: string): Promise<OwnershipValidation> {
  const ownerships = await getTrackOwnerships(trackId);

  const masterTotal = sumByType(ownerships, 'master');
  const publishingTotal = sumByType(ownerships, 'publishing');

  const issues: string[] = [];
  if (masterTotal > 0 && masterTotal !== 100) issues.push(`Master: ${masterTotal}% (needs 100%)`);
  if (publishingTotal > 0 && publishingTotal !== 100) issues.push(`Publishing: ${publishingTotal}% (needs 100%)`);
  if (masterTotal === 0 && publishingTotal === 0) issues.push('No ownership defined');

  return {
    valid: issues.length === 0 && (ownerships.length > 0),
    masterPct: masterTotal,
    publishingPct: publishingTotal,
    mechanicalPct: 0,
    neighbouringPct: 0,
    issues,
  };
}

export function getRightsReadiness(result: OwnershipValidation): { ready: boolean; blockers: string[] } {
  return {
    ready: result.valid,
    blockers: result.issues,
  };
}

function sumByType(items: { ownershipType: string; percentage: number }[], type: string): number {
  return items.filter((i) => i.ownershipType === type).reduce((sum, i) => sum + i.percentage, 0);
}
