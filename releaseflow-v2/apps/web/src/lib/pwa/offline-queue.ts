/**
 * CE-008 — Offline action queue (local IndexedDB only).
 * Operations are replayed in order when online. No business logic here.
 */

import { idbDelete, idbGetAll, idbPut } from './idb';

export type OfflineOpType =
  | 'comment'
  | 'reply'
  | 'status_update'
  | 'mark_read'
  | 'review_request'
  | 'watch'
  | 'unwatch'
  | 'reschedule';

export type OfflineOpStatus = 'pending' | 'processing' | 'failed' | 'done';

export interface OfflineQueueItem {
  id: string;
  type: OfflineOpType;
  payload: Record<string, unknown>;
  createdAt: number;
  status: OfflineOpStatus;
  attempts: number;
  lastError?: string | null;
  organizationId?: string;
  userId?: string;
}

function newId(): string {
  return `oq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueueOfflineAction(
  type: OfflineOpType,
  payload: Record<string, unknown>,
  meta?: { organizationId?: string; userId?: string },
): Promise<OfflineQueueItem> {
  const item: OfflineQueueItem = {
    id: newId(),
    type,
    payload,
    createdAt: Date.now(),
    status: 'pending',
    attempts: 0,
    lastError: null,
    organizationId: meta?.organizationId,
    userId: meta?.userId,
  };
  await idbPut('queue', item);
  return item;
}

export async function listOfflineQueue(): Promise<OfflineQueueItem[]> {
  const all = await idbGetAll<OfflineQueueItem>('queue');
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function listPendingOfflineQueue(): Promise<OfflineQueueItem[]> {
  const all = await listOfflineQueue();
  return all.filter((i) => i.status === 'pending' || i.status === 'failed');
}

export async function updateOfflineQueueItem(item: OfflineQueueItem): Promise<void> {
  await idbPut('queue', item);
}

export async function removeOfflineQueueItem(id: string): Promise<void> {
  await idbDelete('queue', id);
}

export async function clearOfflineQueue(): Promise<void> {
  const all = await listOfflineQueue();
  for (const i of all) await idbDelete('queue', i.id);
}
