# RFDS-002 — Spatial System

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

If conflicts exist: **PDS → RFDS-001 → RFDS-002 → Feature Specification**

RFDS-002 may extend RFDS-001 but never contradict it.

---

## One Question

> **Where does everything live?**

RFDS-002 removes subjective layout decisions by defining measurable spatial rules for every page, every component, and every breakpoint.

Unlike RFDS-001, which establishes philosophy, RFDS-002 establishes geometry.

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Canvas](./RFDS-002-CANVAS.md) | The 6 zones every page divides into |
| [Grid System](./RFDS-002-GRID-SYSTEM.md) | Column counts, margins, gutters per breakpoint |
| [Reading Width](./RFDS-002-READING-WIDTH.md) | Content width per information type |
| [Alignment System](./RFDS-002-ALIGNMENT-SYSTEM.md) | Shared left edge, primary/secondary lines |
| [Whitespace System](./RFDS-002-WHITESPACE-SYSTEM.md) | Semantic spacing between elements |
| [Responsive Composition](./RFDS-002-RESPONSIVE-COMPOSITION.md) | How layouts recompose across breakpoints |
| [Spatial Tokens](./RFDS-002-SPATIAL-TOKENS.md) | Design tokens for all spatial values |
| [Page Zones](./RFDS-002-PAGE-ZONES.md) | Which components belong in which zones |
| [Summary](./RFDS-002-SUMMARY.md) | Quick reference card |

---

## The Six Zones

Every page divides into six zones. Every blueprint must map components into these zones.

| Zone | Purpose | Examples |
|------|---------|----------|
| **Situation** | Current operational state | Hero, briefing |
| **Decision** | What requires action | Assessment, actions |
| **Evidence** | Supporting data | Tables, metrics |
| **Context** | Supplemental information | Context rail |
| **History** | Chronological record | Activity feed |
| **Navigation** | Movement | Sidebar, breadcrumbs |

The five content zones (Situation → Decision → Evidence → Context → History) map to the PDS attention priority model. Navigation is peripheral.

---

## The Core Rules

1. **No page defines its own layout independently.** Every blueprint references the shared grid, canvas, and zones.
2. **Reading widths are standardized.** Editorial content is 640–720px. Evidence is 960–1200px. No arbitrary widths.
3. **Whitespace is semantic.** 16px is relationship. 24–40px is section. 64px is chapter. 96px is canvas.
4. **Alignment is shared.** Every page has a primary alignment line. Nothing begins at arbitrary positions.
5. **Responsive is recomposition, not resizing.** Layouts adapt structurally across breakpoints, not just proportionally.
6. **Spatial tokens replace arbitrary values.** All spacing values are named, documented, and referenced by tokens.

---

## Quick Reference

```
Canvas            96px padding         page boundary
Chapter           64px between          major zones
Section           40px between          related groups
Component         24px inside          one card
Relationship      16px between          related items
Inline             8px adjacent        label and value

Reading column    640px                editorial text
Evidence width   1120px                tables and data
Form column        720px                inputs and fields
Nav rail           72px / 256px         collapsed / expanded
Context rail      360px                 supporting panels
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong |
|---------------|---------------|
| "Add some spacing here" | Spacing is semantic. Use a named token. |
| "Make the column 800px" | Widths are standardized. Use a reading-width token. |
| "It should feel balanced" | Balance is measured. Use the silence budget. |
| "Let it breathe" | Whitespace is a budget. Calculate, don't feel. |
| "Make the table wider" | Evidence is 960–1200px max. The full canvas is not for tables. |
| "Center everything" | Center is for situation. Decision and evidence are left-aligned. |

---

## What RFDS-002 Does NOT Define

- Colours → PDS
- Typography sizes → PDS
- Components → Component Library
- Motion → PDS / RFDS-007
- Attention priorities → RFDS-001

RFDS-002 defines *where*. Other documents define *what* and *how*.
