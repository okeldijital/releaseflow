# Release Dashboard (Overview Panel)

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ◆ Overview                                       ⚙ Settings    │
│                                                                   │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐       │
│  │  📈       │  │  ☰       │  │  👥       │  │  ☑       │       │
│  │  Progress  │  │  Tracks  │  │ Contr.    │  │  Pending │       │
│  │           │  │          │  │           │  │  Tasks   │       │
│  │  ██████░░ │  │  12      │  │  8        │  │  4       │       │
│  │  60%      │  │  Total   │  │  Members  │  │  Tasks   │       │
│  └───────────┘  └──────────┘  └───────────┘  └──────────┘       │
│                                                                   │
│  ─── Release Progress ────────────────────────────────────────   │
│                                                                   │
│  Idea    A&R     Prod    Record   Mix    Master   Art    Meta    │
│  ┌──┐    ┌──┐    ┌──┐    ┌──┐    ┌──┐    ┌──┐    ┌──┐  ┌──┐    │
│  │✓ │    │✓ │    │✓ │    │◌ │    │○ │    │○ │    │○ │  │○ │    │
│  └──┘    └──┘    └──┘    └──┘    └──┘    └──┘    └──┘  └──┘    │
│                                                                   │
│  ─── Pending Tasks ───────────────────────────────────────────   │
│                                                                   │
│  ☐  Approve rough mix                    🎯 Alex     Jun 28 🔴  │
│  ☐  Book studio session                  👤 Sam      Jul 02 🟡  │
│  ☐  Confirm track listing                👤 You      Jul 05 🟡  │
│  └─────────────────────────────────────────────────────────────  │
│                                                                   │
│  ─── Upcoming Deadlines ──────────────────────────────────────   │
│                                                                   │
│  🔴  Jun 28   Rough mix approval due       — Alex                │
│  🟡  Jul 02   Studio session confirmed      — Sam                │
│  🟢  Jul 10   Tracking complete             — Artist X           │
│  🟢  Aug 01   Mix deadline                  — Mix Engineer       │
│                                                                   │
│  ─── Team Members ────────────────────────────────────────────   │
│                                                                   │
│  👤 Alex Taylor      Project Manager        Active on 3 tasks   │
│  👤 Sam Wilson       A&R                    Active on 1 task    │
│  👤 Artist X         Artist                 —                     │
│  👤 Producer Z       Producer               Active on 2 tasks   │
│                                                                   │
│  ─── Quick Actions ───────────────────────────────────────────   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  ☑ Add Task   │  │  📁 Upload   │  │  👥 Invite   │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stat Cards

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  📈              │  │  ☰              │  │  👥              │  │  ☑              │
│  60%             │  │  12             │  │  8               │  │  4              │
│  Release Progress│  │  Tracks         │  │  Contributors    │  │  Pending Tasks   │
│                  │  │                 │  │                  │  │                  │
│  ↑ +10% this wk  │  │  3 complete     │  │  3 active now    │  │  2 overdue       │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Stage Pipeline (Compact)

```
  Idea    A&R     Prod    Record   Mix    Master   Art    Meta    Pub    Dist   Mkt
  ┌──┐    ┌──┐    ┌──┐    ┌──┐    ┌──┐    ┌──┐    ┌──┐  ┌──┐  ┌──┐   ┌──┐   ┌──┐
  │✓ │    │✓ │    │✓ │    │◌ │    │○ │    │○ │    │○ │  │○ │  │○ │   │○ │   │○ │
  └──┘    └──┘    └──┘    └──┘    └──┘    └──┘    └──┘  └──┘  └──┘   └──┘   └──┘
   ↑       ↑       ↑       ↑
  done    done    done    active

  States:
  ✓  = complete (green)
  ◌  = active (blue, glow pulse)
  ○  = pending (border only, muted)
  ●  = blocked (red)
```

---

## Wireframe: Mobile View

```
┌──────────────────────────┐
│  ◆ Overview              │
│                          │
│  📈 60%   ☰ 12   👥 8   │
│                          │
│  ── Pipeline ──           │
│  ✓ ✓ ✓ ◌ ○ ○ ○ ○ ○ ○ ○  │
│                          │
│  ── Tasks ──              │
│  ☐ Approve rough   🔴   │
│  ☐ Book studio     🟡   │
│  ☐ Track listing   🟡   │
│                          │
│  ── Deadlines ──          │
│  🔴 Jun 28  Rough mix   │
│  🟡 Jul 02  Studio      │
│                          │
│  ┌────┐ ┌────┐ ┌────┐   │
│  │Task│ │Upl.│ │Inv.│   │
│  └────┘ └────┘ └────┘   │
└──────────────────────────┘
```

---

---

## Progress System

Release progress measures workflow completion. The single source of truth
is the ratio of completed stages to total stages. This drives the dashboard
progress bar, reporting, and status indicators.

### Formula

```
Progress = Completed Stages ÷ Total Stages
```

A stage is "complete" when all its tasks are marked DONE. Stages with no
tasks are considered complete automatically. Total stages = stages defined
in the template (7 for Single/EP/Album, 7 for Remix).

### Calculation Rules

- Each stage contributes equally: `1 ÷ totalStages` per completed stage
- A stage is "complete" when its status is COMPLETE or SKIPPED
- SKIPPED stages count as complete for progress purposes
- 0 stages (should not occur) = 0%

### Example Calculation

```
Release: "Midnight Sessions" — Single (7 stages)

Completed Stages:        3/7        = 43%

Total Progress:                     43%
```

### Comparison: Old vs New

| Aspect | Old Formula | New Formula |
|--------|-------------|-------------|
| Components | Tracks (40%) + Contributors (30%) + Workflow (30%) | Workflow only (100%) |
| Granularity | Mixed — metadata + people + stages | Pure stage completion |
| Problem | 70% progress possible at PLANNING with no stages done | Progress = stages done — honest signal |
| Track/Credit progress | Not lost — moved to Overview panel below | Still visible in stat cards |

### Status Indicator Mapping

| Progress Range | Label          | Color  | Icon |
|----------------|----------------|--------|------|
| 0%             | Not Started    | ██     | ⚪   |
| 1–25%          | Early Stage    | 🟡     | 🔵   |
| 26–50%         | In Progress    | 🟠     | 🟡   |
| 51–75%         | Well Underway  | 🟢     | 🟢   |
| 76–99%         | Almost There   | 🟢     | 🟢   |
| 100%           | Complete       | 🟢     | ✅   |

### Ui Display

```
  [████████████████░░░░░░░░░░░░░░░░]  60%
   ↑ progress bar               ↑ percentage
   (Primary color)               (semibold)
```

---

## Readiness Score (Future — TASK-903)

The Progress Score measures *what has been done*. It does not measure
*readiness to advance* — these are different concepts.

### The Problem

```
Example Release:

  Total stages:        7
  Completed stages:    0

  Progress Score:               0%

  But the release has:
    • Title, type, date, genre, label — all set
    • 1 track with full metadata
    • Artist + Producer assigned

  Progress Score says 0%, but the release could advance to PLANNING.
```

### The Solution (Sprint 005+)

A separate **Readiness Score** will evaluate:

| Factor                    | Weight | Definition                          |
|---------------------------|--------|-------------------------------------|
| Required metadata present | 25%    | Title, type, date, genre, label     |
| Required tracks exist     | 25%    | Min tracks per template met         |
| Contributors confirmed    | 25%    | All required roles assigned         |
| Stage gate passed         | 25%    | Current stage exit criteria met     |

```
Readiness = (Metadata × 0.25) + (Tracks × 0.25)
          + (Contributors × 0.25) + (StageGate × 0.25)
```

Readiness Score determines whether the release can advance to the next
status. Progress Score tracks how much total work is complete.

**TASK-903** is created to implement this in a future sprint.

---

## Data Sources

| Section            | Source Aggregate     | Key Query                               |
|--------------------|----------------------|-----------------------------------------|
| Release Progress   | Workflow (PRP)       | `COMPLETE` or `SKIPPED` stages ÷ total  |
| Health Indicator   | Workflow (PRP)       | Overdue/blocked stages + release date   |
| Tracks             | Release (RLM)        | Count of tracks, count with assets      |
| Contributors       | Release (RLM) / COL  | Count of distinct contributors          |
| Pending Tasks      | Workflow (PRP)       | Tasks where state ≠ DONE, assigned to   |
| Upcoming Deadlines | Workflow (PRP)       | Tasks ordered by dueDate ASC, limit 5   |
| Team Members       | IAC                  | Users with role scoped to this release  |
| Stage Pipeline     | Workflow (PRP)       | All stages with current state           |
