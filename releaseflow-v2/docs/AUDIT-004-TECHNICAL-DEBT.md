# AUDIT-004 — Technical Debt

| Field | Value |
|---|---|
| Audit date | 2026-06-28 |
| Audit version | 1.0 |
| Scope | Catalog of dead code, duplication, legacy code, unused exports, and inefficiencies |
| Severity scale | Critical (data corruption, security) → High (broken UX, large performance loss) → Medium (correctness, maintainability) → Low (cosmetic, nits) |

---

## Critical

### C1. Activity log written with empty `releaseId` / `stageId` / `deliverableId`

**Finding:** Three call sites pass empty strings as `releaseId` to service functions that write `activities` documents. The result is `activities` records with `releaseId: ''`, violating the type contract (`releaseId: string` is non-optional) and silently corrupting the activity feed for affected releases.

**Evidence:**
- `apps/web/src/app/(app)/contributor/page.tsx:80` — `completeTask(taskId, '', '', user?.uid ?? '')` — both `releaseId` and `stageId` are `''`.
- `apps/web/src/app/(app)/approvals/page.tsx:45, 50` — `approveRequest(requestId, user?.uid ?? '', '')` and `rejectRequest(...)` — `releaseId` is `''`.
- `apps/web/src/lib/notification-service.ts:31, 47, 59` — `createNotification`, `markAsRead`, `archiveNotification` all pass `releaseId: ''` when the caller doesn't provide one.

**Impact:**
- The per-release `ActivityTab` filter at `releases/[id]/page.tsx:909` is `where('releaseId', '==', releaseId)`. These records never match.
- `useOperationsCenter.ts:188-195` aggregates `activities` by `releaseId`; orphans inflate counts.
- Activity types: `task.completed`, `task.assigned` (contributor path), `approval.approved`/`rejected`, `notification.created`/`read`/`archived` all affected.
- This is silent — no error, no UI feedback.

**Proposed fix:**
- Make `releaseId` required on the service-level helpers (TypeScript type change) and have callers look up the value from the parent resource.
- For notifications, accept `releaseId: null` and skip the activity write entirely when not provided.
- For contributor/approvals, fetch the parent doc (task or approval_request) and read its `releaseId`.

**Estimated effort:** S (1-2 days)

---

### C2. Delete release has no cascade — orphaned data

**Finding:** `handleDelete` in the release detail page only deletes the `releases/{id}` doc. All child collections (workflows, stages, tasks, requirements, activities, deliverables, dependencies, ownerships, etc.) are left orphaned.

**Evidence:** `app/(app)/releases/[id]/page.tsx:194-199`:
```ts
async function handleDelete() {
  if (!confirm('This permanently removes the release and all associated operational data.')) return;
  const db = getDb(); if (!db) return;
  await deleteDoc(doc(db, 'releases', id));
  router.push('/releases');
}
```

The confirm message is **misleading** — it says "all associated operational data" but only the release doc is removed.

**Impact:**
- Orphaned docs accumulate.
- Counts on dashboard (`useOperationsCenter`) skew.
- `ActivityTab` for a deleted release keeps showing historical activities (or breaks, depending on filter).
- Cost grows with usage.

**Proposed fix:**
- Cloud Function `onDelete(release)` that runs `deleteAll` across child collections (in batches of 500).
- Or client-side batched delete (capped at 500 per write batch, loop until done) before the main `deleteDoc`.
- Update the confirm copy to match actual behavior, or fix the behavior to match the copy.

**Estimated effort:** M (3-5 days for server-side, S for client-side loop)

---

### C3. Firestore rules allow any auth user to write any collection

**Finding:** `firestore.rules:9-43` allows `read,write: if isAuth()` on 26 of 28 collections. Only `organizations` and `releases` have ownership checks on update/delete; only `releases` and `activities` have create-time actor validation. `artists` and `rights_holders` are explicitly global (no `organizationId` scoping).

**Evidence:**
- `firestore.rules:10` `match /memberships/{docId} { allow read,write: if isAuth(); }` — any auth user can grant themselves any role in any org.
- `firestore.rules:13-43` — same pattern for workflows, stages, tasks, deliverables, requirements, approval_requests, campaigns, etc.
- `firestore.rules:26` artists, `:29` rights_holders — global.
- `lib/artist-service.ts:54-61` — `getArtists` queries all artists, no `where('organizationId')`.
- `lib/rights-service.ts:20-25` — `getRightsHolders` queries all rights holders, no `where('organizationId')`.

**Impact:**
- **Tenant isolation is purely client-side.** Any malicious auth user can:
  - Add themselves as a member of any org with any role (`memberships`).
  - Edit any other org's releases, tasks, deliverables.
  - Read all artists and rights holders.
- This is **P0 security** for any multi-tenant deployment.

**Proposed fix:**
- Server-side rules: check `request.auth.token.role` (custom claim) + `membership` document for the requested `organizationId`.
- Add `organizationId` to `artists` and `rights_holders` (schema migration) and rules that enforce org-scope on read/write.
- Move "isAuth && owns this org" check to a helper function in rules.

**Estimated effort:** L (1-2 weeks for full RBAC + custom claims + migration)

---

### C4. Edit form writes `explicit: null` instead of `false` (type mismatch)

**Finding:** The release edit form's explicit-content checkbox writes `null` to Firestore when unchecked, but the type is `boolean | undefined`.

**Evidence:** `app/(app)/releases/[id]/edit/page.tsx:113`:
```ts
explicit: explicit || null,
```

`types.ts:12-33` — `Release.explicit?: boolean` (boolean, not `boolean | null`).

**Impact:**
- Type contract violation; downstream code that does `if (release.explicit)` (e.g. `lib/distribution-service.ts` checks `explicit` indirectly) behaves inconsistently.
- Future code using `=== true` will silently miss these rows.

**Proposed fix:** `explicit: !!explicit` (or use a default `false`).

**Estimated effort:** XS (one-liner + migration script if needed)

---

## High

### H1. `writeBatch` in a page (no service abstraction)

**Finding:** `releases/new/page.tsx:49-134` composes a 7-doc batch inline in a page. This is 50+ lines of domain logic in a UI file, with no `try/catch`.

**Evidence:** `app/(app)/releases/new/page.tsx:8, 49-134`.

**Impact:**
- Logic isn't reusable.
- Hard to test.
- `batch.commit()` is bare (line 134) — on failure, `setSubmitting(true)` is never reset; user is stuck on the form.
- The same logic is duplicated from `lib/requirement-service.ts:6-24` and `lib/workflow-service.ts:6` (both exported but never called).

**Proposed fix:** Move the batch into `lib/release-service.ts` (or a new `lib/release-creation.ts`):
```ts
export async function createReleaseWithWorkflow(
  organizationId: string, fields: CreateReleaseFields, actorId: string
): Promise<string>
```
Wrap `batch.commit()` in `try/catch` and surface errors via toast or `<Alert>`.

**Estimated effort:** M (3 days)

---

### H2. Cross-org check is client-side only (release detail)

**Finding:** `releases/[id]/page.tsx:111-113` and `releases/[id]/edit/page.tsx:63-67` set a `forbidden` flag in React state, but Firestore rules allow any auth user to read any release.

**Evidence:**
- `app/(app)/releases/[id]/page.tsx:111-113`:
  ```ts
  if (releaseData.organizationId && activeOrgId && releaseData.organizationId !== activeOrgId) {
    setForbidden(true); return;
  }
  ```
- `firestore.rules:12` — `match /releases/{docId} { allow read: if isAuth(); ... }`.

**Impact:** Any auth user can `getDoc('releases', '<any-id>')` from the JS console and read the full release document, including `createdBy`, `targetReleaseDate`, etc.

**Proposed fix:** Server-side rules: `allow read: if isAuth() && (resource.data.organizationId in request.auth.token.memberships)`.

**Estimated effort:** M (paired with C3)

---

### H3. In-memory `useOrgStore` — refresh loses active org

**Finding:** `useOrgStore` is a Zustand store with no persistence. On page refresh, `activeOrgId` resets to `null`; `layout.tsx:158-165` then auto-sets it to the first org in the list (line 162). If the user belongs to multiple orgs, this may select the wrong one.

**Evidence:** `apps/web/src/stores/org-store.ts:1-25` (no `persist` middleware). `app/(app)/layout.tsx:160-164`.

**Impact:** User selects org B, refreshes, lands on org A. Confusing.

**Proposed fix:** `useOrgStore` should use `zustand/middleware`'s `persist` with a versioned localStorage key.

**Estimated effort:** S (hours)

---

### H4. Edit form loses metadata — new releases start with no UPC, label, etc.

**Finding:** The create form has 4 fields. All 10 metadata fields (upc, catalogNumber, label, copyright, pLine, cLine, genre, subgenre, language, explicit) are gated behind an edit toggle (`showMetadata`, default `false`).

**Evidence:**
- `app/(app)/releases/new/page.tsx:138-159` — 4 inputs.
- `app/(app)/releases/[id]/edit/page.tsx:138-186` — 10+ metadata fields.
- `app/(app)/releases/new/page.tsx:52-61` — release batch writes only the 4 fields plus `organizationId`, `createdBy`, `createdAt`.

**Impact:**
- New release can never pass `checkDistributionReadiness` (`lib/distribution-service.ts:8-17`) until the user opens the edit form and fills in 8 fields.
- A user clicking "Create" is surprised that the release is "incomplete" for distribution immediately.

**Proposed fix:** Add the metadata fields to the new-release form (or split into a wizard with a "Metadata" step).

**Estimated effort:** S (1-2 days)

---

### H5. N+1 query loops

**Finding:** Multiple sites issue one Firestore round-trip per parent document.

**Evidence:**
- `app/(app)/releases/[id]/page.tsx:129` — `for (const s of stageList) tasksMap[s.id] = await getTasksByStage(s.id)`.
- `app/(app)/artists/[id]/page.tsx:60-82` — for each `c` in credits, `getDoc(doc(db, 'tracks', c.trackId))` (line 79).
- `app/(app)/approvals/page.tsx:25-33` — for each pending request, `getDoc(doc(db, 'deliverables', r.deliverableId))`.
- `hooks/useOperationsCenter.ts:117-194` — 5+ collections queried once per release id.

**Impact:** Slow page loads on wide workflows. 5-stage workflow = 6 round-trips; 10 credits = 10 round-trips.

**Proposed fix:**
- Add a `getTasksByStages(stageIds: string[])` helper that does a single `where('stageId', 'in', stageIds)`.
- Add a `getTracksByIds(ids: string[])` helper.
- `useOperationsCenter` should batch the aggregate reads by chunking release IDs.

**Estimated effort:** M (3-5 days)

---

### H6. Status state machine mismatch (form options vs. transition table)

**Finding:** Both the create form and edit form omit `on_hold` and `cancelled` from the status select, but the `STATUS_TRANSITIONS` map allows transitioning to them. After a release is moved to `on_hold` (e.g. by a programmatic transition), the user cannot re-select that status manually — dead end.

**Evidence:**
- `app/(app)/releases/new/page.tsx:23-30` — 6 statuses, no `on_hold`/`cancelled`.
- `app/(app)/releases/[id]/edit/page.tsx:20-27` — same.
- `app/(app)/releases/[id]/page.tsx:43-66` — `STATUS_TRANSITIONS` includes `'on_hold'` and `'cancelled'`.
- `types.ts:5-11` (ReleaseStatus) — full enum includes both.

**Impact:** Inconsistent UI; a release can be put into `on_hold` by code but not by user.

**Proposed fix:** Add `on_hold` and `cancelled` to the form selects; document transitions.

**Estimated effort:** XS (hours)

---

### H7. Approximate code: 19 pages import `firebase/firestore` directly

**Finding:** Service-layer abstraction is not enforced. 19 page files import from `firebase/firestore` (e.g. `collection`, `doc`, `getDoc`, `getDocs`, `query`, `where`, `writeBatch`, `Timestamp`).

**Evidence:** See AUDIT-002 §4.1.

**Impact:**
- Hard to swap data sources (testing, mock).
- Logic scattered.
- No central place to add logging, retry, or caching.

**Proposed fix:** Enforce the boundary via an ESLint rule (`no-restricted-imports` from `@/app/**/page.tsx`).

**Estimated effort:** M (a few days to refactor the most-used pages)

---

### H8. Inconsistent error handling — most mutations have no try/catch

**Finding:** The form submissions in `releases/new`, `releases/[id]/edit`, `artists/new`, `rights-holders/new`, and the inline task create/checkbox all call services without `try/catch`.

**Evidence:**
- `releases/new/page.tsx:134` — bare `batch.commit()`.
- `releases/[id]/edit/page.tsx:91-117` — bare `updateDoc`.
- `artists/new/page.tsx:42-50` — bare `createArtist(...)`.
- `contributor/page.tsx:80, 85, 90` — bare service calls; only `setTasks((prev) => prev.filter(...))` runs after.

**Impact:** User has no feedback on failure. `setSubmitting(true)` is never reset to `false`; spinner spins forever (or until route change).

**Proposed fix:** Add a shared `useAsyncAction` hook that wraps `setSubmitting` and surfaces errors via `useToastStore.error()`.

**Estimated effort:** S-M (1 week to standardize)

---

## Medium

### M1. `slugify` / `generateSlug` duplicated 3 times

**Finding:** Three near-identical implementations of slug generation.

**Evidence:**
- `lib/artist-service.ts:5-7`:
  ```ts
  function slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  ```
- `app/(app)/organizations/page.tsx:55-57` — identical body, different name.
- `app/(onboarding)/onboarding/page.tsx:31-33` — identical.

**Impact:** Behavior drift if one is changed (e.g. Unicode handling).

**Proposed fix:** Single `lib/utils.ts` `slugify` export; import in all three places.

**Estimated effort:** XS

---

### M2. `toDate(ts: unknown)` duplicated 6+ times

**Finding:** Helpers that convert Firestore `Timestamp` / `{seconds}` / ISO string to `Date`.

**Evidence:**
- `hooks/useOperationsCenter.ts:67-77`
- `lib/workflow-progression.ts:127-137` (private)
- `lib/workflow-health.ts:3-13` (private)
- `app/(app)/brief/page.tsx:21-31` (private)
- `app/(app)/contributor/page.tsx:15-25` (private)
- `app/(app)/releases/[id]/edit/page.tsx:73` (inline)
- `lib/utils.ts:3-8` (variant — only handles `Timestamp`, object, string, not `Date` instance)

**Impact:** Same as M1 — drift risk.

**Proposed fix:** Consolidate into `lib/utils.ts` `toDate(input): Date | null`. Update all call sites.

**Estimated effort:** S

---

### M3. Org-loading logic (`getOrganizationsByUser`) in layout, not in service

**Finding:** The query that loads the user's orgs lives inside `app/(app)/layout.tsx:130-143`. The same pattern repeats in `app/(app)/organizations/page.tsx:30-39` and `app/(app)/contributor/page.tsx:36-53`.

**Impact:** Cannot be reused or tested.

**Proposed fix:** Move to `lib/org-service.ts`:
```ts
export async function getOrganizationsByUser(userId: string): Promise<Organization[]>
```

**Estimated effort:** XS

---

### M4. `priorityStyles` / `alertSeverityBorder` color maps reinvented 4+ times

**Finding:** Same color-mapping logic (`bg-danger-50`, `bg-warning-50`, etc.) appears in:
- `app/(app)/dashboard/page.tsx:15-37`
- `app/(app)/brief/page.tsx:15-19`
- `app/(app)/releases/[id]/page.tsx:622-629`
- Inline at `contributor/page.tsx:182-184, 228`.

**Impact:** Styling drift.

**Proposed fix:** Single `lib/style-maps.ts` with `priorityColor(priority)`, `severityColor(severity)`. Or extend the existing `Badge` component with a `priority` prop.

**Estimated effort:** XS

---

### M5. Three pages are pure redirects — no value

**Finding:**
- `app/(app)/administration/members/page.tsx` → `router.replace('/organizations')`
- `app/(app)/administration/audit/page.tsx` → `router.replace('/audit')`
- `app/(app)/administration/diagnostics/page.tsx` → `router.replace('/diagnostics')`

**Impact:** Dead routes; one indirection that serves no purpose.

**Proposed fix:** Delete the three files; update sidebar/admin hub links.

**Estimated effort:** XS

---

### M6. Three pages are static placeholders

**Finding:**
- `app/(app)/work/page.tsx` — two `<EmptyState>` only.
- `app/(app)/assets/page.tsx` — one `<EmptyState>` only.
- `app/(app)/people/page.tsx` — one `<EmptyState>` only.

**Impact:** Nav items that lead nowhere useful.

**Proposed fix:** Either build the page or remove from sidebar.

**Estimated effort:** M-L (per page)

---

### M7. `next/middleware.ts` is a no-op

**Finding:** `apps/web/src/middleware.ts:5-18` always returns `NextResponse.next()`. The auth check lives in `app/(app)/layout.tsx:154`.

**Impact:** Misleading; suggests server-side auth gating that doesn't exist.

**Proposed fix:** Either implement real auth checks (read Firebase session cookie) or remove the file. The layout's check is sufficient for the current design.

**Estimated effort:** XS

---

### M8. Type cast violations (`as never`, `as Release[...]`)

**Finding:**
- `app/(app)/artists/new/page.tsx:43` — `artistType as never`
- `lib/rights-service.ts:134-135` — `items as never` (×2)
- `app/(app)/releases/new/page.tsx:64, 98` — `releaseType as Release['releaseType']`

**Impact:** Bypasses type system; future refactors won't catch type drift.

**Proposed fix:** Use proper `as const` literals on the source arrays; remove the casts.

**Estimated effort:** XS

---

### M9. Dead `useOptimistic`, `useUnsavedChanges`, `useKeyShortcuts` hooks

**Finding:** Three hooks are exported but never imported.

**Evidence:**
- `hooks/use-optimistic.ts:6` — `useOptimistic`
- `hooks/use-keyboard-shortcuts.ts:5, 23` — `useUnsavedChanges`, `useKeyShortcuts`

**Impact:** Bundle bloat, confusion.

**Proposed fix:** Delete the files (or wire them up).

**Estimated effort:** XS

---

### M10. Dead store actions: `useRoleStore.loading`, `useRoleStore.reset`, `useToastStore.add`/etc.

**Finding:** 5 store actions defined, 0 callers.

**Evidence:** `stores/role-store.ts:46` (`reset`), `stores/toast-store.ts` (`add`, `success`, `error`, `warning`, `info`).

**Impact:** Bundle + confusion.

**Proposed fix:** Either wire to a global toast container that the UI actually uses, or delete.

**Estimated effort:** XS

---

### M11. `packages/firebase` (Cloudinary) is completely unused

**Finding:** 5 functions (`uploadFile`, `uploadFileFromUrl`, `signUpload`, `getAssetUrl`, `transformImage`) and types are exported; 0 imports anywhere in `apps/web`.

**Evidence:** `packages/firebase/src/cloudinary/*` + `packages/firebase/src/index.ts`.

**Impact:** Bundle, surface area confusion.

**Proposed fix:** Delete the package or implement asset upload.

**Estimated effort:** L (if implementing)

---

### M12. `packages/shared` is an empty barrel

**Finding:** `packages/shared/src/index.ts` contains only `export {};`. No consumers.

**Proposed fix:** Delete the package, or populate it with the cross-cutting constants (e.g. the `pathLabels` map from `layout.tsx:75-92`).

**Estimated effort:** XS

---

### M13. `Roles` collection declared in rules but never read or written

**Finding:** `firestore.rules:11` declares `match /roles/{docId} { allow read,write: if isAuth(); }`. No service or page references it. Role identity is a free string `roleId: 'owner'` on `memberships`.

**Evidence:** `Role` interface exists at `types.ts:142-146`. No `roles/{id}` reads or writes anywhere in `apps/web/src/`.

**Impact:** RBAC data model is incomplete; the `Role` interface is dead.

**Proposed fix:** Either implement role documents (seed with `owner`, `admin`, `release_manager`, `contributor`) and reference them from `memberships.roleId`, or remove the rule and interface.

**Estimated effort:** M (1 week to seed + wire)

---

### M14. `Track` is read-only and partial

**Finding:** `tracks` collection has no write path in the app. `artists/[id]/page.tsx:78-80` does `getDoc(doc(db, 'tracks', c.trackId))` in a loop; the `Track` type has fields that are never read or written.

**Evidence:** `lib/artist-service.ts:87-91` `addTrackCredit` is exported but unused; `lib/artist-service.ts:94-100` `getCreditsByTrack` is unused. `Track` interface fields `writers, publishers, producers, featuredArtists, remixers, duration, version` (`types.ts:64-77`) are never referenced.

**Proposed fix:** Either implement track creation/management or remove the dead `Track` fields.

**Estimated effort:** L (if implementing)

---

### M15. `AssetReference`, `TrackOwnership` collections completely unused

**Finding:** `firestore.rules:21, 31` declare `asset_references` and `track_ownerships`; no service or page references them.

**Impact:** Dead schema.

**Proposed fix:** Implement or remove from rules.

**Estimated effort:** M (if implementing)

---

### M16. `comments` collection has service functions but no UI

**Finding:** `lib/task-service.ts:135-163` `addComment` and `:166-189` `getCommentsByTask` exist. No page calls them. No UI displays comments.

**Impact:** Dead feature.

**Proposed fix:** Wire up comment UI in `TasksSection` (`releases/[id]/page.tsx:728-781`).

**Estimated effort:** M

---

### M17. Unused UI primitives (~25 components)

**Finding:** `MetricCard`, `WorkspaceCard`, `HealthBar`, `AvatarGroup`, `Typography`, `Divider`, `Container`, `Stack`, `Grid`, `Overlay`, `Modal`, `Tooltip`, `Tag`, `Icon`, `Checkbox`, `Radio`, `Switch`, `DataGrid`, `Timeline`, `Pagination`, `SegmentedControl`, `Search`, `Banner`, `ConfirmationDialog`, `InlineMessage`, `Notification`, `NotificationFeed`, `DashboardLayout`.

**Impact:** Bundle bloat.

**Proposed fix:** Remove from `packages/ui/src/index.ts` and delete component files (or implement).

**Estimated effort:** XS (delete)

---

### M18. Unused domain-ui components (6 of 11)

**Finding:** `ApprovalMatrix`, `RightsMatrix`, `CreditsTable`, `DistributionBoard`, `DSPStatus`.

**Impact:** Bundle + dead schema.

**Proposed fix:** Wire to relevant tabs (Distribution tab, Rights tab, Approvals page, Credits section) or remove.

**Estimated effort:** M-L (if implementing)

---

## Low

### L1. Unused design tokens

**Finding:** `apps/web/src/app/globals.css:14-270` defines 80+ tokens. Confirmed unused (verified by `rg`):
- `--color-text-50/100/200/300` (only `text-text-600/700/800/900` used)
- `--color-primary-200`, `--color-primary-300`
- All `--color-secondary-*` (entire scale)
- All `--color-workflow-*` (planning, recording, mixing, mastering, artwork, publishing, distribution, released)
- All `--color-status-*`
- All `--color-border-*`
- The `--rf-` namespace mirrors

**Impact:** CSS bundle bloat (~5–10 KB).

**Proposed fix:** Remove unused tokens from `globals.css`.

**Estimated effort:** XS

---

### L2. Unused `Release.version` field

**Finding:** `types.ts:12-33` has `version?: string` on `Release`. No form sets it; no UI displays it.

**Impact:** Dead schema.

**Proposed fix:** Remove or implement.

**Estimated effort:** XS

---

### L3. Unused `Organization.slug` (kind of)

**Finding:** `Organization.slug` is written on create and displayed in the org page table (`organizations/page.tsx:166`), but not used as a URL or for routing. Also no uniqueness check (see H7-adjacent security gap).

**Impact:** Low.

**Proposed fix:** Decide: is slug a route key, a search handle, or both? Add uniqueness check.

**Estimated effort:** S

---

### L4. Unused `TrackCredit.percentage` (missing entirely)

**Finding:** PDS describes a `percentage` field on `TrackCredit`. Interface (`types.ts:125-130`) has `id, trackId, artistId, role` only.

**Impact:** Schema drift.

**Proposed fix:** Add `percentage: number` to interface and writers.

**Estimated effort:** XS

---

### L5. Unused `Dependency.description` (missing entirely)

**Finding:** PDS mentions a `description` field; the interface (`types.ts:373-384`) has no `description`.

**Impact:** Schema drift.

**Proposed fix:** Add field.

**Estimated effort:** XS

---

### L6. Unused `DistributionPackage.submittedAt` (missing entirely)

**Finding:** PDS describes `submittedAt`; the interface (`types.ts:243-253`) has only `generatedAt` and `createdAt`.

**Proposed fix:** Add field; write on package generation.

**Estimated effort:** XS

---

### L7. Unused `RightsHolder` schema fields

**Finding:** PDS describes `role`, `percentage`, `pro`, `ipi`, `collectionSociety`. Interface (`types.ts:290-298`) has only `name, type, contact, territory, createdAt, updatedAt`.

**Proposed fix:** Extend the interface; update `createRightsHolder` and form.

**Estimated effort:** M

---

### L8. Unused `ReleaseOwnership` / `TrackOwnership` (no UI)

**Finding:** `lib/rights-service.ts:35-49` `addReleaseOwnership` is exported; no page calls it. Same for `addTrackOwnership`. Validation runs but always returns "No ownership defined".

**Proposed fix:** Add a release-rights editor.

**Estimated effort:** M

---

### L9. `getOrganizationsByUser` does N+1 on org docs

**Finding:** `app/(app)/layout.tsx:130-143` queries memberships, then for each membership calls `getDoc('organizations', orgId)`. For a user in 3 orgs, that's 4 round-trips.

**Impact:** Negligible at small N; grows with org count.

**Proposed fix:** Could be replaced with a denormalized `userOrgs` array on a `users/{uid}` doc, or with a single `where('id', 'in', orgIds)` query.

**Estimated effort:** S

---

### L10. `Stage.daysInStage` written, never read

**Finding:** `lib/workflow-progression.ts:46` writes `daysInStage` on stage completion. No reader exists.

**Impact:** Dead data.

**Proposed fix:** Display in `WorkflowBoard` or remove.

**Estimated effort:** XS

---

### L11. Stage `dueDate` always `null`

**Finding:** All writers (`releases/new/page.tsx:88`, `lib/workflow-service.ts:38-39`) set `dueDate: null`. No UI sets it; type permits it.

**Impact:** Dead schema field.

**Proposed fix:** Either remove from type or add a date picker to the stage editor.

**Estimated effort:** S

---

### L12. `WorkflowStatus` enum half-implemented

**Finding:** `types.ts:35` defines `'not_started' | 'in_progress' | 'completed' | 'blocked' | 'review' | 'approved'`. Only `'in_progress'` and `'completed'` are ever written (`releases/new/page.tsx:72`).

**Impact:** Dead enum members.

**Proposed fix:** Either implement the others or trim the union.

**Estimated effort:** XS

---

### L13. 7+ `timestamp.toDate` inline pattern in edit form

**Finding:** `app/(app)/releases/[id]/edit/page.tsx:73` does an inline `data.targetReleaseDate.toDate ? data.targetReleaseDate.toDate() : new Date(data.targetReleaseDate.seconds * 1000)`. This is a subset of M2.

**Impact:** Already covered.

---

### L14. `useOperationsCenter` 5-collection aggregate re-fetch

**Finding:** `hooks/useOperationsCenter.ts:117-194` queries 5+ collections in a loop, once per release id. The dashboard triggers this on every render of the operations center.

**Impact:** Performance on the home page.

**Proposed fix:** Use Firestore `in` queries with chunked release IDs.

**Estimated effort:** M

---

### L15. `approvals/page.tsx` and `contributor/page.tsx` missing error/loading states

**Finding:** Both pages set `loading` but never set `error`. A failed query leaves the user on the skeleton forever (infinite skeleton bug, similar to `releases/[id]/page.tsx:134`).

**Impact:** UX dead-end.

**Proposed fix:** Catch + show `<Alert type="error">` with retry.

**Estimated effort:** S

---

## Summary

| Severity | Count |
|---|---|
| Critical | 4 |
| High | 8 |
| Medium | 18 |
| Low | 15 |
| **Total** | **45** |

### Quick win list (XS / S effort, high impact)
- C4 (`explicit: null` → `false`)
- M1, M2, M3, M4 (consolidate duplicate helpers)
- M5 (delete 3 dead redirect pages)
- M7 (delete no-op middleware or make it real)
- M9, M10, M11, M12 (delete dead code packages/hooks/store actions)
- M17, M18 (delete unused UI primitives)
- L1 (remove unused CSS tokens)
- L2, L4, L5, L6, L7 (extend type interfaces per PDS — XS each)
- H3 (persist `useOrgStore`)
- H6 (add `on_hold`/`cancelled` to status select)
