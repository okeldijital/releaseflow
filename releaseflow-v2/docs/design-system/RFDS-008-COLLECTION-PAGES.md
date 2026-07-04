# RFDS-008 — Collection Pages

**Status:** Active
**Version:** 1.0

---

## Metadata

| Field | Value |
|-------|-------|
| Pattern | Collection (C) |
| Operational Question | Which entity requires my attention? |
| Primary User | All roles |
| Tier Flow | 1 → 4 |
| Zones | Situation → Evidence |
| VH Range | 100 → 40 |
| Navigation | Nav Rail (40) |
| Pages | Releases, Artists, Assets, Rights Holders |

---

## Composition

```
IDENTITY (VH-100)
    └── Page header: title (Display 28px), count, + New CTA (VH-90)

FILTERS (VH-50, optional)
    └── Search bar, type filter, status filter

EVIDENCE (VH-70)
    └── Entity list: table (desktop), card list (mobile)
         Each row: name, type badge, status, date, action link

PAGINATION (VH-40)
    └── Page controls (if >20 items)
```

---

## Component Inventory

| Component | Section | Category |
|-----------|---------|----------|
| Page header | Identity | Informational |
| Button (+ New) | Decision | Operational |
| Search | Filters | Navigational |
| Table | List | Operational |
| StatusBadge | List | Informational |
| Badge | List | Informational |
| EmptyState | List | Feedback |
| Pagination | List | Navigational |

---

## Per-Page Configuration

### Releases
- Columns: Release name, Type, Status, Date, Action
- Empty: "No releases yet" + Create Release CTA

### Artists
- Columns: Artist name, Type, Genres, Status
- Avatar column
- Empty: "No artists yet" + New Artist CTA

### Assets
- Org-aware (requires active org)
- Type filter (Artwork, Audio, Video, Document)
- Empty: "No assets" + Upload CTA

### Rights Holders
- Columns: Name, Type, Territory, Contact
- Empty: "No rights holders" + Add Holder CTA

---

## Rules

1. Filters never dominate the page
2. Lists remain evidence (VH-70)
3. Empty states provide clear next action
4. Each row clickable — navigates to Workspace or Detail
5. Inline status badges on every row

---

## Responsive

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Full table | Table scroll | Card list |
| Filters inline | Filters inline | Filters stacked |

---

## References

PDS, RFDS-001 through RFDS-007
