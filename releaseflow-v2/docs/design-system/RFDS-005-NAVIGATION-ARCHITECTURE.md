# RFDS-005 — Navigation Architecture

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → RFDS-005 → Feature Specification**

---

## Mission

RFDS-005 defines how a user moves through ReleaseFlow.

Navigation is not the product. Operational work is the product. Navigation should consume as little attention as possible while remaining predictable.

---

## Core Principle

```
Navigation is not the product.
Operational work is the product.
```

Navigation is a tool. It exists to connect the user to their work. It must never compete with that work for attention.

This directly reinforces RFDS-004: Navigation is VH-40. Content is VH-70–100. The gap is deliberate.

---

## Navigation Hierarchy

Not all navigation is equal. When multiple mechanisms are available, the user perceives a hierarchy. If the hierarchy is undefined, they all compete.

| Priority | Mechanism | VH | Purpose |
|----------|-----------|-----|---------|
| 1 | Primary Action | 90 | The single thing the user should do now |
| 2 | Command Palette | 70 | Power-user navigation, always available via ⌘K |
| 3 | Context Navigation | 60 | Context rail, tabs — within the current entity |
| 4 | Navigation Rail | 40 | Section-level navigation (sidebar) |
| 5 | Breadcrumbs | 30 | Orientation trail |
| 6 | Search | 50 | Navigate to anything by name |

At any given moment, the user should see at most 3 navigation mechanisms. Two visible navigation systems are ideal. Three is the maximum.

---

## Navigation Modes

| Mechanism | Entry | Exit | VH | Responsive |
|-----------|-------|------|-----|------------|
| Navigation Rail | Always visible (desktop) / Drawer (mobile) | Never closes (desktop) / Auto-close on nav (mobile) | 40 | Fixed left |
| Context Rail | Always visible (desktop) / Tab or drawer (mobile) | Never closes (desktop) / Dismiss (mobile) | 60 | Fixed right |
| Breadcrumbs | In topbar | Never | 30 | Inline |
| Command Palette | ⌘K / Ctrl+K | Esc / click outside | 70 | Overlay |
| Global Search | Click search or ⌘K | Esc / click outside | 50 | Topbar inline (desktop) / Overlay (mobile) |
| Keyboard Shortcuts | Always available | — | — | All devices |
| Deep Links | URL entry or shared link | Navigate to page | — | All devices |

---

## The Operational Flow

ReleaseFlow is not a collection of equal pages. It is a progression through an operational sequence:

```
Operations Center  (What needs attention?)
        ↓
Release            (Which release?)
        ↓
Workflow           (What stage?)
        ↓
Task               (What to do?)
        ↓
Asset              (What deliverable?)
        ↓
Rights             (Who owns what?)
        ↓
Distribution       (Can it ship?)
```

The navigation architecture must support this sequence. The user moves forward through the sequence. Back-navigation returns to the previous step. Deep-links jump to any step.

The Operations Center is always the root. No navigation flow starts from Settings. No user journey begins in Administration.

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Navigation Architecture](./RFDS-005-NAVIGATION-ARCHITECTURE.md) | This overview |
| [Navigation Rail](./RFDS-005-NAVIGATION-RAIL.md) | Sidebar specification |
| [Context Rail](./RFDS-005-CONTEXT-RAIL.md) | Right-side context panel |
| [Command Palette](./RFDS-005-COMMAND-PALETTE.md) | ⌘K power-user navigation |
| [Search](./RFDS-005-SEARCH.md) | Global search |
| [Breadcrumbs](./RFDS-005-BREADCRUMBS.md) | Orientation trail |
| [Shortcuts](./RFDS-005-SHORTCUTS.md) | Keyboard navigation |
| [Overlays](./RFDS-005-OVERLAYS.md) | Drawers, modals, dialogs |
| [Focus Model](./RFDS-005-FOCUS-MODEL.md) | Focus persistence and tab order |
| [Summary](./RFDS-005-SUMMARY.md) | Quick reference card |

---

## Anti-Patterns

| Anti-Pattern | Why |
|-------------|-----|
| Navigation competing with content (equal VH) | The user cannot distinguish tool from work |
| More than 3 visible navigation mechanisms | Overwhelming — reduce to rail + breadcrumbs + palette |
| Navigation that requires hover to discover | Inaccessible — must be visible or have a shortcut |
| Sidebar items that change meaning between pages | Navigation must be predictable |
| Deep navigation (4+ levels) | Three levels maximum: section → list → detail |
