# RFDS-002 — Summary

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

Authority: **PDS → RFDS-001 → RFDS-002 → Feature Specification**

---

## One Question

> **Where does everything live?**

RFDS-002 defines measurable spatial rules. No subjective layout decisions.

---

## The Six Zones

```
┌────────────────────────────────────────────────┐
│ Nav Rail (left, 72–256px)                       │
├────┬───────────────────────────────────────────┤
│    │                                           │
│ N  │  SITUATION  (Hero)                        │
│ a  │                                           │
│ v  │  DECISION  (Assessment, Actions)         │
│    │                                           │
│ R  │  EVIDENCE  (Metrics, Tables)              │
│ a  │                                           │
│ i  │  CONTEXT  (Context Rail)                  │
│ l  │                                           │
│    │  HISTORY  (Activity, Audit)               │
│    │                                           │
└────┴───────────────────────────────────────────┘
```

Every page maps components into these zones.

---

## The Grid

| Breakpoint | Columns | Margin | Gutter |
|-----------|---------|--------|--------|
| Desktop ≥1024px | 12 | 80px | 24px |
| Laptop 768–1023px | 12 | 40px | 20px |
| Tablet 640–767px | 8 | 40px | 20px |
| Mobile <640px | 4 | 20px | 16px |

---

## Reading Widths

| Content | Width |
|---------|------:|
| Situation / Editorial / Assessment / Actions / Metrics / Activity | 640px |
| Forms | 720px |
| Tables / Data | 960–1120px |
| Canvas (desktop) | 1280px |
| Nav rail collapsed | 72px |
| Nav rail expanded | 256px |
| Context rail | 360px |

---

## Spacing Scale

| Token | Value | Use |
|-------|------:|-----|
| `space.4` | 4px | Fine alignment |
| `space.8` | 8px | Inline related |
| `space.12` | 12px | Badge padding |
| `space.16` | 16px | Relationship |
| `space.24` | 24px | Component |
| `space.32` | 40px | Section |
| `space.40` | 40px | Section emphasis |
| `space.64` | 64px | Chapter |
| `space.96` | 96px | Canvas |

---

## Whitespace Rules

- **16px** = relationship (label ↔ value, related items)
- **24–40px** = section (different thoughts)
- **64px** = chapter (different operational zones)
- **96px** = canvas (page boundary)
- **35–45% negative space** on desktop is the silence budget

---

## Recomposition, Not Resize

At each breakpoint, layouts change **structurally**, not proportionally.

| Desktop | Laptop | Tablet | Mobile |
|---------|--------|--------|--------|
| 2-col | 1-col | 1-col | 1-col |
| Tables full | Tables full | Tables scroll | Tables cards |
| Nav rail persistent | Nav rail collapsed | Nav drawer | Nav drawer |
| Context rail visible | Context rail visible | Context drawer | Context tab |

---

## Alignment

- One primary line (left edge) for all content
- One secondary line (right edge) for content
- 4px baseline grid for all vertical spacing
- All heights are multiples of 4
- No element begins at an arbitrary position

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Spatial System](./RFDS-002-SPATIAL-SYSTEM.md) | The full system overview |
| [Canvas](./RFDS-002-CANVAS.md) | The 6 zones every page divides into |
| [Grid System](./RFDS-002-GRID-SYSTEM.md) | Columns, margins, gutters per breakpoint |
| [Reading Width](./RFDS-002-READING-WIDTH.md) | Width per information type |
| [Alignment System](./RFDS-002-ALIGNMENT-SYSTEM.md) | Shared edges and baseline grid |
| [Whitespace System](./RFDS-002-WHITESPACE-SYSTEM.md) | Semantic spacing |
| [Responsive Composition](./RFDS-002-RESPONSIVE-COMPOSITION.md) | Recomposition rules |
| [Spatial Tokens](./RFDS-002-SPATIAL-TOKENS.md) | All design tokens for spacing |
| [Page Zones](./RFDS-002-PAGE-ZONES.md) | Component-to-zone mapping |

---

## One Page to Rule Them All

```
┌─────────────────────────────────────────────────────────────┐
│  ReleaseFlow Spatial System v1.0 — Quick Reference         │
├─────────────────────────────────────────────────────────────┤
│  6 ZONES:  Situation → Decision → Evidence → Context →     │
│             History (Navigation separate)                  │
│  3 WIDTHS: 640 (reading) · 720 (forms) · 960-1120 (data)  │
│  9 GAPS:    4 · 8 · 12 · 16 · 24 · 32 · 40 · 64 · 96      │
│  4 BREAKS:  ≥1024 · 768-1023 · 640-767 · <640             │
│  SILENCE:  35-45% negative space on desktop                  │
│  RULES:    Single H1 · Shared edges · 4px baseline ·       │
│             Recomposition, not resize · Tokens, not values   │
└─────────────────────────────────────────────────────────────┘
```

---

## What RFDS-002 Removes

| Anti-Pattern | Now Forbidden |
|--------------|---------------|
| "Add some spacing" | "Use `space.24`" or `space.40`" |
| "Make the column wider" | "Reading width is 640px, evidence is 960–1120px" |
| "It should feel balanced" | "Silence budget is 35–45% on desktop" |
| "It looks tight" | "Check the 8-point grid alignment" |
| "Resize the layout for mobile" | "Recompose the structure" |
| "Add some margin" | "Use a named token" |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-003 | Visual hierarchy (per-section typography) |
| RFDS-004 | Colour semantics (status, context) |
| RFDS-005 | Interaction patterns (forms, modals) |
| RFDS-006 | Data visualisation |
| RFDS-007 | Motion choreography |
| RFDS-008 | Responsive composition details |

Each extends RFDS-002 with implementation depth. None contradict it.
