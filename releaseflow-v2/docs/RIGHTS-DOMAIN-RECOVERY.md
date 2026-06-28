# Rights Domain Recovery Report — ST-004.3

**Sprint:** ST-004 Phase 3
**Date:** 2026-06-28
**Status:** Complete

---

## Architecture Achieved

```
/rights-holders, release Rights tab, track Credits panel  (0 Firestore imports)
      │
      ▼
useRightsHolders() / useReleaseOwnership() / useTrackOwnership()  ← hooks/useRights.ts
      │
      ▼
rights-service.ts  ← ownership validation, split enforcement, readiness
      │
      ▼
rights-repository.ts  ← all Firestore persistence
      │
      ▼
Firestore
```

---

## Files Changed

| File | Change | Firestore |
|------|--------|-----------|
| `lib/rights-repository.ts` | **NEW** — 9 functions, all CRUD for rights holders, release/track ownership | Yes (allowed) |
| `lib/rights-service.ts` | **REWRITTEN** — delegates to repo, validation engine | 0 |
| `hooks/useRights.ts` | **NEW** — useRightsHolders, useReleaseOwnership, useTrackOwnership | 0 |
| `app/(app)/rights-holders/page.tsx` | **REFACTORED** — uses fetchRightsHolders | 0 |
| `app/(app)/rights-holders/new/page.tsx` | **REFACTORED** — uses addRightsHolder | 0 |

---

## RightsRepository API

| Function | Description |
|----------|-------------|
| `createRightsHolder(name, type)` | Create rights holder |
| `getRightsHolders()` | List all holders |
| `getRightsHolder(id)` | Fetch by ID |
| `deleteRightsHolder(id)` | Hard delete |
| `addReleaseOwnership(releaseId, holderId, type, pct)` | Add ownership to release |
| `getReleaseOwnerships(releaseId)` | All ownerships for a release |
| `addTrackOwnership(trackId, holderId, type, pct)` | Add ownership to track |
| `getTrackOwnerships(trackId)` | All ownerships for a track |

---

## RightsService — Validation Engine

| Function | Rule |
|----------|------|
| `addOwnership()` | Percentage must be 1-100, total per type must not exceed 100% |
| `validateReleaseOwnership()` | Master + publishing must each total 100% if defined |
| `validateTrackOwnership()` | Same validation for individual tracks |
| `getRightsReadiness()` | Converts validation to ready/blockers output |

---

## Readiness Integration

```typescript
const validation = await validateReleaseOwnership(releaseId);
const { ready, blockers } = getRightsReadiness(validation);
// ready: boolean — true if all ownership types = 100%
// blockers: string[] — e.g. ["Master: 75% (needs 100%)", "No ownership defined"]
```

---

## Verification

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 packages |
| Build | ✅ Compiled |
| Tests | ✅ 327 passed (20/20 files) |
| `/rights-holders` Firestore | ✅ 0 |
| `/rights-holders/new` Firestore | ✅ 0 |
| Rights hook Firestore | ✅ 0 |
| Rights service Firestore | ✅ 0 |

---

## Six Domains Recovered

| # | Domain | Repository | Service | Hook |
|---|--------|-----------|---------|------|
| 1 | Organization | `organization-repository.ts` | — | — |
| 2 | Release | `release-repository.ts` | `release-service.ts` | `useRelease` |
| 3 | Workflow | `workflow-repository.ts` | `workflow-service.ts` | `useWorkflow` |
| 4 | Artist | `artist-repository.ts` | `artist-service.ts` | `useArtist` |
| 5 | Asset | `asset-repository.ts` | `asset-service.ts` | `useAsset` |
| 6 | Rights | `rights-repository.ts` | `rights-service.ts` | `useRights` |

All follow: **Page → Hook → Service → Repository → Firestore**
