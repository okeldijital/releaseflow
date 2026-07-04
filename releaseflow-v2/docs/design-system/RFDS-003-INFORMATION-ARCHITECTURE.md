# RFDS-003 — Information Architecture

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

RFDS-003 extends RFDS-002 but never contradicts it.

---

## Mission

RFDS-003 defines **what** information is presented, in what order, and why.

It governs the operational narrative of every ReleaseFlow screen.

| Document | Defines |
|----------|---------|
| RFDS-002 | **Where** information lives (spatial system) |
| RFDS-003 | **What** information appears, in what order, and why (information architecture) |

---

## The Operational Narrative

Every page must tell the same story, in the same order:

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

No page may alter this sequence.

This is not a layout choice. It is an operational contract. Users come to ReleaseFlow to make decisions. The narrative supports decisions in the order they must be made:

1. **First** — what is happening
2. **Then** — should I care
3. **Then** — what should I do
4. **Then** — why
5. **Then** — what else
6. **Then** — what happened before

---

## The Seven Tiers

Every piece of information belongs to one—and only one—tier. A component may not mix tiers.

| Tier | Purpose | Examples |
|------|---------|----------|
| **1 — Situation** | Current operational state | Release state, today's briefing |
| **2 — Assessment** | Operational health | Health %, readiness %, stage |
| **3 — Decision** | What to do now | Immediate actions, recommendations |
| **4 — Evidence** | Supporting data | Releases, assets, tasks, metrics |
| **5 — Context** | Related information | Context rail, tabs, side panels |
| **6 — History** | Chronological record | Activity feed, audit log |
| **7 — Metadata** | Technical values | IDs, timestamps, technical values |

### Tier Mixing Rules

| Tier A | Tier B | Allowed? | Why |
|--------|--------|----------|-----|
| 1 Situation | 2 Assessment | ✓ | Assessment explains situation |
| 2 Assessment | 3 Decision | ✓ | Decision flows from assessment |
| 3 Decision | 4 Evidence | ✓ | Evidence supports decision |
| 4 Evidence | 5 Context | ✓ | Context gives detail |
| 4 Evidence | 6 History | ✓ | History is evidence type |
| 1 Situation | 4 Evidence | ✗ | Evidence without decision is decoration |
| 1 Situation | 3 Decision | ✗ | Decision without assessment is premature |
| 4 Evidence | 1 Situation | ✗ | Evidence before conclusion |
| 6 History | 3 Decision | ✗ | History before decision is noise |
| 7 Metadata | Any | ✗ | Metadata never competes with operational info |

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Information Architecture](./RFDS-003-INFORMATION-ARCHITECTURE.md) | This document — the operational narrative and tier model |
| [Information Hierarchy](./RFDS-003-INFORMATION-HIERARCHY.md) | Detailed tier rules, page composition patterns |
| [Decision Flow](./RFDS-003-DECISION-FLOW.md) | The six operational questions every page answers |
| [Information Lifecycle](./RFDS-003-INFORMATION-LIFECYCLE.md) | Promotion, demotion, archival, expiration |
| [Progressive Disclosure](./RFDS-003-PROGRESSIVE-DISCLOSURE.md) | Immediate / Expanded / Detailed layers |
| [Reading Patterns](./RFDS-003-READING-PATTERNS.md) | Per-breakpoint reading orders |
| [Operational Narrative](./RFDS-003-OPERATIONAL-NARRATIVE.md) | Copy and language patterns |
| [Information Priority Matrix](./RFDS-003-INFORMATION-PRIORITY-MATRIX.md) | Numeric priority per information type |
| [Anti-Patterns](./RFDS-003-ANTI-PATTERNS.md) | Explicitly prohibited patterns |
| [Summary](./RFDS-003-SUMMARY.md) | Quick reference card |

---

## The Decision Flow

Every operational page answers these questions, in this order:

```
Q1: What is happening?      → Situation
Q2: Should I care?           → Assessment
Q3: What should I do?         → Decision
Q4: Why?                       → Evidence
Q5: What else should I know?   → Context
Q6: What happened previously?  → History
```

A page that cannot answer these is not a page.

A page that answers them in a different order is misaligned with how humans make decisions.

---

## Information Lifecycle

Nothing remains permanently important.

```
Blocked Release
    ↓ promoted
Critical
    ↓ promoted
Attention
    ↓ demoted (when resolved)
Resolved
    ↓ archived
History
    ↓ expired (30 days)
Gone
```

Rules:
- **Promotion**: When something becomes more urgent, it moves up
- **Demotion**: When something is resolved, it moves down
- **Archival**: When something is no longer active, it moves to history
- **Expiration**: After retention period, it disappears

See `RFDS-003-INFORMATION-LIFECYCLE.md` for full rules.

---

## Progressive Disclosure

Every page defines three layers.

| Layer | Visibility | Decision |
|-------|-----------|----------|
| **Immediate** | Visible without interaction | "Should I care?" |
| **Expanded** | Visible after user intent | "What are the details?" |
| **Detailed** | Visible only when requested | "Show me everything" |

The default state shows only what is required for the current decision. Everything else is hidden until needed.

---

## What This Document Does NOT Define

| Concern | Defined In |
|---------|-----------|
| Where things are placed | RFDS-002 |
| Visual styling | PDS |
| Color semantics | Future RFDS-004 |
| Motion choreography | Future RFDS-007 |
| Component contracts | Component Library |

RFDS-003 defines *what* and *why*. RFDS-002 defines *where*. Other documents define *how*.
