# RFC-005 — Review Pattern

**Date:** 2026-06-29

---

## Pattern Specification

| Field | Value |
|-------|-------|
| Pattern | Review (RFDS-007, Pattern G) |
| Operational Question | Is this ready to proceed? |
| Tier flow | 1 → 4 → 2 → 3 |
| Zones | Situation → Evidence → Decision |
| Canonical page | Distribution tab (embedded in Release Workspace) |

---

## Composition (Canonical)

```
SUMMARY (Tier 1) — Entity name, status, completeness %
    ↓
EVIDENCE (Tier 4) — 4 readiness dimensions, color-coded
    ↓
DECISION (Tier 3) — Generate Package / Approve button
```

---

## Pages Implementing This Pattern

| Page | Conformance | Notes |
|------|-------------|-------|
| Distribution tab | ✅ Canonical | Strong implementation |
| Approvals | ⚠️ Basic | List-style, needs Review restructure |
