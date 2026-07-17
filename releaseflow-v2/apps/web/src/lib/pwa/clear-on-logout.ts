import { idbClearAllUserData } from './idb';
import { clearServiceWorkerCaches } from './register-sw';

/** Part 19 — Logout clears offline queue, sensitive caches, user-specific data. */
export async function clearOfflineDataOnLogout(): Promise<void> {
  try {
    await idbClearAllUserData();
  } catch {
    /* ignore */
  }
  try {
    await clearServiceWorkerCaches();
  } catch {
    /* ignore */
  }
}
