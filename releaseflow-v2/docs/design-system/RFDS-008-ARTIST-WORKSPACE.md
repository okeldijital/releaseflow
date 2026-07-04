# RFDS-008 — Artist Workspace

**Status:** Active
**Version:** 1.0

---

## Metadata

| Field | Value |
|-------|-------|
| Pattern | Workspace (B) |
| Operational Question | What is the operational status of this artist? |
| Primary User | Label Manager, A&R |
| Tier Flow | 1 → 2 → 3 → 4 → 5 → 6 |
| Zones | Situation → Decision → Evidence → Context → History |
| VH Range | 100 → 40 |
| Navigation | Nav Rail (40) + Context Rail (60) + ⌘K (70) |
| Route | `/artists/[id]` |

---

## Composition

```
IDENTITY (VH-100)
    └── Artist Hero: Avatar (xl), name (Display 28px), type badge,
         country, genre pills, profile completeness pill (VH-85),
         stats (active · completed · credits)
         Primary Action: + Add Release (VH-90, top-right)

OPERATIONAL STATE (VH-80)
    └── OperationalSummary

WORK AREA (VH-70)
    ├── Tabs: Overview, Releases, Credits, Assets, Press Kit, Activity
    └── Active tab content

CONTEXT (VH-60, 360px right rail)
    ├── HealthRing (profile completeness)
    ├── ReadinessStack (photo, bio, genres, social, releases)
    └── ContextRail (attention items)

HISTORY (VH-40)
    └── Activity tab
```

---

## Component Inventory

| Component | Section | Category |
|-----------|---------|----------|
| Hero (custom) | Identity | Informational |
| Avatar | Identity | Contextual |
| StatusBadge | Identity | Informational |
| Badge | Identity | Informational |
| OperationalSummary | Operational State | Informational |
| Tabs | Work Area | Operational |
| HealthRing | Context | Informational |
| ReadinessStack | Context | Informational |
| ContextRail | Context | Contextual |
| ActivityFeed | History | Informational |

---

## Rules

1. Artist identity communicates creative role, not CRM record
2. Profile completeness visually prominent but not dominant
3. Active releases above completed releases
4. Context rail shows artist-specific readiness (not release readiness)
5. Press Kit auto-generates from profile data

---

## Responsive

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Avatar + name + badges | Same | Stacked |
| Context Rail (360px) | Drawer | Inline |
| Tabs horizontal | Scroll | Icons only |

---

## References

PDS, RFDS-001 through RFDS-007
