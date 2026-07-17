/**
 * CE-008 — Background synchronization of offline queue.
 * Replays ops in original order. Failures are logged; remaining ops continue.
 * Conflict rules: comments append; status/review/reschedule server-wins on failure.
 */

import {
  listPendingOfflineQueue,
  removeOfflineQueueItem,
  updateOfflineQueueItem,
  type OfflineQueueItem,
} from './offline-queue';
import { idbPut, idbGetAll } from './idb';
import { setMeta } from './offline-data-cache';

export type SyncStatus = 'idle' | 'syncing' | 'complete' | 'failed';

export interface SyncLogEntry {
  id: string;
  at: number;
  opId: string;
  type: string;
  ok: boolean;
  message?: string;
  conflict?: boolean;
}

export interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
  conflicts: number;
  status: SyncStatus;
}

type OpHandler = (item: OfflineQueueItem) => Promise<{ ok: boolean; conflict?: boolean; message?: string }>;

const handlers: Partial<Record<OfflineQueueItem['type'], OpHandler>> = {};

/** Register a handler for an offline op type (called from app bootstrap). */
export function registerOfflineHandler(
  type: OfflineQueueItem['type'],
  handler: OpHandler,
): void {
  handlers[type] = handler;
}

async function logSync(entry: Omit<SyncLogEntry, 'id' | 'at'>): Promise<void> {
  const row: SyncLogEntry = {
    id: `sl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    ...entry,
  };
  await idbPut('sync_log', row);
  // keep last 100
  const all = await idbGetAll<SyncLogEntry>('sync_log');
  if (all.length > 100) {
    const sorted = all.sort((a, b) => a.at - b.at);
    for (const old of sorted.slice(0, all.length - 100)) {
      const { idbDelete } = await import('./idb');
      await idbDelete('sync_log', old.id);
    }
  }
}

export async function getSyncHistory(): Promise<SyncLogEntry[]> {
  const all = await idbGetAll<SyncLogEntry>('sync_log');
  return all.sort((a, b) => b.at - a.at);
}

let syncing = false;

export async function processOfflineQueue(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, succeeded: 0, failed: 0, conflicts: 0, status: 'failed' };
  }
  if (syncing) {
    return { processed: 0, succeeded: 0, failed: 0, conflicts: 0, status: 'syncing' };
  }
  syncing = true;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let conflicts = 0;

  try {
    const pending = await listPendingOfflineQueue();
    for (const item of pending) {
      processed++;
      item.status = 'processing';
      item.attempts += 1;
      await updateOfflineQueueItem(item);

      const handler = handlers[item.type];
      if (!handler) {
        // No handler registered — keep pending for later, don't discard
        item.status = 'pending';
        item.lastError = 'No handler registered';
        await updateOfflineQueueItem(item);
        failed++;
        await logSync({ opId: item.id, type: item.type, ok: false, message: 'No handler' });
        continue;
      }

      try {
        const result = await handler(item);
        if (result.ok) {
          await removeOfflineQueueItem(item.id);
          succeeded++;
          await logSync({
            opId: item.id,
            type: item.type,
            ok: true,
            conflict: result.conflict,
            message: result.message,
          });
          if (result.conflict) conflicts++;
        } else {
          // Server wins for status/review/reschedule — drop conflicting local op
          const serverWins = ['status_update', 'review_request', 'reschedule'].includes(item.type);
          if (result.conflict && serverWins) {
            await removeOfflineQueueItem(item.id);
            conflicts++;
            await logSync({
              opId: item.id,
              type: item.type,
              ok: false,
              conflict: true,
              message: result.message ?? 'Server wins',
            });
          } else if (item.type === 'comment' || item.type === 'reply') {
            // Comments append — retry later if failed for network; on conflict still try keep
            item.status = 'failed';
            item.lastError = result.message ?? 'Failed';
            await updateOfflineQueueItem(item);
            failed++;
            await logSync({
              opId: item.id,
              type: item.type,
              ok: false,
              conflict: result.conflict,
              message: result.message,
            });
          } else {
            item.status = 'failed';
            item.lastError = result.message ?? 'Failed';
            await updateOfflineQueueItem(item);
            failed++;
            await logSync({
              opId: item.id,
              type: item.type,
              ok: false,
              message: result.message,
            });
          }
        }
      } catch (e) {
        item.status = 'failed';
        item.lastError = (e as Error).message;
        await updateOfflineQueueItem(item);
        failed++;
        await logSync({
          opId: item.id,
          type: item.type,
          ok: false,
          message: (e as Error).message,
        });
      }
    }

    await setMeta('lastSyncAt', Date.now());
    await setMeta('lastSyncResult', { processed, succeeded, failed, conflicts });

    const status: SyncStatus =
      failed > 0 && succeeded === 0 ? 'failed' : failed > 0 ? 'complete' : 'complete';
    return { processed, succeeded, failed, conflicts, status };
  } finally {
    syncing = false;
  }
}

export function isSyncing(): boolean {
  return syncing;
}
