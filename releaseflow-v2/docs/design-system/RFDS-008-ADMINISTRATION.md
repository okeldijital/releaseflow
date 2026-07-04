# RFDS-008 — Administration + Detail Pages

**Status:** Active
**Version:** 1.0

---

## Metadata

| Field | Value |
|-------|-------|
| Patterns | Administration (F) + Detail (D) |
| Operational Question | How is this system configured? / What do I need to know? |
| Pages | Administration, Organization, Settings |

---

## Administration Page

```
CONTEXT (VH-100)
    └── Title + description

CONFIGURATION (VH-70)
    └── Navigation tiles: Organization, Members, Audit, Diagnostics

Each tile navigates to a sub-page.
```

### Component Inventory

| Component | Section | Category |
|-----------|---------|----------|
| Page header | Context | Informational |
| Card (tile) | Configuration | Structural |

---

## Settings / Detail Page

```
IDENTITY (VH-100)
    └── Object name + key metadata

SUMMARY (VH-80)
    └── Aggregate state, health

SECTIONS (VH-70, 720px)
    └── Categorised detail cards

HISTORY (VH-40)
    └── Audit log / activity
```

### Component Inventory

| Component | Section | Category |
|-----------|---------|----------|
| Page header | Identity | Informational |
| MetricCard | Summary | Informational |
| Card | Sections | Structural |
| Badge / StatusBadge | Sections | Informational |
| Input / Select (read-only) | Sections | Operational |
| ActivityFeed | History | Informational |

---

## Rules

1. Dangerous actions isolated and confirmed
2. Audit trail always available
3. Read-only metadata in settings
4. Destructive edits require ConfirmationDialog

---

## Responsive

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Settings 2-col | 1-col | Stacked |
| Admin tiles 2-col | 2-col | 1-col |

---

## References

PDS, RFDS-001 through RFDS-007
