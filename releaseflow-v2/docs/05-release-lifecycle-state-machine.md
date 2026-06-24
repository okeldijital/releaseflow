# Release Lifecycle State Machine

## V1 Simplified Model (Sprint 003)

The V1 release lifecycle is a linear 6-state progression. States are
mutually exclusive — a release is in exactly one state at any time.

```
  ┌──────────┐
  │  DRAFT    │
  └────┬─────┘
       │ begin planning
       ▼
  ┌────────────┐
  │  PLANNING   │
  └────┬───────┘
       │ start production
       ▼
  ┌────────────┐
  │ PRODUCTION  │
  └────┬───────┘
       │ mark ready
       ▼
  ┌─────────┐
  │  READY   │
  └────┬────┘
       │ release
       ▼
  ┌───────────┐
  │  RELEASED  │
  └────┬──────┘
       │ archive
       ▼
  ┌───────────┐
  │  ARCHIVED  │
  └───────────┘
```

### State Definitions

| State      | Description                                          |
|------------|------------------------------------------------------|
| DRAFT      | Release created. No work started. Metadata editable. |
| PLANNING   | Scope defined. Contributors being assigned.          |
| PRODUCTION | Active work: recording, mixing, mastering, artwork.  |
| READY      | All deliverables complete. Awaiting release date.    |
| RELEASED   | Publicly available. Monitoring phase.                |
| ARCHIVED   | Terminal state. No further modifications.            |

### Transition Rules

| From        | To          | Trigger              | Guard                            |
|-------------|-------------|----------------------|----------------------------------|
| DRAFT       | PLANNING    | `beginPlanning()`    | Release has a title and type     |
| PLANNING    | PRODUCTION  | `startProduction()`  | Minimum 1 track and 1 contributor|
| PRODUCTION  | READY       | `markReady()`        | All stage tasks complete         |
| READY       | RELEASED    | `publish()`          | Release date is today or past    |
| RELEASED    | ARCHIVED    | `archive()`          | 30+ days since release           |
| RELEASED    | READY       | `unpublish()`        | Rollback (rare, audit-logged)    |
| PRODUCTION  | PLANNING    | `revertToPlanning()` | Scope change needed              |
| DRAFT       | ARCHIVED    | `discard()`          | Abandoned release                |

### Transition Diagram (Valid Paths)

```
DRAFT ──► PLANNING ──► PRODUCTION ──► READY ──► RELEASED ──► ARCHIVED
  │          ▲              │                                    ▲
  │          │              │                                    │
  └──► ARCHIVED    ◄───────┘                                    │
       (discard)    revertToPlanning()                          │
                                                               │
                        RELEASED ────► READY                    │
                         (unpublish)                            │
                                                                │
                        DRAFT ──────────────────────────────────┘
                         (never started, discard)
```

### States Not in V1

The following stages from the detailed model are **not part of the V1
release status** — they are handled as workflow stages within the
Production workflow instead:

```
  A&R Approval      → handled as a workflow task/approval
  Recording         → Production stage
  Mixing            → Production stage
  Mastering         → Production stage
  Artwork           → Production stage
  Metadata          → handled within release settings
  Publishing        → handled within distribution
  Distribution      → handled as a separate workflow
  Marketing         → handled as a separate campaign
  Post Release      → captured in RELEASED state
```

---

## Level 2: Detailed Model (Full Vision)

The full state machine will be introduced in a future sprint. It is
documented here for reference and long-term architecture planning.

The detailed release-level state machine governs the `Release.state`
field with fine-grained creative and business phases.

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
             ┌──────────┐                                  │
             │   IDEA    │                                  │
             └────┬─────┘                                  │
                  │ submit                                  │
                  ▼                                         │
          ┌──────────────┐                                  │
          │ A&R_APPROVAL  │◄──── reject ────────────────────┤
          └──────┬───────┘                                  │
                 │ approve                                  │
                 ▼                                          │
           ┌──────────┐                                     │
           │PRODUCTION │                                     │
           └─────┬────┘                                     │
                 │ all stages complete                       │
                 ▼                                          │
           ┌──────────┐                                     │
           │ RECORDING │                                     │
           └─────┬────┘                                     │
                 │ all stages complete                       │
                 ▼                                          │
           ┌──────────┐                                     │
           │  MIXING   │                                     │
           └─────┬────┘                                     │
                 │ all stages complete                       │
                 ▼                                          │
          ┌───────────┐                                     │
          │ MASTERING  │                                     │
          └─────┬─────┘                                     │
                │ all stages complete                        │
                ▼                                           │
          ┌──────────┐                                      │
          │ ARTWORK   │                                      │
          └─────┬────┘                                      │
                │ all stages complete                        │
                ▼                                           │
          ┌──────────┐                                      │
          │ METADATA  │                                      │
          └─────┬────┘                                      │
                │ all stages complete                        │
                ▼                                           │
          ┌───────────┐                                     │
          │ PUBLISHING │                                     │
          └─────┬─────┘                                     │
                │ all stages complete                        │
                ▼                                           │
         ┌──────────────┐                                   │
         │ DISTRIBUTION  │                                   │
         └──────┬───────┘                                   │
                │ all stores live                            │
                ▼                                           │
          ┌──────────┐                                      │
          │ MARKETING │                                      │
          └─────┬────┘                                      │
                │ campaign ends                             │
                ▼                                           │
           ┌─────────┐                                      │
           │  RELEASE │◄──── re-release ────────────────────┘
           └────┬────┘
                │ release lifecycle ends
                ▼
          ┌───────────┐
          │ POST_REL  │
          └─────┬─────┘
                │ archive
                ▼
          ┌──────────┐
          │ ARCHIVED  │
          └──────────┘
```

### State Definitions

| State           | Description                                                  |
|-----------------|--------------------------------------------------------------|
| IDEA            | Concept phase. No production work started.                   |
| A&R_APPROVAL    | Awaiting A&R sign-off to proceed.                            |
| PRODUCTION      | Pre-production planning, session booking, budgeting.         |
| RECORDING       | Active audio recording sessions.                             |
| MIXING          | Post-recording audio mixing.                                 |
| MASTERING       | Final audio mastering.                                       |
| ARTWORK         | Cover art and visual asset creation.                         |
| METADATA        | Track metadata, credits, ISRC/UPC assignment.                |
| PUBLISHING      | Rights registration, publishing metadata, licensing prep.    |
| DISTRIBUTION    | Store submission, territory targeting.                       |
| MARKETING       | Active marketing campaign.                                   |
| RELEASE         | Public release (street date).                                |
| POST_REL        | Post-release monitoring, royalty tracking.                   |
| ARCHIVED        | Terminal state. No further modifications.                    |

### Transitions

| From           | To             | Trigger                                    | Guard                                       |
|----------------|----------------|--------------------------------------------|---------------------------------------------|
| IDEA           | A&R_APPROVAL   | `submitForApproval()`                      | Release has ≥1 track                        |
| A&R_APPROVAL   | PRODUCTION     | `approve()`                                | Current user has A&R role                   |
| A&R_APPROVAL   | IDEA           | `reject(reason)`                           | Current user has A&R role                   |
| PRODUCTION     | RECORDING      | `advanceStage()`                           | All PRODUCTION tasks complete               |
| RECORDING      | MIXING         | `advanceStage()`                           | All RECORDING tasks complete                |
| MIXING         | MASTERING      | `advanceStage()`                           | All MIXING tasks complete + approved        |
| MASTERING      | ARTWORK        | `advanceStage()`                           | All MASTERING tasks complete + approved     |
| ARTWORK        | METADATA       | `advanceStage()`                           | All ARTWORK tasks complete + approved       |
| METADATA       | PUBLISHING     | `advanceStage()`                           | All METADATA tasks complete                 |
| PUBLISHING     | DISTRIBUTION   | `advanceStage()`                           | All PUBLISHING tasks complete               |
| DISTRIBUTION   | MARKETING      | `advanceStage()`                           | ≥1 store live                               |
| MARKETING      | RELEASE        | `advanceStage()`                           | Campaign ended; street date reached         |
| RELEASE        | POST_REL       | `closeRelease()`                           | ≥30 days post-release                       |
| POST_REL       | ARCHIVED       | `archive()`                                | 0 pending tasks                             |
| ARCHIVED       | (none)         | —                                          | Terminal                                    |
| RELEASE        | MARKETING      | `reRelease(reason)`                        | Campaign exists                             |

**Rejection transitions:** Any state from PRODUCTION through PUBLISHING
may reject back to A&R_APPROVAL via `escalate()`. This models creative
reshuffling when a release fails quality gates.

---

## Level 2: Stage State Machine (within a Workflow)

Each `Stage` within the production pipeline has its own finer-grained
state machine.

```
          ┌─────────┐
          │ PENDING  │
          └────┬─────┘
               │ start
               ▼
        ┌────────────┐
        │ IN_PROGRESS │◄──── resume
        └──────┬─────┘
           ┌───┴───┐
           │       │
           ▼       ▼
      ┌────────┐ ┌────────┐
      │ ON_HOLD│ │REVIEW  │
      └────────┘ └────┬───┘
                       │ approve all
                       ▼
                 ┌───────────┐
                 │ COMPLETED │
                 └───────────┘
```

### Stage States

| State       | Description                                               |
|-------------|-----------------------------------------------------------|
| PENDING     | Not yet started. Previous stage not complete.             |
| IN_PROGRESS | Active. Tasks being worked.                               |
| ON_HOLD     | Blocked. Awaiting external input or decision.             |
| REVIEW      | Work submitted for approval.                              |
| COMPLETED   | All tasks done and required approvals collected.          |
| SKIPPED     | Stage not applicable (configurable per release template). |

---

## Level 3: Task State Machine

```
         ┌────────┐
         │  TODO   │
         └────┬───┘
              │ assign / start
              ▼
        ┌────────────┐
        │ IN_PROGRESS │◄──── resume
        └──────┬─────┘
           ┌───┴───┐
           │       │
           ▼       ▼
      ┌────────┐ ┌──────┐
      │ BLOCKED│ │REVIEW│
      └────────┘ └──┬───┘
                     │ approve
                     ▼
                ┌────────┐
                │  DONE  │
                └────────┘
```

### Task States

| State       | Description                                              |
|-------------|----------------------------------------------------------|
| TODO        | Created but not started.                                 |
| IN_PROGRESS | Assignee actively working.                               |
| BLOCKED     | Blocked by dependency (asset, another task, external).   |
| REVIEW      | Submitted for review/approval.                           |
| DONE        | Completed. Triggers stage progress check.                |

---

## State Machine Constraints Summary

| Scope             | Machine Type  | Max States | Guard Conditions                  |
|-------------------|---------------|------------|-----------------------------------|
| Release (global)  | Hierarchical  | 14         | Role-based; task completion check |
| Stage             | Sequential    | 6          | Task completion; approval count   |
| Task              | Sequential    | 5          | Assignment; dependency resolution |

---

## Template-Specific State Mapping

| Template    | Active States                                        | Skipped / Optional                 |
|-------------|------------------------------------------------------|------------------------------------|
| Single      | IDEA → A&R → PROD → REC → MIX → MASTER → ART → META → PUB → DIST → MKT → REL → POST → ARCH | (none)               |
| EP          | Same as Single                                       | (none)                             |
| Album       | Same as Single                                       | (none)                             |
| Remix       | IDEA → A&R → PROD → MIX → MASTER → ART → META → PUB → DIST → MKT → REL → POST → ARCH | RECORDING (skipped)    |
| Compilation | IDEA → A&R → PROD → REC → MIX → MASTER → ART → META → PUB → DIST → MKT → REL → POST → ARCH | (none)               |
| Deluxe      | Same as Album (derives from existing release)         | PROD, REC (skipped if reusing)     |
| Reissue     | PUB → DIST → MKT → REL → POST → ARCH                  | PROD, REC, MIX, MASTER, ART (skipped) |

---

## Error States (Edge Cases)

| Situation                                    | Handling                                              |
|----------------------------------------------|-------------------------------------------------------|
| Stage task incomplete after deadline         | Stage → ON_HOLD; notification to PM                   |
| Approval rejected                            | Stage → IN_PROGRESS; task reassigned or reworked      |
| Critical asset missing at distribution       | Distribution → DRAFT; Release stays in DISTRIBUTION   |
| Store rejects metadata                       | Distribution → DRAFT; Release stays at DISTRIBUTION   |
| Campaign launch fails                        | Campaign → DRAFT; Release stays at MARKETING          |
| Archival attempted with pending royalty data | Reject archive; require POST_REL tasks complete       |
