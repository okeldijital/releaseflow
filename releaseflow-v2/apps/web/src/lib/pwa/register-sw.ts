/**
 * CE-008 — Service Worker registration + version detection.
 */

export const SW_SCRIPT = '/sw.js';

export interface SwRegistrationResult {
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

let updateAvailable = false;
const listeners = new Set<(available: boolean) => void>();

export function onSwUpdateAvailable(cb: (available: boolean) => void): () => void {
  listeners.add(cb);
  cb(updateAvailable);
  return () => listeners.delete(cb);
}

function notifyUpdate(available: boolean) {
  updateAvailable = available;
  for (const cb of listeners) cb(available);
}

export async function registerServiceWorker(): Promise<SwRegistrationResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { registration: null, updateAvailable: false };
  }

  // Dev: still register so offline can be tested; skip only if explicitly disabled
  if (process.env.NEXT_PUBLIC_DISABLE_SW === '1') {
    return { registration: null, updateAvailable: false };
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_SCRIPT, { scope: '/' });

    if (registration.waiting) {
      notifyUpdate(true);
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          notifyUpdate(true);
        }
      });
    });

    // Periodic update check
    window.setInterval(() => {
      void registration.update();
    }, 60 * 60 * 1000);

    return { registration, updateAvailable };
  } catch (e) {
    console.warn('[PWA] SW registration failed — app continues online', e);
    return { registration: null, updateAvailable: false };
  }
}

export async function applyServiceWorkerUpdate(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: 'RF_SKIP_WAITING' });
    // Reload when the new SW takes control
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.location.reload();
      },
      { once: true },
    );
  } else {
    window.location.reload();
  }
}

export async function clearServiceWorkerCaches(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  reg?.active?.postMessage({ type: 'RF_CLEAR_CACHES' });
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('rf-sw-')).map((k) => caches.delete(k)));
  }
}

export async function requestBackgroundSync(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    // Background Sync is not in all TS libs
    const syncManager = (reg as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    }).sync;
    if (syncManager) {
      await syncManager.register('rf-offline-sync');
    }
  } catch {
    /* unsupported — app will sync on online event */
  }
}

export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (!('PushManager' in window) || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      // Application server key may be configured later; try without for user-gesture install of subscription API
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        // Store readiness without actual subscription until VAPID configured
        return null;
      }
      const key = urlBase64ToUint8Array(vapid);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key as BufferSource,
      });
    }
    const json = sub.toJSON();
    const { upsertPushSubscription } = await import('@/lib/push-subscriptions-repository');
    await upsertPushSubscription({
      userId,
      endpoint: sub.endpoint,
      keys: {
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
      },
      platform: 'web',
    });
    return sub;
  } catch (e) {
    console.warn('[PWA] Push subscribe failed', e);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
