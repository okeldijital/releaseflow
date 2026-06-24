# TASK-1101 — Task Board

## Concept

A kanban-style board scoped to a single stage. When a user clicks into a
stage from the Workflow Board (TASK-801), the Task Board renders as the
content area with four columns: To Do, In Progress, Review, Done.

Tasks move between columns via drag-and-drop or status change from the
Task Detail panel (TASK-1102). This replaces the current vertical task
list in the Workflow tab.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back to Workflow    Stage: Mixing · Midnight Sessions                 │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  ○ TO DO     │  │  ◉ IN PROGRESS│  │  ◐ REVIEW    │  │  ✓ DONE     │  │
│  │     (3)      │  │     (2)       │  │     (1)       │  │     (5)     │  │
│  │              │  │              │  │              │  │              │  │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │
│  │ │          │ │  │ │          │ │  │ │          │ │  │ │          │ │  │
│  │ │ Eq vocal │ │  │ │ Level    │ │  │ │ Rough    │ │  │ │ Import   │ │  │
│  │ │ chain    │ │  │ │ stems    │ │  │ │ mix      │ │  │ │ stems    │ │  │
│  │ │          │ │  │ │          │ │  │ │ approve  │ │  │ │          │ │  │
│  │ │ 👤 Sam   │ │  │ │ 👤 Alex  │ │  │ │ 👤 Sam   │ │  │ │ 👤 Alex  │ │  │
│  │ │ 🏷 Mixing│ │  │ │ 🏷 Mixing│ │  │ │ 🏷 Mixing│ │  │ │ 🏷 Mixing│ │  │
│  │ │ Jun 30   │ │  │ │ Jul 05   │ │  │ │ Jul 08   │ │  │ │ Jun 20   │ │  │
│  │ │ 🔴 Overd.│ │  │ │ 🟡 Soon │ │  │ │ 🟢 Jul 08│ │  │ │          │ │  │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │
│  │              │  │              │  │              │  │              │  │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │              │  │ ┌──────────┐ │  │
│  │ │          │ │  │ │          │ │  │              │  │ │          │ │  │
│  │ │ Pan lead │ │  │ │ Add      │ │  │              │  │ │ Set up   │ │  │
│  │ │ vocal    │ │  │ │ reverb   │ │  │              │  │ │ session  │ │  │
│  │ │          │ │  │ │ bus      │ │  │              │  │ │          │ │  │
│  │ │ 👤 Alex  │ │  │ │          │ │  │              │  │ │ 👤 Alex  │ │  │
│  │ │ 🏷 Mixing│ │  │ │ 👤 —    │ │  │              │  │ │ 🏷 Mixing│ │  │
│  │ │ Jul 10   │ │  │ │ 🏷 Mixing│ │  │              │  │ │ Jun 18   │ │  │
│  │ │ 🟢 Jul   │ │  │ │ Jul 15   │ │  │              │  │ │          │ │  │
│  │ └──────────┘ │  │ │ 🟢 Jul  │ │  │              │  │ └──────────┘ │  │
│  │              │  │ └──────────┘ │  │              │  │              │  │
│  │ ┌──────────┐ │  │              │  │              │  │ ┌──────────┐ │  │
│  │ │          │ │  │              │  │              │  │ │ (more)   │ │  │
│  │ │ Backing  │ │  │              │  │              │  │ │ ...      │ │  │
│  │ │ vocal    │ │  │              │  │              │  │ └──────────┘ │  │
│  │ │ comp     │ │  │              │  │              │  │              │  │
│  │ │ 👤 Sam   │ │  │              │  │              │  │              │  │
│  │ │ 🏷 Mixing│ │  │              │  │              │  │              │  │
│  │ │ Jul 12   │ │  │              │  │              │  │              │  │
│  │ │ 🟢 Jul   │ │  │              │  │              │  │              │  │
│  │ └──────────┘ │  │              │  │              │  │              │  │
│  │              │  │              │  │              │  │              │  │
│  │ ┌──────────┐ │  │              │  │              │  │              │  │
│  │ │ + Add     │ │  │              │  │              │  │              │  │
│  │ │  task     │ │  │              │  │              │  │              │  │
│  │ └──────────┘ │  │              │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
│                                                                           │
│  🔴 Overdue  🟡 Due this week  🟢 Future  ⚪ No due date                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Column Definitions

| Column | Maps to Task States | Drop Rule | Card Count Badge |
|--------|---------------------|-----------|-------------------|
| To Do | TODO | Cards can only be dropped here from In Progress (returned) | Blue `○` badge |
| In Progress | IN_PROGRESS | Cards can be dropped here from To Do or Review | Amber `◉` badge |
| Review | REVIEW | Cards can be dropped here from In Progress (submit for review) | Purple `◐` badge |
| Done | DONE | Cards can only be dropped here from Review (approve) | Green `✓` badge |

Tasks in BLOCKED state appear with a red border in their current column
and cannot be dragged.

---

## Task Card Anatomy

```
┌────────────────────────────────┐
│  Task title                    │  ← Body (14px/400)
│                                │
│  👤 Assignee avatar + name     │  ← Body small (12px), Text Secondary
│  🏷 Stage name (context)       │  ← Label (12px/500), badge
│  📅 Due date                   │  ← Body small
│                                │
│  ──────────────────────────────│
│  🔴 Overdue  /  🟡 This week   │  ← Deadline indicator strip
└────────────────────────────────┘
```

### Deadline Strip (bottom bar)

| Indicator | Condition | Color |
|-----------|-----------|-------|
| 🔴 Overdue | `dueDate < now` | `#DC2626` |
| 🟡 This week | `dueDate ≤ now + 7d` | `#D97706` |
| 🟢 Future | `dueDate > now + 7d` | `#16A34A` |
| ⚪ No date | `dueDate = null` | `#A1A1AA` |

---

## Drag-and-Drop

| Action | Result | Validation |
|--------|--------|------------|
| Drag TODO → In Progress | Task status → IN_PROGRESS | Assignee must be set; if unassigned: prompt to assign first |
| Drag In Progress → Review | Task status → REVIEW | Title must be set |
| Drag Review → Done | Task status → DONE | User must have `task:complete` permission |
| Drag In Progress → To Do | Task status → TODO | Reset — no gate |
| Drag Review → In Progress | Task status → IN_PROGRESS | Rejected — sent back |
| Drag into BLOCKED | Task already BLOCKED → cannot drag | — |
| Drag Done → elsewhere | Not allowed | Done column is locked for drag-out |

Drag initiates on card header area. Drop target column highlights with a
primary border when hovered. Invalid drop zones show a red border.

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Move focus between cards within columns |
| Left/Right arrow | Move focused card to adjacent column (same as drag) |
| Enter | Open Task Detail (TASK-1102) for focused card |
| Space | Select card for multi-select |
| N | Add new task to focused column |
| Escape | Clear focus |

---

## Filter Bar

Above the kanban columns:

```
┌──────────────────────────────────────────────────────────┐
│  🔍 Search tasks...    [Assigned ▼]  [All ▼]            │
│                                                           │
│  Assigned to:  ○ All  ○ Me  ○ Unassigned                │
│  Show:          ◉ All tasks  ○ Overdue only              │
└──────────────────────────────────────────────────────────┘
```

| Filter | Options | Default |
|--------|---------|---------|
| Assigned to | All, Me, Unassigned | All |
| Show | All tasks, Overdue only | All tasks |
| Search | Free text (searches title + description) | — |

---

## Column States

### To Do (Empty)

```
┌──────────────────┐
│  ○ TO DO  (0)    │
│                  │
│  No tasks yet.   │
│  ┌──────────┐    │
│  │ + Add     │    │
│  │  task     │    │
│  └──────────┘    │
└──────────────────┘
```

### In Progress (Empty)

```
┌──────────────────┐
│  ◉ IN PROGRESS   │
│      (0)          │
│                  │
│  No active tasks.│
│                  │
│  Drag tasks here  │
│  from To Do.      │
└──────────────────┘
```

### Review (Empty)

```
┌──────────────────┐
│  ◐ REVIEW  (0)  │
│                  │
│  Nothing to      │
│  review.          │
└──────────────────┘
```

### Done (Empty)

```
┌──────────────────┐
│  ✓ DONE    (0)  │
│                  │
│  No completed    │
│  tasks yet.       │
└──────────────────┘
```

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| ≥1280px | 4 columns side by side, 240px wide each |
| 1024–1279px | 4 columns, 200px each, horizontal scroll |
| 768–1023px | 2 columns visible, swipe to reveal |
| <768px | Stacked list grouped by status, swipe between columns |

Mobile: each column becomes a vertical list grouped under a status header.
Tapping a column header expands/collapses it.

---

## Add Task Inline

Clicking "+ Add task" at the bottom of any column opens an inline input:

```
┌──────────────────┐
│  ○ TO DO  (3)    │
│                  │
│  ┌──────────────┐│
│  │ Task cards... ││
│  └──────────────┘│
│  ┌──────────────┐│
│  │ Enter title.. ││  ← Text input, auto-focus
│  │ ┌────┐ ┌────┐││
│  │ │Save│ │Cancel│││
│  │ └────┘ └────┘││
│  └──────────────┘│
└──────────────────┘
```

- "Save" creates the task in the current column's state.
- "Cancel" discards.
- Holding Shift+Enter creates and opens Task Detail immediately.
- Created tasks default to unassigned and no due date.

---

## Data Model

```typescript
interface TaskBoardColumn {
  id: TaskState;             // TODO | IN_PROGRESS | REVIEW | DONE
  label: string;             // "To Do" | "In Progress" | "Review" | "Done"
  badge: string;             // "(3)"
  tasks: TaskCard[];
}

interface TaskCard {
  id: string;
  title: string;
  description?: string;
  state: TaskState;
  assignee?: { id: string; name: string; avatar: string };
  dueDate?: Timestamp;
  stageId: string;
  stageName: string;
  releaseId: string;
  releaseName: string;
  createdAt: Timestamp;
  priority: 'overdue' | 'this_week' | 'future' | 'none';  // computed
}

type TaskState = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE';
```
