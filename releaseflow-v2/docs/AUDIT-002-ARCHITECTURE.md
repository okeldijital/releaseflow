# AUDIT-002 — Architecture

| Field | Value |
|---|---|
| Audit date | 2026-06-28 |
| Audit version | 1.0 |
| Scope | Intended vs. observed architecture; layer and package-boundary violations |

---

## 1. Intended Architecture (from PDS)

The Product Design System (PDS, `docs/Product Design System.md` + `docs/01-bounded-context-map.md` through `docs/72-mobile-validation-pass.md`) declares the following:

### 1.1 Layer model

```
┌─────────────────────────────────────────────────┐
│  UI Layer (packages/ui, packages/domain-ui)     │   Pure presentational; no I/O
├─────────────────────────────────────────────────┤
│  App / Route Layer (apps/web/src/app)           │   Composition + auth-gating only
├─────────────────────────────────────────────────┤
│  Service Layer (apps/web/src/lib)               │   All Firestore reads/writes
├─────────────────────────────────────────────────┤
│  Domain Primitives (types, stores)              │   Schemas; org/role state
├─────────────────────────────────────────────────┤
│  Firestore (firestore.rules)                    │   Source of truth; enforces tenant
└─────────────────────────────────────────────────┘
```

### 1.2 Package boundaries

| Package | Exposes | Imports |
|---|---|---|
| `packages/ui` | Generic components | (nothing in repo) |
| `packages/domain-ui` | Domain-aware components | `@releaseflow/ui` |
| `packages/firebase` | Cloudinary helpers | firebase |
| `packages/shared` | Cross-cutting types | (nothing — empty) |
| `apps/web` | Routes | `@releaseflow/ui`, `@releaseflow/domain-ui`, `@releaseflow/firebase`, internal `lib`, `stores`, `contexts`, `hooks` |

### 1.3 Service layer

PDS §`10-design-system.md` and `21-page-specifications.md`:
> "All Firestore access must go through `lib/*-service.ts` modules. Pages must not import `firebase/firestore` directly. The service layer is the only place that knows the schema, indexes, and security constraints."

### 1.4 Tenant isolation

PDS `08-rbac-matrix.md` and `25-permission-matrix.md`:
> "Every operational collection is scoped to an `organizationId`. The `artists` and `rights_holders` collections are shared reference data; a future `organizationId` is anticipated but not required for v1.0."

### 1.5 Activity log

PDS `61-alert-ux.md`:
> "All mutations to releases, tasks, stages, workflows, etc. must write an `activities` document with `actorId`, `releaseId`, and `metadata`."

---

## 2. Actual Architecture (Observed)

### 2.1 Layer model — observed

```
┌──────────────────────────────────────────────────────────┐
│  UI Layer (packages/ui, packages/domain-ui)              │
├──────────────────────────────────────────────────────────┤
│  App / Route Layer — FIRES FIRESTORE DIRECTLY            │  ← violation
│  (apps/web/src/app/**/page.tsx imports                   │
│   `collection`, `doc`, `getDoc`, `getDocs`, `query`,     │
│   `where`, `writeBatch`, `Timestamp`)                    │
├──────────────────────────────────────────────────────────┤
│  Service Layer (apps/web/src/lib)                        │
│  - Coexists with direct page writes                      │  ← violation
│  - ~45 of ~110 exports are unused                        │
├──────────────────────────────────────────────────────────┤
│  Domain Primitives                                       │
│  - types.ts (27 interfaces)                              │
│  - 3 stores (1 dead, 5 actions dead)                     │
├──────────────────────────────────────────────────────────┤
│  Firestore (firestore.rules)                             │
│  - tenant isolation: NONE (only `releases` is owner-     │  ← violation
│    locked; artists/rights_holders are global)             │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Page → Firestore direct calls (verified)

Every page that calls Firestore directly (bypassing `lib/*-service.ts`):

| File:line | Operation | Notes |
|---|---|---|
| `app/(app)/layout.tsx:130-143` | `getDocs` memberships + `getDoc` orgs | Helper defined inside the layout; belongs in a service |
| `app/(onboarding)/onboarding/page.tsx:43-56` | `addDoc` org + `addDoc` membership | Two writes, no batch — fails open if second fails |
| `app/(app)/organizations/page.tsx:30-39, 64-69` | membership query, `addDoc` org, `addDoc` membership | Same pattern as onboarding |
| `app/(app)/releases/new/page.tsx:8, 49-134` | Full `writeBatch` for release + workflow + stages + requirements + 2 activities | 50+ lines of domain logic in a page |
| `app/(app)/releases/[id]/page.tsx:107-148` | `getDoc` release, `getDocs` workflow, stages, requirements, deliverables, dependencies, distribution, ownership | 5+ collection reads orchestrated in the page |
| `app/(app)/releases/[id]/edit/page.tsx:8, 56-117` | `getDoc` release, `updateDoc` | 10+ fields updated in-page |
| `app/(app)/artists/new/page.tsx:34-50` | `addDoc` | Direct |
| `app/(app)/artists/[id]/page.tsx:60-82` | `getDocs` releases + `getDoc` track in a loop | N+1 |
| `app/(app)/rights-holders/new/page.tsx:25-35` | `addDoc` | Direct |
| `app/(app)/campaigns/page.tsx:30-39` | Releases-by-org query | Direct |
| `app/(app)/campaigns/new/page.tsx:35-36` | Releases-by-org query | Direct |
| `app/(app)/campaigns/[id]/page.tsx:55-62` | `getDoc` campaign + `getDocs` deliverables, campaign_tasks, releases | Direct |
| `app/(app)/budgets/page.tsx:20-39` | Releases-by-org + budgets | Direct |
| `app/(app)/brief/page.tsx:50-75` | Multiple direct queries | Direct |
| `app/(app)/dashboard/page.tsx:88-150` | `useOperationsCenter` orchestrates 5+ reads | Direct |
| `app/(app)/contributor/page.tsx:43-72` | `getDocs` tasks + service calls | Direct |
| `app/(app)/approvals/page.tsx:25-33` | `getDoc` deliverables in a loop | N+1 |
| `app/(app)/audit/page.tsx` | Direct queries for activities, alerts | Direct |
| `app/(app)/diagnostics/page.tsx` | Direct queries | Direct |

**Result**: 19 of 35 page files import `firebase/firestore` directly. The "service layer" is co-located with page-level I/O and inconsistently bypassed.

### 2.3 Service layer — actual state

| Service file | Real callers | Dead exports |
|---|---|---|
| `artist-service.ts` | `createArtist`, `getArtists`, `getArtist`, `updateArtist`, `getCreditsByArtist`, `checkArtistReadiness` | `linkArtistToRelease`, `getArtistsByRelease`, `addTrackCredit`, `getCreditsByTrack` |
| `task-service.ts` | `createTask`, `assignTask`, `unassignTask`, `completeTask`, `getTasksByStage`, `getTasksByAssignee`, `getTasksByRelease` | `updateTask`, `deleteTask`, `addComment`, `getCommentsByTask` |
| `rights-service.ts` | `createRightsHolder`, `getRightsHolders`, `validateReleaseOwnership`, `getReleaseOwnerships` | `getRightsHolder`, `addReleaseOwnership`, `addTrackOwnership`, `getTrackOwnerships`, `validateTrackOwnership` |
| `resource-service.ts` | none | all 6 |
| `budget-service.ts` | `getBudgetSummary`, `computeBudgetHealth` | `initializeBudget`, `addCostItem`, `getCostItemsByRelease`, `recalculateBudget` |
| `deliverable-service.ts` | `getDeliverablesByRelease` | `createDeliverable`, `updateDeliverable`, `approveDeliverable`, `rejectDeliverable`, `archiveDeliverable`, `getDeliverablesByStage`, `getDeliverablesByTask` |
| `dependency-service.ts` | `getDependenciesByRelease`, `getBlockingDependencies` | `createDependency`, `updateDependency` |
| `requirement-service.ts` | `submitRequirement`, `approveRequirement` | `generateRequirementsForRelease`, `resetRequirement` |
| `asset-service.ts` | none | all 3 |
| `notification-service.ts` | `createNotification`, `markAsRead`, `archiveNotification`, `getNotificationsByUser` | `getUnreadCount` |
| `alert-engine.ts` | `generateOrgAlerts` | `generateAlerts`, `resolveAlert` |
| `workflow-service.ts` | `logActivity` | `generateWorkflowForRelease` |
| `approval-service.ts` | `getPendingRequestsByApprover`, `approveRequest`, `rejectRequest` | `createApprovalRequest`, `getDeliverableApprovalStatus` |
| `campaign-service.ts` | `createCampaign`, `activateCampaign`, `completeCampaign`, `getCampaigns`, `getCampaign` | `getCampaignsByRelease` |

---

## 3. Intended vs Actual — Comparison

| Concern | PDS says | Code does | Status |
|---|---|---|---|
| All Firestore access via `lib/*-service.ts` | yes | 19 of 35 pages bypass it | ✗ |
| Pages don't import `firebase/firestore` | yes | 19 pages do | ✗ |
| `artists` org-scoped | "future field; not required for v1" | Confirmed global; cross-org leak | ⚠ |
| `rights_holders` org-scoped | same | Confirmed global; cross-org leak | ⚠ |
| Service layer composes batch operations | implied | 50-line `writeBatch` lives in page | ✗ |
| Service functions used by UI | implied | ~40% of exports dead | ✗ |
| `roles` collection as source of truth | implied (RBAC matrix) | Free `roleId: 'owner'` strings; no docs | ✗ |
| `settings` field on `Organization` | yes | Not on interface (`types.ts:1-7`) | ✗ |
| Activity log: every mutation writes a doc | yes | Several mutations don't (`deleteDoc` on release, all `updateDoc` in edit) | ⚠ |
| Status state machine in service | implied | Page-level transition table `releases/[id]/page.tsx:43-66` | ⚠ |

---

## 4. Layer Violations (file:line)

### 4.1 Page → Firestore direct (bypassing service)

| Severity | File:line | Operation | Recommended service |
|---|---|---|---|
| High | `app/(app)/layout.tsx:130-143` | `getOrganizationsByUser` helper in layout | `lib/org-service.ts` |
| High | `app/(onboarding)/onboarding/page.tsx:43-56` | `addDoc` org + membership | `createOrganizationAndMembership()` (atomic) |
| High | `app/(app)/organizations/page.tsx:64-69` | `addDoc` org + membership | same |
| High | `app/(app)/releases/new/page.tsx:49-134` | 7-doc `writeBatch` | `createReleaseWithWorkflow(organizationId, fields)` |
| High | `app/(app)/releases/[id]/page.tsx:107-148` | 7+ collection reads orchestrated | `getReleaseWorkspace(releaseId)` |
| High | `app/(app)/releases/[id]/edit/page.tsx:56-117` | `getDoc` + `updateDoc` 10+ fields | `updateRelease(releaseId, fields)` (exists in `lib/release-service.ts:6-26` but unused) |
| Med  | `app/(app)/artists/new/page.tsx:34-50` | `addDoc` | `createArtist` (exists; page imports) |
| Med  | `app/(app)/artists/[id]/page.tsx:60-82` | N+1 track reads | `getArtistWorkspace(artistId)` |
| Med  | `app/(app)/rights-holders/new/page.tsx:25-35` | `addDoc` | `createRightsHolder` (exists; page should import) |
| Med  | `app/(app)/campaigns/page.tsx:30-39` | releases query | `getCampaignsForOrg(organizationId)` |
| Med  | `app/(app)/campaigns/[id]/page.tsx:55-62` | mixed reads | `getCampaignWorkspace(campaignId)` |
| Med  | `app/(app)/budgets/page.tsx:20-39` | budgets query | `getBudgetsForOrg(organizationId)` |
| Med  | `app/(app)/brief/page.tsx:50-75` | direct queries | `getDailyBrief(organizationId)` |
| Med  | `app/(app)/approvals/page.tsx:25-33` | N+1 deliverable reads | `getPendingApprovalsWithDeliverables(uid)` |
| Low  | `app/(app)/contributor/page.tsx:43-72` | mixed (some via service) | consolidate |

### 4.2 Type cast violations (silenced type system)

| File:line | Cast | Risk |
|---|---|---|
| `app/(app)/artists/new/page.tsx:43` | `artistType as never` | Bypasses `ArtistType` union |
| `lib/rights-service.ts:134-135` | `items as never` (×2) | Bypasses `OwnershipType` |
| `app/(app)/releases/new/page.tsx:64, 98` | `releaseType as Release['releaseType']` | Bypasses literal check |

### 4.3 Middleware is a no-op

`apps/web/src/middleware.ts:5-18`:
```ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some(...) || pathname.startsWith('/_next') || ...) {
    return NextResponse.next();
  }
  return NextResponse.next();   // ← identical to the public branch
}
```
Auth gating is handled entirely in `app/(app)/layout.tsx:154` and in each page's `useAuth` redirect. The middleware does nothing.

---

## 5. Package Boundaries

### 5.1 Exports vs. imports

| Package | Exports | Imported by `apps/web` |
|---|---|---|
| `packages/ui` | 50+ components, 3 layouts, nav, types | 19 imports; 25+ components unused |
| `packages/domain-ui` | 11 components | 5 components used (`ReleaseJourney`, `HealthRing`, `ReadinessStack`, `ContextRail`, `OperationalSummary`, `WorkflowBoard`) |
| `packages/firebase` | 5 Cloudinary fns + types | **0 imports** |
| `packages/shared` | (empty barrel) | **0 imports** |

### 5.2 Inverse-direction imports (would be violations)

Search confirms no app code imports from inside another package's internals. All imports go through barrel `index.ts`. **No internal-import violations.**

### 5.3 Cross-package dependency graph

```
apps/web
  ├── @releaseflow/ui
  ├── @releaseflow/domain-ui
  │     └── @releaseflow/ui        (allowed)
  └── @releaseflow/firebase        (unused but allowed)

packages/shared
  └── (no internal deps; no consumers)
```

No circular dependencies. The shared barrel is dead; consider deleting the package.

---

## 6. Data Flow Diagrams

### 6.1 Create Release (the heaviest flow)

```
[User] --submit--> NewReleasePage.handleSubmit
                            │
                            ├── local state: title, releaseType, status, targetReleaseDate
                            ├── guard: if !activeOrgId || !user || !title.trim() return
                            ├── writeBatch(db)
                            │     ├── set releases/{auto}     { orgId, title, type, status,
                            │     │                              targetDate, createdBy, createdAt }
                            │     ├── set workflows/{auto}    { releaseId, templateId,
                            │     │                              status: 'in_progress', progress: 0,
                            │     │                              currentStageId: null }
                            │     ├── set stages/{auto}×N     { workflowId, name, order, status,
                            │     │                              startedAt?, assignedRole }
                            │     ├── update workflows/{auto}  { currentStageId: firstStageId }
                            │     ├── set release_requirements/{auto}×M  { releaseId, name,
                            │     │                                          status: 'required' }
                            │     ├── set activities/{auto}   { type: 'release.created',
                            │     │                            releaseId, actorId, metadata }
                            │     └── set activities/{auto}   { type: 'workflow.generated',
                            │                                  releaseId, actorId, metadata }
                            ├── await batch.commit()       ← NO try/catch
                            └── router.push(/releases/{id})
```

**Issues**:
- No try/catch around `batch.commit()`. On failure, user is stuck on the form.
- 7 service modules own partial pieces of this: `requirement-service.generateRequirementsForRelease`, `workflow-service.generateWorkflowForRelease`. None are called; the page duplicates the logic inline.
- `createdBy: user.uid` is written but never used as an ownership check (rules allow it, but no UI check exists).

### 6.2 Open Release (multi-source read)

```
[User] --> /releases/{id}
              │
              ├── useEffect [id, activeOrgId]
              │     ├── getDoc(releases/{id})                ── direct
              │     ├── cross-org check  (forbidden = orgId !== activeOrgId)
              │     ├── getDocs(workflows where releaseId)  ── direct
              │     ├── if workflow:
              │     │     ├── getDocs(stages where workflowId)  ── direct
              │     │     └── for each stage:
              │     │           └── getTasksByStage(stage.id)  ── service (N+1)
              │     ├── Promise.all:
              │     │     ├── getRequirementsByRelease       ── service
              │     │     ├── getDeliverablesByRelease       ── service
              │     │     ├── getDependenciesByRelease       ── service
              │     │     ├── getLatestDistributionPackage   ── service
              │     │     └── validateReleaseOwnership       ── service
              │     └── setState
              └── render 8 tabs
```

**Issues**:
- Stage loop is N+1 (`releases/[id]/page.tsx:129`).
- No caching; every tab switch re-fetches.
- Promise.all on line 134 — if any single read rejects, `setLoading(false)` is never called → infinite skeleton.

### 6.3 Switch Organization

```
[User] --> <select onChange>
              │
              ├── setActiveOrgId(orgId || null)   ── useOrgStore (in-memory)
              └── pages re-render; those with
                  useEffect deps including
                  activeOrgId re-fetch
```

**Issues**:
- In-memory store; on page refresh, `activeOrgId` resets to first org in `getOrganizationsByUser` result (`layout.tsx:162`).
- No persistence, no migration.

### 6.4 Complete Task (contributor page)

```
[User] --> click checkbox
              │
              └── completeTask(taskId, '', '', user.uid)
                        │     ↑
                        │     └─ releaseId and stageId passed as ''
                        │
                        ├── updateDoc(tasks/{id}, { status: 'done', completedAt })
                        └── logActivity({
                                type: 'task.completed',
                                releaseId: '',   ← broken
                                stageId:   '',
                                actorId:   user.uid
                              })
```

**Issues**:
- `releaseId: ''` violates `Activity.releaseId: string` non-empty contract.
- Breaks the `ActivityTab` filter at `releases/[id]/page.tsx:909` (those activities never appear in any release's feed).
- Same pattern in `approvals/page.tsx:45, 50` → `notification-service.ts:31, 47, 59` for `markAsRead`/`archiveNotification`/`createNotification`.

---

## 7. Architecture Violations Summary

| Category | Count | Severity |
|---|---|---|
| Pages importing `firebase/firestore` directly | 19 of 35 | High |
| Service functions exported but unused | ~45 of ~110 (40%) | Medium |
| Dead hooks | 3 of 4 (75%) | Low |
| Dead store actions | 5 of 11 (45%) | Low |
| Dead `packages/firebase` (Cloudinary) | entire package | Low |
| Empty `packages/shared` | entire package | Low |
| Type cast `as never` / `as` bypassing unions | 5+ | Medium |
| Tenant isolation absent on `artists` and `rights_holders` | 2 collections | High (data leak) |
| N+1 query loops | 4 (`useOperationsCenter`, `artists/[id]`, `approvals/[id]`, `releases/[id]` stage loop) | Medium |
| `writeBatch` in page | 1 (`releases/new`) | High |
| Middleware no-op | 1 | Low (no security gain, no harm) |
| Activity log written with `releaseId: ''` | 3 sites | High (corrupts activity feed) |
