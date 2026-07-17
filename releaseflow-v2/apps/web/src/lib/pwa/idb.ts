/**
 * Minimal IndexedDB helpers for CE-008 offline storage.
 * Never stores auth tokens or secrets.
 */

const DB_NAME = 'releaseflow-offline';
const DB_VERSION = 1;

export type OfflineStoreName =
  | 'queue'
  | 'assignments'
  | 'notifications'
  | 'schedule'
  | 'meta'
  | 'sync_log';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('queue')) {
        const q = db.createObjectStore('queue', { keyPath: 'id' });
        q.createIndex('createdAt', 'createdAt', { unique: false });
        q.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('assignments')) {
        db.createObjectStore('assignments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('schedule')) {
        db.createObjectStore('schedule', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('sync_log')) {
        const s = db.createObjectStore('sync_log', { keyPath: 'id' });
        s.createIndex('at', 'at', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
  });
}

export async function idbPut<T>(store: OfflineStoreName, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGet<T>(store: OfflineStoreName, key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetAll<T>(store: OfflineStoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function idbDelete(store: OfflineStoreName, key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbClear(store: OfflineStoreName): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbClearAllUserData(): Promise<void> {
  const stores: OfflineStoreName[] = [
    'queue', 'assignments', 'notifications', 'schedule', 'meta', 'sync_log',
  ];
  for (const s of stores) {
    try {
      await idbClear(s);
    } catch {
      /* ignore */
    }
  }
}

export async function estimateOfflineBytes(): Promise<number> {
  if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage?.estimate) {
    const est = await navigator.storage.estimate();
    return est.usage ?? 0;
  }
  // Fallback: rough count of records
  try {
    const stores: OfflineStoreName[] = ['queue', 'assignments', 'notifications', 'schedule', 'sync_log'];
    let n = 0;
    for (const s of stores) {
      const all = await idbGetAll(s);
      n += JSON.stringify(all).length;
    }
    return n;
  } catch {
    return 0;
  }
}
