'use client';

import { useConnectivityStore } from '@/lib/pwa/connectivity';

const styles: Record<string, string> = {
  online: 'hidden',
  offline: 'bg-warning-500/15 text-warning-600 border-warning-500/30',
  synchronizing: 'bg-info-500/15 text-info-400 border-info-500/30',
  sync_complete: 'bg-success-500/15 text-success-600 border-success-500/30',
  sync_failed: 'bg-danger-500/15 text-danger-500 border-danger-500/30',
};

const labels: Record<string, string> = {
  online: 'Online',
  offline: 'Offline — changes will sync when you reconnect',
  synchronizing: 'Synchronizing…',
  sync_complete: 'Sync complete',
  sync_failed: 'Sync failed — will retry',
};

export function ConnectionStatusBanner() {
  const connectionState = useConnectivityStore((s) => s.connectionState);
  const lastMessage = useConnectivityStore((s) => s.lastMessage);
  const pendingCount = useConnectivityStore((s) => s.pendingCount);
  const runSync = useConnectivityStore((s) => s.runSync);

  if (connectionState === 'online' && pendingCount === 0) return null;

  const state = connectionState === 'online' && pendingCount > 0 ? 'sync_failed' : connectionState;
  const cls = styles[state] ?? styles.offline;
  if (cls === 'hidden') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-0 z-[60] border-b px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 ${cls}`}
    >
      <span>
        {labels[state] ?? state}
        {lastMessage && state !== 'offline' ? ` · ${lastMessage}` : ''}
        {pendingCount > 0 && state === 'offline' ? ` · ${pendingCount} queued` : ''}
      </span>
      {(state === 'sync_failed' || pendingCount > 0) && connectionState !== 'offline' ? (
        <button
          type="button"
          className="underline underline-offset-2 shrink-0"
          onClick={() => void runSync()}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
