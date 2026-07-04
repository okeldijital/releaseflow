# RFDS-008 — Review Pages

**Status:** Active
**Version:** 1.0

---

## Metadata

| Field | Value |
|-------|-------|
| Pattern | Review (G) |
| Operational Question | Is this ready to proceed? |
| Primary User | Label Manager, Release Manager |
| Tier Flow | 1 → 4 → 2 → 3 |
| Zones | Situation → Evidence → Decision |
| VH Range | 100 → 60 |
| Navigation | Nav Rail (40), Breadcrumbs (30) |
| Pages | Distribution, Approvals |

---

## Composition

```
SUMMARY (VH-100, 640px)
    └── Entity name, type, current state

EVIDENCE (VH-70, 720px)
    ├── Readiness checklist
    ├── Distribution package details
    ├── Ownership summary

RISK (VH-80)
    └── Blockers, warnings, incomplete items

DECISION (VH-90)
    ├── Primary: Approve / Publish (VH-90)
    ├── Secondary: Reject / Defer (VH-60)
    └── Confirmation modal (VH-90, overlay)
```

---

## Component Inventory

| Component | Section | Category |
|-----------|---------|----------|
| Hero (entity summary) | Summary | Informational |
| ReadinessStack | Evidence | Informational |
| DistributionBoard | Evidence | Informational |
| HealthRing | Evidence | Informational |
| Alert (blocker) | Risk | Feedback |
| Button (Approve) | Decision | Operational |
| Button (Reject) | Decision | Operational |
| ConfirmationDialog | Decision | Feedback |

---

## Rules

1. Risks precede confirmation — user must see blockers before approving
2. Evidence precedes action — user verifies readiness first
3. Final decision visually dominant (VH-90)
4. Destructive action requires confirmation
5. Success navigates to entity workspace

---

## Responsive

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Evidence side-by-side | Stacked | Stacked |
| Decision inline | Inline | Stacked full-width |
| Confirmation centered | Centered | Full-screen sheet |

---

## References

PDS, RFDS-001 through RFDS-007
