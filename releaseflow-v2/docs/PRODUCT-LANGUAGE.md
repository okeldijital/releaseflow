# Product Language — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## Principle

Every term has exactly one meaning. Every concept has exactly one name. Internal terminology and user-facing wording may differ, but they must be traceable to each other.

---

## Entity Definitions

### Organization

| Aspect | Value |
|--------|-------|
| **Definition** | A label, publisher, or group that owns releases, artists, and team members |
| **Owner** | Organization domain (`organization-repository.ts`) |
| **Internal name** | `Organization`, `organizationId` |
| **User-facing** | "Organisation" |
| **Lifecycle** | Created → Active → (no deletion unless empty) |
| **Source** | `types.ts`, Firestore `organizations` collection |

---

### Artist

| Aspect | Value |
|--------|-------|
| **Definition** | A person or group who creates, performs on, or contributes to releases |
| **Owner** | Artist domain (`artist-repository.ts`) |
| **Internal name** | `Artist`, `artistId` |
| **User-facing** | "Artist" |
| **Lifecycle** | Create → Edit Profile → Link to Releases → Active/Inactive |
| **Source** | `types.ts`, Firestore `artists` collection |
| **Related** | Rights Holder (distinct concept — owns publishing/master) |

---

### Release

| Aspect | Value |
|--------|-------|
| **Definition** | A music release: single, EP, album, remix, or compilation. The central entity around which all operations orbit |
| **Owner** | Release domain (`release-repository.ts`) |
| **Internal name** | `Release`, `releaseId` |
| **User-facing** | "Release" |
| **Lifecycle** | Draft → Planning → In Production → Ready → Released → Archived |
| **Source** | `types.ts`, Firestore `releases` collection |

---

### Workflow

| Aspect | Value |
|--------|-------|
| **Definition** | A sequence of operational stages that a release progresses through from planning to release |
| **Owner** | Workflow domain (`workflow-repository.ts`) |
| **Internal name** | `Workflow`, `workflowId` |
| **User-facing** | "Workflow" |
| **Lifecycle** | Generated per release type → Stages advance sequentially → Completed when all stages done |
| **Source** | `types.ts`, Firestore `workflows` collection |

---

### Stage

| Aspect | Value |
|--------|-------|
| **Definition** | A single operational phase within a workflow (e.g., Mastering, Artwork, Distribution) |
| **Owner** | Workflow domain |
| **Internal name** | `Stage`, `stageId` |
| **User-facing** | "Stage" |
| **Lifecycle** | Not Started → In Progress → (Blocked) → Completed |
| **Source** | `types.ts`, Firestore `stages` collection |

---

### Task

| Aspect | Value |
|--------|-------|
| **Definition** | A unit of work within a stage, assigned to a person |
| **Owner** | Task service (`task-service.ts`) |
| **Internal name** | `Task` |
| **User-facing** | "Task" |
| **Lifecycle** | To Do → In Progress → Review → Done |
| **Source** | `types.ts`, Firestore `tasks` collection |

---

### Deliverable

| Aspect | Value |
|--------|-------|
| **Definition** | A concrete output from a task or stage: an audio file, artwork image, metadata document |
| **Owner** | Deliverable service (`deliverable-service.ts`) |
| **Internal name** | `Deliverable` |
| **User-facing** | "Deliverable" or specific type: "Audio master", "Artwork file" |
| **Lifecycle** | Draft → Submitted → Approved / Rejected → Archived |
| **Source** | `types.ts`, Firestore `deliverables` collection |

---

### Requirement

| Aspect | Value |
|--------|-------|
| **Definition** | A mandatory operational condition that must be satisfied for a release to be ready |
| **Owner** | Requirement service (`requirement-service.ts`) |
| **Internal name** | `Requirement`, `ReleaseRequirement` |
| **User-facing** | "Requirement" |
| **Lifecycle** | Required → Submitted → Approved |
| **Source** | `types.ts`, Firestore `release_requirements` collection |

---

### Dependency

| Aspect | Value |
|--------|-------|
| **Definition** | An external condition that blocks workflow progression until resolved (e.g., a mechanical license from a publisher) |
| **Owner** | Dependency service (`dependency-service.ts`) |
| **Internal name** | `Dependency` |
| **User-facing** | "Dependency" or "Blocker" (when blocking) |
| **Lifecycle** | Created → Pending → Completed / Blocked |
| **Source** | `types.ts`, Firestore `dependencies` collection |

---

### Asset

| Aspect | Value |
|--------|-------|
| **Definition** | A file stored and referenced by the system: audio, artwork, video, document |
| **Owner** | Asset domain (`asset-repository.ts`) |
| **Internal name** | `Asset`, `AssetReference` |
| **User-facing** | "Asset" or specific type: "Audio file", "Artwork" |
| **Lifecycle** | Uploaded → Validated → Attached to release/deliverable → Deleted |
| **Source** | `types.ts`, Firestore `asset_references` collection |

---

### Rights Holder

| Aspect | Value |
|--------|-------|
| **Definition** | A person or entity that owns publishing, master, or mechanical rights on a release or track |
| **Owner** | Rights domain (`rights-repository.ts`) |
| **Internal name** | `RightsHolder` |
| **User-facing** | "Rights Holder" |
| **Related** | Artist (may also be a rights holder, but is a distinct concept) |

---

### Distribution Package

| Aspect | Value |
|--------|-------|
| **Definition** | A generated descriptor containing release metadata, asset references, and rights summaries, indicating readiness for DSP delivery |
| **Owner** | Distribution domain (`distribution-repository.ts`) |
| **Internal name** | `DistributionPackage` |
| **User-facing** | "Distribution Package" |
| **Lifecycle** | Generated → Scheduled → Published |

---

## Operational State Terms

### Health

| Aspect | Value |
|--------|-------|
| **Definition** | A 5-level assessment of a release's overall operational condition |
| **States** | Excellent → Healthy → Attention → Blocked → Critical |
| **Computed by** | `computeHealth(readinessPercentage)` in `operational-intelligence-service.ts` |
| **User-facing** | "Health" |

---

### Readiness

| Aspect | Value |
|--------|-------|
| **Definition** | A percentage (0-100%) representing how much of the operational work for a release is complete |
| **Computed by** | `computeReadiness()` — weighted average of requirements, workflow, deliverables, and dependencies |
| **User-facing** | "Readiness" |

---

### Attention

| Aspect | Value |
|--------|-------|
| **Definition** | Items requiring immediate human action: alerts, blocked work, upcoming deadlines |
| **User-facing** | "Attention" |
| **Related** | Alert, Blocker, Deadline |

---

### Alert

| Aspect | Value |
|--------|-------|
| **Definition** | A system-generated notification of a condition requiring attention (e.g., budget exceeded, overdue stage) |
| **User-facing** | "Alert" |

---

### Blocker

| Aspect | Value |
|--------|-------|
| **Definition** | A condition that prevents workflow progression: a blocked stage, an unresolved dependency, a missing approval |
| **User-facing** | "Blocker" |

---

### Risk

| Aspect | Value |
|--------|-------|
| **Definition** | A potential future problem — not yet a blocker but could become one (e.g., approaching deadline, unassigned resource) |
| **User-facing** | "Risk" or "At Risk" |

---

## Forbidden Terminology

| Do not use | Use instead |
|-----------|-------------|
| Ticket | Task |
| Board | Workflow Board or Workflow |
| Kanban | Workflow Board |
| Dashboard | Operations Center |
| Project | Release |
| Resource | Contributor or Team Member |
| OKR / KPI | (not applicable — use Health, Readiness, Pulse) |
| "No data" | "No releases yet", "No activity", etc. |
| "Nothing here" | Provide context and guidance |
