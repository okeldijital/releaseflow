# Tasks Tab — High-Fidelity Spec

## Route

`/releases/[id]/tasks`

## Backend Entity Validation

| Entity | Source | Validated |
|--------|--------|-----------|
| Workflow | `releases/{id}/workflows` (stage grouping) | ✅ |
| Stage | `releases/{id}/stages` (tasks grouped by stage) | ✅ |
| Task | `releases/{id}/tasks` (full list, filtered) | ✅ |
| Deliverable | `releases/{id}/deliverables` (linked via task attachments) | ✅ |
| Activity | `activity` log (task transitions logged) | ✅ |
| Dependency | `releases/{id}/dependencies` (tasks can be blocked by deps) | ✅ |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  release workspace · Content area                                         │
│                                                                           │
│  Tasks · Lua – The Fading Light                                           │
│  ────────────────────────────────────────────────────────────────────     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Filter bar · h 48px · bg Surface · border-b 1px · p 12px          │  │
│  │                                                                     │  │
│  │ ┌──────────────┬──────────────┬──────────────┐                     │  │
│  │ │ Stage ▼      │ Status ▼     │ Assignee ▼   │  🔍 Search tasks..│  │
│  │ │ All stages   │ All statuses │ All          │                   │  │
│  │ └──────────────┴──────────────┴──────────────┘                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ─── Kanban Board ────────────────────────────────────────────────────   │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ ○ TO DO (3)  │ │ ◉ IN PROG (2)│ │ ◐ REVIEW (1) │ │ ✓ DONE (14) │    │
│  │              │ │              │ │              │ │              │    │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │    │
│  │ │ EQ drum   │ │ │ │ Level    │ │ │ │ Rough    │ │ │ │ Import   │ │    │
│  │ │ stem      │ │ │ │ stems    │ │ │ │ mix      │ │ │ │ stems    │ │    │
│  │ │           │ │ │ │          │ │ │ │ approve  │ │ │ │          │ │    │
│  │ │ 👤 Sam W  │ │ │ │ 👤 Sam W │ │ │ │ 👤 Sam   │ │ │ │ 👤 Sam W │ │    │
│  │ │ 🏷 Master │ │ │ │ 🏷 Master│ │ │ │ A&R      │ │ │ │ 🏷 Mixing│ │    │
│  │ │ 📅 Aug 28 │ │ │ │ 📅 Aug 25│ │ │ │ 🏷 Master│ │ │ │ 📅 Aug 12│ │    │
│  │ │ 🔴 Ovrdue │ │ │ │ 🟡 Today │ │ │ │ 📅 Aug 30│ │ │ │ ✓        │ │    │
│  │ │          │ │ │ │          │ │ │ │ 🟢 Future│ │ │ │          │ │    │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │    │
│  │              │ │              │ │              │ │              │    │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │              │ │ ┌──────────┐ │    │
│  │ │ Vocal    │ │ │ │ Reverb   │ │ │              │ │ │ Set up   │ │    │
│  │ │ comp     │ │ │ │ bus setup│ │ │              │ │ │ session  │ │    │
│  │ │          │ │ │ │          │ │ │              │ │ │          │ │    │
│  │ │ 👤 Alex  │ │ │ │ 👤 Sam W │ │ │              │ │ │ 👤 Sam W │ │    │
│  │ │ 🏷 Master│ │ │ │ 🏷 Mixing│ │ │              │ │ │ 🏷 Mixing│ │    │
│  │ │ 📅 Aug 30│ │ │ │ 📅 Sep 01│ │ │              │ │ │ 📅 Aug 10│ │    │
│  │ │ 🟢 Future│ │ │ │ 🟢 Future│ │ │              │ │ │ ✓        │ │    │
│  │ └──────────┘ │ │ └──────────┘ │ │              │ │ └──────────┘ │    │
│  │              │ │              │ │              │ │              │    │
│  │ ┌──────────┐ │ │              │ │              │ │ ┌──────────┐ │    │
│  │ │ Final    │ │ │              │ │              │ │ │ ...       │ │    │
│  │ │ deliver  │ │ │              │ │              │ │ │ (11 more) │ │    │
│  │ │          │ │ │              │ │              │ │ └──────────┘ │    │
│  │ │ 👤 Sam W │ │ │              │ │              │ │              │    │
│  │ │ 🏷 Master│ │ │              │ │              │ │              │    │
│  │ │ 📅 Sep 05│ │ │              │ │              │ │              │    │
│  │ │ 🟢 Future│ │ │              │ │              │ │              │    │
│  │ └──────────┘ │ │              │ │              │ │              │    │
│  │              │ │              │ │              │ │              │    │
│  │ ┌──────────┐ │ │              │ │              │ │              │    │
│  │ │ + Add    │ │ │              │ │              │ │              │    │
│  │ │ task     │ │ │              │ │              │ │              │    │
│  │ └──────────┘ │ │              │ │              │ │              │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                                           │
│  ◀ scroll arrows for overflow columns →                                 │
│                                                                           │
│  ─── Legend ────────────────────────────────────────────────────────────  │
│  🔴 Overdue  🟡 Due this week (≤7d)  🟡 Due today  🟢 Future  ⚪ No date│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Spacing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Filter bar                                                              │
│  │ Height: 48px                                                          │
│  │ Padding: 0 12px                                                       │
│  │ Border-bottom: 1px solid #E4E4E7                                      │
│  │ Filter dropdowns: gap 8px (sm)                                        │
│  │ Search input: 240px, aligned right                                    │
│  └────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  Kanban columns                                                          │
│  │ Column width: 240px                                                   │
│  │ Column gap: 12px (md)                                                 │
│  │ Column header: h 40px · p 8px 12px · Label 12px/500                 │
│  │ Column count badge: ml 4px · bg #F4F4F5 · radius 9999px              │
│  │ Column background: #F4F4F5 (Surface Muted)                            │
│  │ Column border-radius: 8px                                             │
│  │ Card within column: mb 8px (sm)                                       │
│  │ Card padding: 10px (between sm and md)                                │
│  │ Card border-radius: 6px                                               │
│  │ Add task button: mt 4px · w full · centered                           │
│  └────────────────────────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Typography

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Element                │ Token         │ Size / Weight     │ Color     │
│────────────────────────┼───────────────┼───────────────────┼───────────│
│ Column header          │ Label         │ 12px / 500        │ #52525B   │
│ Column count badge     │ Label         │ 12px / 500        │ #52525B   │
│ Task title             │ Body · 600    │ 14px / 600        │ #18181B   │
│ Task assignee          │ Body Small    │ 12px / 400        │ #52525B   │
│ Task stage             │ Caption       │ 11px / 400        │ #A1A1AA   │
│ Task due date          │ Body Small    │ 12px / 400        │ urgency   │
│ Deadline strip label   │ Caption       │ 11px / 400        │ #FFFFFF   │
│ Add task button        │ Label         │ 12px / 500        │ #7C3AED   │
│ Filter label           │ Label         │ 12px / 500        │ #52525B   │
│ Legend text            │ Caption       │ 11px / 400        │ #52525B   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Task Card Anatomy

```
┌──────────────────────────────────────────┐
│  12px padding all sides                  │
│                                          │
│  EQ drum stem          ← Body 14px/600  │
│                                          │
│  👤 Sam Wilson          ← Body Small 12px│
│  🏷 Mastering           ← Caption 11px  │
│  📅 Aug 28              ← Body Small 12px│
│                                          │
│  ───────────────────────────────────────  │
│  🔴 Overdue · 3 days ago ← Deadline strip│
│  h 4px · Caption 11px · bg status color  │
└──────────────────────────────────────────┘
```

---

## Colors

### Column Header

```
Column      │ Background     │ Header Text  │ Count Badge
────────────┼────────────────┼──────────────┼─────────────
TO DO       │ #F4F4F5        │ #52525B      │ bg #E4E4E7
IN PROGRESS │ #DBEAFE        │ #2563EB      │ bg #BFDBFE
REVIEW      │ #EDE9FE        │ #7C3AED      │ bg #DDD6FE
DONE        │ #DCFCE7        │ #16A34A      │ bg #BBF7D0
```

### Task Card

```
State       │ Background    │ Border       │ Shadow
────────────┼───────────────┼──────────────┼────────────────
Default     │ #FFFFFF       │ #E4E4E7      │ 0 1px 2px rgba(0,0,0,0.04)
Hover       │ #F5F3FF       │ #EDE9FE      │ 0 4px 12px rgba(0,0,0,0.08)
Drag        │ #EDE9FE       │ #7C3AED      │ 0 8px 16px rgba(0,0,0,0.12)
Selected    │ #EDE9FE       │ #7C3AED      │ 0 1px 2px rgba(0,0,0,0.04)
Blocked     │ #FEE2E2       │ #DC2626      │ 0 1px 2px rgba(0,0,0,0.04)
```

### Deadline Strip

```
Urgency     │ Background    │ Text Color
────────────┼───────────────┼─────────────
Overdue     │ #DC2626       │ #FFFFFF
This week   │ #D97706       │ #FFFFFF
Today       │ #D97706       │ #FFFFFF
Future      │ #16A34A       │ #FFFFFF
No date     │ (hidden)      │ —
```

### Drop Target

```
State       │ Background
────────────┼─────────────
Valid       │ #F5F3FF + border 2px dashed #7C3AED
Invalid     │ #FEF2F2 + border 2px dashed #DC2626
```

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default | Tasks exist across columns | Full kanban as shown |
| Filtered | Stage/status/assignee filter active | Filter bar shows active pill. Non-matching tasks hidden. |
| Empty (no tasks anywhere) | Release has 0 tasks | "No tasks yet. [Create your first task]." |
| Empty column | Specific column has 0 tasks | Per-column empty state: icon + "No tasks in Review" |
| Dragging | Card being dragged | Card lifts (shadow + scale 1.02). Valid drop targets highlight. |
| Drop refused | Invalid drop | Drop target flashes red. Card returns to origin. 200ms ease. |
| Task created | "+ Add task" clicked | Inline input appears at bottom of column. Auto-focus. |
| Task Detail open | Card clicked | 480px slide-out panel. Board dimmed behind. |

---

## Interactions

| Element | Action | Result |
|---------|--------|--------|
| Task card | Drag to another column | Task state changes. Stage progress recalculates. |
| Task card | Click | Open Task Detail panel (doc 32). |
| "+ Add task" | Click | Inline text input appears below last card. Title + Enter = create. |
| Filter dropdown | Select | Board filters to matching tasks. URL updates (`?stage=mastering`). |
| Search input | Type | Cards filter in real time (title + description match). |
| Column header | Click badge count | Sort column: by due date, by assignee, by stage. |
| Right-click card | Context menu | "Edit", "Assign", "Delete", "Move to..." |

---

## Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥1280px | 4 columns at 240px each = 960px + gaps. Fits. |
| 1024–1279px | 3 columns, 4th requires scroll arrow. |
| 768–1023px | 2 columns visible. Swipe to reveal. |
| <768px | Stacked list grouped by status (accordion). Swipe card left → next column. Swipe card right → previous column. |

---

## CSS Implementation

```css
.task-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 16px 0;
}

.task-column {
  min-width: 240px;
  max-width: 240px;
  background: #F4F4F5;
  border-radius: 8px;
  padding: 0;
  display: flex;
  flex-direction: column;

  .column-header {
    padding: 8px 12px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font: var(--text-label);

    .count-badge {
      padding: 1px 6px;
      border-radius: 9999px;
      background: #E4E4E7;
      font: var(--text-label);
    }
  }

  .column-body {
    padding: 0 8px 8px;
    flex: 1;
    overflow-y: auto;
  }
}

.task-card {
  background: #FFFFFF;
  border: 1px solid #E4E4E7;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: grab;
  transition: box-shadow 150ms ease, border-color 150ms ease;

  &:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }

  &.dragging {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    border-color: #7C3AED;
    transform: scale(1.02);
  }

  .task-title { font: var(--text-body); font-weight: 600; margin-bottom: 4px; }
  .task-assignee { font: var(--text-body-sm); color: #52525B; }
  .task-stage { font: var(--text-caption); color: #A1A1AA; }
  .task-due { font: var(--text-body-sm); }

  .deadline-strip {
    height: 4px;
    margin: 8px -10px -10px;
    border-radius: 0 0 6px 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font: var(--text-caption);
    color: #FFFFFF;

    &.overdue { background: #DC2626; }
    &.today { background: #D97706; }
    &.this-week { background: #D97706; }
    &.future { background: #16A34A; }
  }
}

.drop-target {
  &.valid { background: #F5F3FF; border: 2px dashed #7C3AED; }
  &.invalid { background: #FEF2F2; border: 2px dashed #DC2626; }
}
```
