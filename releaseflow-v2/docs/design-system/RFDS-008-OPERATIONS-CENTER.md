# RFDS-008 — Operations Center

**Status:** Active
**Version:** 1.0

---

## Metadata

| Field | Value |
|-------|-------|
| Pattern | Executive Briefing (A) |
| Operational Question | What requires attention across the organisation right now? |
| Primary User | Label Manager, Owner, Admin |
| Tier Flow | 1 → 2 → 3 → 4 → 6 |
| Zones | Situation → Decision → Evidence → History |
| VH Range | 100 → 40 |
| Navigation | Nav Rail (40) + ⌘K (70) |
| Route | `/dashboard` |

---

## Composition

```
SITUATION (VH-100, 640px)
    └── Hero: Date (Display 40px) + briefing (Statement 15px)
             Primary Action: + New Release (VH-90, top-right)

DECISION (VH-80, 640px)
    ├── Assessment: 2-col grid (Health, Confidence, Stage, Deadline)
    └── Immediate Actions: max 3 text items + NOW timestamp (VH-90)

EVIDENCE (VH-70)
    ├── Metrics: inline stat bar (active · blocked · shipped)
    └── Active Releases: Table (Release, Health, Stage, Deadline, Owner)

ATTENTION (VH-70, conditional)
    ├── Alerts: left-border colour cards
    ├── Blocked Work: inline rows
    └── Deadlines: inline rows with relative dates

HISTORY (VH-40, 640px)
    └── Recent Activity: muted list
```

---

## Component Inventory

| Component | Section | Category | RFDS-006 Ref |
|-----------|---------|----------|-------------|
| Hero (custom) | Situation | Informational | — |
| AssessmentItem (4×) | Decision | Informational | — |
| ActionItem (max 3) | Decision | Operational | — |
| MetricItem (3×) | Evidence | Informational | MetricCard |
| Table | Evidence | Operational | Table |
| Alert card | Attention | Feedback | Alert |
| BlockedRow | Attention | Informational | Badge + StatusBadge |
| DeadlineRow | Attention | Informational | Badge |
| ActivityRow | History | Informational | — |

---

## Rules

1. Hero (date) owns VH-100 — nothing larger or more prominent
2. Sidebar capped at VH-40 — never competes with content
3. Assessment + Actions visible without scrolling
4. First release row visible in initial viewport
5. Attention panel hidden when 0 items — collapses entirely
6. Activity is supporting evidence — VH-40, muted text
7. Max one primary action (+ Create Release)

---

## Responsive

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Assessment 2-col | 1-col | 1-col |
| Table full | Scroll | Cards |
| Metrics inline | Inline | Stacked |
| Activity muted | List | List |

---

## References

- PDS: Typography, Colour, Motion, Radius
- RFDS-001: Four questions, Quiet interfaces
- RFDS-002: Reading width 640px, Evidence 960px
- RFDS-003: Tier flow 1→2→3→4→6
- RFDS-004: VH scale, luminance ladder
- RFDS-005: Nav Rail, ⌘K, Breadcrumbs
- RFDS-006: Button, Table, Alert, EmptyState
- RFDS-007: Executive Briefing pattern
