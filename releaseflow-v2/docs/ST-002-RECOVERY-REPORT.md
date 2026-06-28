# ST-002 Architecture Recovery Report

**Sprint:** ST-002
**Phase:** 1–10 (Phase 1 execution)
**Date:** 2026-06-28
**Status:** In Progress

---

## Phase 1 — Repository Recovery — Firestore Call Audit

### Categorization

| File | Layer | Firestore Calls | Allowed | Action |
|------|-------|-----------------|---------|--------|
| `app/(app)/layout.tsx` | Presentation | getDocs, getDoc, query, where | **NO** | Move to OrganizationRepository |
| `app/(app)/releases/[id]/page.tsx` | Presentation | getDoc, deleteDoc, getDocs, query, where | **NO** | Already uses services; 3 remaining direct calls |
| `app/(app)/releases/[id]/edit/page.tsx` | Presentation | getDoc, updateDoc | **NO** | Move to ReleaseService |
| `app/(app)/releases/new/page.tsx` | Presentation | writeBatch, doc, setDoc | **NO** | Move to ReleaseService.createRelease() |
| `app/(app)/releases/page.tsx` | Presentation | getDocs, query, where | **NO** | Move to ReleaseRepository |
| `app/(app)/artists/[id]/page.tsx` | Presentation | getDocs, getDoc, query | **NO** | Already uses artist-service; 2 remaining direct calls |
| `app/(app)/organizations/page.tsx` | Presentation | addDoc, getDocs, getDoc, updateDoc, deleteDoc | **NO** | Move to OrganizationService |
| `app/(app)/campaigns/[id]/page.tsx` | Presentation | getDoc | **NO** | Already uses campaign-service |
| `app/(app)/campaigns/page.tsx` | Presentation | getDocs, query | **NO** | Move to CampaignRepository |
| `app/(app)/campaigns/new/page.tsx` | Presentation | getDocs, query | **NO** | Move to CampaignRepository |
| `app/(app)/budgets/page.tsx` | Presentation | getDocs, query | **NO** | Move to BudgetRepository |
| `app/(app)/brief/page.tsx` | Presentation | getDocs, query (6 calls) | **NO** | Move to BriefRepository |
| `app/(app)/contributor/page.tsx` | Presentation | getDocs, query | **NO** | Move to TaskRepository |
| `app/(app)/approvals/page.tsx` | Presentation | getDoc | **NO** | Already uses approval-service |
| `app/(onboarding)/onboarding/page.tsx` | Presentation | addDoc, getDocs, query | **NO** | Move to OrganizationService |
| `stores/role-store.ts` | State | getDocs, query, where | **NO** | Move to MembershipRepository |
| `hooks/useOperationsCenter.ts` | Orchestration | getDocs, query, where (15 calls) | **NO** | Move to OperationsRepository |
| `components/command-palette.tsx` | Presentation | getDocs, query, where | **NO** | Move to Release/Artist/Campaign Repositories |

### `lib/` Services (Repository Layer — ALLOWED)

| File | Firestore Calls | Status |
|------|-----------------|--------|
| `artist-service.ts` | addDoc, updateDoc, getDoc, getDocs, query | Repository |
| `alert-engine.ts` | getDocs, addDoc, query, updateDoc | Domain Engine (should use repository) |
| `workflow-progression.ts` | getDocs, query, updateDoc | Service + Repository |
| `asset-service.ts` | addDoc, getDocs, deleteDoc | Repository |
| `dependency-service.ts` | addDoc, getDocs, updateDoc, query | Repository |
| `requirement-service.ts` | addDoc, getDocs, query, updateDoc | Repository |
| `deliverable-service.ts` | addDoc, getDocs, query, updateDoc | Repository |
| `resource-service.ts` | addDoc, getDocs, query, updateDoc | Repository |
| `workflow-service.ts` | addDoc, updateDoc | Service + Repository |
| `campaign-service.ts` | addDoc, getDocs, query, updateDoc | Repository |
| `approval-service.ts` | addDoc, getDocs, query, updateDoc | Repository |
| `release-service.ts` | updateDoc | Minimal repo |
| `task-service.ts` | addDoc, updateDoc, deleteDoc, getDoc, getDocs, query | Repository |
| `notification-service.ts` | addDoc, updateDoc, getDocs, query | Repository |
| `rights-service.ts` | addDoc, getDocs, getDoc, query | Repository |
| `distribution-service.ts` | addDoc, getDocs, getDoc, query, updateDoc | Repository |
| `budget-service.ts` | addDoc, getDocs, query, updateDoc | Repository |
| `recommendation-engine.ts` | getDocs, query (many) | Domain Engine (should use repositories) |
| `rule-engine.ts` | getDocs, query (many) | Domain Engine (should use repositories) |
| `integrity-validator.ts` | getDocs, query | Diagnostic |
| `query-analyzer.ts` | getDocs, query | Diagnostic |
| `baseline-metrics.ts` | getDocs, query | Diagnostic |
| `firebase.ts` | initializeFirebase | Infrastructure |

### Target Repository Map

| Repository | Collections | Status |
|------------|-------------|--------|
| ReleaseRepository | releases | EXISTS (release-service.ts) |
| WorkflowRepository | workflows, stages | EXISTS (workflow-service.ts + workflow-progression.ts) |
| TaskRepository | tasks, comments | EXISTS (task-service.ts) |
| ArtistRepository | artists, release_artists, track_credits | EXISTS (artist-service.ts) |
| OrganizationRepository | organizations, memberships | PARTIAL (inlined in pages) |
| MembershipRepository | memberships | PARTIAL (inlined in store) |
| DeliverableRepository | deliverables | EXISTS (deliverable-service.ts) |
| DependencyRepository | dependencies | EXISTS (dependency-service.ts) |
| DistributionRepository | distribution_packages | EXISTS (distribution-service.ts) |
| RightsRepository | rights_holders, release_ownerships, track_ownerships | EXISTS (rights-service.ts) |
| CampaignRepository | campaigns, campaign_tasks | EXISTS (campaign-service.ts) |
| ApprovalRepository | approval_requests | EXISTS (approval-service.ts) |
| BudgetRepository | release_budgets, cost_items | EXISTS (budget-service.ts) |
| AssetRepository | asset_references | EXISTS (asset-service.ts) |
| RequirementRepository | release_requirements | EXISTS (requirement-service.ts) |
| NotificationRepository | notifications | EXISTS (notification-service.ts) |
| ActivityRepository | activities | MISSING — inlined in pages |
| OperationsRepository | releases, alerts, stages, dependencies, tasks, budgets, campaigns, activities | MISSING — in useOperationsCenter hook |
| AlertRepository | operational_alerts | EXISTS (alert-engine.ts) |
| ResourceRepository | resource_assignments | EXISTS (resource-service.ts) |
| OrganizationRepository | organizations, memberships | **MISSING** |
| **OrganizationRepository** | organizations, memberships | **MISSING** |

---

## Phase 2 — Service Audit

| Service | Used | Duplicate | Dead | Missing | Status |
|---------|------|-----------|------|---------|--------|
| artist-service | ✅ | No | | | OK |
| alert-engine | ✅ | No | | | Repository calls directly |
| approval-service | ✅ | No | | | OK |
| asset-service | ✅ | No | | | OK |
| baseline-metrics | ✅ | No | | Diagnostic | OK |
| budget-service | ✅ | No | | | OK |
| campaign-service | ✅ | No | | | OK |
| deliverable-service | ✅ | No | | | OK |
| dependency-health | ✅ | No | | | OK |
| dependency-service | ✅ | No | | | OK |
| distribution-service | ✅ | No | | | OK |
| env-validator | ✅ | No | | | OK |
| integrity-validator | ✅ | No | | Diagnostic | OK |
| notification-service | ✅ | No | | | OK |
| permission-audit | ✅ | No | | | OK |
| performance-review | ? | No | ? | | INVESTIGATE |
| query-analyzer | ✅ | No | | Diagnostic | OK |
| readiness-engine | ✅ | No | | | OK |
| recommendation-engine | ✅ | No | | | OK |
| release-service | ✅ | No | | Minimal | OK |
| requirement-service | ✅ | No | | | OK |
| requirement-templates | ✅ | No | | | OK |
| resource-service | ✅ | No | | | OK |
| rights-service | ✅ | No | | | OK |
| rule-engine | ✅ | No | | | OK |
| security-audit | ? | No | ? | | INVESTIGATE |
| task-progress | ✅ | No | | | OK |
| task-service | ✅ | No | | | OK |
| utils | ✅ | No | | | OK |
| workflow-health | ✅ | No | | | OK |
| workflow-progress | ✅ | No | | | OK |
| workflow-progression | ✅ | No | | | OK |
| workflow-service | ✅ | No | | | OK |
| workflow-templates | ✅ | No | | | OK |
| **OrganizationService** | | | | **MISSING** | NEED |
| **ActivityService** | | | | **MISSING** | NEED |

---

## Phase 3 — State Ownership

| Store | Owner | Consumers | Persistence | Status |
|-------|-------|-----------|-------------|--------|
| org-store.ts | AppLayout | 13 components | None (in-memory) | ACTIVE |
| role-store.ts | AppLayout | role-checking code | None (in-memory) | ACTIVE |
| toast-store.ts | ToastContainer | Toast system | None (in-memory) | ACTIVE |

**Issue**: `role-store.ts` calls Firestore directly (`getDocs`, `query`, `where` on `memberships` collection). This is a Phase 1 violation.

---

## Phase 4 — Hook Audit

| Hook | Firestore Calls | Violation | Status |
|------|-----------------|-----------|--------|
| useOperationsCenter.ts | 15 getDocs/query/where | **YES** | Critical |
| use-keyboard-shortcuts.ts | None | No | OK |
| use-optimistic.ts | None | No | OK |

---

## Phase 5 — Domain Audit

The canonical types are in `app/(app)/types.ts` (423 lines). The `lib/` services return raw Firestore data cast to these types. Validation is minimal — data is cast with `as Type` rather than validated through a schema.

**Status**: Types are in one place. No divergence. No runtime validation layer.

---

## Phase 6 — Authentication Audit

**Login flow**: Firebase Auth → `auth-context.tsx` → AppLayout → redirects
**Logout**: `firebaseSignOut()` → no state cleanup
**Sign-out cleanup gaps**:
- `org-store` never resets `activeOrgId` or `orgsLoaded`
- `role-store` never resets `role`
- No cache clearing on sign-out

---

## Phase 7 — Security Audit

### Secrets
No committed secrets found in source. Firebase config uses environment variables.

### Firestore Rules
No Firestore rules file found. **P0 gap**.

### Middleware
`app/middleware.ts` exists but is a basic pass-through. Does not protect `(app)` routes.

### Authorization
Repositories/services receive `organizationId` from client-side code (Zustand store). No server-side verification of org membership on writes.

---

## Phase 8 — Data Flow

Current flow (violations):

```
Login → Router → AppLayout (Firestore) → Page (Firestore) → Hook (Firestore)
                                  ↓
                            Store (Firestore)
```

Target flow:

```
Login → Router → AppLayout → Page → Hook → Service → Repository → Firebase
```

---

## Phase 9 — Dead Code Audit

Files to investigate:
- `performance-review.ts` — unused?
- `security-audit.ts` — unused?
- `config` package — empty

---

## Phase 10 — Architecture Enforcement

Guardrails needed:
- ESLint rule: no `firebase/firestore` imports in `app/`, `components/`, `hooks/`, `stores/`
- ESLint rule: no `collection(`, `doc(`, `query(` in presentation layer
