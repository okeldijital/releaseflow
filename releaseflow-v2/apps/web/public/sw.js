/* ReleaseFlow Service Worker — CE-008
 * Connectivity only. No business logic.
 * Caches: static shell, artwork (LRU-ish), navigation offline fallback.
 */

const SW_VERSION = 'rf-sw-v1.0.0';
const STATIC_CACHE = `${SW_VERSION}-static`;
const ARTWORK_CACHE = `${SW_VERSION}-artwork`;
const DATA_CACHE = `${SW_VERSION}-data`;
const ARTWORK_MAX = 80;
const DATA_MAX = 60;

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('rf-sw-') && !k.startsWith(SW_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isArtworkUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes('cloudinary.com')
      || u.hostname.includes('res.cloudinary')
      || /\/(artwork|image|upload)\//i.test(u.pathname)
    );
  } catch {
    return false;
  }
}

function isStaticAsset(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    return (
      u.pathname.startsWith('/_next/static/')
      || u.pathname.startsWith('/icons/')
      || u.pathname.endsWith('.css')
      || u.pathname.endsWith('.js')
      || u.pathname.endsWith('.woff2')
      || u.pathname === '/manifest.webmanifest'
    );
  } catch {
    return false;
  }
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  const remove = keys.length - max;
  for (let i = 0; i < remove; i++) {
    await cache.delete(keys[i]);
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      if (maxEntries) await trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        await cache.put(request, response.clone());
        if (maxEntries) await trimCache(cacheName, maxEntries);
      }
      return response;
    })
    .catch(() => null);
  if (hit) {
    networkPromise.catch(() => {});
    return hit;
  }
  const net = await networkPromise;
  return net || new Response('', { status: 503, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;

  // Never cache auth / API secrets / invitation tokens
  if (
    url.includes('/api/')
    || url.includes('identitytoolkit')
    || url.includes('securetoken')
    || url.includes('googleapis.com/identitytoolkit')
    || url.includes('/invite/')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isArtworkUrl(url)) {
    event.respondWith(cacheFirst(request, ARTWORK_CACHE, ARTWORK_MAX));
    return;
  }

  // Same-origin JSON-ish app data — short-lived SWR (not auth)
  try {
    const u = new URL(url);
    if (u.origin === self.location.origin && u.pathname.startsWith('/_next/data/')) {
      event.respondWith(staleWhileRevalidate(request, DATA_CACHE, DATA_MAX));
    }
  } catch {
    /* ignore */
  }
});

/* ── Push delivery (CE-006 subscriptions) ─────────────────────────── */

self.addEventListener('push', (event) => {
  let payload = { title: 'ReleaseFlow', body: 'You have a new notification', data: {} };
  try {
    if (event.data) {
      const json = event.data.json();
      payload = {
        title: json.title || payload.title,
        body: json.body || json.message || payload.body,
        data: json.data || json,
      };
    }
  } catch {
    try {
      payload.body = event.data ? event.data.text() : payload.body;
    } catch { /* ignore */ }
  }

  const data = payload.data || {};
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data,
      tag: data.entityId || data.assignmentId || 'rf-notification',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let path = '/notifications';
  const assignmentId = data.assignmentId || (data.entityType === 'assignment' || data.entityType === 'task' ? data.entityId : null);
  if (assignmentId) path = `/assignments/${assignmentId}`;
  else if (data.url) path = data.url;
  else if (data.entityType === 'release' && data.entityId) path = `/releases/${data.entityId}`;

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(path);
          else client.postMessage({ type: 'RF_NAVIGATE', path });
          return;
        }
      }
      await self.clients.openWindow(path);
    })(),
  );
});

/* ── Messages from app ────────────────────────────────────────────── */

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'RF_SKIP_WAITING') {
    self.skipWaiting();
  }
  if (data.type === 'RF_CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('rf-sw-')).map((k) => caches.delete(k)))),
    );
  }
  if (data.type === 'RF_GET_VERSION') {
    event.ports?.[0]?.postMessage({ version: SW_VERSION });
  }
});

/* Background Sync tag — app performs actual sync; SW only re-notifies */
self.addEventListener('sync', (event) => {
  if (event.tag === 'rf-offline-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const c of clients) c.postMessage({ type: 'RF_SYNC_REQUESTED' });
      }),
    );
  }
});
