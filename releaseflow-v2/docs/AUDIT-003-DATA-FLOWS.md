# AUDIT-003 — Data Flows

| Field | Value |
|---|---|
| Audit date | 2026-06-28 |
| Audit version | 1.0 |
| Scope | End-to-end data paths for 10 user workflows |
| Conventions | All paths are `file:line` relative to repo root |

---

## Workflow 1: Authentication (Sign-in)

**Entry point:** `apps/web/src/app/(auth)/sign-in/page.tsx:11-143`

**Trigger:** User navigates to `/sign-in`; submits email/password or clicks "Continue with Google".

**Data path:**
```
Email/Password                          Google
─────────────                           ──────
sign-in/page.tsx:37-51                  sign-in/page.tsx:25-35
  → getAuthInstance()                      → getAuthInstance()
  → signInWithEmailAndPassword(auth,        → signInWithPopup(auth,
       email, password)                         new GoogleAuthProvider())
  → router.push('/dashboard')             → router.push('/dashboard')
                │                                 │
                └────────────┬────────────────────┘
                             ↓
              contexts/auth-context.tsx:41-44
                onAuthStateChanged → setUser(auth.currentUser)
                             ↓
              app/(app)/layout.tsx:153-156
                resolveRole(user.uid)   ← reads memberships via
                                          role-store (no Firestore I/O
                                          in resolveRole itself)
                             ↓
              app/(app)/layout.tsx:158-165
                getOrganizationsByUser(user.uid)
                  → query(memberships where userId == uid, status == 'active')
                  → for each: getDoc(organizations/{orgId})
                setOrgs(data) → setActiveOrgId(data[0].id) → setOrgsLoaded(true)
                             ↓
              Page renders; AppShell with org selector visible
```

**Loading state:**
- `submitting` local boolean (line 17). Submit button text changes to "Signing in..."; `loading={submitting}` (line 56).
- `useAuth().loading` (line 12) returns `null` for the whole page if `loading || user` (line 23) — prevents flash.

**Error state:**
- `setError((err as Error).message)` (line 40) → rendered in `<Alert type="error">` (lines 60-64).
- Raw Firebase error string shown (e.g. "auth/invalid-credential"). Not localized.
- `getAuthInstance()` returning `undefined` (env vars missing) → `throw new Error('Auth not initialized')` shown.

**Edge cases:**
- Already-logged-in redirect at `useEffect` line 19-21: if `user`, push to `/dashboard` immediately.
- **Google `displayName` not set**: `signInWithPopup` is called but no `updateProfile({ displayName })` is invoked. The user record has no displayName unless set elsewhere.
- **No rate limiting / lockout** on email/password.
- **No CSRF token** (Firebase Auth handles this for its endpoints, but the form is a plain submit).

**Notes:**
- `getOrganizationsByUser` (`layout.tsx:130-143`) lives inside a layout component. It belongs in a service.
- The role resolution at `layout.tsx:155` calls `resolveRole` on every `user`/`loading` change. This triggers a Firestore read of `memberships` (and possibly `roles`) on each sign-in, with no caching.

---

## Workflow 2: Organization Selection / Creation

**Entry points:**
- First-time: `app/(onboarding)/onboarding/page.tsx:35-62` (post sign-up)
- Anytime: `app/(app)/organizations/page.tsx:59-74`

**Trigger:** New user with no org lands on `/onboarding`; existing user clicks "New Organization" on `/organizations`.

**Data path (creation):**
```
Onboarding or Organizations page
   │
   ├── form state: name, slug (auto-derived)
   ├── generateSlug(name)                 ← DUPLICATED in 3 files:
   │                                          artist-service.ts:5-7
   │                                          organizations/page.tsx:55-57
   │                                          onboarding/page.tsx:31-33
   ├── setSubmitting(true)
   ├── addDoc(organizations, { name, slug, ownerId: user.uid, createdAt: now })
   │     ← SEQUENTIAL, not in a batch
   ├── const orgId = ref.id
   ├── addDoc(memberships, { organizationId: orgId, userId: user.uid,
   │                          roleId: 'owner', status: 'active',
   │                          invitedBy: user.uid, createdAt: now })
   │     ← SEQUENTIAL — if this fails, org exists with no membership
   ├── setSubmitting(false)
   └── redirect to /dashboard (onboarding) or stay on page (organizations)
```

**Data path (selection / switching):**
```
app/(app)/layout.tsx:230-244
   <select value={activeOrgId}
           onChange={e => setActiveOrgId(e.target.value || null)} />
   │
   └── useOrgStore.set({ activeOrgId })
         ← IN-MEMORY ONLY (no persist middleware)
         ← on page refresh, resets to first org (line 162)
```

**Loading state:**
- Onboarding: `submitting` boolean; button text "Creating..."; `Alert` for errors.
- Organizations: `submitting` boolean; button text "Creating..."; `console.error` only — **no user-visible error**.

**Error state:**
- Onboarding: `setError(err.message)` → `<Alert type="error">`.
- Organizations: `console.error(err); setSubmitting(false)`. User sees nothing; the form re-enables. Silent failure.

**Edge cases:**
- **Slug uniqueness not enforced** (no Firestore rule, no client check, no composite index). Two orgs with the same slug can be created.
- **Neither page sets `activeOrgId` to the newly created org** explicitly. The org page leaves the user to use the topbar dropdown; the onboarding page relies on `layout.tsx:158-165` to auto-pick the first.
- **OwnerId set to `user.uid` in client code** — a malicious client can submit any `ownerId`. The Firestore rule at `firestore.rules:9` enforces `request.resource.data.ownerId == request.auth.uid` on `create`, so this is safe at the data layer; but the in-page assignment is misleading.

**Notes:**
- Two identical implementations of org+owner write; both should be a single `createOrganizationAndMembership(name, user)` service that runs them in a batch.
- Pending invites are shown on `/organizations` (line 179-199) with `handleAccept`/`handleDecline` (line 76-93), but those call `updateDoc` on `memberships` directly (line 88, 92) — not via a service.

---

## Workflow 3: Artist Create

**Entry point:** `app/(app)/artists/new/page.tsx:19-93`

**Trigger:** User clicks "New Artist" on `/artists`.

**Data path:**
```
artists/new/page.tsx
   │
   ├── form state: name, artistType, bio, country, genres, imageUrl,
   │               socialLinks: { instagram, spotify, website }
   ├── validation: if (!name.trim()) return     ← only required field
   ├── setSubmitting(true)
   ├── createArtist({
   │     name, artistType, bio, country, genres,
   │     imageUrl, socialLinks
   │   })
   │     │
   │     └── lib/artist-service.ts:19-37
   │           addDoc(artists, {
   │             name, slug: slugify(name),
   │             artistType, bio, country, genres, imageUrl, socialLinks,
   │             status: 'active',
   │             createdAt: now, updatedAt: now
   │           })
   │
   ├── setSubmitting(false)               ← only on success
   └── router.push(`/artists/${ref.id}`)
```

**Loading state:**
- `submitting` local boolean (line 30). Button: `loading={submitting}` + label "Creating...".

**Error state:**
- `console.error(err); setSubmitting(false)` (line 52-53). **No user-visible error.**
- If `createArtist` throws, the user sees the button re-enable but no message.

**Edge cases:**
- `artistType as never` cast (line 43) bypasses the type system.
- No URL format check on social link fields.
- `genres` is split on comma in the form (line 41), but the field is stored as a string array — works.
- **No `organizationId` is written.** Artists are global. Any auth user can see this artist (`firestore.rules:26`).

**Notes:**
- The form's "social links" section is in a `<details>` element (collapsible). Easy to miss.
- `Artist.organizationId` is not in the interface; see PDS stating "future field, not required for v1" but cross-org leak is real.

---

## Workflow 4: Release Create

**Entry point:** `app/(app)/releases/new/page.tsx:32-159`

**Trigger:** User clicks "New Release" on `/releases` list.

**Data path:**
```
releases/new/page.tsx
   │
   ├── form state: title, releaseType, status, targetReleaseDate
   ├── guard: if (!activeOrgId || !user) return
   ├── guard: if (!db) return
   ├── setSubmitting(true)
   ├── writeBatch(db)                  ← ALL IN ONE BATCH
   │     │
   │     ├── set releases/{auto}               { organizationId, title, releaseType, status,
   │     │                                        targetReleaseDate (Timestamp or null),
   │     │                                        createdBy: user.uid, createdAt, updatedAt }
   │     ├── set workflows/{auto}              { releaseId, templateId: releaseType,
   │     │                                       status: in_progress|completed,
   │     │                                       progress: 0, currentStageId: null,
   │     │                                       startedAt, updatedAt }
   │     ├── for each template:                { workflowId, name, order,
   │     │   set stages/{auto}                    status: in_progress|not_started,
   │     │                                        startedAt?, dueDate: null,
   │     │                                        assignedRole, completedAt: null }
   │     ├── update workflows/{auto}           { currentStageId: firstStageId }   (if templates)
   │     ├── for each reqName:                 { releaseId, name, status: 'required',
   │     │   set release_requirements/{auto}     createdAt, updatedAt }
   │     ├── set activities/{auto}             { type: 'release.created', releaseId,
   │     │                                       workflowId, actorId, metadata }
   │     └── (if templates) set activities/{auto}  { type: 'workflow.generated',
   │                                                 releaseId, workflowId, actorId,
   │                                                 metadata: { stageCount } }
   │
   ├── await batch.commit()             ← NO try/catch
   └── router.push(`/releases/${id}`)
```

**Loading state:**
- `submitting` boolean (line 40). Button: `loading={submitting}` + label "Creating...".

**Error state:**
- **None.** `batch.commit()` is bare (line 134). On failure, an exception is thrown but uncaught; React's default behavior shows the unhandled error; `setSubmitting(true)` is never reset. The user is stuck on the form with a button in "Creating..." state (and the spinner is animated).

**Edge cases:**
- If `templates.length === 0`, the workflow starts as `'completed'` (line 72). No stages, no `currentStageId` update. The `workflow.generated` activity is also skipped (line 121).
- `createdAt: Timestamp.now()` (line 59) and `workflow.generated`'s `createdAt: Timestamp.now()` (line 130) are slightly different timestamps. Minor.
- If `activeOrgId` is `null` at submit time (e.g. between renders), the batch proceeds with `organizationId: null` (line 53).
- `releaseType as Release['releaseType']` cast (line 64, 98) bypasses the literal union.
- **Missing fields**: upc, catalogNumber, label, copyright, pLine, cLine, genre, subgenre, language, explicit — **not written on create**. The new release starts with `null` for all metadata, blocking distribution readiness (`lib/distribution-service.ts:8-17`).

**Notes:**
- All release/requirement/workflow generation logic is duplicated from the dead `lib/requirement-service.ts:6-24` and `lib/workflow-service.ts:6`. The functions exist but are never imported.
- 7 doc writes orchestrated in a page is a strong signal the page is too heavy.

---

## Workflow 5: Release Load

**Entry point:** `app/(app)/releases/[id]/page.tsx:72-953`

**Trigger:** User navigates to `/releases/{id}`.

**Data path:**
```
releases/[id]/page.tsx:103-148
   │
   ├── useEffect [id, activeOrgId]
   │
   ├── getDoc(releases/{id})                    ← direct
   │     ↓
   ├── cross-org check:
   │     if (release.organizationId && activeOrgId &&
   │         release.organizationId !== activeOrgId)
   │         setForbidden(true)   ← client-side only
   │         return
   │     ↓
   ├── getDocs(workflows where releaseId, limit 1)    ← direct (line 117)
   ├── if workflow:
   │     ├── getDocs(stages where workflowId, orderBy order)   ← direct (line 125)
   │     └── for each stage:
   │           getTasksByStage(stage.id)            ← service (N+1; line 129)
   │           tasksMap[stage.id] = ...
   │
   └── Promise.all([
         getRequirementsByRelease(id),             ← service
         getDeliverablesByRelease(id),             ← service
         getDependenciesByRelease(id),             ← service
         getLatestDistributionPackage(id),         ← service
         validateReleaseOwnership(id),             ← service
       ])
```

**Loading state:**
- `loading=true`; full Skeleton UI (lines 213-233).

**Error states:**
- Release not found: `setLoading(false); return` → `<EmptyState title="Release not found" />` (line 241).
- Cross-org: `forbidden=true` → "Access Denied" screen (lines 234-240) with a "Return to Dashboard" link.
- **Per-Firestore error: not handled.** `Promise.all` on line 134 will reject on any failure; `setLoading(false)` is never reached → infinite skeleton.

**Edge cases:**
- **Stage loop N+1**: `releases/[id]/page.tsx:129` calls `getTasksByStage` once per stage. For a 5-stage workflow, that's 5 sequential round-trips.
- **No caching**: every tab switch re-fetches. The component has 9 useEffects (including per-tab).
- `setForbidden` is not reset on `id` change — if a user goes from a forbidden release to a valid one in the same SPA session, the state may persist (the effect's cleanup doesn't reset it).
- `getDoc(doc(db, 'tracks', id))` in `artists/[id]/page.tsx:79` is the only place the `tracks` collection is read, in a loop — N+1.
- `wfSnap` is assigned via `Promise.all` with a single-element array (lines 116-118) — works but verbose.

**Notes:**
- The page is 882 lines. It is the de facto "release workspace" implementation: 8 tabs (Overview, Workflow, Tasks, Assets, Distribution, Budget, Activity, Settings) each rendered inline. No sub-components extracted.
- The 4 parallel `Promise.all` reads each do their own Firestore query — total 5 + N(stages) reads on every load.

---

## Workflow 6: Task Update

**Entry points:**
- Contributor page: `app/(app)/contributor/page.tsx:79-82` (inline checkbox)
- Release detail: `app/(app)/releases/[id]/page.tsx:758` (inline checkbox in `TasksSection`)

**Trigger:** User clicks the checkbox to complete a task, or types a title in the inline new-task form.

**Data path (complete):**
```
contributor/page.tsx:80 OR releases/[id]/page.tsx:758
   │
   └── completeTask(taskId, releaseId, stageId, userId)
         │
         ├── updateDoc(tasks/{taskId}, {
         │     status: 'done',
         │     completedAt: Timestamp.now(),
         │     updatedAt: Timestamp.now()
         │   })
         │
         └── logActivity({
               type: 'task.completed',
               releaseId,       ← '' on contributor page
               stageId,         ← '' on contributor page
               taskId,
               actorId: userId
             })
```

**Data path (create):**
```
releases/[id]/page.tsx:769-776  (inline new-task form)
   │
   └── createTask({ stageId, releaseId, title, priority, assigneeId })
         │
         ├── addDoc(tasks, {
         │     stageId, releaseId, title, description: null,
         │     status: 'todo', priority: fields.priority ?? 'medium',
         │     assigneeId: fields.assigneeId ?? null,
         │     dueDate: null,
         │     createdAt: now, updatedAt: now
         │   })
         │
         └── logActivity({ type: 'task.created', releaseId, stageId, taskId,
                          actorId, metadata: { title, priority } })
```

**Loading state:** None. The checkbox is a synchronous click; no spinner.

**Error state:** **None.** Both `completeTask` and `createTask` are called without `try/catch`; failures throw silently.

**Edge cases:**
- **contributor/page.tsx:80** passes `''` as `releaseId` and `''` as `stageId`. The activity log entry has `releaseId: ''` and never appears in any release's `ActivityTab` filter (`releases/[id]/page.tsx:909`).
- Inline task creation on the release detail page is plain — no optimistic update, no rollback on error.
- No `addComment` / comment UI anywhere, despite the service existing (`lib/task-service.ts:135`).

**Notes:**
- `updateTask` and `deleteTask` are exported but never called from any page (`lib/task-service.ts:73-83`). Dead code.
- `assignTask` / `unassignTask` write activity but no UI calls them.

---

## Workflow 7: Workflow Progression (Stage Complete)

**Entry point:** `app/(app)/releases/[id]/page.tsx` — status transitions and stage advance buttons

**Trigger:** User clicks "Complete Stage" or transitions release status.

**Data path:**
```
releases/[id]/page.tsx:42-66  STATUS_TRANSITIONS
   │
   ├── updateReleaseStatus(releaseId, newStatus, userId)   ← lib/release-service.ts:6-26
   │     │
   │     ├── updateDoc(releases/{id}, { status, updatedAt })
   │     └── logActivity({ type: 'release.status.changed',
   │                        releaseId, actorId: userId,
   │                        metadata: { from, to } })
   │
   └── (If stage advanced) stageComplete(workflowId, stageId, userId)  ← lib/workflow-progression.ts:8-125
         │
         ├── transaction:
         │     ├── re-read stage
         │     ├── update stage: status: 'completed', completedAt, daysInStage
         │     ├── find next stage
         │     ├── if next: update next stage: status: 'in_progress', startedAt
         │     ├── if no next: update workflow: status: 'completed',
         │     │                                currentStageId: null,
         │     │                                progress: 100
         │     └── else: update workflow: currentStageId: next.id
         │
         └── logActivity({ type: 'stage.completed', ... })
```

**Loading state:** `submitting` flag on the page; spinner on the action button.

**Error state:** `try/catch` in `stageComplete` but no user-visible surface; on failure, status may be in a partial state.

**Edge cases:**
- **Status machine mismatch**: `releases/new/page.tsx:23-30` exposes 6 statuses (no `on_hold`, no `cancelled`); the edit form (`edit/page.tsx:20-27`) also omits them; but `STATUS_TRANSITIONS` (`releases/[id]/page.tsx:43-66`) permits transitioning to them. The user can transition to `on_hold` but cannot re-select it manually later — dead-end.
- `Stage.dueDate` is always `null` on create (`releases/new/page.tsx:88`); never updated; nothing in the codebase writes it.
- `Stage.assignedRole` strings (e.g. `'producer'`, `'mixing_engineer'`) in `workflow-templates.ts` don't correspond to `Role` or `Artist` types.

**Notes:**
- `WorkflowStatus` enum includes `'not_started'`, `'blocked'`, `'review'`, `'approved'` (`types.ts:35`) but only `'in_progress'` and `'completed'` are ever written.
- `progress` and `health` recomputed on every stage completion.
- `daysInStage` written on completion (`workflow-progression.ts:46`) but **never read** anywhere.

---

## Workflow 8: Distribution

**Entry point:** `app/(app)/releases/[id]/page.tsx:192` — "Generate Package" button

**Trigger:** User clicks the button on the Distribution tab.

**Data path:**
```
releases/[id]/page.tsx:192 → generateDistributionPackage(releaseId, userId)
   │
   ├── lib/distribution-service.ts:14-78  checkDistributionReadiness(releaseId)
   │     ├── checkMetadata: upc, catalogNumber, label, copyright, pLine, cLine, genre, language
   │     ├── checkDeliverables: getDeliverablesByRelease(id)  → all approved
   │     ├── checkRequirements: getRequirementsByRelease(id)  → all approved
   │     └── checkDependencies: getBlockingDependencies(id)  → none blocking
   │
   ├── if !canDistribute: return { ready: false, issues }
   │
   ├── getLatestDistributionPackage(releaseId)
   ├── if exists: updateDoc(distribution_packages/{id}, { completeness, …, updatedAt })
   └── else:     addDoc(distribution_packages, { releaseId, status: 'generated',
                                                completeness, metadataReady,
                                                deliverablesReady, requirementsReady,
                                                generatedAt, createdAt })
```

**Loading state:** Submitting state on the generate button.

**Error state:** `try/catch` in the handler; `console.error` only.

**Edge cases:**
- **New releases can never generate** because upc, catalogNumber, label, copyright, pLine, cLine, genre, language are not set on creation (`releases/new/page.tsx:52-61`). User must edit and fill in 8 fields first.
- `deliverables` are read but never created by the app. `checkDeliverables` always returns "no deliverables". Distribution never reaches `canDistribute: true` for the no-deliverable path.
- `DistributionPackage.submittedAt` is in the PDS but not in the type (`types.ts:243-253`); only `generatedAt` and `createdAt` exist.
- **No DSP submission integration**. This is a "package generation" only; no actual delivery to Spotify/Apple/etc.

**Notes:**
- `DistributionBoard` and `DSPStatus` are exported from `packages/domain-ui` but never rendered.

---

## Workflow 9: Rights

**Entry point:** `app/(app)/rights-holders/new/page.tsx:1-80`

**Trigger:** User creates a new rights holder from `/rights-holders` or fills in a release's rights tab.

**Data path (create):**
```
rights-holders/new/page.tsx
   │
   ├── form state: name, type, territory, contact
   ├── setSubmitting(true)
   ├── createRightsHolder(name, type, contact, territory)   ← lib/rights-service.ts:5-18
   │     │
   │     └── addDoc(rights_holders, { name, type, contact: contact ?? null,
   │                                  territory: territory ?? null,
   │                                  createdAt: now, updatedAt: now })
   │
   ├── setSubmitting(false)
   └── router.push(`/rights-holders/${id}`)
```

**Data path (release ownership validation):**
```
releases/[id]/page.tsx (called in workspace load)
   │
   └── validateReleaseOwnership(releaseId)    ← lib/rights-service.ts:96-124
         │
         ├── getReleaseOwnerships(releaseId)
         ├── for each type (master, publishing, mechanical, neighbouring):
         │     sum percentages
         ├── issues:
         │     - master > 0 && master != 100
         │     - publishing > 0 && publishing != 100
         │     - master == 0 && publishing == 0
         └── return { valid, masterPct, publishingPct, mechanicalPct,
                      neighbouringPct, issues }
```

**Loading state:** `submitting` on create form; otherwise synchronous reads.

**Error state:** `console.error` only.

**Edge cases:**
- **No `organizationId` on rights_holders**: any auth user can read all rights holders (`lib/rights-service.ts:20-25`, `firestore.rules:29`).
- `addReleaseOwnership` is exported but **no UI calls it**. The only ownership data comes from manual Firestore writes (or test fixtures). The validation is run on every release load but always returns "No ownership defined".
- PDS-listed fields `role`, `percentage` (on rights holder), `pro`, `ipi`, `collectionSociety` are **not in the type** (`types.ts:290-298`).
- `validateTrackOwnership` is exported but never called (no `tracks` writes exist).

**Notes:**
- The "Rights" workspace is essentially a CRUD list of rights holders; no connection to actual releases in the UI.

---

## Workflow 10: Assets

**Entry point:** `app/(app)/releases/[id]/page.tsx:788-806` (read-only `AssetsTab`)

**Trigger:** User opens the Assets tab on a release.

**Data path (load):**
```
releases/[id]/page.tsx:103-148 (parent workspace load)
   │
   └── getDeliverablesByRelease(releaseId)   ← lib/deliverable-service.ts
         │
         └── getDocs(deliverables where releaseId)
              ↓
   AssetsTab at line 788-806
      → maps deliverables to UI
      → NO create/upload UI
```

**Loading state:** Inherits from workspace load.

**Error state:** Inherits from workspace load.

**Edge cases:**
- **No create form anywhere.** `createDeliverable`, `updateDeliverable`, `approveDeliverable`, `rejectDeliverable`, `archiveDeliverable` are all exported but never called (`lib/deliverable-service.ts:19-126`).
- **No Cloudinary integration.** `packages/firebase/src/cloudinary` has `uploadFile`, `signUpload`, `transformImage` (5 functions total) but is never imported.
- The interface mentions `cloudinaryPublicId` in the PDS; the actual `Deliverable` has no such field. The design is implemented as a sibling `AssetReference` collection linked by `deliverableId` (also empty — no callers).
- `getDeliverablesByStage` and `getDeliverablesByTask` are exported but no page calls them.

**Notes:**
- The Assets tab is a viewer only. It will always be empty for a release created in this app, because no code creates deliverables.

---

## Cross-Workflow Observations

1. **Activity log corruption** — `contributor/page.tsx:80`, `approvals/page.tsx:45, 50`, and `notification-service.ts:31, 47, 59` all pass `releaseId: ''` (or empty stageId/deliverableId) into the service layer. Resulting `activities` documents violate the type contract (`releaseId: string` non-empty) and never appear in the per-release ActivityTab filter at `releases/[id]/page.tsx:909`. This is a P0 data-integrity bug.
2. **No cross-org server-side enforcement** for any collection except `releases` ownership.
3. **No transactional safety** for org + membership creation (sequential writes).
4. **In-memory `activeOrgId`** — refresh resets to first org alphabetically.
5. **No offline support** anywhere.
6. **No retry / queueing** — a failed `batch.commit()` leaves the user on the form.
