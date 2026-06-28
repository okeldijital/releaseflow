# Architecture Verification — ST-003-101

**Date:** 2026-06-28
**Status:** Complete

---

## Target Architecture

```
Presentation   app/          Pages, components — composition only
     │
Application    hooks/        Orchestration — loading, errors, refresh
     │
Domain         lib/*service  Business logic, validation, computation
     │
Repository     lib/*reposit  All Firestore persistence
     │
Infrastructure lib/firebase   getDb(), getAuthInstance()
     │
Firebase       Firestore, Auth
```

---

## Import Graph — Recovered Domains

### Organization Domain
```
app/(app)/layout.tsx
    → stores/org-store.ts           (state)
    → stores/role-store.ts          (state)
    → lib/organization-repository.ts (repository) ← firebase/firestore
```

### Release Domain
```
app/(app)/releases/page.tsx
    → hooks/useRelease.ts
        → lib/release-service.ts
            → lib/release-repository.ts ← firebase/firestore

app/(app)/releases/new/page.tsx
    → lib/release-service.ts
        → lib/release-repository.ts ← firebase/firestore

app/(app)/releases/[id]/page.tsx         ← 0 Firestore imports
    → hooks/useWorkflow.ts
        → lib/workflow-service.ts
            → lib/workflow-repository.ts ← firebase/firestore
    → hooks/useRelease.ts
        → lib/release-service.ts
            → lib/release-repository.ts ← firebase/firestore

app/(app)/releases/[id]/edit/page.tsx
    → lib/release-service.ts
        → lib/release-repository.ts ← firebase/firestore
```

### Workflow/Activity Domain
```
hooks/useWorkflow.ts
    → lib/workflow-service.ts
        → lib/workflow-repository.ts ← firebase/firestore

lib/workflow-progression.ts
    → lib/workflow-repository.ts ← firebase/firestore
    → lib/workflow-progress.ts   (computation, 0 Firestore)
    → lib/workflow-health.ts     (computation, 0 Firestore)
```

---

## Violation Map

### Remaining Firestore in Presentation Layer (10 files)

| File | Firestore Calls | Priority | Phase |
|------|-----------------|----------|-------|
| `app/(app)/organizations/page.tsx` | 10 (addDoc, getDocs, getDoc, updateDoc, deleteDoc) | P1 | Organization domain |
| `app/(app)/contributor/page.tsx` | 2 (getDocs, query) | P2 | Contributor domain |
| `app/(app)/budgets/page.tsx` | 2 (getDocs, query) | P2 | Budget domain |
| `app/(app)/brief/page.tsx` | 6 (getDocs, query) | P2 | Brief domain |
| `app/(app)/artists/[id]/page.tsx` | 2 (getDocs, getDoc) | P1 | Artist domain |
| `app/(app)/campaigns/new/page.tsx` | 1 (getDocs) | P2 | Campaign domain |
| `app/(app)/campaigns/[id]/page.tsx` | 1 (getDoc) | P2 | Campaign domain |
| `app/(app)/campaigns/page.tsx` | 2 (getDocs, query) | P2 | Campaign domain |
| `app/(app)/approvals/page.tsx` | 1 (getDoc) | P2 | Approval domain |
| `app/(onboarding)/onboarding/page.tsx` | 2 (addDoc, getDocs) | P1 | Organization domain |

### Remaining Firestore in Hooks (1 file)

| File | Firestore Calls | Priority |
|------|-----------------|----------|
| `hooks/useOperationsCenter.ts` | 15 (getDocs, query, where) | P0 |

### Remaining Firestore in Components (1 file)

| File | Firestore Calls | Priority |
|------|-----------------|----------|
| `components/command-palette.tsx` | 3 (getDocs, query) | P2 |

### Remaining Firestore in Stores (0 files)

All stores are clean. ✅

---

## Recovered vs Unrecovered

| Layer | Total Files | Recovered | Unrecovered | Recovery % |
|-------|-------------|-----------|-------------|------------|
| Pages | 16 | 6 | 10 | 37.5% |
| Hooks | 3 | 2 | 1 | 66.7% |
| Stores | 3 | 3 | 0 | 100% |
| Components | 6 | 5 | 1 | 83.3% |
| Repositories | 3 | 3 | 0 | 100% |
| Services | 18 | 18 | 0 | 100% |

---

## Architecture Scorecard

| Rule | Status |
|------|--------|
| Pages never import Firestore | ⚠️ 6/16 pages recovered |
| Hooks never import Firestore | ⚠️ 2/3 hooks recovered |
| Stores never import Firestore | ✅ 3/3 recovered |
| Components never import Firestore | ⚠️ 5/6 recovered |
| Repositories are the only Firestore layer | ✅ All `lib/` with Firestore are repositories |
| Services contain only business logic | ✅ All services delegate to repositories |
| Domain-ui components contain no Firestore | ✅ Verified |
| UI package contains no Firestore | ✅ Verified |
