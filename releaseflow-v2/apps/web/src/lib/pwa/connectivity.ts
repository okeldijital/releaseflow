'use client';

import { create } from 'zustand';
import { processOfflineQueue, type SyncStatus } from './sync-engine';
import { listPendingOfflineQueue } from './offline-queue';

export type ConnectionState = 'online' | 'offline' | 'synchronizing' | 'sync_complete' | 'sync_failed';

interface ConnectivityState {
  online: boolean;
  connectionState: ConnectionState;
  pendingCount: number;
  lastSyncAt: number | null;
  lastMessage: string | null;
  setOnline: (online: boolean) => void;
  setConnectionState: (s: ConnectionState) => void;
  refreshPending: () => Promise<void>;
  runSync: () => Promise<SyncStatus>;
}

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionState: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
  pendingCount: 0,
  lastSyncAt: null,
  lastMessage: null,

  setOnline: (online) => {
    set({
      online,
      connectionState: online ? 'online' : 'offline',
    });
  },

  setConnectionState: (connectionState) => set({ connectionState }),

  refreshPending: async () => {
    try {
      const pending = await listPendingOfflineQueue();
      set({ pendingCount: pending.length });
    } catch {
      set({ pendingCount: 0 });
    }
  },

  runSync: async () => {
    if (!get().online) {
      set({ connectionState: 'offline', lastMessage: 'Offline — sync deferred' });
      return 'failed';
    }
    set({ connectionState: 'synchronizing', lastMessage: 'Synchronizing…' });
    try {
      const result = await processOfflineQueue();
      await get().refreshPending();
      if (result.failed > 0 && result.succeeded === 0) {
        set({
          connectionState: 'sync_failed',
          lastSyncAt: Date.now(),
          lastMessage: `${result.failed} item(s) failed`,
        });
        return 'failed';
      }
      const conflictNote = result.conflicts > 0 ? ` · ${result.conflicts} conflict(s)` : '';
      set({
        connectionState: result.failed > 0 ? 'sync_failed' : 'sync_complete',
        lastSyncAt: Date.now(),
        lastMessage:
          result.processed === 0
            ? 'Up to date'
            : `Synced ${result.succeeded}/${result.processed}${conflictNote}`,
      });
      // Return to online after brief complete state
      if (result.failed === 0) {
        window.setTimeout(() => {
          if (get().connectionState === 'sync_complete') {
            set({ connectionState: 'online' });
          }
        }, 2500);
      }
      return result.status;
    } catch (e) {
      set({
        connectionState: 'sync_failed',
        lastMessage: (e as Error).message,
      });
      return 'failed';
    }
  },
}));

export function initConnectivityListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onOnline = () => {
    useConnectivityStore.getState().setOnline(true);
    void useConnectivityStore.getState().runSync();
  };
  const onOffline = () => {
    useConnectivityStore.getState().setOnline(false);
  };

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  void useConnectivityStore.getState().refreshPending();

  // SW background sync ping
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'RF_SYNC_REQUESTED') {
      void useConnectivityStore.getState().runSync();
    }
    if (event.data?.type === 'RF_NAVIGATE' && typeof event.data.path === 'string') {
      window.location.href = event.data.path;
    }
  };
  navigator.serviceWorker?.addEventListener('message', onMessage);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    navigator.serviceWorker?.removeEventListener('message', onMessage);
  };
}
