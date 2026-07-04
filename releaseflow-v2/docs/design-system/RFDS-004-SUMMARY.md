# RFDS-004 — Summary

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → Feature Specification**

---

## One Question

> **How should the interface communicate operational priority without relying on decoration?**

---

## The Four Mechanisms

Only four ways to create emphasis:

1. **Typography** — size, weight, tracking, leading
2. **Position** — vertical order, proximity, alignment
3. **Luminance** — light/dark value relationship
4. **Accent colour** — reserved for operational state

Nothing else.

---

## Visual Weight Scale

| VH | Role | Treatment |
|----|------|-----------|
| 100 | Situation | 40px medium, top of page |
| 90 | Decision | 15px medium, primary CTA |
| 85 | Assessment | 24px/10px pairs, 2-col grid |
| 70 | Evidence | 14px normal, text-700 |
| 60 | Context | 13px normal, text-500 |
| 40 | Navigation | 13px normal, text-400 |
| 20 | Metadata | 10px normal, text-400 |
| 10 | Decoration | 1px surface-200, 50% opacity |

---

## Visual Budget

| Resource | Limit |
|----------|------:|
| Accent colours | ≤5% of screen |
| High contrast elements | ≤10% of screen |
| Icons | One per primary concept |
| Borders | Structural only |
| Shadows | Overlay only |
| Filled pills | Operational state only |

---

## Luminance Highlights

| Layer | Light | Dark |
|-------|-------|------|
| Canvas | 100 | 5 |
| Surface | 98 | 12 |
| Body | 25 | 82 |
| Heading | 10 | 96 |

Dark mode is designed, not inverted.

---

## Colour Assignments

| Colour | One Meaning |
|--------|------------|
| Orange | Primary action, current stage |
| Green | Healthy, approved, complete |
| Amber | Attention, needs review |
| Red | Critical, blocked, overdue |
| Blue | Informational |
| Neutral | Structure |

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Visual Hierarchy](./RFDS-004-VISUAL-HIERARCHY.md) | Overview |
| [Visual Weight](./RFDS-004-VISUAL-WEIGHT.md) | VH-10 to VH-100 system |
| [Luminance System](./RFDS-004-LUMINANCE-SYSTEM.md) | Value-based hierarchy |
| [Typographic Hierarchy](./RFDS-004-TYPOGRAPHIC-HIERARCHY.md) | Text roles |
| [Contrast System](./RFDS-004-CONTRAST-SYSTEM.md) | Semantic contrast |
| [Emphasis Rules](./RFDS-004-EMPHASIS-RULES.md) | The four mechanisms |
| [Iconography](./RFDS-004-ICONOGRAPHY.md) | Icon rules |
| [Colour Responsibility](./RFDS-004-COLOUR-RESPONSIBILITY.md) | One colour, one meaning |
| [Dark Mode](./RFDS-004-DARK-MODE.md) | Luminance ladder for dark |
| [Summary](./RFDS-004-SUMMARY.md) | This document |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-005 | Interaction patterns |
| RFDS-006 | Data visualisation |
| RFDS-007 | Motion choreography |
| RFDS-008 | Page blueprint template |
