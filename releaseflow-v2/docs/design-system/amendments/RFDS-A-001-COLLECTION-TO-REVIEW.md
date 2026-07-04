# RFDS-A-001 — Collection → Review Transition

**Status:** Approved
**Version:** 1.0
**Date:** 2026-06-29

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → RFDS-005 → RFDS-006 → RFDS-007 → RFDS-008 → RFDS-A-001**

---

## Purpose

This amendment clarifies the architectural relationship between Collection and Review experiences.

## Amendment

**RFDS-007 § Collection (Pattern C)** is amended with the following rule:

> Queue-based pages (Approvals, Rights Requests, Distribution Requests, Publishing Queue, Financial Approvals) SHALL implement the Collection experience pattern for queue management (search, filter, sort, prioritise).

> Selecting an entity from the Collection SHALL transition into the Review experience pattern for decision-making.

> No page SHALL implement both patterns simultaneously.

## Examples

| Queue Page | Collection → Select → Review |
|------------|------------------------------|
| Approvals | Browse requests → Select → Review & Approve/Reject |
| Rights Requests | Browse requests → Select → Review & Grant/Deny |
| Distribution Queue | Browse packages → Select → Review & Publish |
| Publishing Queue | Browse releases → Select → Review & Schedule |

## Rule

```
Collection (queue management)
      │
      ▼
Review (evidence-based decision)
      │
      ▼
Decision (approve / reject / defer)
```

This transition is now a governed RFDS pattern.

---

## Impact

- RFDS-007: Collection pattern definition extended with queue rule
- RFDS-008: Review blueprints extended with Collection→Review transition
- RFC-005: Approvals page remains Collection, not forced into Review
- RFC-005.1: Review pattern achieves Platinum without Approvals restructuring

---

## Validation

- [x] Collection pages may manage queues
- [x] Selecting from Collection transitions to Review
- [x] No page implements both patterns simultaneously
- [x] This amendment does not modify existing pattern definitions
