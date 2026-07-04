# RFDS-003 — Summary

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

This specification SHALL be implemented in accordance with:

- Product Design Standards (PDS)
- ReleaseFlow Design System (RFDS)
- ReleaseFlow Accessibility Standards
- ReleaseFlow Component Library

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → Feature Specification**

---

## One Question

> **What should the user see, in what order, and why?**

RFDS-003 defines the information architecture. RFDS-002 defines where it lives. RFDS-001 defines how it should feel.

---

## The Operational Narrative

```
Situation
    ↓
Assessment
    ↓
Decision
    ↓
Evidence
    ↓
Context
    ↓
History
```

Every page must follow this order. No exceptions.

---

## The Seven Tiers

| Tier | Purpose | Priority | Reading Width |
|------|---------|----------|----------------|
| 1 | Situation | 100 | 640px |
| 2 | Assessment | 80–95 | 640px |
| 3 | Decision | 90 | 640px |
| 4 | Evidence | 60–80 | 960–1120px |
| 5 | Context | 20 | 360px (rail) |
| 6 | History | 10–50 | 640px |
| 7 | Metadata | 5–10 | Inline |

---

## The Decision Flow

| # | Question | Tier |
|---|----------|------|
| 1 | What is happening? | 1 |
| 2 | Should I care? | 2 |
| 3 | What should I do? | 3 |
| 4 | Why? | 4 |
| 5 | What else? | 5 |
| 6 | What happened? | 6 |

---

## Lifecycle

```
Created
    ↓ promoted (urgency increases)
Active
    ↓ demoted (urgency decreases)
Resolved
    ↓ archived
History
    ↓ expired (30 days typical)
Gone
```

---

## Progressive Disclosure

| Layer | Visibility |
|-------|-----------|
| Immediate | Always visible |
| Expanded | Visible after user intent |
| Detailed | Visible only on request |

Tier 1–3 are always visible. Tier 4 expands on scroll. Tier 5 is in a rail. Tier 6 is collapsed. Tier 7 is inline only.

---

## Reading Order

The same order on every device:

```
Desktop  →  Sidebar | Situation | Assessment | Decision | Evidence | Context Rail | History
Laptop   →  Sidebar | Situation | Assessment | Decision | Evidence | History
Tablet   →  Drawer  | Situation | Assessment | Decision | Evidence (scroll) | History
Mobile   →  Drawer  | Situation | Assessment | Decision | Evidence (cards) | History tab
```

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Information Architecture](./RFDS-003-INFORMATION-ARCHITECTURE.md) | The tier model, the narrative, the decision flow |
| [Information Hierarchy](./RFDS-003-INFORMATION-HIERARCHY.md) | Tier mixing rules, zone composition |
| [Decision Flow](./RFDS-003-DECISION-FLOW.md) | The six operational questions |
| [Information Lifecycle](./RFDS-003-INFORMATION-LIFECYCLE.md) | Promotion, demotion, archival, expiration |
| [Progressive Disclosure](./RFDS-003-PROGRESSIVE-DISCLOSURE.md) | The three layers |
| [Reading Patterns](./RFDS-003-READING-PATTERNS.md) | Per-breakpoint reading orders |
| [Operational Narrative](./RFDS-003-OPERATIONAL-NARRATIVE.md) | Language and voice |
| [Information Priority Matrix](./RFDS-003-INFORMATION-PRIORITY-MATRIX.md) | Numeric priority per information type |
| [Anti-Patterns](./RFDS-003-ANTI-PATTERNS.md) | Prohibited patterns with alternatives |

---

## One Page to Rule Them All

```
┌─────────────────────────────────────────────────────────────┐
│  ReleaseFlow Information Architecture v1.0                  │
├─────────────────────────────────────────────────────────────┤
│  6 TIERS:    1 Situation → 2 Assessment → 3 Decision       │
│              → 4 Evidence → 5 Context → 6 History            │
│  6 QS:       What? → Care? → Do? → Why? → Else? → Was?    │
│  LIFECYCLE:  Created → Promoted → Demoted → Archived →     │
│              Expired                                             │
│  DISCLOSURE: Immediate / Expanded / Detailed                  │
│  READING:    Same order on every device                      │
│  TIERING:    No two adjacent sections share a tier            │
│  ANTI:       Dashboard-first, metric-first, equal weight,    │
│              duplicate info, evidence before conclusion,      │
│              database language, multiple CTAs                  │
└─────────────────────────────────────────────────────────────┘
```

---

## What RFDS-003 Removes

| Anti-Pattern | Now Forbidden |
|--------------|---------------|
| Dashboard-first | "Situation first" |
| Metric-first | "Conclusion first" |
| Equal weight | "Tier hierarchy" |
| Duplicate info | "Single source" |
| Repeated status | "One indicator" |
| Evidence before conclusion | "Decision before evidence" |
| Database language | "Translated narrative" |
| Multiple CTAs | "One primary action" |
| Multiple dominant items | "One focal point" |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-004 | Color semantics (status, context) |
| RFDS-005 | Interaction patterns (forms, modals, drawers) |
| RFDS-006 | Data visualisation patterns |
| RFDS-007 | Motion choreography |
| RFDS-008 | Page blueprint template (consumes RFDS-002 + RFDS-003) |

Each extends RFDS-003. None contradict it.
