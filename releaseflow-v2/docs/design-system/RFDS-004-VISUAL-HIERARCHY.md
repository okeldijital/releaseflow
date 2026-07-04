# RFDS-004 — Visual Hierarchy

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → Feature Specification**

---

## Mission

RFDS-004 defines **how importance is expressed visually**.

It answers: *How should the interface communicate operational priority without relying on decoration?*

| RFDS | Question |
|------|----------|
| RFDS-001 | Why? (philosophy, governance) |
| RFDS-002 | Where? (spatial system) |
| RFDS-003 | What? (information architecture) |
| RFDS-004 | **How?** (visual hierarchy) |

---

## The Four Mechanisms of Emphasis

Only four mechanisms may create emphasis in ReleaseFlow:

1. **Typography** — size, weight, tracking, leading
2. **Position** — vertical order, proximity, alignment
3. **Luminance** — light/dark value relationship
4. **Accent colour** — reserved for operational state

Explicitly prohibited:
- Unnecessary borders
- Unnecessary shadows
- Glowing effects
- Oversized icons
- Multiple competing accents
- Decorative colour

---

## Visual Weight System

Every component receives a permanent weight. Never subjective.

| Weight | Role | Examples | Visual Treatment |
|--------|------|----------|------------------|
| **VH-100** | Situation | Hero briefing, page identity | 40px medium, text-900, top of page |
| **VH-90** | Decision | Immediate action, primary CTA | 15px medium, dominant position |
| **VH-80** | Assessment | Health, readiness, stage | 24px value, 10px label, 2-col grid |
| **VH-70** | Evidence | Tables, metrics, data | 14px normal, text-700 |
| **VH-60** | Context | Context rail content | 13px normal, text-500 |
| **VH-50** | Supporting | Tabs, section headers | 10–12px medium uppercase |
| **VH-40** | Navigation | Sidebar, breadcrumbs | 13px normal, text-400 |
| **VH-20** | Metadata | IDs, timestamps, technical | 10px normal, text-400 |
| **VH-10** | Decoration | Dividers, structural lines | 1px, surface-200, 50% opacity |

No component may exceed its assigned weight. A sidebar item (VH-40) must never visually compete with a hero heading (VH-100).

---

## Visual Budget

Every page must declare and respect a visual budget:

| Resource | Budget | Enforcement |
|----------|--------|-------------|
| Accent colours | ≤5% of screen | Count % of surface area using primary/warning/danger/success |
| High contrast elements | ≤10% of screen | VH-100 and VH-90 elements only |
| Icons | One per primary concept | Max one icon per action, heading, or status indicator |
| Borders | Structural only | No decorative borders. Dividers only between zones. |
| Shadows | Overlay only | Cards may carry shadow. Body content never does. |
| Filled pills | Operational state only | Health, status, priority. Never decoration. |

---

## Luminance Ladder (Light Mode)

Visual hierarchy is created by luminance difference, not colour.

| Layer | Luminance | Purpose |
|-------|-----------|---------|
| Canvas | 100 | Page background |
| Surface | 98 | Cards, panels |
| Divider | 90 | Structural separation |
| Metadata | 55 | Secondary text, labels |
| Body | 25 | Primary text |
| Heading | 10 | Titles, heavy text |
| Accent | Burned orange | Primary action, current state |

The heading-to-body luminance ratio is 2.5:1 (25/10). The body-to-metadata ratio is 2.2:1 (55/25). This creates a clear information gradient without colour.

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Visual Hierarchy](./RFDS-004-VISUAL-HIERARCHY.md) | This overview |
| [Visual Weight](./RFDS-004-VISUAL-WEIGHT.md) | The VH-10 to VH-100 system |
| [Luminance System](./RFDS-004-LUMINANCE-SYSTEM.md) | Light/dark value-based hierarchy |
| [Typographic Hierarchy](./RFDS-004-TYPOGRAPHIC-HIERARCHY.md) | Text roles and their visual treatment |
| [Contrast System](./RFDS-004-CONTRAST-SYSTEM.md) | Semantic contrast assignments |
| [Emphasis Rules](./RFDS-004-EMPHASIS-RULES.md) | The four permitted mechanisms |
| [Iconography](./RFDS-004-ICONOGRAPHY.md) | Icon rules and constraints |
| [Colour Responsibility](./RFDS-004-COLOUR-RESPONSIBILITY.md) | One colour, one meaning |
| [Dark Mode](./RFDS-004-DARK-MODE.md) | Luminance ladder for dark surfaces |
| [Summary](./RFDS-004-SUMMARY.md) | Quick reference card |

---

## What RFDS-004 Removes

| Anti-Pattern | Now Forbidden |
|--------------|---------------|
| "Make it pop" with colour | "VH-90 gets accent colour only" |
| Decorative borders | "Borders are structural only" |
| Multiple accent colours | "One colour, one meaning" |
| Oversized icons | "Icons support recognition, never decoration" |
| Shadow for depth | "Shadow for overlay only" |
| Glow effects | "Never" |
| Dark mode as inversion | "Dark mode is a designed experience" |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-005 | Interaction patterns (forms, modals, drawers) |
| RFDS-006 | Data visualisation patterns |
| RFDS-007 | Motion choreography |
| RFDS-008 | Page blueprint template |

Each extends RFDS-004. None contradict it.
