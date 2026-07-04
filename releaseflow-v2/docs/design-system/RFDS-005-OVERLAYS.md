# RFDS-005 — Overlays

**Status:** Active
**Version:** 1.0

---

## Overlay Types

| Type | Elevation | Backdrop | Close |
|------|-----------|----------|-------|
| Drawer (right) | z-40, shadow-modal | bg-surface-900/40 blur | Esc, click outside |
| Dialog (center) | z-50, shadow-modal | bg-surface-900/40 blur | Esc, Cancel button |
| Dropdown | z-30, shadow-raised | None | Esc, click outside |
| Tooltip | z-20, shadow-overlay | None | Mouse leave, 300ms delay |

---

## Timing

| Action | Duration | Easing |
|--------|----------|--------|
| Open drawer | 200ms | ease-enter |
| Close drawer | 150ms | ease-exit |
| Open dialog | 200ms | ease-enter (fade + scale) |
| Close dialog | 150ms | ease-exit |
| Dropdown appear | 150ms | ease-enter (scale) |
| Tooltip appear | 150ms delay, 100ms fade | ease-enter |

---

## Focus

- First focusable element focused on open
- Focus trapped within overlay
- Focus returns to trigger on close
