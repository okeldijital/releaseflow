# RFDS-007 — Collection

**Status:** Active
**Version:** 1.0

---

## Pattern C — Collection

**Purpose**: Find and manage operational records efficiently.

**Operational Question**: *Which entity requires my attention?*

**Used By**: Releases, Artists, Assets, Rights Holders

---

## Reading Order

```
Identity (Tier 1) — Page title, count, CTA
    ↓
Filters (Tier 5) — Search, filter controls (optional)
    ↓
Operational List (Tier 4) — Table or card list
    ↓
Selection (Tier 4) — Click to navigate
    ↓
Details — (navigates to Workspace or Detail pattern)
```

---

## Zone Assignment

| Section | Zone | VH | Width |
|---------|------|-----|-------|
| Page header (title, count, + New CTA) | Situation | 100 | 640px |
| Filter bar (optional) | Context | 50 | Full width |
| Entity list (table or cards) | Evidence | 70 | 960px |
| Pagination | Evidence | 40 | Full width |

---

## Components Permitted

| Component | Section | Category |
|-----------|---------|----------|
| Page header (title + subtitle) | Identity | Informational |
| Button (+ New, primary) | Decision | Operational |
| Search (filter) | Filters | Navigational |
| Table | List | Operational |
| Card (if card list view) | List | Structural |
| StatusBadge | List | Informational |
| Pagination | List | Navigational |
| EmptyState (no records) | List | Feedback |

---

## Navigation

| Mechanism | VH | Location |
|-----------|-----|----------|
| Primary Action (+ New) | 90 | Top-right |
| Navigation Rail | 40 | Left |
| Breadcrumbs | 30 | Topbar |

---

## Responsive

| Breakpoint | List |
|-----------|------|
| Desktop | Full table |
| Tablet | Table with scroll |
| Mobile | Card list (one card per row) |

---

## Accessibility

- Single H1 (page title)
- Table: `role="table"`, `aria-label` per column
- Each row: clickable, keyboard accessible
- Empty state: describes why empty and what to do
