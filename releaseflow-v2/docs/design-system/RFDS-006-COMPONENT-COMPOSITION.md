# RFDS-006 — Component Composition

**Status:** Active
**Version:** 1.0

---

## Principle

Components have legal parent-child relationships. Not all combinations are valid.

Composition is governed by: category, VH, information tier, and zone.

---

## Legal Compositions

| Parent | Allowed Children | Reason |
|--------|-----------------|--------|
| Page (Structural) | Section, Container | Page holds sections |
| Section (Structural) | Any Operational, Informational, Feedback | Sections contain work |
| Container (Structural) | Any | Container constrains width |
| ContextRail (Contextual) | HealthRing, ReadinessStack, Badge, StatusBadge | Context shows supporting info |
| Table (Operational) | TableRow, TableCell, Badge, StatusBadge | Table contains data |
| Card (Structural) | Any Informational, Operational | Card groups related content |
| Modal (Overlay) | Any Operational, Input | Modal contains focused work |
| Drawer (Overlay) | Any | Drawer contains supplementary content |

---

## Forbidden Compositions

| Parent | Forbidden Children | Reason |
|--------|-------------------|--------|
| Table (Operational) | Hero (Informational) | Table is not a page layout |
| ContextRail (Contextual) | Navigation (Navigational) | Context is not navigation |
| Hero (Informational) | Table (Operational) | Hero is summary, not workspace |
| Sidebar (Navigational) | Operational components | Sidebar is navigation only |
| EmptyState (Feedback) | Any children beyond description | EmptyState is self-contained |
| Badge (Informational) | Any children | Badge is atomic |
| Input (Operational) | Button | Input is not a container |

---

## Tier-Based Composition

| Parent Tier | Child Tier Must Be | Reason |
|-------------|-------------------|--------|
| Tier 1 (Situation) | Tier 1–2 | Situation explains itself |
| Tier 2 (Assessment) | Tier 2–3 | Assessment flows to decision |
| Tier 3 (Decision) | Tier 3–4 | Decision supported by evidence |
| Tier 4 (Evidence) | Tier 4, 6 | Evidence displays data |
| Tier 5 (Context) | Tier 5, 7 | Context shows supporting info |
| Tier 6 (History) | Tier 6 | History is self-contained |

A Tier 3 component must never contain a Tier 1 component. Evidence does not contain the situation.

---

## VH-Based Composition

| Parent VH | Child Max VH | Reason |
|-----------|-------------|--------|
| 100 | 90 | Child cannot outrank parent |
| 90 | 85 | Same |
| 80 | 70 | Same |
| 70 | 60 | Same |

---

## Validation

- [ ] No forbidden parent-child combinations
- [ ] No tier inversion (child tier > parent tier)
- [ ] No VH inversion (child VH > parent VH)
- [ ] Context rail contains only contextual components
- [ ] Sidebar contains only navigational components
