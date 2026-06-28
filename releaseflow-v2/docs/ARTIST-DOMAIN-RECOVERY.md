# Artist Domain Recovery Report — ST-004.1

**Sprint:** ST-004 Phase 1
**Date:** 2026-06-28
**Status:** Complete

---

## Architecture Achieved

```
/artists, /artists/new, /artists/[id]  (0 Firestore imports)
      │
      ▼
useArtist() + useArtists()  ← hooks/useArtist.ts
      │
      ▼
artist-service.ts  ← validation, business logic, readiness
      │
      ▼
artist-repository.ts  ← all Firestore persistence
      │
      ▼
Firestore
```

---

## Files Changed

| File | Change | Firestore |
|------|--------|-----------|
| `lib/artist-repository.ts` | **NEW** — all CRUD for artists, releases, credits | Yes (allowed) |
| `lib/artist-service.ts` | **REWRITTEN** — delegates to repository, adds validation | 0 |
| `hooks/useArtist.ts` | **NEW** — useArtist, useArtists hooks | 0 |
| `app/(app)/artists/page.tsx` | **REFACTORED** — uses useArtists hook | 0 |
| `app/(app)/artists/new/page.tsx` | **REFACTORED** — uses createNewArtist | 0 |
| `app/(app)/artists/[id]/page.tsx` | **REWRITTEN** — uses useArtist hook | **0** (was 5) |
| `__tests__/artist-service.test.ts` | **UPDATED** — matches new API | N/A |

---

## ArtistRepository API

| Function | Description |
|----------|-------------|
| `createArtist(fields)` | Create artist with slug, timestamps |
| `updateArtist(id, fields)` | Partial update with slug auto-generation |
| `deleteArtist(id)` | Hard delete |
| `getArtist(id)` | Fetch by ID |
| `getArtists(limit)` | List all, sorted by name |
| `getArtistsByRelease(releaseId)` | All artists on a release |
| `getArtistReleases(artistId)` | Release list with title, role, status |
| `getCreditsByArtist(artistId)` | Track credits for artist |
| `getTrackTitle(trackId)` | Track title lookup |

---

## ArtistService API

| Function | Description |
|----------|-------------|
| `createNewArtist(fields)` | Validates name, delegates to repo |
| `editArtist(id, fields)` | Delegates to repo |
| `removeArtist(id)` | Hard delete |
| `fetchArtist(id)` | Proxy to repo |
| `fetchArtists()` | Proxy to repo |
| `fetchArtistReleases(id)` | Proxy to repo |
| `fetchCreditsByArtist(id)` | Proxy to repo |
| `fetchTrackTitle(id)` | Proxy to repo |
| `checkArtistReadiness(id)` | Pure business logic — profile completeness scoring |

---

## Verification

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 packages |
| Build | ✅ Compiled |
| Tests | ✅ 327 passed (20/20 files) |
| `/artists` Firestore | ✅ 0 |
| `/artists/new` Firestore | ✅ 0 |
| `/artists/[id]` Firestore | ✅ 0 |
| Artist hook Firestore | ✅ 0 |
| Artist service Firestore | ✅ 0 |

---

## Core Domains Recovered

```
✅ Organization  → organization-repository.ts
✅ Release       → release-repository.ts
✅ Workflow      → workflow-repository.ts
✅ Artist        → artist-repository.ts
```

All four follow: **Page → Hook → Service → Repository → Firestore**
