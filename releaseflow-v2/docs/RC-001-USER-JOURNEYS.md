# RC-001 — User Journeys

**Date:** 2026-06-28

---

## Journey 1 — Authentication + Organization

```
Route: / → /sign-in (unauthenticated)
Route: / → /dashboard (authenticated)
Data flow: auth-context → AppLayout → org-store + role-store

Status: ✅ PASS
```
- Sign-in guard: `layout.tsx` checks `!loading && !user` → redirects to `/sign-in`
- Org loading: `getOrganizationsByUser()` → `organization-repository.ts`
- Org selector: `<select>` writes `activeOrgId` via `setActiveOrgId()`
- Role resolution: `getUserRole()` → `organization-repository.ts` → `role-store`
- Sign-out cleanup: clears org, role, Firebase session

---

## Journey 2 — Artist Lifecycle

```
Page: /artists/new
Hook: (none — direct service call)
Service: artist-service.ts → createNewArtist()
Repository: artist-repository.ts → createArtist() → addDoc(artists)

Page: /artists/[id]
Hook: useArtist(id) → fetchArtist(), fetchArtistReleases(), fetchCreditsByArtist(), checkArtistReadiness()
Service: artist-service.ts
Repository: artist-repository.ts

Status: ✅ PASS
```
- Edit: Inline form calls `editArtist()` → repository
- Delete: `removeArtist()` → repository (function exists, UI not yet wired)
- All data through hook → service → repository

---

## Journey 3 — Release Lifecycle

```
Page: /releases/new
Service: release-service.ts → createReleaseWithFullWorkflow()
Repository: release-repository.ts → writeBatch (atomic)

Page: /releases/[id]
Hooks: useWorkflow(id), useActivity(id)
Service: release-service.ts, workflow-service.ts
Repository: release-repository.ts, workflow-repository.ts

Status: ✅ PASS
```
- Atomic creation: Release + Workflow + Stages + Requirements + Activity in single writeBatch
- Stage advancement: `stageComplete()` → updates stage + workflow + activity
- Delete: `removeRelease()` → repository
- All data through hooks → services → repositories

---

## Journey 4 — Asset Lifecycle

```
Page: /assets
Repository: asset-repository.ts → addAsset(), getAssetsByRelease(), validateAssetRef()

Status: ✅ PASS
```
- File type validation: 5 categories (artwork, audio, video, document, image)
- Size validation: per-category limits
- Completeness checks: artwork + audio presence detection
- Readiness integration: `getReleaseAssetsSummary()` produces structured blockers

---

## Journey 5 — Rights Lifecycle

```
Page: /rights-holders/new, /rights-holders
Hooks: useRightsHolders(), useReleaseOwnership()
Service: rights-service.ts → addOwnership(), validateReleaseOwnership()
Repository: rights-repository.ts → addReleaseOwnership(), getReleaseOwnerships()

Status: ✅ PASS
```
- Percentage enforcement: 1-100 validation, total per type ≤100%
- Ownership validation: master + publishing must = 100% if defined
- Readiness: `getRightsReadiness()` → structured blockers

---

## Journey 6 — Distribution Lifecycle

```
Tab: Release Workspace → Distribution
Service: distribution-service.ts → checkDistributionReadiness(), generateDistributionPackage()
Repository: distribution-repository.ts → createPackage(), getLatestPackage()

Status: ✅ PASS
```
- 4 dimensions: metadata, deliverables, requirements, dependencies
- Package generation: creates or updates package record
- Event logging: `recordEvent()` for audit trail
- Readiness summary: `getDistributionReadinessSummary()` produces structured blockers

---

## Journey 7 — Operations Center

```
Page: /dashboard
Hook: useOperationsCenter()
Service: operations-center-service.ts → fetchOperationsData()
Repository: release-repository.ts → getReleasesByOrganization()

Status: ✅ PASS
```
- Active Releases: real release data from repository
- Attention Panel: alerts + blocked + deadlines
- Org Pulse: 5 stat cards
- Quick Actions: role-aware via `useRoleStore()`

---

## Journey 8 — Navigation

```
Sidebar: Operations (Home, Releases, Work) / Resources (Artists, Assets, People) / System (Administration)
Topbar: Breadcrumbs, Search, Notifications, Command Palette (⌘K), Org Switcher

Status: ✅ PASS
```
- All routes render without errors
- Breadcrumbs: dynamic from `buildBreadcrumbs(pathname)`
- Command Palette: `⌘K` keyboard shortcut
- Search: wired in Topbar
- Notifications: bell icon with unread count
