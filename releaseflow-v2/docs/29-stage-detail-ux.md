# TASK-802 — Stage Detail UX

## Concept

A detail panel that opens when a user clicks a stage column on the Workflow
Board (TASK-801). Shows the stage's identity, assignment, and timeline, plus
an activity feed of comments. Task cards are not shown here — tasks will be
added in a future sprint.

---

## Layout

The Stage Detail renders as a right slide-out panel (overlay, 480px wide) on
top of the Workflow Board. The board remains visible behind the panel
(dimmed).

```
┌──────────────────────────────────────────────────────────────────┐
│  Workflow Board (dimmed behind panel)                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  ──────── Panel: Stage Detail ────────────────────── [×] │     │
│  │                                                          │     │
│  │  ┌────────────────────────────────────────────────────┐ │     │
│  │  │  PLANNING                                          │ │     │
│  │  │  Stage 1 of 7                                      │ │     │
│  │  │  Status: ● Active                                  │ │     │
│  │  └────────────────────────────────────────────────────┘ │     │
│  │                                                          │     │
│  │  ─── Description ──────────────────────────────────────  │     │
│  │                                                          │     │
│  │  Scope, budget, and schedule definition for the          │     │
│  │  release. Includes track listing, session booking,       │     │
│  │  and resource planning.                                  │     │
│  │                                                          │     │
│  │  ┌────────────────────────────────────────────────────┐  │     │
│  │  │  Required deliverables:                            │  │     │
│  │  │  • Release plan                                    │  │     │
│  │  │  • Track list                                      │  │     │
│  │  │  • Session booked                                  │  │     │
│  │  └────────────────────────────────────────────────────┘  │     │
│  │                                                          │     │
│  │  ─── Assignment ───────────────────────────────────────  │     │
│  │                                                          │     │
│  │  Owner           │  👤 Sam Wilson · Project Manager     │     │
│  │  Due date        │  Jun 28, 2026                        │     │
│  │  Estimated days  │  14                                   │     │
│  │                                                          │     │
│  │  ─── Timeline ─────────────────────────────────────────  │     │
│  │                                                          │     │
│  │  Created:  Jun 14, 2026                                 │     │
│  │  Started:  Jun 15, 2026                                 │     │
│  │  Due:      Jun 28, 2026                                 │     │
│  │  ────────────────────────────────────────►              │     │
│  │  ████████░░░░░░░░░░░░░░  40%                            │     │
│  │                                                          │     │
│  │  ─── Activity & Comments ─────────────────────────────  │     │
│  │                                                          │     │
│  │  🟢 Alex Taylor completed task "Draft release plan"     │     │
│  │     · 2 hours ago                                       │     │
│  │                                                          │     │
│  │  💬 Sam Wilson: "Track list needs final review          │     │
│  │     before we move to Production."                      │     │
│  │     · 1 hour ago                                        │     │
│  │                                                          │     │
│  │  🟡 Alex Taylor uploaded "Track-List-v3.pdf"            │     │
│  │     · 30 minutes ago                                    │     │
│  │                                                          │     │
│  │  ┌────────────────────────────────────────────────────┐  │     │
│  │  │  Write a comment...                        [Send] │  │     │
│  │  └────────────────────────────────────────────────────┘  │     │
│  │                                                          │     │
│  │  ─── Actions ──────────────────────────────────────────  │     │
│  │                                                          │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │     │
│  │  │  Mark Complete│  │  Put on Hold │  │  Skip Stage    │ │     │
│  │  └──────────────┘  └──────────────┘  └────────────────┘ │     │
│  │                                                          │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Sections

### Header

| Element | Content |
|---------|---------|
| Stage name | Uppercase, bold, 20px |
| Step indicator | "Stage X of Y" (e.g., "Stage 1 of 7") |
| Status pill | Same status indicator as board column |

### Description

| Field | Content |
|-------|---------|
| Description text | Static text from template definition |
| Required deliverables | Bullet list from template |
| Notes (optional) | Editable text area — free-form notes about this stage |

Description is read-only by default (pulled from template). The Notes field
is editable by users with `workflow:configure` permission.

### Assignment

| Field | Type | Editable By |
|-------|------|-------------|
| Owner | User selector (typeahead from org) | PM, Admin, Owner |
| Due date | Date picker | PM, Admin, Owner |
| Estimated days | Number input (auto-calculates due date when start date + days entered) | PM, Admin, Owner |

Setting an owner creates an implicit assignment visible on the Workflow
Board column. The owner receives a notification when assigned.

### Timeline

| Element | Source |
|---------|--------|
| Created date | Stage creation timestamp |
| Started date | When stage first transitioned to ACTIVE |
| Due date | From assignment section |
| Progress bar | `completedTaskCount ÷ taskCount` |
| Days remaining | Computed: `dueDate - now` |

### Activity & Comments

A chronological feed of events related to this stage:

| Event Type | Icon | Example |
|------------|------|---------|
| Task completed | 🟢 | "Alex Taylor completed task 'Draft release plan'" |
| Stage action | 🔵 | "Sam Wilson started stage 'Planning'" |
| Comment | 💬 | "Sam Wilson: Track list needs final review" |
| Asset uploaded | 🟡 | "Alex Taylor uploaded 'Track-List-v3.pdf'" |
| Status change | 🔵 | "Stage moved to ACTIVE" |
| Owner change | 👤 | "Owner changed from — to Sam Wilson" |

### Comment Input

| Element | Behavior |
|---------|----------|
| Text area | Multi-line, auto-expanding, placeholder "Write a comment..." |
| @ mentions | Typeahead for org members |
| Send button | Enabled when text is non-empty; posts comment and clears input |
| Enter | Shift+Enter = newline; Enter = send |

### Actions

| Action | Permission Required | Behavior |
|--------|---------------------|----------|
| Mark Complete | `stage:advance` | Stage status → COMPLETE. Triggers next stage activation. |
| Put on Hold | `stage:advance` | Opens reason dialog (min 10 chars). Stage → BLOCKED. |
| Skip Stage | `stage:skip` | Confirmation dialog. Stage → SKIPPED. Next stage activates. |

Actions are conditionally shown based on current stage status:
- ACTIVE: Show all three
- PENDING: Show "Skip Stage" only
- COMPLETE/BLOCKED/SKIPPED: No actions (terminal or already in progress)

---

## States

| State | Trigger | Visual |
|-------|---------|--------|
| Open | Click stage column | Panel slides in from right, 300ms ease-in-out |
| Loading | Data fetch for stage detail | Skeleton sections: header pulse, description lines, timeline bar shimmer |
| Loaded | Data received | Full content rendered |
| Error | Fetch failure | "Failed to load stage details. [Retry]" |
| Saving | Owner/due date update | Save indicator on changed field (autosave on blur) |
| Comment posting | Send clicked | Spinner on Send button; comment appears optimistically |
| Hold dialog open | "Put on Hold" clicked | Modal: "Reason for hold (min 10 chars)" + Cancel/Hold buttons |
| Skip dialog open | "Skip Stage" clicked | Modal: "Skip [Stage Name]? This cannot be undone." + Cancel/Skip buttons |
| Complete confirmation | "Mark Complete" clicked | Toast: "[Stage Name] marked complete. Next stage activated." |

---

## Permissions

| Section | View | Edit |
|---------|------|------|
| Description & deliverables | All roles with Workflow tab access | Owner, Admin, PM (self-scoped) |
| Owner | All | Owner, Admin, PM (self-scoped) |
| Due date | All | Owner, Admin, PM (self-scoped) |
| Timeline | All | — |
| Activity feed | All | — |
| Comments | All | All roles with `task:view` (create comment) |
| Mark Complete | — | Owner, Admin, PM, A&R |
| Put on Hold | — | Owner, Admin, PM |
| Skip Stage | — | Owner, Admin, PM |

---

## Mobile View

```
┌──────────────────────────────┐
│  ← Back to Workflow     [×]  │
│                              │
│  PLANNING     ● Active       │
│  Stage 1 of 7                │
│                              │
│  ── Description ──           │
│  Scope, budget, and schedule │
│  definition...               │
│                              │
│  ── Assignment ──            │
│  Owner    👤 Sam Wilson      │
│  Due      Jun 28, 2026       │
│                              │
│  ── Timeline ──              │
│  ████████░░░░░░  40%         │
│  14 days remaining           │
│                              │
│  ── Comments ──              │
│  🟢 Alex completed task      │
│  💬 Sam: Need final review   │
│                              │
│  ┌────────────────────────┐ │
│  │  Write a comment...    │ │
│  └────────────────────────┘ │
│                              │
│  [Mark Complete] [Hold]     │
└──────────────────────────────┘
```

On mobile, the panel takes the full screen. "Back to Workflow" returns to
the board. Actions are stacked at the bottom.
