# RFDS-007 — Responsive Behaviour

**Status:** Active
**Version:** 1.0

---

## Principle

Responsive is not resizing. Responsive is recomposition. The experience remains the same even though the composition changes.

---

## Executive Briefing

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Hero | 640px, flush left | 640px | Full width |
| Assessment | 2-col grid | 1-col | 1-col |
| Actions | Inline text, full width | Inline text | Stacked, full-width text |
| Metrics | Inline bar | Inline bar | Stacked |
| Table | Full table | Scroll, sticky column | Card list |
| Activity | List | List | List |

---

## Workspace

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Entity header | 960px + 360px rail | 960px | Full width |
| Primary action | Top-right | Top-right | Top-right |
| Context rail | 360px fixed right | Drawer overlay | Inline below content |
| Tabs | Horizontal, text labels | Horizontal scroll | Icons only, scroll |
| Tab content | Full width | Full width | Full width |
| Workflow board | Multi-column | Scroll | Single-column swipe |

---

## Collection

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Header + CTA | 2-col | 2-col | Stacked |
| Table | Full table | Scroll | Card list |
| Empty state | Centered | Centered | Centered |

---

## Creation

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Form | 720px max | 720px | Full width |
| Fields | 2-col where possible | 2-col | 1-col stacked |
| Actions | Inline | Inline | Full-width buttons |

---

## Detail

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Summary cards | 2-col | 1-col | Stacked |
| Detail sections | 2-col | 1-col | Stacked |
| History | List | List | List |

---

## Review

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Evidence | Side-by-side | Stacked | Stacked |
| Decision buttons | Inline | Inline | Stacked |
| Confirmation | Centered dialog | Centered dialog | Full-screen sheet |

---

## Administration

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Settings cards | 2-col | 1-col | Stacked |
| Actions | Inline | Inline | Full-width buttons |

---

## Common Responsive Rules

1. Tables become card lists on mobile (≤640px)
2. Two-column grids become single-column at ≤1023px
3. Context rail becomes drawer ≤1279px
4. Primary action always visible, never hidden behind a menu
5. Touch targets minimum 44px on mobile
6. Hover states hidden on touch devices
