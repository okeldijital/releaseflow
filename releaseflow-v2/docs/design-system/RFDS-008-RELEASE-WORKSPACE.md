# RFDS-008 — Release Workspace

**Status:** Active
**Version:** 1.0

---

## Metadata

| Field | Value |
|-------|-------|
| Pattern | Workspace (B) |
| Operational Question | What must happen before this release can ship? |
| Primary User | Label Manager, Release Manager, Contributor |
| Tier Flow | 1 → 2 → 3 → 4 → 5 → 6 |
| Zones | Situation → Decision → Evidence → Context → History |
| VH Range | 100 → 40 |
| Navigation | Nav Rail (40) + Context Rail (60) + ⌘K (70) |
| Route | `/releases/[id]` |

---

## Composition

```
IDENTITY (VH-100)
    └── Release Hero: Artwork placeholder (72×72), title (Display 28px),
         type badge, genre pill, date, health pill (VH-85), status badge,
         rights badge (VH-50, clickable), blockers badge (VH-50)
         Primary Action: Advance Stage (VH-90, top-right)
         Secondary: Edit, Delete

OPERATIONAL STATE (VH-80)
    └── ReleaseJourney: horizontal stage pipeline

WORK AREA (VH-70)
    ├── Tabs: Overview, Workflow, Assets, Distribution, Rights, Activity, Settings
    └── Active tab content

CONTEXT (VH-60, 360px right rail)
    ├── HealthRing
    ├── ReadinessStack
    ├── ContextRail (dependencies, attention items)

HISTORY (VH-40)
    └── Activity tab
```

---

## Component Inventory

| Component | Section | Category |
|-----------|---------|----------|
| Hero (custom) | Identity | Informational |
| ReleaseJourney | Operational State | Informational |
| Button (Advance Stage) | Decision | Operational |
| Tabs | Work Area | Operational |
| WorkflowBoard | Work Area | Operational |
| Table | Work Area | Operational |
| HealthRing | Context | Informational |
| ReadinessStack | Context | Informational |
| ContextRail | Context | Contextual |
| ActivityFeed | History | Informational |

---

## Tab Content Map

| Tab | Content | Components |
|-----|---------|------------|
| Overview | Readiness, Distribution, Rights, Requirements | ProgressBar, StatusBadge, Button |
| Workflow | Stage cards + tasks | WorkflowBoard, Card, Button, Input |
| Assets | Deliverables list | Table, Badge, StatusBadge |
| Distribution | Package readiness + history | ProgressBar, StatusBadge, Button |
| Rights | Ownership percentages + issues | Card, ProgressBar |
| Activity | Chronological event feed | ActivityRow |
| Settings | Release metadata | Card, Input |

---

## Rules

1. Hero communicates identity and operational state — user understands in <5 seconds
2. Context Rail always visible on desktop (≥1280px)
3. Primary action (Advance Stage) always visible
4. Tabs preserve state on navigation within the workspace
5. Activity secondary — never above the work area

---

## Responsive

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Hero + Context Rail (360px) | Hero + Rail (320px) | Hero full width |
| Tabs horizontal | Tabs scroll | Tabs icons only |
| Context rail always | Drawer | Inline below |
| Workflow multi-column | Scroll | Single-column swipe |

---

## References

PDS, RFDS-001 through RFDS-007
