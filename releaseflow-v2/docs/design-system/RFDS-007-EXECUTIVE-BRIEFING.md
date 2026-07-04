# RFDS-007 — Executive Briefing

**Status:** Active
**Version:** 1.0

---

## Pattern A — Executive Briefing

**Purpose**: Answer the operational state of the organisation in under three seconds.

**Operational Question**: *What requires my attention today?*

**Used By**: Operations Center

---

## Reading Order

```
Situation (Tier 1) — Date, briefing headline
    ↓
Assessment (Tier 2) — Health, readiness, confidence
    ↓
Decision (Tier 3) — Immediate actions, recommendations
    ↓
Evidence (Tier 4) — Metrics, active releases table
    ↓
History (Tier 6) — Recent activity
```

---

## Zone Assignment

| Section | Zone | VH | Width |
|---------|------|-----|-------|
| Hero (date + briefing) | Situation | 100 | 640px |
| Assessment grid | Decision | 80 | 640px |
| Immediate actions | Decision | 90 | 640px |
| Metrics (inline) | Evidence | 70 | 640px |
| Active releases table | Evidence | 70 | 960px |
| Attention panel | Evidence | 70 | 640px |
| Recent activity | History | 40 | 640px |

---

## Components Permitted

| Component | Section | Category |
|-----------|---------|----------|
| Hero (custom — date + briefing text) | Situation | Informational |
| AssessmentItem (2-col grid) | Assessment | Informational |
| ActionItem (text + NOW timestamp) | Decision | Operational |
| MetricItem (inline count) | Evidence | Informational |
| Table | Evidence | Operational |
| Alert card | Attention | Feedback |
| BlockedRow | Attention | Informational |
| DeadlineRow | Attention | Informational |
| ActivityRow | History | Informational |

---

## Navigation

| Mechanism | VH | Location |
|-----------|-----|----------|
| Primary Action (+ Create Release) | 90 | Top-right |
| Command Palette (⌘K) | 70 | Overlay |
| Navigation Rail | 40 | Left |
| Search | 50 | Topbar |

---

## Responsive Adaptations

### Desktop (≥1024px)
- Assessment: 2-column grid
- Actions: inline text list
- Table: full-width

### Laptop (768–1023px)
- Assessment: 2-column grid
- Actions: inline text list
- Table: full scroll

### Tablet (640–767px)
- Assessment: 1-column
- Actions: stacked
- Table: scroll with sticky first column

### Mobile (<640px)
- Assessment: 1-column
- Actions: stacked, full-width text
- Table: card list

---

## Accessibility

- `role="main"` on content area
- `aria-label` on every section
- Tab order: Skip link → Nav Rail → Primary Action → Hero → Assessment → Actions → Evidence → Activity
- Single H1 (the date)
- All interactive elements keyboard accessible
