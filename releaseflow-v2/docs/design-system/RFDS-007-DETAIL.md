# RFDS-007 — Detail

**Status:** Active
**Version:** 1.0

---

## Pattern D — Detail

**Purpose**: Understand one object in depth.

**Operational Question**: *What do I need to know about this?*

**Used By**: Settings, Organization profile, Reports

---

## Reading Order

```
Identity (Tier 1) — Object name, key metadata
    ↓
Summary (Tier 2) — Aggregate state, health
    ↓
Sections (Tier 4) — Categorised detail
    ↓
History (Tier 6) — Changes over time
```

---

## Zone Assignment

| Section | Zone | VH | Width |
|---------|------|-----|-------|
| Header (name, key metadata) | Situation | 100 | 640px |
| Summary (aggregate state) | Decision | 80 | 640px |
| Detail sections | Evidence | 70 | 720px |
| History (audit log) | History | 40 | 640px |

---

## Components Permitted

| Component | Section | Category |
|-----------|---------|----------|
| Header (name + status) | Identity | Informational |
| MetricCard (summary stats) | Summary | Informational |
| Card (detail sections) | Sections | Structural |
| Badge / StatusBadge | Sections | Informational |
| ActivityFeed | History | Informational |

---

## Navigation

| Mechanism | VH | Location |
|-----------|-----|----------|
| Breadcrumbs | 30 | Topbar |
| Navigation Rail | 40 | Left |
| Back link | 40 | Top-left of content |

---

## Responsive

Desktop: Summary cards in 2-col grid. Tablet: 1-col grid. Mobile: stacked.

---

## Accessibility

- Single H1 (object name)
- Each section: `aria-label`
- History items: chronologically ordered list
