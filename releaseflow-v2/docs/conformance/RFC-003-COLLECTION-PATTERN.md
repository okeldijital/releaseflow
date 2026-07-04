# RFC-003 — Collection Pattern Certification

**Date:** 2026-06-29

---

## Pattern Specification

| Field | Value |
|-------|-------|
| Pattern | Collection (RFDS-007, Pattern C) |
| Operational Question | Which entity requires my attention? |
| Tier flow | 1 → 4 |
| Zones | Situation → Evidence |
| VH range | 100 → 40 |
| Canonical page | Releases (`/releases/page.tsx`) |

---

## Composition (Canonical)

```
IDENTITY (VH-100)
    └── Page title (Display 28px), record count, + New CTA (VH-90)

EVIDENCE (VH-70)
    └── Table: entity name, type badge, status, date, action link

EMPTY (when no records)
    └── EmptyState: descriptive title, explanation, CTA
```

---

## Pages Implementing This Pattern

| Page | Conformance | Notes |
|------|-------------|-------|
| Releases | ✅ Canonical | Reference implementation |
| Artists | ✅ Good | Minor subtitle drift (DD-003) |
| Assets | ⚠️ Basic | No operational list (DD-001) |
| Rights Holders | ✅ Good | Card list instead of table (DD-002) |

---

## Pattern Rules

1. Every collection page follows Identity → List
2. Hero communicates what and how many
3. Primary CTA is always + New
4. Empty state provides clear next action
5. Lists use consistent row treatment
6. All data from hooks/services
