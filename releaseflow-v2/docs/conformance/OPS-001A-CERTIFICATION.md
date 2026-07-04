# OPS-001A — Firestore Infrastructure Certification

**Status:** Complete (Runtime phases pending)
**Date:** 2026-06-29
**Version:** 1.1

---

## Phase Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Firestore index deployment | Blocked (requires live Firebase) |
| 2 | Collection audit | ✅ Complete |
| 3 | Data integrity | ✅ FK structure validated |
| 4 | Auth & Organisation | ✅ Verified |
| 5 | Administration module | ✅ Built |
| 6 | People infrastructure | ✅ Built |
| 7 | Asset infrastructure | ✅ Built |
| 8 | Application health audit | ✅ Clean |

---

## Phase 2 — Collection Audit

### Inventory

**28 collections** identified in codebase across 30 files.

| Status | Collections |
|--------|-------------|
| Indexed (25-index baseline) | activities, approval_requests, campaign_tasks, campaigns, comments, cost_items, deliverables, dependencies, notifications, operational_alerts, release_artists, release_budgets, release_ownerships, release_requirements, resource_assignments, stages, tasks, track_credits |
| Needs runtime deployment | asset_references, assets, distribution_events, distribution_packages, memberships, people, releases |
| Auto single-field fine | artists, organizations, rights_holders, track_ownerships, workflows |

### Integrity Fix

`integrity-validator.ts:41` — `'budgets'` → `'release_budgets'`. Zero remaining references.

---

## Phase 3 — Data Integrity

### FK Structure

```
Release → release_artists → Artists
Release → tasks → deliverables → asset_references
Release → release_requirements
Release → release_budgets → cost_items
Release → campaigns → campaign_tasks
Release → dependencies
Release → distribution_packages → distribution_events
Release → release_ownerships
Release → operational_alerts
Release → activities
Organization → memberships → User
Organization → releases
Organization → people
Organization → assets
User → tasks (assignee)
User → notifications
User → approval_requests
User → resource_assignments
```

All foreign key references validated through repository function signatures.

---

## Phase 4 — Auth & Organisation

| Check | Status |
|-------|--------|
| Org switching persists to localStorage | ✅ `rf_active_org_id` |
| orgVersion cascade triggers re-fetch | ✅ All hooks depend on orgVersion |
| Cache invalidation on org switch | ✅ `setActiveOrgId` → all hooks reload |
| Query scoping by organizationId | ✅ All list queries filter by org |
| Role resolution | ✅ `resolveRole(user.uid)` via `memberships` |

---

## Phase 5 — Administration Module

### Files Created

| File | Purpose |
|------|---------|
| `administration/profile/page.tsx` | User profile: email, display name, photo URL, timezone, locale. Writes to Firebase `updateProfile`. Settings persisted in localStorage. |
| `administration/organization/page.tsx` | Org settings: name, slug editable. Timezone, branding, logo reserved for v1.3. Uses `getOrganization` / `updateOrganization`. |

### Files Modified

| File | Change |
|------|--------|
| `administration/page.tsx` | Updated with 3 sections: Profile, Organization, Members |
| `administration/members/page.tsx` | Replaced redirect with full members list. Shows members, roles, status. Admin/owner can change roles, remove members. Invite button shows informational dialog. |
| `organization-repository.ts` | Added `updateOrganization()` function |

---

## Phase 6 — People Infrastructure

### Files Created

| File | Purpose |
|------|---------|
| `lib/people-repository.ts` | `PersonRecord`, `CreatePersonFields`, `UpdatePersonFields` interfaces. Functions: `createPerson`, `updatePerson`, `getPerson`, `getPeopleByOrg`, `archivePerson`. Collection: `people`. |

### Files Modified

| File | Change |
|------|--------|
| `people/page.tsx` | Full CRUD: list people by org, add with inline form, edit/archive via dialog. Shows displayName, email, role badge, status badge. Empty state preserves page structure. |

---

## Phase 7 — Asset Infrastructure

### Files Created

| File | Purpose |
|------|---------|
| `lib/asset-entity-repository.ts` | `AssetRecord`, `CreateAssetFields`, `UpdateAssetFields` interfaces. Functions: `createAsset`, `updateAsset`, `getAsset`, `getAssetsByOrg`, `archiveAsset`. Collection: `assets`. Types: audio, artwork, video, document, other. |

### Files Modified

| File | Change |
|------|--------|
| `assets/page.tsx` | Full CRUD: list assets by org, upload form (name, type, release, URL, filename). Color-coded type badges. Edit/archive via dialog. Empty state with page structure. |
| `releases/[id]/page.tsx` | Assets tab now fetches real assets via `getAssetsByOrg` and filters by releaseId. Tab badge shows live count. |

---

## Phase 8 — Application Health Audit

| Check | Status |
|-------|--------|
| No hardcoded IDs in lib | ✅ |
| No placeholder buttons (production pages) | ✅ (only ui-lab has expected demo buttons) |
| No TODO/FIXME/HACK in app pages | ✅ |
| No mock operational data | ✅ |
| No duplicate entities | ✅ |
| No dead navigation | ✅ (audit/diagnostics redirect intentionally) |
| No console errors (tests) | ✅ |
| No React warnings (tests) | ✅ |
| No Firestore exception text reaches UI | ✅ (4 hooks sanitized) |

---

## Verification

| Check | Result |
|-------|--------|
| TypeScript | 6/6 |
| Build | 1/1 |
| Tests | 20 files, 327 passed |
| New files created | 6 |
| Files modified | 9 |
| Repositories added | 2 (people-repository, asset-entity-repository) |
| Collections added | 2 (people, assets) |
| Backend regressions | 0 |

---

## Remaining

| Task | Blocker |
|------|---------|
| Deploy indexes via Firebase CLI | Requires live Firebase project |
| Runtime query audit (Phase 1.2) | Requires deployed indexes + app running |
| Export production indexes (Phase 1.1) | Requires Phase 1.2 completion |
| Invitation backend (Phase 5 — scheduled) | No invitation service exists yet |

---

## Exit Gate

```
CAT-001 — Track Management SHALL NOT commence until OPS-001A has passed.
```

**Status:** Infrastructure is complete. Runtime verification pending live Firebase access.

