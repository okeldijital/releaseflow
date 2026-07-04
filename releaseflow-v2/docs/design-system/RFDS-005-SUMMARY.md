# RFDS-005 — Summary

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → RFDS-005 → Feature Specification**

---

## Core Principle

```
Navigation is not the product.
Operational work is the product.
```

Navigation consumes as little attention as possible while remaining predictable.

---

## Navigation Hierarchy (Priority Order)

| # | Mechanism | VH | Trigger |
|---|-----------|-----|---------|
| 1 | Primary Action | 90 | Visible CTA |
| 2 | Command Palette | 70 | ⌘K |
| 3 | Context Navigation | 60 | Context rail, tabs |
| 4 | Navigation Rail | 40 | Sidebar |
| 5 | Breadcrumbs | 30 | Topbar |
| 6 | Search | 50 | ⌘K or click |

---

## Rail Specs

| Rail | Width | Desktop | Tablet | Mobile |
|------|------:|---------|--------|--------|
| Navigation | 72/256px | Persistent | Drawer | Drawer |
| Context | 360px | Persistent (≥1280px) | Drawer | Inline |

---

## Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Command palette |
| ⌘\ | Toggle sidebar |
| ⌘1-3 | Home / Releases / Artists |
| Esc | Dismiss overlay |

---

## Timing

| Action | Duration |
|--------|----------|
| Hover | 100ms |
| Expand | 150ms |
| Drawer open | 200ms |
| Overlay close | 150ms |

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Navigation Architecture](./RFDS-005-NAVIGATION-ARCHITECTURE.md) | Overview + philosophy |
| [Navigation Rail](./RFDS-005-NAVIGATION-RAIL.md) | Sidebar |
| [Context Rail](./RFDS-005-CONTEXT-RAIL.md) | Right panel |
| [Command Palette](./RFDS-005-COMMAND-PALETTE.md) | ⌘K power navigation |
| [Search](./RFDS-005-SEARCH.md) | Global search |
| [Breadcrumbs](./RFDS-005-BREADCRUMBS.md) | Orientation |
| [Shortcuts](./RFDS-005-SHORTCUTS.md) | Keyboard shortcuts |
| [Overlays](./RFDS-005-OVERLAYS.md) | Drawers, dialogs |
| [Focus Model](./RFDS-005-FOCUS-MODEL.md) | Tab order, focus trapping |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-006 | Component Architecture |
| RFDS-007 | Layout Patterns |
| RFDS-008 | Page Blueprints |
