# TASK-2603 — Resource Planning Board

## Concept

A board that visualizes what every contributor is working on across all
releases and campaigns. PMs and Admins use this to answer: *"Who is
overloaded? Who has capacity? Can we take on another release?"*

Not a Gantt chart. Not a calendar. A simple resource → assignment mapping
that shows workload at a glance.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Resource Planning                                           ⚙ Filter    │
│                                                                           │
│  ─── Designers ────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  👤 Taylor                           Designer     🟡 3 releases     │ │
│  │                                                                      │ │
│  │  ┌────────────────────────┐ ┌────────────────────────┐              │ │
│  │  │ Midnight Sessions      │ │ Summer EP              │              │ │
│  │  │ Artwork · Oct 01       │ │ Artwork · Aug 20        │              │ │
│  │  │ Cover art + booklet   │ │ Social media kit       │              │ │
│  │  │ ░░░░░░░░░░░░░░ 100%   │ │ ████████████████  90%  │              │ │
│  │  │ ✓ Completed            │ │ ◐ In progress          │              │ │
│  │  └────────────────────────┘ └────────────────────────┘              │ │
│  │  ┌────────────────────────┐                                          │ │
│  │  │ Neon Remix             │                                          │ │
│  │  │ Artwork · Nov 15        │                                          │ │
│  │  │ Remix cover design     │                                          │ │
│  │  │ ░░░░░░░░░░░░░░   0%   │                                          │ │
│  │  │ ○ Not started          │                                          │ │
│  │  └────────────────────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Mix Engineers ────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  👤 Sam Wilson                      Mix Engineer  🔴 5 releases     │ │
│  │                                                                      │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │ │
│  │  │Midnight Ses..│ │ Summer EP    │ │ Lost Tracks  │                │ │
│  │  │Mixing·Oct 01 │ │ Mixing·Aug 20│ │ Mixing·Sep 15│                │ │
│  │  │█████████ 60% │ │█████████ 60% │ │███████████ 70│                │ │
│  │  │◐ In progress  │ │◐ In progress │ │◐ In progress │                │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │ │
│  │  ┌──────────────┐ ┌──────────────┐                                  │ │
│  │  │ Neon Remix    │ │ Autumn EP    │                                  │ │
│  │  │Mix·Nov 15    │ │ Mix·Dec 01   │                                  │ │
│  │  │░░░░░░░ 0%   │ │░░░░░░░ 0%   │                                  │ │
│  │  │○ Not started  │ │○ Not started  │                                  │ │
│  │  └──────────────┘ └──────────────┘                                  │ │
│  │                                                                      │ │
│  │  ⚠ Sam is overloaded. 5 releases, 3 active. Consider redistributing. │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Producers ────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  👤 Producer Z                     Producer     🟢 1 release        │ │
│  │                                                                      │ │
│  │  ┌────────────────────────┐                                          │ │
│  │  │ Midnight Sessions      │                                          │ │
│  │  │ Production · Oct 01    │                                          │ │
│  │  │ Stems + session files │                                          │ │
│  │  │ ░░░░░░░░░░░░░░ 100%  │                                          │ │
│  │  │ ✓ Completed            │                                          │ │
│  │  └────────────────────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Marketing ────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  👤 Anna                           Marketing    🟡 2 campaigns      │ │
│  │                                                                      │ │
│  │  ┌────────────────────────┐ ┌────────────────────────┐              │ │
│  │  │ Midnight Sessions      │ │ Summer EP              │              │ │
│  │  │ Campaign · Oct 01      │ │ Campaign · Aug 20      │              │ │
│  │  │ Pre-save + social     │ │ Ads + social           │              │ │
│  │  │ ████████████░░░░ 60%  │ │ ██████████████████ 90%│              │ │
│  │  │ ◐ In progress          │ │ ◐ In progress          │              │ │
│  │  └────────────────────────┘ └────────────────────────┘              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Summary ──────────────────────────────────────────────────────────  │
│  12 contributors · 28 active assignments · 3 overloaded                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Assignee Card Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  👤 Name                           Role           🟡 N releases  │
│                                                                   │
│  ┌──────────────────┐ ┌──────────────────┐                       │
│  │ Release name     │ │ Release name     │                       │
│  │ Stage · Due date │ │ Stage · Due date │                       │
│  │ Scope / notes    │ │ Scope / notes    │                       │
│  │ ████████░░ 50%   │ │ ████░░░░░░ 25%   │                       │
│  │ ◐ In progress    │ │ ○ Not started    │                       │
│  └──────────────────┘ └──────────────────┘                       │
│  ...                                                              │
└──────────────────────────────────────────────────────────────────┘
```

### Load Indicator

| Load | Icon | Meaning |
|------|------|---------|
| Normal (0–2) | 🟢 | Under capacity |
| Busy (3) | 🟡 | Full capacity |
| Overloaded (4+) | 🔴 | Over capacity — risk of delay |

---

## Filtering

```
┌──────────────────────────────────────────────────────────────┐
│  Role: ◉ All  ○ Designers  ○ Mix Engineers  ○ Producers    │
│        ○ Marketing  ○ PR  ○ Artists                         │
│                                                               │
│  Status: ◉ All assignments  ○ Active only  ○ Overdue        │
│                                                               │
│  Release: ◉ All releases  ○ Midnight Sessions ▼             │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Actions

Each assignment card has a context menu (⋯):

```
┌──────────────────────┐
│  View Release        │
│  View Contributor    │
│  Reassign            │
│  Add Note            │
└──────────────────────┘
```

Reassign opens a user picker to move the assignment to another
contributor. This changes the owner on the underlying deliverable
or task.

---

## Mobile View

```
┌──────────────────────────────┐
│  Resource Planning           │
│                               │
│  ── Designers ──             │
│                               │
│  👤 Taylor  🟡 3 releases   │
│                               │
│  ◐ Midnight Sessions         │
│     Artwork · 100% · ✓ Done  │
│                               │
│  ◐ Summer EP                 │
│     Artwork · 90% · In prog  │
│                               │
│  ○ Neon Remix                │
│     Artwork · 0% · Not start │
│                               │
│  ── Mix Engineers ──         │
│                               │
│  👤 Sam Wilson  🔴 5 rel    │
│  ⚠ Overloaded               │
│                               │
│  ◐ Midnight Sessions         │
│  ◐ Summer EP                 │
│  ◐ Lost Tracks               │
│  ○ Neon Remix                │
│  ○ Autumn EP                 │
│                               │
│  +3 more groups               │
└──────────────────────────────┘
```

---

## Data Model

```typescript
interface ResourcePlanningBoard {
  releaseAssignments: ResourceAssignment[];
  campaignAssignments: ResourceAssignment[];
  overloadedContributors: string[];  // User IDs with 4+ active assignments
}

interface ResourceAssignment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  role: string;                  // "Designer", "Mix Engineer", "Producer"
  releaseId?: string;
  releaseName?: string;
  campaignId?: string;
  campaignName?: string;
  stage?: string;                // "Artwork", "Mixing", etc.
  scope: string;                 // "Cover art + booklet", "Stems + session files"
  dueDate: Timestamp;
  progress: number;              // 0–100
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  loadIndicator: 'green' | 'amber' | 'red';  // Per contributor total
}
```
