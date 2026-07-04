# RFDS-001 — Summary

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## What This Is

RFDS-001 is the constitutional layer of ReleaseFlow. It defines how the product communicates, how it organizes information, and how it presents operational state.

It does not specify colours, sizes, or components. Those come from the PDS.

It does not specify pages. Those come from blueprints.

It is the rules that every page, component, and interaction must follow.

---

## One-Sentence Statement

**ReleaseFlow is an Operations Center, not a dashboard.**

---

## The Four Questions

Every screen must answer, in order:

1. What is happening?
2. Why does it matter?
3. What should I do next?
4. What evidence supports that recommendation?

If a screen cannot answer these, it has failed.

---

## The 7 Principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | Operational Clarity | State before detail |
| 2 | Decisions Before Data | System interprets, user decides |
| 3 | Editorial Composition | Hierarchy from typography, not chrome |
| 4 | Quiet Interfaces | Whitespace is communication |
| 5 | Information Hierarchy | No equal-weight competing elements |
| 6 | Progressive Disclosure | Only the current decision is visible |
| 7 | Functional Beauty | Beauty serves comprehension |

---

## The 7 Tenets (Evaluation Questions)

For every design decision, ask:

1. Does this reduce cognitive effort?
2. Does this improve operational clarity?
3. Does this reduce visual competition?
4. Does this strengthen hierarchy?
5. Does this improve scan speed?
6. Does it respect the PDS?
7. Would removing it make the interface worse?

If the last answer is "no," it should not exist.

---

## The Attention Budget

| Priority | Purpose |
|----------|---------|
| 100 | Situation (hero) |
| 90 | Immediate decision |
| 80 | Operational state |
| 70 | Supporting evidence |
| 50 | Context |
| 20 | Navigation |
| 10 | History |
| 5 | Metadata |

No two adjacent sections share the same priority.

---

## Governance

```
PDS (highest)
  ↓
RFDS
  ↓
Feature Specification
  ↓
Implementation
```

Every spec begins with:

> This specification SHALL be implemented in accordance with:
> Product Design Standards (PDS)
> ReleaseFlow Design System (RFDS)
> ReleaseFlow Accessibility Standards
> ReleaseFlow Component Library

---

## Implementation Rules (Quick)

- No subjective language ("clean", "modern", "nice", "beautiful", "user-friendly")
- All requirements observable, measurable, testable
- All spacing from the 8-point grid
- All colors from PDS tokens
- All motion from PDS timing tokens
- Single H1 per page
- Max 3 immediate actions
- 65-80 character line length for reading text

---

## Compliance Checklist (10 Categories)

Every UI task must verify:

1. PDS compliance
2. RFDS compliance
3. Accessibility compliance (WCAG AA)
4. Responsive compliance (4 breakpoints)
5. Typography compliance (single H1, hierarchy)
6. Attention hierarchy compliance (priority budget)
7. Dark mode compliance
8. Light mode compliance
9. Motion compliance (timing + easing)
10. Interaction compliance (8 states)

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Design Philosophy](./RFDS-001-DESIGN-PHILOSOPHY.md) | Core statement, four questions, anti-principles |
| [Governance](./RFDS-001-GOVERNANCE.md) | Authority hierarchy, amendment process |
| [Design Principles](./RFDS-001-DESIGN-PRINCIPLES.md) | 7 permanent principles |
| [Attention Model](./RFDS-001-ATTENTION-MODEL.md) | Priority budget, visual treatment mapping |
| [Design Tenets](./RFDS-001-DESIGN-TENETS.md) | 7 evaluation questions |
| [Implementation Rules](./RFDS-001-IMPLEMENTATION-RULES.md) | Language rules, spec format, acceptance criteria |
| [Compliance Checklist](./RFDS-001-COMPLIANCE-CHECKLIST.md) | 10-category acceptance criteria |

---

## One Page to Rule Them All

```
┌─────────────────────────────────────────────────────────────┐
│  ReleaseFlow Design System v1.0 — Quick Reference Card       │
├─────────────────────────────────────────────────────────────┤
│  CORE:  Operations Center, not a dashboard                  │
│  VOICE: Conclusions, not data dumps                        │
│  HIER:  100 Situation → 90 Action → 80 State →             │
│         70 Evidence → 20 Nav → 10 History → 5 Meta       │
│  LANG:  No subjective words. Observable. Measurable.       │
│  COMPL: 10 checklist categories. All must pass.           │
└─────────────────────────────────────────────────────────────┘
```

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-002 | Layout primitives (grid, container, stack, section) |
| RFDS-003 | Color semantics (success, warning, danger, info) |
| RFDS-004 | Typography in context (per-page hierarchy) |
| RFDS-005 | Interaction patterns (forms, modals, drawers, toasts) |
| RFDS-006 | Data visualisation (tables, charts, timelines) |
| RFDS-007 | Motion choreography (page transitions, gestures) |
| RFDS-008 | Responsive design (breakpoint matrix) |

Each RFDS-NN extends RFDS-001 with implementation-level detail. None may contradict it.
