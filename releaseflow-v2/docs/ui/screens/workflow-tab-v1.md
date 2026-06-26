# Workflow Tab — High-Fidelity Spec

## Route

`/releases/[id]/workflow`

## Backend Entity Validation

| Entity | Source | Validated |
|--------|--------|-----------|
| Workflow | `releases/{id}/workflows` (template reference) | ✅ |
| Stage | `releases/{id}/stages` (7 stages for Lua EP) | ✅ |
| Task | `releases/{id}/tasks` (per stage, drives progress) | ✅ |
| Deliverable | `releases/{id}/deliverables` (linked to stage) | ✅ |
| Activity | `activity` log (stage transitions logged) | ✅ |
| Dependency | `releases/{id}/dependencies` (blocks stage) | ✅ |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  release workspace · Content area · 1200px                              │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Workflow                              h 56px · H2 20px/600        │  │
│  │  ────────────────────────────────────────────────────────────────  │  │
│  │                                                                     │  │
│  │  ─── Lua – The Fading Light · EP · 7 stages ──────────────────────  │  │
│  │  [H3 16px/600 · Text Secondary · mb 16px]                           │  │
│  │                                                                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ PLANNING │→│PRODUCTION│→│  MIXING  │→│MASTERING │→│ ARTWORK  │  │  │
│  │  │          │ │          │ │          │ │          │ │          │  │  │
│  │  │ ✓ Done   │ │ ✓ Done   │ │ ✓ Done   │ │ ◉ Active │ │ ○ Pend   │  │  │
│  │  │          │ │          │ │          │ │          │ │          │  │  │
│  │  │ Aug 01   │ │ Aug 10   │ │ Aug 20   │ │ —        │ │ —        │  │  │
│  │  │          │ │          │ │          │ │          │ │          │  │  │
│  │  │ 👤 Alex  │ │ 👤 Prod Z│ │ 👤 Sam W │ │ 👤 Sam W │ │ —        │  │  │
│  │  │          │ │          │ │          │ │          │ │          │  │  │
│  │  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │  │  │
│  │  │ │ 5/5  │ │ │ │ 8/8  │ │ │ │ 6/6  │ │ │ │ 1/4  │ │ │ │ 0/3  │ │  │  │
│  │  │ │tasks │ │ │ │tasks │ │ │ │tasks │ │ │ │tasks │ │ │ │tasks │ │  │  │
│  │  │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │  │  │
│  │  │          │ │          │ │          │ │          │ │          │  │  │
│  │  │ [View]   │ │ [View]   │ │ [View]   │ │ [Tasks]  │ │ [View]   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │                                                                     │  │
│  │  ┌──────────┐ ┌──────────┐                                         │  │
│  │  │DISTRIB.. │→│ RELEASE  │   ← scroll arrows for overflow          │  │
│  │  │          │ │          │                                         │  │
│  │  │ ○ Pend   │ │ ○ Pend   │                                         │  │
│  │  │          │ │          │                                         │  │
│  │  │ —        │ │ —        │                                         │  │
│  │  │          │ │          │                                         │  │
│  │  │ —        │ │ —        │                                         │  │
│  │  │          │ │          │                                         │  │
│  │  │ ┌──────┐ │ │ ┌──────┐ │                                         │  │
│  │  │ │ 0/5  │ │ │ │ 0/2  │ │                                         │  │
│  │  │ │tasks │ │ │ │tasks │ │                                         │  │
│  │  │ └──────┘ │ │ └──────┘ │                                         │  │
│  │  │          │ │          │                                         │  │
│  │  │ [View]   │ │ [View]   │                                         │  │
│  │  └──────────┘ └──────────┘                                         │  │
│  │                                                                     │  │
│  │  ─── Stage Detail ───────────────────────────────────────────────   │  │
│  │  [Opens as right slide-out panel when a stage column is clicked]    │  │
│  │                                                                     │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │ Mastering · Stage 4 of 7 · ◉ Active                  [×]     │  │  │
│  │  │ ────────────────────────────────────────────────────────────  │  │  │
│  │  │                                                                │  │  │
│  │  │ ── Description ─────────────────────────────────────────────  │  │  │
│  │  │ Final master files (WAV 16/44.1) per track.                   │  │  │
│  │  │ All 5 tracks mastered. 4 of 5 delivered.                      │  │  │
│  │  │                                                                │  │  │
│  │  │ Required deliverables:                                         │  │  │
│  │  │ • Master file per track (4 of 5 complete)                     │  │  │
│  │  │ • Reference comparison files (optional)                       │  │  │
│  │  │                                                                │  │  │
│  │  │ ── Assignment ─────────────────────────────────────────────  │  │  │
│  │  │ Owner:  👤 Sam Wilson · Mix/Master Engineer    [Change]       │  │  │
│  │  │ Due:    Aug 25, 2026                    📅 [Change]           │  │  │
│  │  │                                                                │  │  │
│  │  │ ── Timeline ───────────────────────────────────────────────  │  │  │
│  │  │ Created:  Aug 18  ·  Started: Aug 20  ·  Due: Aug 25         │  │  │
│  │  │ ████████████████████████████░░░░░░  80% · 1 day remaining    │  │  │
│  │  │                                                                │  │  │
│  │  │ ── Activity & Comments ────────────────────────────────────  │  │  │
│  │  │ 🟢 Sam W completed "Import stems" · 2h ago                   │  │  │
│  │  │ 💬 Alex PM: "Mastering deadline moved to Aug 25" · 4h ago   │  │  │
│  │  │ 🔵 Stage activated · Aug 20                                   │  │  │
│  │  │                                                                │  │  │
│  │  │ ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ │ Write a comment...                               [Send] │  │  │
│  │  │ └──────────────────────────────────────────────────────────┘  │  │
│  │  │                                                                │  │
│  │  │ ── Actions ─────────────────────────────────────────────────  │  │
│  │  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │  │
│  │  │ │ Mark Complete│ │ Put on Hold  │ │  Skip Stage  │           │  │
│  │  │ └──────────────┘ └──────────────┘ └──────────────┘           │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  │                                                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Spacing

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Section Spacing                                                          │
│                                                                          │
│  Content max-width: 1200px · full width of content area                 │
│                                                                          │
│  ─── Row: Stage Columns ──────────────────────────────────────────────  │
│  │ Stage columns row: flex row, gap 12px (md)                          │
│  │ Stage column card: w 160px · p 12px (md)                             │
│  │ Column → column connector arrow: 20px gap, #A1A1AA                   │
│  │ Stage name: mb 8px (sm)                                              │
│  │ Stage status: mb 4px (xs)                                            │
│  │ Stage due date: mb 4px (xs)                                          │
│  │ Stage owner: mb 8px (sm)                                             │
│  │ Task progress chip: mb 4px (xs)                                      │
│  │ View/Tasks button: mt 4px (xs)                                       │
│  │                                                                       │
│  │ Spacing within column: vertical, each element gap 4-8px             │
│  └────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  ─── Stage Detail Panel ──────────────────────────────────────────────  │
│  │ Panel width: 480px · slides from right                               │
│  │ Panel padding: 16px (lg)                                             │
│  │ Section within panel: mb 16px (lg)                                   │
│  │ Section header: mb 8px (sm)                                          │
│  │ Field row (label + value): gap 8px (sm)                              │
│  │ Activity item: mb 8px (sm)                                           │
│  │ Comment input: mt 12px (md)                                          │
│  │ Action buttons: mt 12px (md), gap 8px (sm)                           │
│  └────────────────────────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Typography

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Element                │ Token         │ Size / Weight     │ Color     │
│────────────────────────┼───────────────┼───────────────────┼───────────│
│ Tab title "Workflow"   │ H2            │ 20px / 600        │ #18181B   │
│ Release context line   │ H3            │ 16px / 600        │ #52525B   │
│ Stage name             │ Label · 600   │ 12px / 500 · uc   │ #18181B   │
│ Stage status pill      │ Label         │ 12px / 500        │ status    │
│ Stage due date         │ Body Small    │ 12px / 400        │ #52525B   │
│ Stage owner            │ Body Small    │ 12px / 400        │ #52525B   │
│ Task progress          │ Body · 600    │ 14px / 600        │ #18181B   │
│ Task progress label    │ Body Small    │ 12px / 400        │ #52525B   │
│ View/Tasks button      │ Label         │ 12px / 500        │ #7C3AED   │
│────────────────────────┼───────────────┼───────────────────┼───────────│
│ Panel title            │ H3            │ 16px / 600        │ #18181B   │
│ Panel section header   │ Label · 600   │ 12px / 500        │ #18181B   │
│ Panel description      │ Body          │ 14px / 400        │ #52525B   │
│ Panel deliverables     │ Body Small    │ 12px / 400        │ #52525B   │
│ Panel field label      │ Label         │ 12px / 500        │ #52525B   │
│ Panel field value      │ Body          │ 14px / 400        │ #18181B   │
│ Panel activity item    │ Body Small    │ 12px / 400        │ #52525B   │
│ Panel action button    │ Label         │ 12px / 500        │ #FFFFFF   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Colors

### Stage Column States

```
State       │ Background    │ Border       │ Text         │ Progress bar
────────────┼───────────────┼──────────────┼──────────────┼─────────────
Active      │ #EFF6FF       │ #DBEAFE      │ #2563EB      │ #2563EB
Complete    │ #F0FDF4       │ #DCFCE7      │ #16A34A      │ #16A34A
Pending     │ #FFFFFF       │ #E4E4E7      │ #52525B      │ (hidden)
Blocked     │ #FEF2F2       │ #FEE2E2      │ #DC2626      │ #DC2626
Skipped     │ #FAFAFA       │ #E4E4E7      │ #A1A1AA      │ (hidden)
```

### Stage Status Pill

```
Status      │ Background    │ Text         │ Dot
────────────┼───────────────┼──────────────┼───────
Active      │ #DBEAFE       │ #2563EB      │ #2563EB
Complete    │ #DCFCE7       │ #16A34A      │ #16A34A
Pending     │ #F4F4F5       │ #52525B      │ #A1A1AA
Blocked     │ #FEE2E2       │ #DC2626      │ #DC2626
Skipped     │ #F4F4F5       │ #A1A1AA      │ #A1A1AA
```

### Connector Arrow

```
Status      │ Arrow Color
────────────┼─────────────
Any → Any   │ #A1A1AA (muted)
Active → *  │ #2563EB (blue)
Complete→ * │ #16A34A (green)
```

### Task Progress Chip

```
Count       │ Background    │ Text         │ Border
────────────┼───────────────┼──────────────┼───────────
Partial     │ #F5F3FF       │ #7C3AED      │ none
Complete    │ #DCFCE7       │ #16A34A      │ none
Zero        │ #F4F4F5       │ #A1A1AA      │ none
```

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default (stages exist) | Release has stages from template | 7 columns as shown |
| Empty (no stages) | Template failed to apply | "No workflow stages found. The release template was not applied. [Contact support]." |
| All complete | 7/7 stages COMPLETED | All columns green. Arrow connectors green. "All stages complete. Release ready for distribution." banner. |
| All blocked | 1+ stages BLOCKED | Blocked columns red. Active columns paused. |
| Stage Detail open | Column clicked | 480px panel slides from right. Board dimmed behind. 300ms ease-in-out. |
| Stage Detail loading | Data fetching | Skeleton: header pulse, description lines, timeline bar shimmer. |
| Author actions | User has stage:advance | "Mark Complete", "Put on Hold", "Skip Stage" visible. |
| Viewer (no actions) | User lacks stage:advance | Action buttons hidden. Panel is read-only. |
| Drag reorder (Owner/Admin) | Drag handle shown on column headers | Columns draggable. Drop zone highlighted. |

---

## Interactions

| Element | Action | Target |
|---------|--------|--------|
| Stage column | Click | Open Stage Detail panel |
| "View" button | Click | Open Stage Detail panel |
| "Tasks" button (active stage) | Click | Navigate to Tasks tab, filtered to this stage |
| Stage Detail: Mark Complete | Click | Stage → COMPLETED. Next stage activates. Animation: column turns green, arrow turns green, next column pulses blue. |
| Stage Detail: Put on Hold | Click | Modal: "Reason for hold (min 10 chars)". Stage → BLOCKED. |
| Stage Detail: Skip | Click | Confirmation dialog. Stage → SKIPPED. |
| Stage Detail: Change Owner | Click | User picker dropdown. Saves on select. Posts activity event. |
| Stage Detail: Change Due Date | Click | Date picker. Saves on select. |
| Stage Detail: Comment | Enter | Sends comment. Appears in activity feed. @mentions notify. |
| Connector arrow | Hover | Tooltip: "Planning → Production" |

---

## Responsive

| Breakpoint | Stage Columns | Stage Detail |
|------------|--------------|-------------|
| ≥1280px | 7 columns visible (160px each = 1120px + gaps). Horizontal scroll if overflow. | 480px slide-out panel. Board dimmed behind. |
| 1024–1279px | 5-6 columns, scroll arrows L/R. | 400px panel. |
| 768–1023px | 3-4 columns, scroll arrows. | Full-screen panel. "← Back to Board" header. |
| <768px | Single column, swipe between stages. Dot indicator at bottom. | Full-screen. Swipe to dismiss. |

---

## CSS Implementation

```css
.workflow-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
}

.stage-column {
  min-width: 160px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  transition: box-shadow 150ms ease, border-color 150ms ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: var(--color-primary-muted);
  }

  &.active    { background: #EFF6FF; border-color: #DBEAFE; }
  &.complete  { background: #F0FDF4; border-color: #DCFCE7; }
  &.blocked   { background: #FEF2F2; border-color: #FEE2E2; }
  &.skipped   { background: #FAFAFA; border-color: #E4E4E7; }

  .stage-name {
    font: var(--text-label);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stage-status {
    display: inline-block;
    font: var(--text-label);
    padding: 2px 8px;
    border-radius: 9999px;
  }

  .stage-due { font: var(--text-body-sm); }
  .stage-owner { font: var(--text-body-sm); }

  .task-progress {
    font: var(--text-body);
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .view-btn {
    all: unset;
    cursor: pointer;
    font: var(--text-label);
    color: var(--color-primary);
    margin-top: 4px;

    &:hover { text-decoration: underline; }
  }
}

.stage-connector {
  display: flex;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 20px;
  margin: 0 -4px;

  &.active-arrow { color: #2563EB; }
  &.complete-arrow { color: #16A34A; }
}
```
