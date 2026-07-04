# Release Workspace Blueprint

**Screen:** `/releases/[id]`
**Purpose:** Answer "can this release ship?" with full operational context.

---

## Core Questions

| # | Question | Answered By |
|---|----------|-------------|
| 1 | Can this release ship? | OperationalSummary — health % + readiness |
| 2 | Why not? | Attention Panel — blockers, missing requirements |
| 3 | What is blocking it? | Context Rail — dependencies, blockers count |
| 4 | What changed? | Activity tab — chronological events |
| 5 | Who owns the next action? | Workflow tab — current stage owner |

---

## Fixed Layout

```
┌──────────────────────────────────────────────────────────┬──────────┐
│  ◀ Back to releases                                      │          │
│                                                          │          │
│  ┌────┐  Lua · The Fading Light          Advance Stage  │ Context  │
│  │ 🎵 │  EP · Afro Tech · Nov 15, 2026     Edit  Delete │ Rail     │
│  └────┘  🟡 Attention 68% · Production · Rights Ready   │          │
│                                                          │ Health   │
│  ─── Release Journey ────────────────────────────────   │ Ring     │
│  Plan ✓ → Prod ✓ → Mix ✓ → Master ◉ → Art ○ → Dist ○ → │          │
│                                                          │ Readin-  │
│  ─── Operational Summary ────────────────────────────   │ ess      │
│  Release is healthy. 4 of 7 stages complete.           │ Stack    │
│  3 of 7 readiness checks passed. 2 active blockers.    │          │
│                                                          │ Context  │
│  ─── Tabs ──────────────────────────────────────────   │ Rail     │
│  Overview │ Workflow │ Assets │ Dist │ Rights │ ...     │          │
│                                                          │          │
│  ─── Tab Content ───────────────────────────────────   │          │
│  [Active tab content fills remaining vertical space]    │          │
│                                                          │          │
└──────────────────────────────────────────────────────────┴──────────┘
```

---

## Layer Order

| Layer | Zone | Content |
|-------|------|---------|
| Decision | Hero top-right | Advance Stage (or equivalent primary action) |
| Operational | Hero | Title, type, genre, date, health pill, status, badges |
| Operational | Below hero | ReleaseJourney pipeline |
| Operational | Below journey | OperationalSummary |
| Context | Content area | Tabs + active tab content |
| Context | Context Rail (right) | HealthRing, ReadinessStack, Dependencies, Attention |
| History | Activity tab | Chronological feed |

---

## Tab Content Hierarchy

| Tab | Layer | Purpose |
|-----|-------|---------|
| Overview | Operational | Readiness breakdown, distribution status, rights overview |
| Workflow | Context | WorkflowBoard + stage cards + tasks |
| Assets | Context | Deliverables list |
| Distribution | Context | Package readiness + history |
| Rights | Context | Ownership percentages + issues |
| Activity | History | Chronological event feed |
| Settings | Context | Metadata readout |

---

## Content Rules

### What must appear in the hero
- Release artwork placeholder or image
- Release title (editorial, dominant)
- Release type + genre
- Target release date
- Health state + percentage
- Current workflow stage (clickable, with status transitions)
- Rights readiness badge
- Blocker count badge
- Primary action (contextual to current state)

### What must appear in the Context Rail
- Health Ring (visual)
- Readiness Stack (checklist)
- Dependencies (blocking items)
- Attention items (approvals, reviews, deadlines)
- Current stage badge
- Release date

### What must not appear
- Organization-level metrics
- Other releases' data
- Task CRUD forms as primary content
- Administrative settings inline
- Two primary actions competing for attention

### Empty states
- No workflow → "Generate workflow" CTA
- No assets → "Upload assets" with guidance
- No rights → "Define ownership" with guidance
- No activity → "Activity will appear as actions are taken"
