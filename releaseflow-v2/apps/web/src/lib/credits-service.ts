import {
  createCredit,
  updateCredit,
  deleteCredit,
  getCreditsByTrack,
  getCreditsByPerson,
} from './credit-repository';
import type {
  CreditRecord,
} from './credit-repository';

export type { CreditRecord } from './credit-repository';

export async function addCreditToTrack(
  trackId: string,
  orgId: string,
  personId: string,
  creditType: string,
  displayOrder?: number,
  creditName?: string,
): Promise<CreditRecord> {
  if (!trackId) throw new Error('Track ID is required');
  if (!orgId) throw new Error('Organization ID is required');
  if (!personId) throw new Error('Person ID is required');
  if (!creditType.trim()) throw new Error('Credit type is required');

  return createCredit({
    trackId,
    organizationId: orgId,
    personId,
    creditType: creditType.trim(),
    displayOrder,
    creditName: creditName?.trim() || undefined,
    visible: true,
  });
}

export async function removeCredit(creditId: string): Promise<void> {
  if (!creditId) throw new Error('Credit ID is required');
  return deleteCredit(creditId);
}

export async function reorderCredits(trackId: string, creditIds: string[]): Promise<void> {
  if (!trackId) throw new Error('Track ID is required');
  if (!creditIds || creditIds.length === 0) throw new Error('Credit IDs are required');

  for (let i = 0; i < creditIds.length; i++) {
    await updateCredit(creditIds[i]!, { displayOrder: i });
  }
}

export async function verifyCredit(creditId: string): Promise<void> {
  if (!creditId) throw new Error('Credit ID is required');
  return updateCredit(creditId, { verified: true });
}

export async function fetchCreditsByTrack(trackId: string): Promise<CreditRecord[]> {
  if (!trackId) throw new Error('Track ID is required');
  return getCreditsByTrack(trackId);
}

export async function fetchCreditsByPerson(personId: string): Promise<CreditRecord[]> {
  if (!personId) throw new Error('Person ID is required');
  return getCreditsByPerson(personId);
}
