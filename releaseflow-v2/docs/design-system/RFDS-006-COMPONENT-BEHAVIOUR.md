# RFDS-006 — Component Behaviour

**Status:** Active
**Version:** 1.0

---

## The Ten Standard States

Every interactive component must implement these states. No custom terminology.

| State | Trigger | Visual Response | Timing |
|-------|---------|-----------------|--------|
| **Idle** | Default | Resting appearance | — |
| **Hover** | Pointer enters | Subtle background/border change | 100ms |
| **Focus** | Tab / keyboard focus | Focus ring (2px primary-500 + 3px offset) | 0ms |
| **Active** | Pointer down / click | Scale 0.98, colour deepen | 0ms |
| **Loading** | Async operation in progress | Spinner or skeleton, disabled interaction | — |
| **Success** | Operation completed | Brief green indicator | 1.5s, then idle |
| **Warning** | Attention required | Amber indicator | Persistent until resolved |
| **Error** | Operation failed | Red indicator, error message | Persistent until dismissed |
| **Disabled** | Insufficient permissions / invalid | 40% opacity, cursor not-allowed | — |
| **Empty** | No data | EmptyState with guidance | Persistent |

---

## State Transition Table

| From | To | Allowed? |
|------|----|----------|
| Idle | Hover | Yes |
| Idle | Focus | Yes |
| Idle | Active | Yes |
| Idle | Loading | Yes |
| Hover | Active | Yes |
| Hover | Idle | Yes (pointer leaves) |
| Focus | Active | Yes |
| Focus | Idle | Yes (focus moves) |
| Active | Loading | Yes |
| Active | Idle | Yes (operation complete) |
| Loading | Success | Yes |
| Loading | Error | Yes |
| Success | Idle | Yes (1.5s auto) |
| Error | Idle | Yes (dismiss or retry) |
| Warning | Idle | Yes (condition resolved) |

Forbidden: Disabled can never transition to Active. Empty can never transition to Hover.

---

## Interactive Checklist Per Component

| Component | Idle | Hover | Focus | Active | Loading | Success | Error | Disabled | Empty |
|-----------|------|-------|-------|--------|---------|---------|-------|----------|-------|
| Button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Input | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| Card (clickable) | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Tab | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ | — |
| Table Row | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| Sidebar Item | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| Dropdown | ✓ | — | ✓ | — | — | — | — | — | — |
| Modal | ✓ | — | — | — | — | — | — | — | — |
| Toast | ✓ | — | — | — | — | ✓ | ✓ | — | — |

---

## Timing Contracts

| Transition | Duration | Easing |
|-----------|----------|--------|
| Idle → Hover | 100ms | ease-standard |
| Hover → Idle | 100ms | ease-standard |
| Idle → Active | 0ms | — |
| Active → Idle | 100ms | ease-standard |
| Loading → Success | 200ms (appear), 1.5s (display) | ease-enter |
| Loading → Error | 200ms | ease-enter |
| Any → Disabled | 0ms | — |
