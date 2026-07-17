'use client';

import { useCallback, useEffect, useState } from 'react';
import { estimateOfflineBytes, idbClearAllUserData } from '@/lib/pwa/idb';
import { getMeta } from '@/lib/pwa/offline-data-cache';
import { getSyncHistory, type SyncLogEntry } from '@/lib/pwa/sync-engine';
import { listPendingOfflineQueue } from '@/lib/pwa/offline-queue';
import { useConnectivityStore } from '@/lib/pwa/connectivity';
import { clearServiceWorkerCaches } from '@/lib/pwa/register-sw';
import { Button, LoadingState } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';
import { subscribeToPush } from '@/lib/pwa/register-sw';
import { useAuth } from '@/contexts/auth-context';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(ts: number | null | undefined): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString();
}

export function StoragePanel() {
  const { user } = useAuth();
  const runSync = useConnectivityStore((s) => s.runSync);
  const [loading, setLoading] = useState(true);
  const [bytes, setBytes] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [pending, setPending] = useState(0);
  const [history, setHistory] = useState<SyncLogEntry[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, ls, q, h] = await Promise.all([
        estimateOfflineBytes(),
        getMeta<number>('lastSyncAt'),
        listPendingOfflineQueue(),
        getSyncHistory(),
      ]);
      setBytes(b);
      setLastSync(ls ?? null);
      setPending(q.length);
      setHistory(h.slice(0, 12));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const clearAll = async () => {
    setBusy(true);
    try {
      await idbClearAllUserData();
      await clearServiceWorkerCaches();
      toast.success('Offline data cleared');
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const forceSync = async () => {
    setBusy(true);
    try {
      await runSync();
      toast.success('Synchronization finished');
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const enablePush = async () => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      const sub = await subscribeToPush(user.uid);
      if (sub) toast.success('Push notifications enabled');
      else toast.error('Push requires browser support and VAPID configuration');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-surface-700/60 p-3">
          <p className="text-xs text-text-500 uppercase tracking-wider">Cache size</p>
          <p className="text-surface-100 font-medium mt-1">{formatBytes(bytes)}</p>
        </div>
        <div className="rounded-lg border border-surface-700/60 p-3">
          <p className="text-xs text-text-500 uppercase tracking-wider">Last sync</p>
          <p className="text-surface-100 font-medium mt-1 text-xs">{formatTime(lastSync)}</p>
        </div>
        <div className="rounded-lg border border-surface-700/60 p-3 col-span-2">
          <p className="text-xs text-text-500 uppercase tracking-wider">Queued offline actions</p>
          <p className="text-surface-100 font-medium mt-1">{pending}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void forceSync()} loading={busy}>Force synchronization</Button>
        <Button size="sm" variant="ghost" onClick={() => void clearAll()} loading={busy}>Clear offline data</Button>
        <Button size="sm" variant="ghost" onClick={() => void enablePush()} loading={busy}>Enable push</Button>
      </div>

      <div>
        <p className="text-xs text-text-500 uppercase tracking-wider mb-2">Synchronization history</p>
        {history.length === 0 ? (
          <p className="text-xs text-text-500">No sync activity yet.</p>
        ) : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.map((h) => (
              <li
                key={h.id}
                className="text-xs flex items-center justify-between gap-2 border border-surface-700/40 rounded-md px-2 py-1.5"
              >
                <span className="text-surface-100 truncate">
                  {h.type}
                  {h.conflict ? ' · conflict' : ''}
                  {h.message ? ` — ${h.message}` : ''}
                </span>
                <span className={h.ok ? 'text-success-600' : 'text-danger-500'}>
                  {h.ok ? 'ok' : 'fail'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
