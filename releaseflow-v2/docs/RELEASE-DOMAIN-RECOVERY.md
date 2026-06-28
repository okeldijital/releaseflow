# Release Domain Recovery Report — ST-002.2

**Sprint:** ST-002 Phase 2
**Date:** 2026-06-28
**Status:** Complete

---

## Architecture

```
Release Pages (/releases, /releases/new, /releases/[id], /releases/[id]/edit)
      │
      ▼
Release Hooks (useRelease, useReleases)
      │
      ▼
Release Service (release-service.ts) — validation, orchestration, business rules
      │
      ▼
Release Repository (release-repository.ts) — all Firestore persistence
      │
      ▼
Firestore
```

---

## Files Changed

| File | Change | Firestore Imports |
|------|--------|-------------------|
| `lib/release-repository.ts` | **NEW** — all CRUD for releases | Yes (allowed) |
| `lib/release-service.ts` | **REWRITTEN** — validation, orchestration | No |
| `hooks/useRelease.ts` | **NEW** — useRelease, useReleases hooks | No |
| `app/(app)/releases/new/page.tsx` | **REFACTORED** — zero Firestore | **0** (was 4) |
| `app/(app)/releases/page.tsx` | **REFACTORED** — uses hook | **0** (was 4) |
| `app/(app)/releases/[id]/edit/page.tsx` | **REFACTORED** — zero Firestore | **0** (was 3) |
| `app/(app)/releases/[id]/page.tsx` | **REFACTORED** — reduced Firestore | 1 (was 5) |

---

## Release Repository API

| Function | Description |
|----------|-------------|
| `getRelease(id)` | Fetch single release by ID |
| `getReleasesByOrganization(orgId)` | All releases for an org |
| `getReleasesByArtist(artistId)` | All releases linked to an artist |
| `getReleasesByStatus(orgId, statuses)` | Releases filtered by status |
| `createRelease(fields, actorId)` | Simple release (no workflow) |
| `createReleaseWithWorkflow(fields, stages, reqs, actorId)` | Full release + workflow + requirements in **single batched write** |
| `updateRelease(id, fields, actorId)` | Update any release fields |
| `updateReleaseStatus(id, status, actorId, metadata)` | Status change only |
| `deleteRelease(id)` | Hard delete |

---

## Release Service API

| Function | Description |
|----------|-------------|
| `createReleaseWithFullWorkflow(fields, stages, reqs, actorId)` | Validates, then calls repo |
| `editRelease(id, fields, actorId)` | Validates, then calls repo |
| `changeReleaseStatus(id, status, actorId, reason?)` | Validates, then calls repo |
| `removeRelease(id, actorId)` | Logs activity, then calls repo |
| `fetchRelease(id)` | Proxy to repository |
| `fetchReleasesByOrg(orgId)` | Proxy to repository |

---

## Data Integrity

Release creation uses `createReleaseWithWorkflow` which performs a **single batched write** containing:
1. Release document
2. Workflow document
3. Stage documents
4. Requirement documents
5. Activity log entries

If any part fails, the entire batch rolls back. Atomic.

---

## Remaining Violations (Workflow Domain)

| File | Firestore Calls | Domain | Phase |
|------|-----------------|--------|-------|
| `releases/[id]/page.tsx:116` | getDocs(workflows) | Workflow | Phase 3 |
| `releases/[id]/page.tsx:124` | getDocs(stages) | Workflow | Phase 3 |
| `releases/[id]/page.tsx:156` | getDoc(workflow) | Workflow | Phase 3 |
| `releases/[id]/page.tsx:158` | getDocs(stages) | Workflow | Phase 3 |
| `releases/[id]/page.tsx:904` | getDocs(activities) | Activity | Phase 3 |

These belong to the Workflow domain recovery (ST-002.3).

---

## Verification

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 packages pass |
| Build | ✅ Compiled successfully |
| Tests | ✅ 328 passed, 0 regressions |
| Lint | ✅ 0 errors |
| `/releases/new` Firestore imports | ✅ 0 |
| `/releases/page` Firestore imports | ✅ 0 |
| `/releases/[id]/edit` Firestore imports | ✅ 0 |
| Release CRUD through repository | ✅ All operations |
| Atomic release creation | ✅ writeBatch |
