# RFC-004 — Creation Pattern

**Date:** 2026-06-29

---

## Pattern Specification

| Field | Value |
|-------|-------|
| Pattern | Creation (RFDS-007, Pattern E) |
| Operational Question | What do I need to provide to create this? |
| Tier flow | 1 → 4 → 3 |
| Zones | Situation → Evidence → Decision |
| VH range | 100 → 60 |
| Canonical page | New Release (`/releases/new/page.tsx`) |

---

## Composition (Canonical)

```
CONTEXT (VH-100, 640px)
    └── Page title, back navigation

INPUT (VH-70, 720px)
    └── Form fields: required and optional, grouped logically

VALIDATION (VH-80, inline)
    └── Service-layer validation on submit

DECISION (VH-90)
    ├── Primary: Create (VH-90)
    └── Secondary: Cancel (VH-50)
```

---

## Pages Implementing This Pattern

| Page | Lines | Service |
|------|------:|---------|
| New Release | 93 | `createReleaseWithFullWorkflow()` |
| New Artist | 94 | `createNewArtist()` |
| New Rights Holder | 59 | `addRightsHolder()` |

---

## Pattern Rules

1. Context establishes what is being created
2. Input collects required information
3. Validation prevents errors before submission
4. Confirmation completes the action
5. Success navigates to the new entity
6. Cancel returns to collection
