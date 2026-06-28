# Data Flow Validation Report — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## Target Architecture

```
Presentation          App Router pages, components
     │
     ▼
Application           AppLayout, hooks (useOperationsCenter)
     │
     ▼
Domain                Services (business logic), Engines (computation)
     │
     ▼
Repository            organization-repository, artist-service, etc.
     │
     ▼
Infrastructure        firebase.ts (getDb, getAuthInstance)
     │
     ▼
Firebase              Firestore, Auth, Cloudinary
```

---

## Validated Workflows

### Login → Organization

```
/auth-context (Firebase Auth sign-in)
     │
     ▼
/ (root page) redirects → /dashboard (authenticated)
     │
     ▼
AppLayout
     ├── resolveRole(userId) → role-store
     ├── getOrganizationsByUser(userId) → organization-repository
     │       ↓
     │   setActiveOrgId(data[0].id) → org-store
     │   setOrgsLoaded(true) → org-store
     │
     ▼
Dashboard reads activeOrgId from org-store
```

### Release → Workflow → Distribution → Rights

```
/releases/new
     │
     ▼
release-service (write release doc)
workflow-service (create workflow + stages via writeBatch)
     │
     ▼
/releases/[id]
     ├── getDoc(releases)
     ├── getDocs(workflows)
     ├── getDocs(stages)
     ├── getDocs(tasks)
     ├── getDocs(deliverables)
     ├── getDocs(dependencies)
     ├── getDocs(distribution_packages)
     └── validateReleaseOwnership()
     │
     ▼
Stage completion → workflow-progression.ts
Distribution → distribution-service.ts
Rights → rights-service.ts
```

---

## Current Violations (To Be Resolved)

| Violation | Location | Severity |
|-----------|----------|----------|
| Firestore in page | `releases/[id]/page.tsx:107` (getDoc) | High |
| Firestore in page | `releases/[id]/page.tsx:117` (getDocs) | High |
| Firestore in page | `releases/[id]/page.tsx:197` (deleteDoc) | High |
| Firestore in page | `releases/new/page.tsx:49` (writeBatch) | High |
| Firestore in page | `artists/[id]/page.tsx:62` (getDoc) | Medium |
| Firestore in page | `layout.tsx` (moved to repository) | **FIXED** |
| Firestore in store | `role-store.ts` (moved to repository) | **FIXED** |
| Firestore in hook | `useOperationsCenter.ts` (15 calls) | High |
| Firestore in component | `command-palette.tsx:34` (getDocs) | Medium |

---

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 packages pass |
| Build | ✅ Compiled successfully |
| Tests | ✅ 328 passed, 0 regressions |
| Lint | ✅ 0 errors |
| No console errors | ✅ |
| No hydration warnings | ✅ |
