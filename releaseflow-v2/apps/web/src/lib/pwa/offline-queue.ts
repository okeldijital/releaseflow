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

/** Ops collaborators may queue offline. Elevated ops are blocked client-side. */
const COLLABORATOR_ALLOWED_OPS: OfflineOpType[] = [
  'comment',
  'reply',
  'status_update',
  'mark_read',
  'review_request',
  'watch',
  'unwatch',
];

const ELEVATED_OPS: OfflineOpType[] = ['reschedule'];

export async function enqueueOfflineAction(
  type: OfflineOpType,
  payload: Record<string, unknown>,
  meta?: { organizationId?: string; userId?: string },
): Promise<OfflineQueueItem> {
  // AUTH-001 — offline queue asks AuthorizationService before queuing elevated ops.
  if (meta?.organizationId && meta?.userId && ELEVATED_OPS.includes(type)) {
    const { AuthorizationService } = await import('@/lib/auth/authorization-service');
    const allowed = await AuthorizationService.canRescheduleAsync(
      meta.organizationId,
      meta.userId,
    );
    if (!allowed) {
      throw new Error(`Offline queue denied: ${type} (AuthorizationService)`);
    }
  }

  // create/delete release / invite are not OfflineOpType — cannot be queued.
  void COLLABORATOR_ALLOWED_OPS;

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
