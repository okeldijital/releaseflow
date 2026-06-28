# AUDIT-001 — Current State Inventory

| Field | Value |
|---|---|
| Audit date | 2026-06-28 |
| Audit version | 1.0 |
| Scope | Read-only inventory of `releaseflow-v2` monorepo |
| Source of truth | `apps/web/src/**`, `packages/*/src/**`, `firestore.rules`, `firestore.indexes.json` |

---

## 1. Project Structure Inventory

### 1.1 Top-level layout

```
releaseflow-v2/
├── apps/
│   └── web/                     # Next.js 14 client app
├── packages/
│   ├── ui/                      # Generic design system (50+ components)
│   ├── domain-ui/               # Release/Artist domain components (11)
│   ├── firebase/                # Cloudinary utilities (5 fns, unused)
│   └── shared/                  # Empty barrel (export {})
├── docs/                        # PDS + 80 design docs
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── pnpm-workspace.yaml
└── turbo.json
```

### 1.2 `apps/web/src/` inventory

| Directory | File count | Purpose |
|---|---|---|
| `app/` | 36 (page.tsx + layouts) | Routes |
| `lib/` | 36 | Service + utility modules |
| `stores/` | 3 | Zustand stores (org, role, toast) |
| `contexts/` | 1 | Auth context |
| `hooks/` | 3 | `useOperationsCenter`, `useOptimistic`, `use-keyboard-shortcuts` |
| `components/` | 6 | Providers, command palette, error boundary, toast container, config error |
| `__tests__/` | varies | Vitest test files |
| `middleware.ts` | 1 | Next.js middleware (no-op) |
| `styles/` | 1 | Global CSS / Tailwind config |

### 1.3 `packages/*/src/` inventory

| Package | Files | Status |
|---|---|---|
| `packages/ui` | 38 components + 3 layouts + nav (2) + index | Active; 25+ components unused |
| `packages/domain-ui` | 11 components + index | Active; 6 of 11 components unused |
| `packages/firebase` | 6 (Cloudinary only) | Imported by nothing in `apps/web` |
| `packages/shared` | 1 (`export {}`) | Empty barrel |

---

## 2. Route Inventory

| Path | File | Purpose | Status | Nav? |
|---|---|---|---|---|
| `/` | `app/page.tsx` | Redirects to `/dashboard` | Live | n/a |
| `/sign-in` | `app/(auth)/sign-in/page.tsx` | Email + Google sign-in | Live | public |
| `/sign-up` | `app/(auth)/sign-up/page.tsx` | Email sign-up | Live | public |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Password reset | Live | public |
| `/onboarding` | `app/(onboarding)/onboarding/page.tsx` | First-org creation | Live | hidden (post-signup) |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Operations Center | Live | Home |
| `/releases` | `app/(app)/releases/page.tsx` | Release list (org-scoped) | Live | Releases |
| `/releases/new` | `app/(app)/releases/new/page.tsx` | Create release (4-field form) | Live | link from list |
| `/releases/[id]` | `app/(app)/releases/[id]/page.tsx` | Release workspace (882 lines) | Live | from list |
| `/releases/[id]/edit` | `app/(app)/releases/[id]/edit/page.tsx` | Edit release (10+ fields) | Live | from detail |
| `/artists` | `app/(app)/artists/page.tsx` | Artist list | Live | Artists |
| `/artists/new` | `app/(app)/artists/new/page.tsx` | Create artist | Live | from list |
| `/artists/[id]` | `app/(app)/artists/[id]/page.tsx` | Artist workspace | Live | from list |
| `/work` | `app/(app)/work/page.tsx` | Two empty states | **Placeholder** | Work |
| `/assets` | `app/(app)/assets/page.tsx` | Static empty state | **Placeholder** | Assets |
| `/people` | `app/(app)/people/page.tsx` | Static empty state | **Placeholder** | People |
| `/organizations` | `app/(app)/organizations/page.tsx` | Org list + create | Live | hidden (topbar) |
| `/contributor` | `app/(app)/contributor/page.tsx` | Contributor dashboard | Live | hidden (cmd palette) |
| `/approvals` | `app/(app)/approvals/page.tsx` | Approval queue | Live | hidden (cmd palette) |
| `/budgets` | `app/(app)/budgets/page.tsx` | Read-only budget summary | Live | hidden |
| `/brief` | `app/(app)/brief/page.tsx` | Daily brief | Live | hidden |
| `/audit` | `app/(app)/audit/page.tsx` | System audit | Live | hidden |
| `/diagnostics` | `app/(app)/diagnostics/page.tsx` | System health | Live | hidden |
| `/rights-holders` | `app/(app)/rights-holders/page.tsx` | Rights holder list | Live | hidden |
| `/rights-holders/new` | `app/(app)/rights-holders/new/page.tsx` | Create rights holder | Live | from list |
| `/campaigns` | `app/(app)/campaigns/page.tsx` | Campaign list | Live | hidden |
| `/campaigns/new` | `app/(app)/campaigns/new/page.tsx` | Create campaign | Live | from list |
| `/campaigns/[id]` | `app/(app)/campaigns/[id]/page.tsx` | Campaign detail | Live | from list |
| `/administration` | `app/(app)/administration/page.tsx` | Admin hub | Live | Administration |
| `/administration/members` | `app/(app)/administration/members/page.tsx` | `router.replace('/organizations')` | **Redirect only** | hidden |
| `/administration/audit` | `app/(app)/administration/audit/page.tsx` | `router.replace('/audit')` | **Redirect only** | hidden |
| `/administration/diagnostics` | `app/(app)/administration/diagnostics/page.tsx` | `router.replace('/diagnostics')` | **Redirect only** | hidden |
| `/ui-lab` | `app/ui-lab/page.tsx` | Component playground | Live | hidden |

**Summary**:
- 35 page files
- 3 placeholder pages (`/work`, `/assets`, `/people`) — `<EmptyState>` only
- 3 redirect-only pages — `administration/{members,audit,diagnostics}`
- 9 pages reachable but not in the sidebar nav (`/organizations`, `/contributor`, `/approvals`, `/budgets`, `/brief`, `/audit`, `/diagnostics`, `/rights-holders`, `/campaigns`)

---

## 3. Firestore Collection Inventory

28 collections declared in `firestore.rules:9-43`. Each row verified by `rg` of collection names in `apps/web/src`.

| Collection | Read | Write | Index | Tenant? | Notes |
|---|---|---|---|---|---|
| `organizations` | yes (3) | yes (2) | none | n/a | `app/(app)/organizations/page.tsx:64-66`, `app/(onboarding)/onboarding/page.tsx:43-48` |
| `memberships` | yes (4+) | yes (2) | none | per-user via `userId` | |
| `roles` | **no** | **no** | none | n/a | Declared in rules line 11; never read or written. Free string `roleId` used instead. |
| `releases` | yes | yes (create/update/delete) | none (status, targetDate filters in-memory) | `organizationId` | Tenant-scoped in queries; cross-org check client-side only. |
| `workflows` | yes (release detail) | yes (batch on create) | none | implicit | |
| `stages` | yes | yes (batch) | yes (`workflowId, order` asc) | implicit | |
| `tracks` | yes (artist page) | **no** | none | none | N+1 read at `artists/[id]/page.tsx:79`; no write code anywhere. |
| `contributors` | **no** | **no** | none | n/a | Rules line 16; no service or page touches it. |
| `tasks` | yes | yes | yes (4 indexes) | per-stage | |
| `comments` | **no** | **no** | yes (`taskId, createdAt`) | n/a | `addComment`/`getCommentsByTask` exist in `task-service.ts:135, 166` but no UI caller. |
| `deliverables` | yes (4 callers) | **no (write)** | yes (3 indexes) | implicit | `AssetsTab` is read-only (`releases/[id]/page.tsx:788-806`). |
| `release_requirements` | yes | yes (batch) | yes | implicit | |
| `asset_references` | **no** | **no** | none | n/a | No code references. |
| `approval_requests` | yes (2 pages) | yes (approve/reject only) | yes (`approverId, status, createdAt`) | implicit | **No UI creates new requests**; only handles existing pending. |
| `distribution_packages` | yes | yes (generate/update) | none | implicit | |
| `campaigns` | yes | yes (form) | yes (`releaseId, createdAt`) | via release | |
| `campaign_tasks` | yes | yes | yes | implicit | |
| `artists` | yes | yes | none (orderBy name) | **global** | No `where('organizationId')` — `artist-service.ts:54-61`. |
| `release_artists` | **no** | **no** | yes | n/a | `linkArtistToRelease` exported but unused. |
| `track_credits` | yes (artist page) | **no (write)** | yes | implicit | `getCreditsByArtist` reads; no `addTrackCredit` caller. |
| `rights_holders` | yes | yes (form) | none | **global** | No `where('organizationId')` — `rights-service.ts:20-25`. |
| `release_ownerships` | yes (validation) | **no** | yes | implicit | Only `validateReleaseOwnership` reads. |
| `track_ownerships` | **no** | **no** | none | n/a | All functions dead. |
| `release_budgets` | yes (read) | **no** | yes | implicit | `getBudgetSummary` reads; no UI creates. |
| `cost_items` | yes (in budget summary) | **no** | yes | implicit | No UI creates. |
| `resource_assignments` | yes (in utilization) | **no** | yes | per-user | No UI creates. |
| `dependencies` | yes | **no** | yes | implicit | Only `getDependenciesByRelease` reads. |
| `operational_alerts` | yes (dashboard) | yes (alert-engine) | yes | implicit | |
| `activities` | yes (ActivityTab, dashboard) | yes (every service via `logActivity`) | yes | implicit | |
| `notifications` | yes (contributor) | yes (`createNotification`) | yes (2) | per-user | |

**Totals**:
- 28 collections declared in `firestore.rules`
- 8 read but never written by the app: `tracks`, `deliverables`, `approval_requests`, `release_ownerships`, `release_budgets`, `cost_items`, `resource_assignments`, `dependencies`
- 5–7 completely unused (no read, no write): `roles`, `contributors`, `comments`, `asset_references`, `release_artists`, `track_ownerships`
- 0 collections enforce cross-org isolation server-side. `artists` and `rights_holders` are global.

---

## 4. Service Inventory

36 files in `apps/web/src/lib/`. Function-level status from Phase 9 audit.

| File | Exported fns | Used | Unused |
|---|---|---|---|
| `lib/activity-audit.ts` | (helpers only) | yes | — |
| `lib/alert-engine.ts` | `generateOrgAlerts`, `generateAlerts`, `resolveAlert` | 1 | 2 |
| `lib/approval-service.ts` | `createApprovalRequest`, `getPendingRequestsByApprover`, `approveRequest`, `rejectRequest`, `getDeliverableApprovalStatus` | 3 | 2 |
| `lib/artist-service.ts` | `createArtist`, `updateArtist`, `getArtists`, `getArtist`, `linkArtistToRelease`, `getArtistsByRelease`, `addTrackCredit`, `getCreditsByTrack`, `getCreditsByArtist`, `checkArtistReadiness` | 6 | 4 |
| `lib/asset-service.ts` | `addAssetReference`, `getAssetReferencesByDeliverable`, `deleteAssetReference` | 0 | 3 |
| `lib/baseline-metrics.ts` | (helpers) | yes | — |
| `lib/budget-service.ts` | `initializeBudget`, `addCostItem`, `getBudgetSummary`, `getCostItemsByRelease`, `recalculateBudget`, `computeBudgetHealth` | 2 | 4 |
| `lib/campaign-service.ts` | `createCampaign`, `activateCampaign`, `completeCampaign`, `getCampaigns`, `getCampaignsByRelease`, ... | 5+ | 1+ |
| `lib/deliverable-service.ts` | `createDeliverable`, `updateDeliverable`, `approveDeliverable`, `rejectDeliverable`, `archiveDeliverable`, `getDeliverablesByRelease`, `getDeliverablesByStage`, `getDeliverablesByTask` | 1 | 7 |
| `lib/dependency-health.ts` | (helpers) | yes | — |
| `lib/dependency-service.ts` | `createDependency`, `updateDependency`, `getDependenciesByRelease`, `getBlockingDependencies` | 2 | 2 |
| `lib/distribution-service.ts` | `checkDistributionReadiness`, `generateDistributionPackage`, `getLatestDistributionPackage` | 2 | 0 (the one in-code, anyway) |
| `lib/env-validator.ts` | (helpers) | yes | — |
| `lib/firebase.ts` | `getAuthInstance`, `getDb` | yes | — |
| `lib/integrity-validator.ts` | (helpers) | yes | — |
| `lib/notification-service.ts` | `createNotification`, `markAsRead`, `archiveNotification`, `getNotificationsByUser`, `getUnreadCount` | 4 | 1 |
| `lib/performance-review.ts` | (helpers) | yes | — |
| `lib/permission-audit.ts` | (helpers) | yes | — |
| `lib/query-analyzer.ts` | (helpers) | yes | — |
| `lib/readiness-engine.ts` | (helpers) | yes | — |
| `lib/recommendation-engine.ts` | (helpers) | yes | — |
| `lib/release-service.ts` | `updateReleaseStatus`, `updateRelease` | yes | — |
| `lib/requirement-service.ts` | `generateRequirementsForRelease`, `submitRequirement`, `approveRequirement`, `resetRequirement` | 2 | 2 |
| `lib/requirement-templates.ts` | (template data) | yes | — |
| `lib/resource-service.ts` | `assignResource`, `updateUtilization`, `getAssignmentsByUser`, `getAssignmentsByRelease`, `getUserUtilization`, `getOrgResourceSummary` | 0 | 6 |
| `lib/rights-service.ts` | `createRightsHolder`, `getRightsHolders`, `getRightsHolder`, `addReleaseOwnership`, `getReleaseOwnerships`, `addTrackOwnership`, `getTrackOwnerships`, `validateReleaseOwnership`, `validateTrackOwnership` | 4 | 5 |
| `lib/rule-engine.ts` | (helpers) | yes | — |
| `lib/security-audit.ts` | (helpers) | yes | — |
| `lib/task-progress.ts` | (helpers) | yes | — |
| `lib/task-service.ts` | `createTask`, `assignTask`, `unassignTask`, `completeTask`, `updateTask`, `deleteTask`, `addComment`, `getCommentsByTask`, `getTasksByStage`, `getTasksByAssignee`, `getTasksByRelease` | 8 | 3 |
| `lib/utils.ts` | `fmtDate` | yes | — |
| `lib/workflow-health.ts` | (helpers) | yes | — |
| `lib/workflow-progress.ts` | (helpers) | yes | — |
| `lib/workflow-progression.ts` | `stageComplete` | yes | — |
| `lib/workflow-service.ts` | `generateWorkflowForRelease`, `logActivity` | 1 | 1 |
| `lib/workflow-templates.ts` | (template data) | yes | — |

**Totals**:
- ~110 exported functions across 36 service files
- ~45 functions (≈40%) have zero callers from `apps/web/src/app/**`

---

## 5. Store Inventory

`apps/web/src/stores/`

| Store | Actions / state | Used | Unused |
|---|---|---|---|
| `useOrgStore` | `activeOrgId`, `orgsLoaded`, `setActiveOrgId`, `setOrgsLoaded` | 4 of 4 | 0 |
| `useRoleStore` | `role`, `loading`, `resolveRole`, `reset` | 2 of 4 | 2 (`loading`, `reset`) |
| `useToastStore` | `toasts`, `remove`, `add`, `success`, `error`, `warning`, `info` | 2 of 7 (`toasts`, `remove`) | 5 |

**Persistence**: None. All stores are in-memory Zustand; `useOrgStore.activeOrgId` resets to first org on refresh (`layout.tsx:162`).

---

## 6. Hook Inventory

`apps/web/src/hooks/`

| Hook | File:line | Used by | Notes |
|---|---|---|---|
| `useOperationsCenter` | `hooks/useOperationsCenter.ts:88` | `app/(app)/dashboard/page.tsx:163` | Active; queries 5+ collections in a loop |
| `useOptimistic` | `hooks/use-optimistic.ts:6` | **none** | Dead — only consumer is itself |
| `useUnsavedChanges` | `hooks/use-keyboard-shortcuts.ts:5` | **none** | Dead |
| `useKeyShortcuts` | `hooks/use-keyboard-shortcuts.ts:23` | **none** | Dead |

3 of 4 hooks (75%) have no callers.

---

## 7. Component Inventory

### 7.1 `packages/ui` exports (50+)

| Component | Used? | Notes |
|---|---|---|
| `Button` | yes | many places |
| `Card` | yes | many places |
| `MetricCard` | **no** | exported; never imported |
| `WorkspaceCard` | **no** | exported; never imported |
| `Badge`, `StatusBadge` | yes | |
| `ProgressBar` | yes | |
| `HealthBar` | **no** | |
| `Avatar` | yes | |
| `AvatarGroup` | **no** | |
| `EmptyState`, `LoadingState`, `Skeleton` | yes | |
| `Typography` | **no** | |
| `Divider` | **no** | |
| `Container` | **no** | |
| `Stack` | **no** | |
| `Grid` | **no** | |
| `Drawer` | yes | |
| `Overlay`, `Modal` | **no** | |
| `Tooltip` | **no** | |
| `Tag` | **no** | |
| `Icon` | **no** | |
| `Input`, `TextArea` | yes | |
| `Select` | yes | |
| `Checkbox`, `Radio` | **no** | |
| `Switch` | **no** | |
| `Table` | yes | |
| `DataGrid` | **no** | |
| `Timeline` | **no** | |
| `Tabs` | yes | |
| `Pagination` | **no** | |
| `SegmentedControl` | **no** | |
| `Search` | **no** | |
| `Toast` (via container) | yes | |
| `Alert` | yes | |
| `Banner` | **no** | |
| `ConfirmationDialog` | **no** | |
| `InlineMessage` | **no** | |
| `Notification`, `NotificationFeed` | **no** | |
| `AppShell`, `WorkspaceLayout` | yes | |
| `DashboardLayout` | **no** | |
| `Sidebar`, `Topbar`, `Breadcrumbs` | yes | |

~25 of 50+ UI primitives are exported but never imported.

### 7.2 `packages/domain-ui` exports (11)

| Component | Used? |
|---|---|
| `ReleaseJourney` | yes — `releases/[id]/page.tsx:27` |
| `HealthRing` | yes — `releases/[id]/page.tsx:28`, `artists/[id]/page.tsx:146` |
| `ReadinessStack` | yes — `releases/[id]/page.tsx:296`, `artists/[id]/page.tsx:154` |
| `ContextRail` | yes — `releases/[id]/page.tsx:297`, `artists/[id]/page.tsx:156` |
| `OperationalSummary` | yes — `releases/[id]/page.tsx:422`, `dashboard/page.tsx:388`, `artists/[id]/page.tsx:207` |
| `WorkflowBoard` | yes — `releases/[id]/page.tsx:645` |
| `ApprovalMatrix` | **no** |
| `RightsMatrix` | **no** |
| `CreditsTable` | **no** |
| `DistributionBoard` | **no** |
| `DSPStatus` | **no** |

6 of 11 domain-ui components (55%) are exported but never rendered.

### 7.3 `apps/web/src/components/`

| Component | Purpose | Used? |
|---|---|---|
| `app-providers.tsx` | Context + store provider tree | yes (root layout) |
| `command-palette.tsx` | Cmd-K nav (162 lines) | yes |
| `config-error.tsx` | Shown when env vars missing | yes (root layout) |
| `error-boundary.tsx` | React error boundary | yes (root layout) |
| `toast-container.tsx` | Renders `toasts` from `useToastStore` | yes (root layout, but toasts never produced) |

### 7.4 `apps/web/src/contexts/`

| Context | Purpose | Notes |
|---|---|---|
| `auth-context.tsx` | Wraps `onAuthStateChanged`; exposes `user`, `loading` | The only context. |

---

## 8. Summary

### What is real (live code paths)
- Auth: email + Google sign-in, sign-up, password reset, sign-out
- Onboarding: first-org creation
- Releases: create, list (org-scoped), detail (882-line workspace with 8 tabs), edit
- Artists: create, list, detail
- Rights holders: create, list
- Campaigns: create, list, detail
- Tasks: create inline on release detail, complete inline
- Notifications: read on contributor page, mark read / archive
- Approvals: view pending, approve / reject
- Org switching via topbar dropdown
- Operations Center dashboard with 5-collection aggregate fetch
- Activity feed on release detail

### What is dead (no callers)
- ~45 service functions (40% of all service exports)
- 3 hooks (`useOptimistic`, `useUnsavedChanges`, `useKeyShortcuts`)
- 5 store actions (`useRoleStore.loading`, `useRoleStore.reset`, `useToastStore.add/success/error/warning/info`)
- 6 domain-ui components (`ApprovalMatrix`, `RightsMatrix`, `CreditsTable`, `DistributionBoard`, `DSPStatus`)
- ~25 UI primitives
- Entire `packages/firebase` (Cloudinary) package
- `packages/shared` (empty barrel)

### What is partially built
- `approval_requests` — only approve/reject exist; no creation form
- `deliverables` — read in 4 places; no creation form
- `tracks` — read in 1 place; never written
- `cost_items`, `release_budgets`, `dependencies`, `release_ownerships` — read but no creation
- `comments` — types + service functions exist, no UI
- `/work`, `/assets`, `/people` — static empty states, no data wiring
- `budgets` page — read-only summary, no create
- `RightsHolder` — schema missing `role`, `percentage`, `pro`, `ipi`, `collectionSociety` (PDS asks for)
- `TrackCredit` — schema missing `percentage`
- `DistributionPackage` — schema missing `submittedAt`
- `Dependency` — schema missing `description`
- `Organization` — schema missing `settings`

### Quick numbers
- 35 page files
- 36 service files
- ~110 exported service functions, ~45 unused
- 28 Firestore collections, 5–7 completely unused, 8 read-but-not-written
- 4 hooks, 3 unused (75%)
- 11 store actions, 5 unused
- 50+ UI primitives, ~25 unused
- 11 domain-ui components, 6 unused
