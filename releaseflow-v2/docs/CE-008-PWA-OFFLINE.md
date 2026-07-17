# CE-008 — Progressive Web App & Offline Foundation

**Status:** Implemented  
**Date:** 2026-07-17  
**Prerequisites:** CE-001 … CE-007

---

## Part 1 — Audit

```
Browser → React (Next.js App Router) → Firestore (client SDK)
                                    → Cloudinary (artwork URLs)
```

| Safely cacheable | Never cache |
|---|---|
| Static JS/CSS/fonts/icons/shell | Firebase Auth tokens / JWT |
| Offline HTML shell | Invitation tokens / links |
| Release artwork (read-only, LRU) | Permissions / session secrets |
| Recently viewed assignments, notifications, schedule snapshots (IndexedDB, short TTL) | Full org dumps, admin data |

---

## Architecture Summary

### Service Worker (`public/sw.js`)

- **Only connectivity**: static precache, navigation network-first + offline fallback, artwork cache-first (trim), static cache-first, push display, notification click routing, version invalidate.
- **No business logic** — sync is performed in the app via IndexedDB queue + handlers.

### Offline architecture

```
User action (offline)
  → offline-queue (IndexedDB)
  → Background Sync tag / online event
  → sync-engine (ordered replay)
  → domain services (comment, mark_read, …)
  → Firestore + activity/events
```

### Caches

| Cache | Contents | Policy |
|---|---|---|
| `rf-sw-v*-static` | shell, icons, manifest, offline.html, `/_next/static` | Versioned; wipe on activate |
| `rf-sw-v*-artwork` | Cloudinary images | Cache-first; max ~80 entries |
| `rf-sw-v*-data` | `/_next/data` (if used) | SWR; max ~60 |
| IndexedDB `assignments` | Recent assignment snapshots | 24h TTL; max 40/user |
| IndexedDB `notifications` | Recent inbox | 12h TTL |
| IndexedDB `schedule` | Last schedule snapshot | 6h TTL |
| IndexedDB `queue` | Offline ops | Until synced / logout |

### Push

- SW `push` + `notificationclick` → deep-link `/assignments/{id}` when payload includes assignment entity.
- Client `subscribeToPush` stores subscription via CE-006 `push_subscriptions` when `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set.

### Conflict resolution

| Op | Rule |
|---|---|
| comment / reply | Append (retry on failure) |
| status_update / review_request / reschedule | Server wins on conflict; drop local op |
| mark_read | Best-effort |

---

## Synchronization Model

1. Queue ops with stable `createdAt` order.  
2. On online / SW sync message: `processOfflineQueue()`.  
3. One failure does not stop the rest.  
4. Results written to `sync_log`.  
5. UI banner: Online / Offline / Synchronizing / Sync Complete / Sync Failed.

---

## File Summary

### New

| Path | Purpose |
|---|---|
| `public/manifest.webmanifest` | Web App Manifest |
| `public/sw.js` | Service Worker |
| `public/offline.html` | Offline navigation fallback |
| `public/icons/*` | 192/512 + maskable icons |
| `src/lib/pwa/*` | IDB, queue, cache, sync, install, SW register |
| `src/components/pwa/*` | Banner, install, storage, bootstrap |
| `src/__tests__/pwa-offline.test.ts` | Unit tests |
| `docs/CE-008-PWA-OFFLINE.md` | This document |

### Modified

| Path | Purpose |
|---|---|
| `app/layout.tsx` | Manifest / theme / icons metadata |
| `next.config.ts` | SW + manifest headers |
| `components/app-providers.tsx` | PWA bootstrap |
| `app/(app)/layout.tsx` | Clear offline data on logout |
| `app/(app)/profile/page.tsx` | Storage + Install |
| `hooks/useAssignment.ts` | Cache + offline fallback |
| `notifications/page.tsx` | Cache + offline read/mark |
| `schedule/page.tsx` | Cache + offline schedule |
| `assignment-comments-panel.tsx` | Offline comment queue |

---

## Validation

| Check | Result |
|---|---|
| TypeScript | Pass |
| Lint | Pass (pre-existing warnings only) |
| Tests | **571 passed** (incl. `pwa-offline.test.ts`) |
| Production build | Pass |
| Lighthouse PWA | Run against production HTTPS deploy (manifest + SW + icons present) |

## Acceptance

- [x] Installable PWA (manifest + icons + install UI)  
- [x] Service Worker registered  
- [x] Offline shell (`offline.html` + precache)  
- [x] Offline assignments / schedule / notifications  
- [x] Offline queue + ordered sync  
- [x] Conflict rules without silent overwrite  
- [x] Push handlers + deep links  
- [x] Connection status always visible when relevant  
- [x] Profile storage management  
- [x] Logout clears user offline data  
- [x] Version update prompt (no forced refresh mid-work)  
