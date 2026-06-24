# Aggregate Root Analysis

## Principles

1. **Transactional boundary** — each aggregate is modified and persisted as
   a single unit. No two aggregates are modified in the same transaction.
2. **Identity-based reference** — aggregates refer to each other by ID, not
   by object reference.
3. **Eventual consistency** — cross-aggregate side effects are propagated
   via domain events.
4. **Size discipline** — aggregates should be small enough to be practical
   but large enough to enforce invariants.

---

## Aggregate Root 1: Tenant (IAC Context)

**Root entity:** `Tenant`
**Boundary:** `Tenant` + `Organization` + `Role` + `Permission`

**Invariants:**
- A tenant must have at least one `Organization` on creation.
- Default `Roles` (Owner, Admin, Viewer) are seeded per tenant.
- `Permissions` are globally defined; `Roles` within a tenant select from
  them.

**Why this is an aggregate:**
- Tenant setup (org + default roles) must be atomic.
- Billing plan changes should not interleave with role modifications.

**Referenced by ID from:** User, Release (via organizationId)

**Domain events:** `TenantProvisioned`, `BillingPlanChanged`

---

## Aggregate Root 2: Organization + User + Team (IAC Context)

**Root entity:** `Organization`
**Boundary:** `Organization` + `Team` + `TeamMembership`

**Invariants:**
- An organization must have at least one `Owner`-role user.
- `Team` names must be unique within an organization.
- A `User` can belong to multiple teams.

**Why this is an aggregate:**
- Membership changes (join/leave team) must be consistent.
- Organization-scoped settings and user invitations are atomic.

**Referenced by ID from:** Release, Campaign, Asset

**Domain events:** `UserInvited`, `UserRemoved`, `TeamCreated`

---

## Aggregate Root 3: User + Roles (IAC Context)

**Root entity:** `User`
**Boundary:** `User` + `UserRoleAssignment`

**Invariants:**
- A user must have at least one role within an organization.
- Role changes must be audited.

**Why this is an aggregate:**
- Authentication and authorization depend on a consistent view of a
  user's roles. Role assignment changes are infrequent but must be
  immediately visible.

**Referenced by ID from:** Task (assignee), Approval (approver), Comment
(author), Contributor (userId)

**Domain events:** `RoleAssigned`, `RoleRevoked`

---

## Aggregate Root 4: Release (RLM Context)

**Root entity:** `Release`
**Boundary:** `Release` + `Track` + `Specification`

**Invariants:**
- A release must have at least one `Track`.
- A release must have a valid `ReleaseTemplate`.
- Track numbers within a release must be unique.
- `Specification` content must validate against the template schema.
- `state` transitions follow the lifecycle state machine (see
  `05-release-lifecycle-state-machine.md`).

**Why this is an aggregate:**
- The release is the central transactional unit. Adding a track or
  updating metadata should be atomic.
- Lifecycle state transitions must be validated against the current
  aggregate state.

**Referenced by ID from:** Campaign, Distribution, Contributor, Asset

**Domain events:**
- `ReleaseCreated`
- `ReleaseStateChanged` (oldState, newState, triggeredBy)
- `TrackAdded` (trackId, title)
- `TrackRemoved` (trackId)
- `SpecificationUpdated`

---

## Aggregate Root 5: Workflow + Stage + Task + Approval (PRP Context)

**Root entity:** `Workflow`
**Boundary:** `Workflow` + `Stage` + `Task` + `Approval`

**Invariants:**
- Stages within a workflow must form a directed acyclic sequence.
- A stage cannot transition to `COMPLETED` until all its `Task`s are
  `DONE` and required `Approval`s are collected.
- Approval count must meet `requiredApprovalCount` before stage advances.

**Why this is an aggregate:**
- Pipeline progression is the most consistency-sensitive operation in the
  system. Task completion, approval recording, and stage advancement must
  be atomic to prevent double-advance or skipped steps.

**Referenced by ID from:** Release (workflowId), ReleaseTemplate
(defaultWorkflowId)

**Domain events:**
- `StageStarted` (stageId)
- `StageCompleted` (stageId, nextStageId)
- `StageApproved` (stageId, approverId)
- `StageRejected` (stageId, approverId, reason)
- `TaskAssigned` (taskId, assigneeId)
- `TaskCompleted` (taskId)

---

## Aggregate Root 6: Asset (ASC Context)

**Root entity:** `Asset`
**Boundary:** `Asset` + `AssetVersion`

**Invariants:**
- `AssetVersion` numbers must be sequential (1, 2, 3…).
- Only the latest version is the "current" version.
- File hash must be unique per asset to prevent duplicate uploads.

**Why this is an aggregate:**
- Versioning is append-only. New versions should not interfere with
  in-progress reads of the current version.

**Referenced by ID from:** Release (coverArtAssetId), Task
(requiredAssets), CampaignAsset

**Domain events:**
- `AssetUploaded` (assetId, versionNumber)
- `AssetVersioned` (assetId, oldVersion, newVersion)

---

## Aggregate Root 7: Campaign (MKC Context)

**Root entity:** `Campaign`
**Boundary:** `Campaign` + `CampaignAsset`

**Invariants:**
- Campaign `startDate` must precede `endDate`.
- A campaign cannot be activated without at least one `CampaignAsset`.
- A release can have multiple campaigns but only one active at a time.

**Referenced by ID from:** Release

**Domain events:**
- `CampaignLaunched` (campaignId, releaseId, launchDate)
- `CampaignEnded` (campaignId)

---

## Aggregate Root 8: Distribution (DST Context)

**Root entity:** `Distribution`
**Boundary:** `Distribution` + `Territory` + `Store` mapping

**Invariants:**
- A distribution must specify at least one `Store` and `Territory`.
- Release date per territory must not be in the past (for new
  submissions).
- State transitions: DRAFT → SUBMITTED → APPROVED → LIVE → TAKEDOWN.

**Referenced by ID from:** Release

**Domain events:**
- `DistributionSubmitted` (distributionId, storeId)
- `DistributionApproved` (distributionId, storeId)
- `StoreLive` (distributionId, storeId, goLiveDate)

---

## Aggregate Root 9: Comment / Notification / Activity (COL Context)

**Root entity:** `Comment`, `Notification`, `Activity`
**Boundary:** Each is an independent aggregate (no shared root).

**Rationale:**
- Comments, notifications, and activities are high-volume, append-only
  streams. Aggregating them would create unnecessary contention.
- Each references other entities by polymorphic `(entityType, entityId)`.
  No cross-entity invariants to enforce.

**Domain events:**
- `CommentPosted`
- `MentionTriggered`
- `ActivityRecorded`

---

## Aggregate Root Map (Summary)

| # | Aggregate Root   | Context | Entities Within        | Key Invariant                              |
|---|------------------|---------|------------------------|--------------------------------------------|
| 1 | Tenant           | IAC     | Tenant, Org, Role, Perm | Tenant setup atomic; default roles seeded  |
| 2 | Organization     | IAC     | Org, Team, Membership  | Team name uniqueness; owner always present |
| 3 | User             | IAC     | User, RoleAssignment   | Immediate role visibility                  |
| 4 | Release          | RLM     | Release, Track, Spec   | State machine valid; ≥1 track              |
| 5 | Workflow         | PRP     | Workflow, Stage, Task, Approval | Stage advancement atomic         |
| 6 | Asset            | ASC     | Asset, AssetVersion    | Sequential versioning; hash uniqueness     |
| 7 | Campaign         | MKC     | Campaign, CampaignAsset | Date ordering; one active per release     |
| 8 | Distribution     | DST     | Distribution, Territory, Store | State machine valid; date constraints |
| 9 | Comment          | COL     | Comment                | — (append-only log)                       |
| 10 | Notification    | COL     | Notification           | — (append-only log)                       |
| 11 | Activity        | COL     | Activity               | — (append-only log)                       |

---

## Cross-Aggregate Consistency

| Event                          | Producer     | Consumer(s)       | Handling                      |
|--------------------------------|--------------|-------------------|-------------------------------|
| ReleaseStateChanged            | Release      | Workflow          | Start/advance stages          |
| StageCompleted                 | Workflow     | Release           | Evaluate release-level state  |
| TaskAssigned                   | Workflow     | Notification      | Notify assignee               |
| CommentPosted                  | Comment      | Notification      | Notify mentioned users        |
| AssetUploaded                  | Asset        | Task              | Mark task asset requirement   |
| CampaignLaunched               | Campaign     | Distribution      | Coordinate release date       |
| DistributionSubmitted          | Distribution | Notification      | Notify label team             |

All cross-aggregate consistency is **eventually consistent**. No two
aggregate roots are modified in the same database transaction.
