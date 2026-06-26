# 07 — Status Language

## Principle

One word per state. One meaning per color. Consistent across every surface
in the application.

A stage is never "done" on one screen and "completed" on another. Green
always means finished/approved/ready — never "selected" or "active."

---

## Workflow Statuses

Used for stages and tasks. These are the states a unit of work moves
through from creation to completion.

### States

| Status | Label | Badge CSS | Icon | Meaning |
|--------|-------|-----------|------|---------|
| Not Started | NOT STARTED | `bg-[#F4F4F5] text-[#52525B]` | ○ | Work has not begun |
| In Progress | IN PROGRESS | `bg-[#DBEAFE] text-[#2563EB]` | ◉ | Work is actively being done |
| Review | REVIEW | `bg-[#DBEAFE] text-[#2563EB]` | ◐ | Work submitted, awaiting approval |
| Blocked | BLOCKED | `bg-[#FEE2E2] text-[#DC2626]` | ● | Cannot proceed — dependency unmet |
| Approved | APPROVED | `bg-[#DCFCE7] text-[#16A34A]` | ✓ | Work accepted, next stage |
| Completed | COMPLETED | `bg-[#DCFCE7] text-[#16A34A]` | ✓ | All work is done |
| Skipped | SKIPPED | `bg-[#F4F4F5] text-[#78716C]` | – | Intentionally bypassed |

### Usage

| Context | States Used |
|---------|-------------|
| Stage state machine (doc 5, 28) | Not Started → In Progress → Review → Blocked → Completed / Skipped |
| Task state machine (doc 5, 31) | Not Started → In Progress → Review → Blocked → Completed |
| Task Board columns (doc 31) | To Do (=Not Started), In Progress, Review, Done (=Completed) |

### Badge Rendering

```
NOT STARTED:  ┌─────────────┐   IN PROGRESS: ┌─────────────┐
              │ NOT STARTED  │                │ IN PROGRESS │
              └─────────────┘                └─────────────┘

REVIEW:       ┌──────────┐     BLOCKED:      ┌──────────┐
              │  REVIEW  │                   │ BLOCKED  │
              └──────────┘                   └──────────┘

APPROVED:     ┌──────────┐     COMPLETED:    ┌───────────┐
              │ APPROVED │                   │ COMPLETED │
              └──────────┘                   └───────────┘

SKIPPED:      ┌─────────┐
              │ SKIPPED │
              └─────────┘
```

---

## Readiness Statuses

Used for release readiness (TASK-1601) and rights readiness (TASK-2603).
These answer: "Can this proceed?"

### States

| Status | Label | Badge CSS | Icon | Meaning |
|--------|-------|-----------|------|---------|
| Not Ready | NOT READY | `bg-[#FEE2E2] text-[#DC2626]` | ✕ | Critical blockers exist |
| At Risk | AT RISK | `bg-[#FEF3C7] text-[#D97706]` | ⚠ | Proceeding is possible but risky |
| Ready | READY | `bg-[#DCFCE7] text-[#16A34A]` | ✓ | All checks passed |

### Usage

| Context | States Used |
|---------|-------------|
| Release Readiness (doc 37) | Ready / At Risk / Not Ready (blocked) |
| Rights Readiness (doc 54) | Cleared (=Ready) / Not Cleared (=Not Ready) |
| DSP Readiness (doc 44) | Ready / Ready with Warnings / Not Ready |

**Note on Rights Readiness:** Uses the binary "Cleared / Not Cleared"
because rights are a legal gate — there is no "at risk" middle state.

### Badge Rendering

```
NOT READY:    ┌───────────┐    AT RISK:     ┌─────────┐
              │ NOT READY │                 │ AT RISK │
              └───────────┘                 └─────────┘

READY:        ┌───────┐
              │ READY │
              └───────┘
```

---

## Budget Statuses

Used for budget categories, cost tracking, and budget workspace (TASK-2601).

### States

| Status | Label | Badge CSS | Icon | Meaning |
|--------|-------|-----------|------|---------|
| On Budget | ON BUDGET | `bg-[#DCFCE7] text-[#16A34A]` | ✓ | Spend ≤ allocation |
| At Risk | AT RISK | `bg-[#FEF3C7] text-[#D97706]` | ⚠ | Spend >75% of allocation, planned exceeds remaining |
| Over Budget | OVER BUDGET | `bg-[#FEE2E2] text-[#DC2626]` | ✕ | Spend or planned > allocation |

### Usage

| Context | States Used |
|---------|-------------|
| Budget Workspace categories (doc 55) | On Budget / At Risk / Over Budget |
| Cost items (doc 56) | Submitted / Approved / Rejected / Paid (different from budget status) |
| Budget Pulse (doc 60) | Within / Approaching (>75%) / Over |

**Note on distinction:** Budget categories use "On Budget / At Risk /
Over Budget." Cost items use "Submitted / Approved / Rejected / Paid."
They are different dimensions — a cost can be "Approved" while its
category is "Over Budget."

### Badge Rendering

```
ON BUDGET:    ┌───────────┐    AT RISK:     ┌─────────┐
              │ ON BUDGET │                 │ AT RISK │
              └───────────┘                 └─────────┘

OVER BUDGET:  ┌─────────────┐
              │ OVER BUDGET │
              └─────────────┘
```

---

## Campaign Statuses

Used for campaign lifecycle (TASK-2201) and campaign health (TASK-2203).

### Lifecycle States

| Status | Label | Badge CSS | Icon | Meaning |
|--------|-------|-----------|------|---------|
| Draft | DRAFT | `bg-[#F4F4F5] text-[#52525B]` | ○ | Campaign created, not yet active |
| Active | ACTIVE | `bg-[#DBEAFE] text-[#2563EB]` | ● | Campaign is running |
| Paused | PAUSED | `bg-[#FEF3C7] text-[#D97706]` | ‖ | Temporarily halted |
| Completed | COMPLETED | `bg-[#DCFCE7] text-[#16A34A]` | ✓ | Post-release, retrospective done |
| Archived | ARCHIVED | `bg-[#F4F4F5] text-[#78716C]` | 📦 | Campaign data preserved, not editable |

### Health States (separate from lifecycle)

| Status | Label | Badge CSS | Icon | Meaning |
|--------|-------|-----------|------|---------|
| On Track | ON TRACK | `bg-[#DCFCE7] text-[#16A34A]` | ✓ | All milestones on schedule |
| At Risk | AT RISK | `bg-[#FEF3C7] text-[#D97706]` | ⚠ | 1+ milestones overdue |
| Delayed | DELAYED | `bg-[#FEE2E2] text-[#DC2626]` | ✕ | 2+ milestones overdue or channel past schedule |

### Usage

| Context | States Used |
|---------|-------------|
| Campaign Workspace lifecycle (doc 46) | Draft / Active / Paused / Completed / Archived |
| Campaign Health (doc 48) | On Track / At Risk / Delayed |
| Campaign Card (Marketing Hub) | Shows both: Active + On Track |

**Note on dual display:** A campaign shows its lifecycle state (Active)
and health state (On Track) simultaneously. The lifecycle badge is on
the left. The health badge is on the right. Example: `● ACTIVE  ✓ ON TRACK`.

### Badge Rendering

```
DRAFT:        ┌───────┐      ACTIVE:       ┌────────┐
              │ DRAFT │                    │ ACTIVE │
              └───────┘                    └────────┘

PAUSED:       ┌────────┐     COMPLETED:    ┌───────────┐
              │ PAUSED │                   │ COMPLETED │
              └────────┘                   └───────────┘

ARCHIVED:     ┌──────────┐
              │ ARCHIVED │
              └──────────┘

ON TRACK:     ┌──────────┐    AT RISK:     ┌─────────┐
              │ ON TRACK │                 │ AT RISK │
              └──────────┘                 └─────────┘

DELAYED:      ┌─────────┐
              │ DELAYED │
              └─────────┘
```

---

## Release Lifecycle Statuses

The master release statuses (doc 16). These are distinct from workflow
statuses (which apply to stages within a release).

| Status | Label | Badge CSS | Icon | Meaning |
|--------|-------|-----------|------|---------|
| Draft | DRAFT | `border border-[#E4E4E7] text-[#52525B]` | ○ | Created, not started |
| Planning | PLANNING | `bg-[#DBEAFE] text-[#2563EB]` | ◉ | Scope and schedule defined |
| Production | PRODUCTION | `bg-[#EDE9FE] text-[#7C3AED]` | ◉ | Active creative work |
| On Hold | ON HOLD | `bg-[#FEF3C7] text-[#D97706]` | ‖ | Paused, blocked externally |
| Ready | READY | `bg-[#DCFCE7] text-[#16A34A]` | ✓ | Awaiting release date |
| Released | RELEASED | `bg-[#16A34A] text-[#FFFFFF]` | ✓ | Publicly live |
| Archived | ARCHIVED | `bg-[#F4F4F5] text-[#78716C]` | 📦 | Terminal |
| Cancelled | CANCELLED | `bg-[#FEE2E2] text-[#DC2626] line-through` | ✕ | Terminal |

---

## Color Consistency Matrix

```
Color          │ Workflow    │ Readiness  │ Budget    │ Campaign H │ Release
───────────────┼─────────────┼────────────┼───────────┼────────────┼─────────
Green #16A34A  │ Completed   │ Ready      │ On Budget │ On Track   │ Released
               │ Approved    │            │           │            │ Ready
───────────────┼─────────────┼────────────┼───────────┼────────────┼─────────
Amber #D97706  │ —           │ At Risk    │ At Risk   │ At Risk    │ On Hold
───────────────┼─────────────┼────────────┼───────────┼────────────┼─────────
Red #DC2626    │ Blocked     │ Not Ready  │ Over Bgt  │ Delayed    │ Cancelled
───────────────┼─────────────┼────────────┼───────────┼────────────┼─────────
Blue #2563EB   │ In Progress │ —          │ —         │ Active     │ Planning
               │ Review      │            │           │            │
───────────────┼─────────────┼────────────┼───────────┼────────────┼─────────
Purple #7C3AED │ —           │ —          │ —         │ —          │ Production
───────────────┼─────────────┼────────────┼───────────┼────────────┼─────────
Stone #78716C  │ Skipped     │ —          │ —         │ Archived   │ Archived
───────────────┼─────────────┼────────────┼───────────┼────────────┼─────────
Neutral #52525B│ Not Started │ —          │ —         │ Draft      │ Draft
```

No color means two different things. Green never means "in progress."
Red never means "editable." Every status across every domain maps to
exactly one color.

---

## CSS Custom Properties

```css
:root {
  /* Workflow */
  --status-not-started: #52525B;
  --status-not-started-bg: #F4F4F5;
  --status-in-progress: #2563EB;
  --status-in-progress-bg: #DBEAFE;
  --status-review: #2563EB;
  --status-review-bg: #DBEAFE;
  --status-blocked: #DC2626;
  --status-blocked-bg: #FEE2E2;
  --status-approved: #16A34A;
  --status-approved-bg: #DCFCE7;
  --status-completed: #16A34A;
  --status-completed-bg: #DCFCE7;
  --status-skipped: #78716C;
  --status-skipped-bg: #F4F4F5;

  /* Readiness */
  --status-not-ready: #DC2626;
  --status-not-ready-bg: #FEE2E2;
  --status-at-risk: #D97706;
  --status-at-risk-bg: #FEF3C7;
  --status-ready: #16A34A;
  --status-ready-bg: #DCFCE7;

  /* Budget */
  --status-on-budget: #16A34A;
  --status-on-budget-bg: #DCFCE7;
  --status-budget-at-risk: #D97706;
  --status-budget-at-risk-bg: #FEF3C7;
  --status-over-budget: #DC2626;
  --status-over-budget-bg: #FEE2E2;

  /* Campaign lifecycle */
  --status-draft: #52525B;
  --status-draft-bg: #F4F4F5;
  --status-active: #2563EB;
  --status-active-bg: #DBEAFE;
  --status-paused: #D97706;
  --status-paused-bg: #FEF3C7;
  --status-campaign-completed: #16A34A;
  --status-campaign-completed-bg: #DCFCE7;
  --status-archived: #78716C;
  --status-archived-bg: #F4F4F5;

  /* Release lifecycle */
  --status-planning: #2563EB;
  --status-planning-bg: #DBEAFE;
  --status-production: #7C3AED;
  --status-production-bg: #EDE9FE;
  --status-released: #16A34A;
  --status-released-bg: #16A34A;  /* Solid fill */
  --status-cancelled: #DC2626;
  --status-cancelled-bg: #FEE2E2;
}
```
