# Elevation System — ReleaseFlow

**Version:** 1.0
**Source:** PDS-13 shadow tokens

---

## Philosophy

Elevation is not decoration. It communicates:

| Level | Meaning |
|-------|---------|
| Flat | Resting state. No interaction required. |
| Card | Grouped content. Slightly separated from canvas. |
| Raised | Interactive. Available for action. Currently engaged. |
| Modal | Demands attention. Must be dismissed before continuing. |
| Toast | Transient notification. Overlays everything. |

---

## Shadow Tokens

### shadow-none

| Attribute | Value |
|-----------|-------|
| CSS | `none` |
| Usage | Canvas, page surfaces, panels in flow |
| Meaning | "This is the background. It recedes." |

### shadow-card

| Attribute | Value |
|-----------|-------|
| CSS | `0 1px 3px rgba(42,35,25,0.06), 0 1px 2px rgba(42,35,25,0.04)` |
| Usage | Cards, stat cards, profile cards |
| Meaning | "I am grouped content. I am slightly above the canvas." |

### shadow-raised

| Attribute | Value |
|-----------|-------|
| CSS | `0 4px 12px rgba(42,35,25,0.08), 0 2px 4px rgba(42,35,25,0.05)` |
| Usage | Hovered cards, selected rows, dropdowns |
| Meaning | "I am interactive. You are engaging with me." |

### shadow-modal

| Attribute | Value |
|-----------|-------|
| CSS | `0 24px 72px rgba(42,35,25,0.14), 0 8px 24px rgba(42,35,25,0.08)` |
| Usage | Modals, dialogs, drawers |
| Meaning | "I require your attention. Finish here before continuing." |

### shadow-overlay

| Attribute | Value |
|-----------|-------|
| CSS | `0 8px 24px rgba(42,35,25,0.10)` |
| Usage | Tooltips, popovers |
| Meaning | "I provide context. I will disappear when focus moves." |

### shadow-focus

| Attribute | Value |
|-----------|-------|
| CSS | `0 0 0 3px rgba(204,85,0,0.18)` |
| Usage | `:focus-visible` ring |
| Meaning | "You are navigating via keyboard. This element is focused." |

---

## Elevation Transitions

All elevation changes must be accompanied by motion:

| Transition | Duration | Easing |
|-----------|----------|--------|
| Card → Raised (hover) | 150ms | `ease-standard` |
| Flat → Modal (open) | 200ms | `ease-enter` |
| Modal → Flat (close) | 150ms | `ease-exit` |
| Focus ring (appear) | 100ms | `ease-enter` |

---

## Rules

1. **Two surfaces at the same elevation must not overlap.** If they do, one must rise.
2. **Backdrop always accompanies modal elevation.** Modal surfaces without a backdrop feel unmoored.
3. **Focus ring is not elevation.** It sits on top of the surface without changing its position in the z-stack.
4. **Elevation changes always animate.** No instant jumps between elevation states.
