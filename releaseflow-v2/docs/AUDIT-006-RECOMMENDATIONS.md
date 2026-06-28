# AUDIT-006 — Recommendations

| Field | Value |
|---|---|
| Audit date | 2026-06-28 |
| Audit version | 1.0 |
| Scope | Prioritized remediation list, ordered by impact × effort |
| Priority scale | P0 = critical security/correctness · P1 = architecture compliance · P2 = performance/scalability · P3 = polish |

---

## P0 — Critical Security & Correctness

### P0-1. Rewrite Firestore rules to enforce tenant isolation

| | |
|---|---|
| Problem | Any auth user can read or write any doc in 26 of 28 collections. Tenant isolation is client-side only. |
| Root cause | `firestore.rules:9-43` is permissive; no `request.auth.token` checks; no `get()` membership lookups; `artists` and `rights_holders` are global. |
| Evidence | `firestore.rules:10` `memberships { allow read,write: if isAuth() }` — no org check. `firestore.rules:26` artists global. `firestore.rules:29` rights_holders global. `lib/artist-service.ts:54-61` and `lib/rights-service.ts:20-25` query without org filter. |
| Impact | Multi-tenant data leak; users in any org can see/edit any release, task, deliverable, rights holder, etc. |
| Proposed fix | (a) Set custom claims on sign-in via Cloud Function: `request.auth.token.orgMemberships = { orgId: role }`. (b) Add helper `function isOrgMember(orgId) { return request.auth.token.orgMemberships[orgId] != null; }`. (c) Apply to all 26 collections. (d) Migrate `artists` and `rights_holders` to include `organizationId`; enforce org-scope. |
| Estimated effort | L (1-2 weeks) |
| Risk | Migration of `artists`/`rights_holders` may be irreversible without careful planning. Test against emulator. |
| Priority | **P0** |

---

### P0-2. Add delete cascade for releases

| | |
|---|---|
| Problem | `handleDelete` only deletes the release doc; child docs are orphaned. The confirm copy is misleading. |
| Root cause | `releases/[id]/page.tsx:194-199` uses a single `deleteDoc`. No Cloud Function listens for `onDelete(releases/{id})`. |
| Evidence | `releases/[id]/page.tsx:194-199`. Confirmed message: "This permanently removes the release and all associated operational data." |
| Impact | Orphaned workflows, stages, tasks, requirements, activities, deliverables, dependencies. Counts skew; activity feed breaks; storage cost grows. |
| Proposed fix | Deploy `onDocumentDeleted('releases/{id}')` Cloud Function that fans out `deleteAll` across child collections in batches of 500. Or run a client-side batched-delete loop before the main `deleteDoc`. |
| Estimated effort | M (3-5 days) |
| Risk | Cloud Function has 9-minute timeout; for very large releases may need a queue. |
| Priority | **P0** |

---

### P0-3. Fix activity log writes with empty `releaseId`

| | |
|---|---|
| Problem | `activities` documents are written with `releaseId: ''`, silently corrupting the per-release activity feed. |
| Root cause | Three call sites pass `''` as `releaseId` to service functions: `contributor/page.tsx:80`, `approvals/page.tsx:45, 50`, `notification-service.ts:31, 47, 59`. |
| Evidence | `contributor/page.tsx:80` — `completeTask(taskId, '', '', user?.uid ?? '')`. `approvals/page.tsx:45` — `approveRequest(requestId, user?.uid ?? '', '')`. `notification-service.ts:31` — `releaseId: fields.releaseId ?? ''`. |
| Impact | Activity feed is incomplete; dashboard counts are wrong; audit trail gaps. |
| Proposed fix | (a) Make `releaseId` required on the service-level helpers via TypeScript. (b) Have callers look up the parent doc (task, approval_request) and read its `releaseId` before calling. (c) For `notification-service`, accept `releaseId: null` and skip the activity write when not provided. |
| Estimated effort | S (1-2 days) |
| Risk | Low. Some calls will require an extra read. |
| Priority | **P0** |

---

### P0-4. Atomic org + membership creation

| | |
|---|---|
| Problem | Org and membership are written sequentially; if the second `addDoc` fails, the org exists with no owner. |
| Root cause | `onboarding/page.tsx:43-56` and `organizations/page.tsx:64-69` issue two `addDoc` calls with no `writeBatch` or transaction. |
| Evidence | `app/(onboarding)/onboarding/page.tsx:43-56`. `app/(app)/organizations/page.tsx:64-69`. |
| Impact | Orphan org; user can't sign in to claim it; support burden. |
| Proposed fix | New service `createOrganizationAndMembership(name, userId)` that wraps both writes in a `writeBatch` (or, better, deploy a Cloud Function for atomicity beyond the client). |
| Estimated effort | S (1 day client-side; M if server-side) |
| Risk | Slug uniqueness must be enforced in the same transaction to prevent races. |
| Priority | **P0** |

---

### P0-5. Integrate external error monitoring (Sentry)

| | |
|---|---|
| Problem | No external monitoring. Production failures will be invisible until users complain. |
| Root cause | No Sentry, LogRocket, Datadog, or Firebase Crashlytics integration. |
| Evidence | `package.json` (no `@sentry/*` deps). `lib/firebase.ts` (no analytics config). |
| Impact | Cannot detect or triage production issues. |
| Proposed fix | (a) Add `@sentry/nextjs` with `withSentryConfig` in `next.config.js`. (b) Wrap `ErrorBoundary` with Sentry's `withErrorBoundary`. (c) Add Firestore error logging. (d) Add Firebase Analytics. |
| Estimated effort | M (1 week) |
| Risk | Low. Make sure to filter PII before sending. |
| Priority | **P0** |

---

### P0-6. Add security headers (CSP, HSTS, etc.)

| | |
|---|---|
| Problem | No `Content-Security-Policy`, no `Strict-Transport-Security`, no `X-Frame-Options`. |
| Root cause | No `headers()` in `next.config.js`; no CSP config in `vercel.json`. |
| Evidence | `vercel.json` (no headers); `next.config.js` (no headers function). |
| Impact | XSS, clickjacking, MITM exposure. |
| Proposed fix | Add a `headers()` function in `next.config.js` that returns a CSP that allows Firebase auth endpoints and Cloudinary if/when used. Include `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| Estimated effort | S (1-2 days) |
| Risk | CSP may break third-party widgets (e.g. Google sign-in); iterate. |
| Priority | **P0** |

---

### P0-7. Move server-side release cross-org check to rules

| | |
|---|---|
| Problem | `releases/[id]/page.tsx:111-113` and `releases/[id]/edit/page.tsx:63-67` enforce cross-org in React state, but Firestore allows any auth user to `getDoc('releases', anyId)`. |
| Root cause | `firestore.rules:12` only checks `createdBy`; no `organizationId` check. |
| Evidence | `releases/[id]/page.tsx:111-113`. `firestore.rules:12`. |
| Impact | Any auth user can read any release from the console. |
| Proposed fix | Pair with P0-1: rules check `isOrgMember(resource.data.organizationId)`. |
| Estimated effort | included in P0-1 |
| Risk | included in P0-1 |
| Priority | **P0** |

---

### P0-8. Fix `explicit: null` type mismatch on edit

| | |
|---|---|
| Problem | `edit/page.tsx:113` writes `null` when checkbox is unchecked, but the type is `boolean`. |
| Root cause | `explicit: explicit || null` on line 113. |
| Evidence | `releases/[id]/edit/page.tsx:113`. `types.ts:12-33` (`Release.explicit?: boolean`). |
| Impact | Type contract violation; downstream `=== true` checks miss these rows. |
| Proposed fix | `explicit: !!explicit`. Backfill: a one-off script to set `explicit: false` where it's currently `null`. |
| Estimated effort | XS (1 hour) |
| Risk | Trivial. |
| Priority | **P0** (because the data is corrupted in production-like data sets) |

---

### P0-9. Standardize error handling on all mutations (no bare service calls)

| | |
|---|---|
| Problem | 8+ mutation sites call services without `try/catch`; failures are silent, `setSubmitting(true)` is never reset, user is stuck. |
| Root cause | No convention for error handling. |
| Evidence | `releases/new/page.tsx:134`, `releases/[id]/edit/page.tsx:91-117`, `artists/new/page.tsx:42-50`, `rights-holders/new/page.tsx:25-35`, `contributor/page.tsx:80, 85, 90`, `approvals/page.tsx:45, 50`. |
| Impact | User sees no feedback on failure; data inconsistency; stuck UI. |
| Proposed fix | Add a `useAsyncAction` hook: `const { run, submitting, error } = useAsyncAction()`. All forms use `run(async () => { await service(); })`. Wire `useToastStore.error()` to surface failures. |
| Estimated effort | S-M (1 week) |
| Risk | Low. |
| Priority | **P0** |

---

## P1 — Architecture Compliance

### P1-1. Move page-level Firestore calls into services

| | |
|---|---|
| Problem | 19 of 35 pages import `firebase/firestore` directly, bypassing the service layer. |
| Root cause | Historical: pages grew faster than services; not all service functions existed when pages were written. |
| Evidence | See AUDIT-002 §4.1. Notable: `releases/new/page.tsx:8, 49-134` (7-doc batch); `releases/[id]/page.tsx:107-148` (7+ reads); `releases/[id]/edit/page.tsx:8, 56-117`; `app/(app)/layout.tsx:130-143` (`getOrganizationsByUser`). |
| Impact | Hard to test, hard to swap data sources, no central place for retry/caching/logging. |
| Proposed fix | For each page, extract its I/O into a service. Add ESLint `no-restricted-imports` rule that bans `firebase/firestore` from `apps/web/src/app/**/page.tsx`. Allow only `lib/**` to import it. |
| Estimated effort | M (1-2 weeks) |
| Risk | Refactor is mechanical; risk is low if done with adequate test coverage. |
| Priority | **P1** |

---

### P1-2. Use the dead service functions (or delete them)

| | |
|---|---|
| Problem | ~45 of ~110 service exports are dead code; or, the service is missing the function the page needs (causing P1-1). |
| Root cause | Over-eager service design; pages evolved around inline I/O. |
| Evidence | `lib/artist-service.ts:71, 78, 87, 94` — all dead. `lib/task-service.ts:73, 79, 135, 166` — dead. `lib/requirement-service.ts:6, 57` — `generateRequirementsForRelease` is duplicated inline at `releases/new/page.tsx:99-108`; `resetRequirement` has no UI. `lib/workflow-service.ts:6` `generateWorkflowForRelease` is duplicated inline at `releases/new/page.tsx:66-96`. |
| Impact | Confusion; surface area; ~5-10 KB bundle bloat. |
| Proposed fix | For each dead function, either (a) wire it up to a UI/page, or (b) delete it. Don't leave it in limbo. |
| Estimated effort | M (1-2 weeks) |
| Risk | Low. |
| Priority | **P1** |

---

### P1-3. Persist `useOrgStore` to localStorage

| | |
|---|---|
| Problem | `activeOrgId` resets to first org on page refresh. |
| Root cause | `useOrgStore` is in-memory Zustand; no `persist` middleware. |
| Evidence | `stores/org-store.ts:1-25`. `layout.tsx:162` auto-picks `data[0].id`. |
| Impact | Multi-org users get reset to the wrong org on refresh. |
| Proposed fix | `import { persist } from 'zustand/middleware'`. Wrap store creator. Version the persisted shape. |
| Estimated effort | S (hours) |
| Risk | Low. Make sure to migrate on version bump. |
| Priority | **P1** |

---

### P1-4. Eliminate N+1 query loops

| | |
|---|---|
| Problem | Multiple sites do one Firestore read per parent. |
| Root cause | Service helpers written for single-id lookups; loops call them per item. |
| Evidence | `releases/[id]/page.tsx:129` — `getTasksByStage` per stage. `artists/[id]/page.tsx:79` — `getDoc` track per credit. `approvals/page.tsx:25-33` — `getDoc` deliverable per request. `useOperationsCenter.ts:117-194` — 5+ reads per release. |
| Impact | Slow page loads; cost scaling. |
| Proposed fix | Add `getTasksByStages(stageIds: string[])`, `getTracksByIds(ids: string[])`, `getDeliverablesByIds(ids: string[])`. Refactor loops. |
| Estimated effort | M (3-5 days) |
| Risk | `in` queries are limited to 30 items per call; chunk larger sets. |
| Priority | **P1** |

---

### P1-5. Consolidate duplicate helpers

| | |
|---|---|
| Problem | `slugify` / `generateSlug` exists 3 times; `toDate(ts: unknown)` exists 6+ times; `getOrganizationsByUser` is in the layout; `priorityStyles` reinvented 4 times. |
| Root cause | Organic growth. |
| Evidence | See AUDIT-004 M1-M4. |
| Impact | Drift risk; bundle bloat. |
| Proposed fix | Single `lib/utils.ts` with `slugify`, `toDate`, `priorityColor`, `severityColor`. Move `getOrganizationsByUser` to `lib/org-service.ts`. |
| Estimated effort | S (1-2 days) |
| Risk | Trivial. |
| Priority | **P1** |

---

### P1-6. Wire toast system to the UI

| | |
|---|---|
| Problem | `useToastStore.add` and `toast.success`/`.error`/`.warning`/`.info` helpers are defined; no page calls them. The `useOptimistic` hook is the only consumer, and it's dead. |
| Root cause | Toast system was designed but never integrated. |
| Evidence | `stores/toast-store.ts`. `hooks/use-optimistic.ts:6` (dead). `components/toast-container.tsx:15` (only renders toasts in store; never any). |
| Impact | Errors and successes are silent. |
| Proposed fix | Replace `<Alert>` patterns with `toast.error(...)` / `toast.success(...)`. Wire into the `useAsyncAction` hook from P0-9. |
| Estimated effort | S (1-2 days) |
| Risk | Low. |
| Priority | **P1** |

---

### P1-7. Delete the no-op middleware

| | |
|---|---|
| Problem | `apps/web/src/middleware.ts:5-18` does nothing; suggests server-side gating that doesn't exist. |
| Root cause | Stub file never filled in. |
| Evidence | `apps/web/src/middleware.ts`. |
| Impact | Misleading; potential perf cost of middleware invocation per request. |
| Proposed fix | Delete the file. (Or implement real auth: read `__session` cookie and gate routes.) |
| Estimated effort | XS |
| Risk | None if deleted. |
| Priority | **P1** |

---

### P1-8. Delete 3 dead redirect pages

| | |
|---|---|
| Problem | `administration/{members,audit,diagnostics}/page.tsx` only `router.replace` to the canonical route. |
| Root cause | Legacy URL compatibility. |
| Evidence | The three `page.tsx` files in `app/(app)/administration/*/`. |
| Impact | Confusing nav; dead routes. |
| Proposed fix | Delete the three files. Update any link in `administration/page.tsx` to point directly to `/organizations`, `/audit`, `/diagnostics`. |
| Estimated effort | XS |
| Risk | Low; check for inbound links. |
| Priority | **P1** |

---

### P1-9. Delete the Cloudinary package (or implement it)

| | |
|---|---|
| Problem | `packages/firebase` (Cloudinary helpers) is exported but never imported. 5 functions, types, docs. |
| Root cause | Designed for asset upload, never wired up. |
| Evidence | `packages/firebase/src/cloudinary/*`. |
| Impact | Bundle bloat; confusion. |
| Proposed fix | Decide: either implement asset upload (and add to release edit flow), or delete the package. If deleting, also delete `packages/firebase` from `pnpm-workspace.yaml` and the docs that mention it. |
| Estimated effort | XS (delete); L (implement) |
| Risk | Low. |
| Priority | **P1** |

---

### P1-10. Implement or remove the dead `packages/shared`

| | |
|---|---|
| Problem | `packages/shared/src/index.ts` is `export {};` — empty barrel, no consumers. |
| Root cause | Reserved for cross-cutting types; never populated. |
| Evidence | `packages/shared/src/index.ts`. |
| Impact | Misleading. |
| Proposed fix | Either delete the package, or populate it (good candidate: the `pathLabels` map from `layout.tsx:75-92`, the activity type union, etc.). |
| Estimated effort | XS (delete); S (populate) |
| Risk | Low. |
| Priority | **P1** |

---

### P1-11. Make `roles` collection a real source of truth (or remove)

| | |
|---|---|
| Problem | `Role` interface exists, rules declare `roles` collection, but no code reads or writes it. Memberships have a free `roleId: 'owner'` string. |
| Root cause | RBAC design was sketched but not built. |
| Evidence | `types.ts:142-146` `Role` interface. `firestore.rules:11` `roles` collection. `memberships` use `roleId: 'owner'` strings. |
| Impact | No central role definitions; cannot change role semantics without code changes. |
| Proposed fix | Seed `roles/{owner, admin, release_manager, contributor}` documents. Update `memberships.roleId` to be a doc reference (or use custom claims — P0-1). |
| Estimated effort | M (1 week) |
| Risk | Migration of existing memberships. |
| Priority | **P1** |

---

### P1-12. Make the `Roles` enum types reflect actual usage

| | |
|---|---|
| Problem | `AppRole` enum (`stores/role-store.ts:5`) maps `'viewer'`, `'admin'`, `'release_manager'`, `'contributor'`. None is enforced anywhere; `resolveRole` always returns a default. |
| Root cause | Same as P1-11. |
| Evidence | `stores/role-store.ts:1-50`. |
| Impact | Permissions in the UI are based on a derived role from `memberships.roleId`, not a real RBAC source. |
| Proposed fix | Pair with P1-11. |
| Estimated effort | included in P1-11 |
| Priority | **P1** |

---

### P1-13. Surface `Stage.dueDate` or remove the field

| | |
|---|---|
| Problem | All writers set `Stage.dueDate = null`; no UI sets it. |
| Root cause | Workflow design didn't include dates. |
| Evidence | `releases/new/page.tsx:88`, `lib/workflow-service.ts:38-39`. |
| Impact | Dead schema. |
| Proposed fix | Either add a date picker to a stage editor, or remove `dueDate` from the `Stage` type. |
| Estimated effort | S (add); XS (remove) |
| Priority | **P1** |

---

## P2 — Performance & Scalability

### P2-1. Add pagination to all list pages

| | |
|---|---|
| Problem | `/releases`, `/artists`, `/rights-holders`, `/campaigns` return unlimited (or `limit(50)`) result sets. |
| Root cause | No pagination UI implemented. |
| Evidence | `releases/page.tsx:24-29` (no limit). `artist-service.ts:54-61` (`limit(50)`). `rights-service.ts:20-25` (no limit). `campaigns/page.tsx:30-39` (no limit). |
| Impact | Slow loads; cost; no UX for >50 items. |
| Proposed fix | Cursor-based pagination using `startAfter` and `limit(20)`. Add "Load more" UI or numbered pages. |
| Estimated effort | M (3-5 days) |
| Risk | Low. |
| Priority | **P2** |

---

### P2-2. Add missing composite indexes

| | |
|---|---|
| Problem | Some queries may need indexes not declared in `firestore.indexes.json`. |
| Root cause | Indexes defined ad hoc. |
| Evidence | Compare `firestore.indexes.json` against all `where(...).orderBy(...)` patterns in `apps/web/src`. Common candidate: `getBlockingDependencies` (`dependency-service.ts:50-53`) — no dedicated index for `(releaseId, status, blocking)`. |
| Impact | Queries that should hit an index will fall back to a full collection scan, billed as such. |
| Proposed fix | Audit all queries, add missing indexes. Use the Firebase CLI's "explain query" output. |
| Estimated effort | S (1-2 days) |
| Priority | **P2** |

---

### P2-3. Refactor `useOperationsCenter` to batch reads

| | |
|---|---|
| Problem | `useOperationsCenter.ts:117-194` queries 5+ collections in a loop, once per release id. |
| Root cause | Pre-aggregation helper. |
| Evidence | `hooks/useOperationsCenter.ts:117-194`. |
| Impact | Slow dashboard; cost scales with releases. |
| Proposed fix | Aggregate read: chunk release IDs into batches of 30, do a single `in` query per collection. Cache the result with SWR. |
| Estimated effort | M (3-5 days) |
| Priority | **P2** |

---

### P2-4. Cache release workspace

| | |
|---|---|
| Problem | `releases/[id]/page.tsx` re-fetches all data on every prop change and tab switch. |
| Root cause | No client-side cache. |
| Evidence | 9 useEffect hooks in `releases/[id]/page.tsx`. |
| Impact | Re-fetch on every interaction. |
| Proposed fix | Adopt React Query or SWR. Cache the workspace read; only refetch on mutation. |
| Estimated effort | M-L (1 week) |
| Priority | **P2** |

---

### P2-5. Add offline persistence

| | |
|---|---|
| Problem | App is unusable offline. |
| Root cause | No Firestore offline persistence. |
| Evidence | `lib/firebase.ts` (no `enableIndexedDbPersistence`). |
| Impact | Real-world flaky-network UX is poor. |
| Proposed fix | Call `enableIndexedDbPersistence(db)` in `lib/firebase.ts`. Handle the `failed-precondition` (multi-tab) and `unimplemented` (browser doesn't support) cases. |
| Estimated effort | S (1 day) |
| Risk | Offline writes may cause data conflicts; document expected behavior. |
| Priority | **P2** |

---

### P2-6. Add virtualization to long lists

| | |
|---|---|
| Problem | `/releases` list renders all releases in a single scroll. |
| Root cause | No virtualization. |
| Evidence | `releases/page.tsx`. |
| Impact | Sluggish on >100 items. |
| Proposed fix | Use `react-window` or `@tanstack/react-virtual`. |
| Estimated effort | S |
| Priority | **P2** |

---

## P3 — Polish

### P3-1. Remove unused UI primitives

| | |
|---|---|
| Problem | ~25 of 50+ `packages/ui` components are exported but never imported. |
| Evidence | See AUDIT-004 M17. |
| Proposed fix | Delete the unused component files and remove their `export` from `packages/ui/src/index.ts`. |
| Estimated effort | S (1-2 days) |
| Priority | **P3** |

---

### P3-2. Remove unused domain-ui components

| | |
|---|---|
| Problem | 6 of 11 `packages/domain-ui` components are exported but never rendered. |
| Evidence | `ApprovalMatrix`, `RightsMatrix`, `CreditsTable`, `DistributionBoard`, `DSPStatus` (see AUDIT-004 M18). |
| Proposed fix | Either wire to the relevant tabs (Distribution tab, Rights tab, Approvals page), or delete. |
| Estimated effort | L (if wiring); S (if deleting) |
| Priority | **P3** |

---

### P3-3. Remove unused hooks

| | |
|---|---|
| Problem | `useOptimistic`, `useUnsavedChanges`, `useKeyShortcuts` have no callers. |
| Evidence | `hooks/use-optimistic.ts:6`, `hooks/use-keyboard-shortcuts.ts:5, 23`. |
| Proposed fix | Delete the files. |
| Estimated effort | XS |
| Priority | **P3** |

---

### P3-4. Remove unused store actions

| | |
|---|---|
| Problem | `useRoleStore.loading`, `useRoleStore.reset`, `useToastStore.add`/`.success`/`.error`/`.warning`/`.info` have no callers. |
| Evidence | `stores/role-store.ts:46`, `stores/toast-store.ts`. |
| Proposed fix | Delete or wire to UI (P1-6). |
| Estimated effort | XS (delete); included in P1-6 (wire) |
| Priority | **P3** |

---

### P3-5. Remove unused design tokens

| | |
|---|---|
| Problem | 30+ CSS tokens in `apps/web/src/app/globals.css:14-270` are never used. |
| Evidence | `text-text-50/100/200/300`, `bg-primary-200/300`, all `--color-secondary-*`, `--color-workflow-*`, `--color-status-*`, `--color-border-*`, the `--rf-` namespace. |
| Proposed fix | Remove from `globals.css`. Verify in browser. |
| Estimated effort | XS |
| Priority | **P3** |

---

### P3-6. Replace static placeholders with real pages (or remove from nav)

| | |
|---|---|
| Problem | `/work`, `/assets`, `/people` are static `<EmptyState>` only. |
| Evidence | `app/(app)/work/page.tsx`, `assets/page.tsx`, `people/page.tsx`. |
| Proposed fix | Build them, or remove from sidebar. |
| Estimated effort | L (build) or XS (remove from nav) |
| Priority | **P3** |

---

### P3-7. Wire comment UI to `addComment` / `getCommentsByTask`

| | |
|---|---|
| Problem | `addComment` and `getCommentsByTask` exist; no UI. |
| Evidence | `lib/task-service.ts:135, 166`. |
| Proposed fix | Add comment section to `TasksSection` at `releases/[id]/page.tsx:728-781`. |
| Estimated effort | M (3 days) |
| Priority | **P3** |

---

### P3-8. Add metadata fields to the create-release form

| | |
|---|---|
| Problem | New releases start with no UPC, label, etc. Distribution readiness is always false until the user visits the edit form. |
| Evidence | `releases/new/page.tsx:138-159` has 4 inputs. `releases/[id]/edit/page.tsx:138-186` has 10+ metadata fields. |
| Proposed fix | Add a "Metadata" step to a wizard, or include the fields in the new form. |
| Estimated effort | S (1-2 days) |
| Priority | **P3** |

---

### P3-9. Add `on_hold` and `cancelled` to status selects

| | |
|---|---|
| Problem | Form status options omit `on_hold` and `cancelled`, but `STATUS_TRANSITIONS` allows transitioning to them. |
| Evidence | `releases/new/page.tsx:23-30`, `releases/[id]/edit/page.tsx:20-27`, `releases/[id]/page.tsx:43-66`. |
| Proposed fix | Add to the `releaseStatuses` array in both forms. |
| Estimated effort | XS |
| Priority | **P3** |

---

### P3-10. Improve accessibility

| | |
|---|---|
| Problem | No skip link; status badges are color-only; sidebar mobile overlay starts open; no focus management. |
| Evidence | `packages/ui/src/navigation/sidebar.tsx`, `packages/ui/src/layouts/app-shell.tsx:30`. |
| Proposed fix | (a) Add skip-to-content link. (b) Add text/icon to status badges. (c) Default `collapsed = true` on mobile. (d) Document keyboard shortcuts. |
| Estimated effort | M (1 week) |
| Priority | **P3** |

---

### P3-11. Localize error messages

| | |
|---|---|
| Problem | Raw Firebase error strings ("auth/invalid-credential") are shown to users. |
| Evidence | `sign-in/page.tsx:40`, `onboarding/page.tsx:48`. |
| Proposed fix | Map Firebase error codes to user-friendly strings. |
| Estimated effort | S |
| Priority | **P3** |

---

### P3-12. Align PDS schema with implementation

| | |
|---|---|
| Problem | Several PDS-described fields are missing from interfaces. |
| Evidence | `Organization.settings` (PDS yes, type no), `TrackCredit.percentage` (yes, no), `Dependency.description` (yes, no), `DistributionPackage.submittedAt` (yes, no), `RightsHolder` `role/percentage/pro/ipi/collectionSociety` (yes, no). |
| Proposed fix | Add the missing fields to the interfaces; update writers/readers; add a migration script if data is already in production. |
| Estimated effort | M (1 week) |
| Priority | **P3** |

---

### P3-13. Add 404 page

| | |
|---|---|
| Problem | No `not-found.tsx`; unknown routes use Next.js default. |
| Evidence | `apps/web/src/app/` has no `not-found.tsx`. |
| Proposed fix | Add `app/not-found.tsx` with branded empty state. |
| Estimated effort | XS |
| Priority | **P3** |

---

### P3-14. Remove type cast violations

| | |
|---|---|
| Problem | `as never` and `as Release[...]` bypass the type system. |
| Evidence | `artists/new/page.tsx:43`, `rights-service.ts:134-135`, `releases/new/page.tsx:64, 98`. |
| Proposed fix | Use `as const` on the source arrays; remove the casts. |
| Estimated effort | XS |
| Priority | **P3** |

---

## Effort Summary

| Tier | Count | Estimated total |
|---|---|---|
| P0 | 9 | ~5 weeks (1 engineer) |
| P1 | 13 | ~6 weeks |
| P2 | 6 | ~3 weeks |
| P3 | 14 | ~3 weeks |
| **Total** | **42** | **~17 weeks (1 engineer)** |

### Critical path to production (P0 only)
P0-1 → P0-7 → P0-2 → P0-3 → P0-4 → P0-9 → P0-5 → P0-6 → P0-8
**~2-3 weeks for one senior engineer.**

### Strongly recommended (P0 + P1 first half)
P0-1, P0-2, P0-3, P0-4, P0-5, P0-6, P0-7, P0-8, P0-9, P1-1, P1-2, P1-3, P1-4, P1-5, P1-6, P1-11
**~5-6 weeks.**
