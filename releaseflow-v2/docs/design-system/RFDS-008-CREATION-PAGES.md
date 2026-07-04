# RFDS-008 — Creation Pages

**Status:** Active
**Version:** 1.0

---

## Metadata

| Field | Value |
|-------|-------|
| Pattern | Creation (E) |
| Operational Question | What do I need to provide to create this? |
| Primary User | Label Manager, Release Manager |
| Tier Flow | 1 → 4 → 3 |
| Zones | Situation → Evidence → Decision |
| VH Range | 100 → 60 |
| Navigation | Nav Rail (40), Breadcrumbs (30) |
| Pages | New Release, New Artist, New Asset |

---

## Composition

```
CONTEXT (VH-100, 640px)
    └── Page title (Display 28px), guidance text

INPUT (VH-70, 720px)
    └── Form fields: required and optional, grouped logically

VALIDATION (VH-80, inline)
    └── Field-level errors, summary errors

DECISION (VH-90)
    ├── Primary: Create (VH-90)
    └── Secondary: Cancel (VH-50)
```

---

## Component Inventory

| Component | Section | Category |
|-----------|---------|----------|
| Page header | Context | Informational |
| Input | Form | Operational |
| Select | Form | Operational |
| TextArea | Form | Operational |
| InlineMessage | Validation | Feedback |
| Button (Create) | Action | Operational |
| Button (Cancel) | Action | Operational |

---

## Per-Page Forms

### New Release
Title (required), Type (select), Status (select), Date (optional), UPC, Catalog, Label, Genre

### New Artist
Name (required), Type (select), Country, Bio, Genres, Image URL, Social Links

### New Asset
Currently: file upload UI placeholder. File, Type, Release association.

---

## Rules

1. One primary action (Create)
2. Progressive validation — errors appear on blur
3. Inline guidance text below complex fields
4. Cancel returns to collection page
5. Success navigates to the new entity's workspace

---

## Responsive

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Form 720px max | Full width | Full width |
| Fields 2-col possible | 2-col | Stacked |
| Actions inline | Inline | Full-width buttons |

---

## References

PDS, RFDS-001 through RFDS-007
