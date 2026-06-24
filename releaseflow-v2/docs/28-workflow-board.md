# TASK-801 — Workflow Board

## Concept

A visual stage pipeline that replaces the current vertical stage list in
the Workflow tab. Stages are displayed as horizontal swimlane columns, not
task cards. Each column represents one stage with its summary state.

Stages only — task cards are not displayed here. Tasks live inside the
Stage Detail panel (see TASK-802).

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Workflow                                                    ⚙ Settings  │
│                                                                           │
│  ─── Midnight Sessions · Single ────────────────────────────────────────  │
│                                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  │ PLANNING │  │PRODUCTION│  │  MIXING  │  │MASTERING │  │ ARTWORK  │  │DISTRIB.. │  │ RELEASE  │
│  │          │  │          │  │          │  │          │  │          │  │          │  │          │
│  │ Status   │  │ Status   │  │ Status   │  │ Status   │  │ Status   │  │ Status   │  │ Status   │
│  │ ● Active │  │ ○ Pending│  │ ○ Pending│  │ ○ Pending│  │ ○ Pending│  │ ○ Pending│  │ ○ Pending│
│  │          │  │          │  │          │  │          │  │          │  │          │  │          │
│  │ Due      │  │ Due      │  │ Due      │  │ Due      │  │ Due      │  │ Due      │  │ Due      │
│  │ Jun 28   │  │ Jul 15   │  │ Aug 01   │  │ Aug 15   │  │ Sep 01   │  │ Sep 15   │  │ Oct 01   │
│  │          │  │          │  │          │  │          │  │          │  │          │  │          │
│  │ Owner    │  │ Owner    │  │ Owner    │  │ Owner    │  │ Owner    │  │ Owner    │  │ Owner    │
│  │ 👤 Sam   │  │ 👤 Alex  │  │ —        │  │ —        │  │ —        │  │ —        │  │ —        │
│  │          │  │          │  │          │  │          │  │          │  │          │  │          │
│  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │
│  │ │ 2/5  │ │  │ │ 0/3  │ │  │ │ 0/2  │ │  │ │ 0/2  │ │  │ │ 0/2  │ │  │ │ 0/3  │ │  │ │ 0/1  │ │
│  │ │tasks │ │  │ │tasks │ │  │ │tasks │ │  │ │tasks │ │  │ │tasks │ │  │ │tasks │ │  │ │tasks │ │
│  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │
│  │          │  │          │  │          │  │          │  │          │  │          │  │          │
│  │ [View]   │  │ [View]   │  │ [View]   │  │ [View]   │  │ [View]   │  │ [View]   │  │ [View]   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
│                                                                           │
│  ─── Legend ────────────────────────────────────────────────────────────  │
│  ● Active  ◉ Complete  ○ Pending  ● Blocked  – Skipped                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Column States

Each stage column shows:

| Element | Description |
|---------|-------------|
| Stage name | Uppercase header (e.g., "PLANNING") |
| Status indicator | Pill with icon + label |
| Due date | Calendar date |
| Owner | Avatar + name, or "—" if unassigned |
| Task progress | `X/Y tasks` chip |
| View button | Opens Stage Detail panel (TASK-802) |

### Status Indicators

| Status | Label | Column Background | Pill |
|--------|-------|-------------------|------|
| Active | ● Active | Blue tint `#EFF6FF` | Blue `#DBEAFE` |
| Complete | ◉ Complete | Green tint `#F0FDF4` | Green `#DCFCE7` |
| Pending | ○ Pending | White | Neutral `#F4F4F5` |
| Blocked | ● Blocked | Red tint `#FEF2F2` | Red `#FEE2E2` |
| Skipped | – Skipped | Muted `#FAFAFA` | Muted `#F4F4F5` |

---

## Column Width

| Breakpoint | Layout |
|------------|--------|
| ≥1280px | All 7 columns visible, horizontal scroll only if overflow |
| 1024–1279px | 5–6 columns visible, arrow buttons to scroll |
| 768–1023px | 3–4 columns visible, scroll arrows |
| <768px | Single column, vertical stack, swipe to change stage |

Desktop uses a fixed-column layout where each column is 160px wide (total
~1120px + padding). Navigation arrows appear on the left/right edges of
the board when columns overflow the viewport.

---

## Interactions

| Interaction | Behavior |
|-------------|----------|
| Click column | Opens Stage Detail panel (TASK-802) |
| Click "View" button | Same as clicking column |
| Hover column | Subtle shadow elevation + border highlight |
| Scroll (desktop) | Horizontal scroll with overflow hidden + arrow buttons |
| Swipe (mobile) | Touch swipe to navigate between stages |
| Stage reorder | Drag column header to reorder (Owner/Admin only) |

---

## Mobile View

```
┌────────────────────────────┐
│  Workflow                  │
│                            │
│  ← PLANNING          →    │
│  ┌────────────────────────┐│
│  │ ● Active               ││
│  │ Due: Jun 28            ││
│  │ Owner: 👤 Sam          ││
│  │                        ││
│  │ ┌────────────────────┐ ││
│  │ │ 2/5 tasks complete │ ││
│  │ └────────────────────┘ ││
│  │                        ││
│  │ [View Stage Details]  ││
│  └────────────────────────┘│
│                            │
│  ○ ○ ○ ● ○ ○ ○            │
│  (stage dots indicator)    │
└────────────────────────────┘
```

On mobile, only one stage column is visible at a time. Swipe left/right or
tap the arrow buttons to move between stages. The dot indicator at the
bottom shows the current position in the sequence.

---

## Data Model (Stage Summary)

Each stage column renders from this shape:

```typescript
interface StageSummary {
  id: string;
  name: string;               // "Planning", "Production", etc.
  order: number;
  status: StageStatus;        // PENDING | ACTIVE | COMPLETE | BLOCKED | SKIPPED
  owner?: { id: string; name: string; avatar: string };
  dueDate?: Timestamp;
  taskCount: number;          // total tasks in this stage
  completedTaskCount: number; // tasks marked DONE
}
```

---

## Empty State

When a release has no stages defined (should not occur in V1), the board
shows:

```
┌────────────────────────────────────────────┐
│                                            │
│               ┌──────────┐                  │
│               │  📋       │                  │
│               └──────────┘                  │
│         No workflow stages found.            │
│     The release template was not applied.    │
│                                            │
│         ┌──────────────────────────┐        │
│         │  Contact support         │        │
│         └──────────────────────────┘        │
└────────────────────────────────────────────┘
```
