# RFDS-001 — Governance

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Mandatory Governance Declaration

Every document created after RFDS-001 SHALL begin with:

> ## Governance
>
> This specification SHALL be implemented in accordance with:
>
> - Product Design Standards (PDS)
> - ReleaseFlow Design System (RFDS)
> - ReleaseFlow Accessibility Standards
> - ReleaseFlow Component Library
>
> If conflicts exist:
> **PDS → RFDS → Feature Specification**
>
> Individual feature specifications may extend these standards but may never contradict them.

---

## Authority Hierarchy

```
Product Design Standards (PDS)
            ↓
ReleaseFlow Design System (RFDS)
            ↓
Feature Specification
            ↓
Implementation
```

PDS is the highest authority. No RFDS document, feature spec, or implementation may contradict it.

RFDS is the constitutional layer. It defines *how* PDS principles are applied.

A feature specification (e.g., a blueprint for a single page) extends RFDS. It may add detail. It may not contradict.

---

## Document Index

| Document | Purpose |
|----------|---------|
| `RFDS-001-DESIGN-PHILOSOPHY.md` | Core statement: what ReleaseFlow is |
| `RFDS-001-GOVERNANCE.md` | This document — authority, precedence, amendment process |
| `RFDS-001-DESIGN-PRINCIPLES.md` | 7 permanent principles |
| `RFDS-001-ATTENTION-MODEL.md` | Explicit priority budget for visual weight |
| `RFDS-001-DESIGN-TENETS.md` | 7 evaluation questions for every design decision |
| `RFDS-001-IMPLEMENTATION-RULES.md` | Rules specifications must follow |
| `RFDS-001-COMPLIANCE-CHECKLIST.md` | Acceptance criteria for every UI task |
| `RFDS-001-SUMMARY.md` | Quick reference card |

---

## Amendment Process

RFDS is versioned. The current version is 1.0.

| Change Type | Required Approval |
|-------------|------------------|
| Typo, grammar | Direct edit, version bump (1.0.0 → 1.0.1) |
| New principle | Product Owner + Engineering Lead |
| New implementation rule | Product Owner + Engineering Lead |
| Conflict with PDS | Not permitted — PDS must be amended first |
| New attention priority | Product Owner |
| Removing a principle | Product Owner + Engineering Lead (unanimous) |

All amendments are recorded in the changelog at the end of this document.

---

## Amendment Log

| Date | Version | Change | Approved By |
|------|---------|--------|-------------|
| 2026-06-28 | 1.0 | Initial publication | — |
