# TASK-UIB-301 — Workflow Board Gap Resolution

## Objective

Resolve all 7 gaps identified in `docs/ui/workflow-board-interaction-audit.md`.
No new documents. No new backend requirements. Implementation-focused addendum
to update existing specs.

---

## Gap 1: Network Failure Recovery

**Severity:** Medium
**Affected Doc:** `docs/ui/screens/workflow-tab-v1.md`, `docs/29-stage-detail-ux.md`

### Resolution: Retry Banner + Optimistic UI Rollback

When a stage transition (Mark Complete / Put on Hold / Skip) fails due to
network error, the UI must not leave the stage in an indeterminate state.

**Add to `docs/ui/screens/workflow-tab-v1.md` — States section:**

```markdown
| Transition failed | Network error during Mark Complete / Put on Hold / Skip | Stage column reverts to previous state. Toast: "Failed to advance stage. Check your connection." Stage header shows retry banner: ┌──────────────────────────────────────────┐ │ ⚠ Stage transition failed · [Retry] [Dismiss] │ └──────────────────────────────────────────┘. Banner persists until retry succeeds or is dismissed. |
```

**Add to `docs/29-stage-detail-ux.md` — Actions section, under Mark Complete:**

> **Network failure:** If the transition fails, the stage reverts to its
> previous state. A retry banner appears at the top of the Stage Detail panel.
> The "Mark Complete" button re-enables for a manual retry. The user does not
> need to re-enter any data — the action is a single-click retry.

**Optimistic UI sequence:**

```
1. PM clicks "Mark Complete"
2. UI immediately shows COMPLETED state (optimistic)
3. Next stage immediately shows ACTIVE (optimistic)
4. Server validates → success → UI confirmed
5. Server validates → failure → UI rolls back:
   a. Stage reverts to previous state
   b. Next stage reverts to PENDING
   c. Retry banner appears
   d. Toast: "Failed to advance stage. [Retry]"
```

**Implementation note:** Optimistic updates are safe here because stage
transitions are idempotent — retrying Mark Complete on an already-complete
stage is a no-op on the server. No data corruption risk.

---

## Gap 2: Manual Dependency Unblock

**Severity:** Medium
**Affected Docs:** `docs/28-workflow-board.md`, `docs/66-dependency-workspace.md`

### Resolution: "Resolve Dependency" on Blocked Stage Detail

When a dependency is resolved off-platform (phone call, email), the PM needs
a one-click path to unblock the stage without navigating to the Dependency
Workspace.

**Add to `docs/28-workflow-board.md` — Blocked column section:**

> ### Resolving Dependencies from the Board
>
> A blocked stage column shows the blocking dependency count and a "Resolve"
> link. Clicking opens a confirmation:
>
> ```
> ┌──────────────────────────────────────────────────┐
> │  Resolve Dependency: Mechanical License            │
> │                                                    │
> │  Melodic Publishing · 12 days blocked              │
> │                                                    │
> │  ○ Mark as resolved (license secured)              │
> │  ○ Unblock without resolving (reason required)    │
> │                                                    │
> │  ┌──────────────────┐ ┌──────────┐                │
> │  │  Confirm         │ │  Cancel  │                │
> │  └──────────────────┘ └──────────┘                │
> └──────────────────────────────────────────────────┘
> ```
>
> Marking as resolved transitions the dependency to `resolved` and
> auto-unblocks the stage. Unblocking without resolving allows the stage
> to proceed but flags the dependency as `bypassed` for audit purposes.

**Add to `docs/66-dependency-workspace.md` — Dependency statuses:**

| Status | Meaning |
|--------|---------|
| Resolved | Dependency was satisfied (auto or manual) |
| Bypassed | Stage unblocked without dependency resolution — audit-flagged |

---

## Gap 3: Multiple Dependency Behavior

**Severity:** Medium
**Affected Docs:** `docs/28-workflow-board.md`, `docs/66-dependency-workspace.md`

### Resolution: Ordered Dependency List with Blocking Priority

When multiple dependencies block the same stage, they are displayed in a
prioritized list. The stage unblocks only when ALL dependencies are resolved
or bypassed.

**Add to `docs/28-workflow-board.md` — Blocked column detail:**

> ### Multiple Dependencies on One Stage
>
> When a stage is blocked by N dependencies, the column shows:
>
> ```
> ┌──────────────────────────────────────────┐
> │ 🔴 BLOCKED · 2 dependencies              │
> │                                          │
> │ 1. Mechanical License (Melodic Pub)      │
> │    14 days · 3 contact attempts          │
> │    ┌──────────┐                           │
> │    │  Resolve │                           │
> │    └──────────┘                           │
> │                                          │
> │ 2. Sam W capacity (5 releases)           │
> │    All tasks blocked by overload          │
> │    ┌──────────┐                           │
> │    │  Resolve │                           │
> │    └──────────┘                           │
> │                                          │
> │ Stage unblocks when all resolved.        │
> └──────────────────────────────────────────┘
> ```
>
> Dependencies are ordered by:
> 1. External dependencies first (outside ReleaseFlow control)
> 2. Longest duration first
> 3. Alphabetical fallback
>
> The stage stays blocked until ALL dependencies are resolved or bypassed.
> Each resolved dependency shows a ✓ checkmark. The stage auto-unblocks
> when the last dependency is resolved.

**Add to `docs/66-dependency-workspace.md` — Dependency list section:**

> **Blocking priority order:** Dependencies are sorted by severity to the
> release timeline. External dependencies always sort first because they
> are outside the org's control.

---

## Gap 4: Mobile Hold Reason — Bottom Sheet

**Severity:** Medium
**Affected Doc:** `docs/ui/screens/workflow-tab-v1.md`

### Resolution: Bottom Sheet on Mobile

**Add to `docs/ui/screens/workflow-tab-v1.md` — Responsive section, <768px:**

> ### Mobile: Put on Hold — Bottom Sheet
>
> On viewports <768px, the hold reason dialog renders as a bottom sheet:
>
> ```
> ┌──────────────────────────────┐
> │                              │
> │  (board dimmed behind)       │
> │                              │
> │ ┌──────────────────────────┐ │
> │ │ Put Mastering on Hold    │ │
> │ │ ──────────────────────── │ │
> │ │                          │ │
> │ │ Reason (min 10 chars)    │ │
> │ │ ┌──────────────────────┐ │ │
> │ │ │ Awaiting stems from  │ │ │
> │ │ │ Producer Z for T5... │ │ │
> │ │ └──────────────────────┘ │ │
> │ │                          │ │
> │ │ ┌──────────┐┌──────────┐ │ │
> │ │ │   Hold   ││  Cancel  │ │ │
> │ │ └──────────┘└──────────┘ │ │
> │ └──────────────────────────┘ │
> └──────────────────────────────┘
> ```
>
> The sheet slides up from the bottom (300ms ease-in-out). The board remains
> visible behind a semi-transparent overlay (rgba(0,0,0,0.3)). Tapping the
> overlay dismisses the sheet. Touch targets: 44px minimum.

---

## Gap 5: Mobile Dependency Details — Expandable Card

**Severity:** Medium
**Affected Doc:** `docs/ui/screens/workflow-tab-v1.md`

### Resolution: Expandable Dependency Card on Mobile

**Add to `docs/ui/screens/workflow-tab-v1.md` — Responsive section, <768px:**

> ### Mobile: Blocked Stage — Dependency Details
>
> On mobile, a blocked stage card shows a collapsed dependency summary.
> Tapping expands the full dependency list inline:
>
> ```
> ┌──────────────────────────────┐
> │ 🔴 BLOCKED · 2 dependencies │
> │ 3 days · Mastering          │
> │                              │
> │ ┌──── Dependency Details ───┐│
> │ │ 1. Mechanical License     ││
> │ │    Melodic Pub · 14 days  ││
> │ │    ┌──────────┐            ││
> │ │    │  Resolve │            ││
> │ │    └──────────┘            ││
> │ │                            ││
> │ │ 2. Sam W capacity         ││
> │ │    5 releases · overload   ││
> │ │    ┌──────────┐            ││
> │ │    │  Resolve │            ││
> │ │    └──────────┘            ││
> │ └────────────────────────────┘│
> │                              │
> │ [View Stage Details]         │
> └──────────────────────────────┘
> ```
>
> The "Dependency Details" section is collapsed by default (chevron ▼
> indicator). Tapping expands inline (300ms ease). The stage dot indicator
> shows a 🔴 dot to indicate a blocked stage.

---

## Gap 6: Mobile Stage Reorder — Unsupported in V1

**Severity:** Low
**Affected Doc:** `docs/ui/screens/workflow-tab-v1.md`

### Resolution: Explicitly Declare as V1 Limitation

**Add to `docs/ui/screens/workflow-tab-v1.md` — Responsive section:**

> ### Mobile: Stage Reorder
>
> Stage reorder is **not supported on mobile in V1.** Desktop supports
> drag-and-drop reordering of stage columns. Mobile has no equivalent
> gesture or UI.
>
> **Rationale:** Stage reorder is an admin-level configuration action,
> performed rarely (once per template customization). It does not justify
> the mobile implementation complexity in V1. Admins are expected to be on
> desktop when configuring workflows.
>
> **V1 behavior:** The "Reorder Stages" option is hidden on <768px. The
> stage order is read-only on mobile.
>
> **V2 consideration:** A list-view reorder modal accessible from a ⋯ menu
> on the Workflow Board header.

---

## Gap 7: Downstream Bulk Unblock — Defer to V2

**Severity:** Low
**Affected Doc:** `docs/28-workflow-board.md`

### Resolution: Document as V2 Feature with Rationale

**Add to `docs/28-workflow-board.md` — Blocked column section:**

> ### Downstream Bulk Unblock (V2)
>
> When a stage is unblocked, downstream stages (Artwork, Distribution,
> Release) that were blocked by the dependency remain blocked until
> individually activated or until the unblock cascade reaches them.
>
> In V1, unblocking a stage activates only the immediate next stage. The
> PM manually advances each subsequent stage. This is intentional:
>
> - **Safety:** Auto-advancing multiple stages risks skipping review gates.
> - **Visibility:** Each stage transition generates a notification and
>   activity event, keeping the team informed.
> - **Simplicity:** The auto-advance logic for cascading unblocks requires
>   dependency graph traversal that adds backend complexity without
>   proportional V1 value.
>
> **V2 consideration:** A "Resume Pipeline" button on the unblocked stage
> that auto-advances all downstream stages that were blocked exclusively
> by the resolved dependency. Requires `stage:advance_all` permission.

---

## Docs to Update

| Doc | Section | Gap Resolved |
|-----|---------|-------------|
| `docs/ui/screens/workflow-tab-v1.md` | States | G1: Network failure recovery |
| `docs/29-stage-detail-ux.md` | Actions > Mark Complete | G1: Network failure recovery |
| `docs/28-workflow-board.md` | Blocked column | G2: Manual dependency unblock |
| `docs/66-dependency-workspace.md` | Dependency statuses | G2: Bypassed status |
| `docs/28-workflow-board.md` | Blocked column detail | G3: Multiple dependency behavior |
| `docs/66-dependency-workspace.md` | Dependency list | G3: Blocking priority order |
| `docs/ui/screens/workflow-tab-v1.md` | Responsive <768px | G4: Bottom sheet |
| `docs/ui/screens/workflow-tab-v1.md` | Responsive <768px | G5: Expandable dep card |
| `docs/ui/screens/workflow-tab-v1.md` | Responsive | G6: Reorder unsupported V1 |
| `docs/28-workflow-board.md` | Blocked column | G7: Bulk unblock deferred V2 |

---

## Updated Audit: 36/36 Pass

| # | Gap | Resolution | Status |
|---|-----|-----------|--------|
| 1 | Network failure recovery | Retry banner + optimistic UI rollback | ✅ Resolved |
| 2 | Manual dependency unblock | "Resolve Dependency" on blocked stage detail + bypassed status | ✅ Resolved |
| 3 | Multiple dependency behavior | Ordered dependency list, all must resolve, priority rules | ✅ Resolved |
| 4 | Mobile hold reason | Bottom sheet with overlay, 44px touch targets | ✅ Resolved |
| 5 | Mobile dependency details | Expandable inline card, 300ms animation | ✅ Resolved |
| 6 | Mobile stage reorder | Declared unsupported in V1 with rationale | ✅ Resolved |
| 7 | Downstream bulk unblock | Deferred to V2 with rationale + "Resume Pipeline" spec | ✅ Resolved |

**36 pass. 0 outstanding gaps.**
