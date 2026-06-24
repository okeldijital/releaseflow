# TASK-3201 — Dependency Workspace

## Concept

A dependency is anything that must be resolved before something else can
proceed. Dependencies exist within a release (stage order), across
releases (Release B needs Release A's Designer), and outside the system
(a mechanical license from Melodic Publishing).

The Dependency Workspace visualizes all of them. Not just what's blocked
— what's waiting on what, and in what order.

---

## Dependency Types

| Type | Example | Scope |
|------|---------|-------|
| Stage → Stage | Mixing depends on Production being complete | Within release (auto-managed) |
| Deliverable → Deliverable | Spotify Canvas depends on Cover Art being approved | Within release |
| Task → Task | Review task depends on Upload task | Within stage |
| Release → Release | Neon Remix can't ship until Lua ships (same artist) | Cross-release |
| Contributor capacity | Designer can't start EP artwork until Single artwork is done | Cross-release |
| External | Mechanical license from Melodic Publishing | External |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Dependencies · Lua – The Fading Light                                   │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │                          ┌──────────────────────┐                   │  │
│  │                          │   Mechanical License │  ← External       │  │
│  │                          │   Melodic Publishing │                   │  │
│  │                          │   🔴 Blocks Eclipse │                   │  │
│  │                          │   & Horizon          │                   │  │
│  │                          └──────────┬───────────┘                   │  │
│  │                                     │                                │  │
│  │                    ┌────────────────┼────────────────┐               │  │
│  │                    │                │                │               │  │
│  │                    ▼                ▼                │               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ Planning │─▶│Production│─▶│  Mixing  │─▶│Mastering │            │  │
│  │  │    ✓     │  │    ✓     │  │    ✓     │  │    ✓     │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │  │
│  │                                                          │          │  │
│  │                                                          ▼          │  │
│  │                                                    ┌──────────┐     │  │
│  │                                                    │ Artwork  │────▶│  │
│  │                                                    │    ✓     │     │  │
│  │                                                    └──────────┘     │  │
│  │                                                          │          │  │
│  │                                 ┌────────────────────────┘          │  │
│  │                                 ▼                                   │  │
│  │                          ┌──────────────┐                           │  │
│  │                          │ Distribution │  ← 🔴 Blocked             │  │
│  │                          │   Waiting on │                           │  │
│  │                          │   license    │                           │  │
│  │                          └──────┬───────┘                           │  │
│  │                                 │                                    │  │
│  │                                 ▼                                    │  │
│  │                          ┌──────────┐                               │  │
│  │                          │ Release  │                               │  │
│  │                          │    ○     │                               │  │
│  │                          └──────────┘                               │  │
│  │                                                                     │  │
│  │  Legend: ✓ Complete  ◐ In Progress  🔴 Blocked  ○ Pending         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ─── Dependency List ──────────────────────────────────────────────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Dependency                            │ Status  │ Blocking    │     │ │
│  │────────────────────────────────────────┼─────────┼─────────────│     │
│  │  Mechanical License · Melodic Pub     │ 🔴      │ Distribution│     │
│  │  Eclipse + Horizon clear rights       │ Blocked │ Eclipse T3  │     │
│  │                                       │ 14 days │ Horizon T4  │     │
│  │  ────────────────────────────────────┼─────────┼─────────────│     │
│  │  Cover Art approved → Canvas         │ ✓       │ —           │     │
│  │  Auto-resolved                        │         │             │     │
│  │  ────────────────────────────────────┼─────────┼─────────────│     │
│  │  Designer Taylor · Single → EP       │ ◐       │ Artwork EP  │     │
│  │  Taylor finishes Midnight Sessions    │ In Prog │             │     │
│  │  before starting Lua artwork          │         │             │     │
│  │  ────────────────────────────────────┼─────────┼─────────────│     │
│  │  Sam Wilson capacity · 5 releases    │ 🟡      │ Various     │     │
│  │  Mix engineer overloaded              │ Warning │             │     │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Add Dependency ────────────────────────────────────────────────────  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  + Add Dependency                                                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Graph

The top section shows a visual dependency graph. Nodes are stages (or
external entities). Arrows show "depends on" direction (A → B means A
depends on B — B must complete first).

### Node States

| State | Color | Meaning |
|-------|-------|---------|
| ✓ Complete | Green `#DCFCE7` | Dependency resolved, waiting item can proceed |
| ◐ In Progress | Blue `#DBEAFE` | Dependency is being worked on |
| 🔴 Blocked | Red `#FEE2E2` | Dependency is itself blocked or stuck |
| ○ Pending | Neutral `#F4F4F5` | Not yet started |

---

## Dependency List

The bottom section lists all dependencies in a sortable table.

| Column | Description |
|--------|-------------|
| Dependency | What needs to happen first |
| Status | 🔴 Blocked / 🟡 Warning / ◐ In Progress / ✓ Resolved |
| Blocking | What's waiting on this dependency |
| Duration | How long the dependency has existed |
| Owner | Who is responsible for resolution |
| Action | Nudge / Escalate / Resolve |

---

## Adding a Dependency

```
┌──────────────────────────────────────────────────┐
│  + Add Dependency                             [×] │
│                                                    │
│  Type *                                              │
│  ┌──────────────────────────────────────────────┐  │
│  │ Mechanical License                    ▼      │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Description *                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ Eclipse (Track 3) samples "Neon Nights" by   │  │
│  │ Melt 2000. Needs clearance from Melodic Pub. │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Rights holder *                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Melodic Publishing                           │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Contact                                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ legal@melodicpublishing.com                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Blocks *                                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ ☑ Distribution stage                          │  │
│  │ ☑ Track 3 — Eclipse                          │  │
│  │ ☐ Track 4 — Horizon                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Estimated resolution                                │
│  ┌───────────────────────────────┬──────────────┐  │
│  │ Sep 15, 2026                  │ 📅           │  │
│  └───────────────────────────────┴──────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Create Dependency                           │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## External Dependencies

External dependencies are the most dangerous because ReleaseFlow cannot
control them. They need special treatment:

| Feature | Behavior |
|---------|----------|
| Contact tracking | Log every contact attempt with timestamp |
| Reminder scheduling | "Remind me in [N] days" — triggers notification |
| Escalation path | After 3 contact attempts with no response → escalate to Admin |
| Status | Contacted / Awaiting Response / Negotiating / Secured / Denied |
| "Follow Up" button | One-click log: "Followed up on Aug 20. No response." |
| Auto-reminder | If status = Contacted and >7 days with no response, remind PM |

---

## Cross-Release Dependencies

When one release blocks another:

```
┌──────────────────────────────────────────────────────────────────┐
│  Mid Sess Artwork → Lua Artwork                                  │
│                                                                   │
│  Taylor (Designer) is working on Midnight Sessions cover art.    │
│  Lua – The Fading Light cannot start artwork until Midnight      │
│  Sessions artwork is approved.                                    │
│                                                                   │
│  Blocking: Lua – The Fading Light · Artwork stage                │
│  Depends on: Midnight Sessions · Cover Art v3 approval           │
│  Estimated unblock: Sep 01 (Midnight Sessions artwork deadline)  │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                          │
│  │  Nudge   │ │ Reassign │ │  View    │                          │
│  └──────────┘ └──────────┘ └──────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface DependencyWorkspace {
  releaseId: string;
  dependencies: Dependency[];
  graph: DependencyGraph;
}

interface Dependency {
  id: string;
  type: 'stage' | 'deliverable' | 'task' | 'release' | 'contributor' | 'external';
  description: string;
  status: 'blocked' | 'in_progress' | 'warning' | 'resolved';

  dependsOn: {
    entityType: string;
    entityId: string;
    entityName: string;
    releaseId?: string;        // Cross-release if different from workspace releaseId
    releaseName?: string;
  };

  blocking: {
    entityType: string;
    entityId: string;
    entityName: string;
  }[];

  owner?: { id: string; name: string };
  externalContact?: {
    name: string;              // "Melodic Publishing"
    email?: string;
    phone?: string;
    contactLog: ContactAttempt[];
  };

  estimatedResolution?: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  duration: number;            // Hours since created
  createdAt: Timestamp;
}

interface ContactAttempt {
  date: Timestamp;
  method: 'email' | 'phone' | 'in_person';
  outcome: string;             // "Left voicemail", "Awaiting response"
}

interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

interface DependencyNode {
  id: string;
  label: string;               // "Distribution", "Mechanical License", etc.
  type: 'stage' | 'external' | 'release' | 'deliverable';
  status: 'complete' | 'in_progress' | 'blocked' | 'pending';
  releaseId?: string;
}

interface DependencyEdge {
  from: string;                // Node ID — depends on
  to: string;                  // Node ID — blocked by from
  dependencyId: string;        // FK to Dependency
}
```
