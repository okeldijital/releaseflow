# Surface Hierarchy — ReleaseFlow

**Version:** 1.0

---

## Surface Types

### 1. Canvas

| Attribute | Value |
|-----------|-------|
| Purpose | The application background. The lowest surface. |
| Background | `surface-50` (#FAF8F5) |
| Border | None |
| Elevation | Flat (0) |
| Usage | Behind all content, between cards |

### 2. Page

| Attribute | Value |
|-----------|-------|
| Purpose | Content containers within the canvas |
| Background | Transparent (inherits canvas) |
| Border | None |
| Elevation | Flat (0) |
| Usage | `max-w-4xl` centered containers |

### 3. Panel

| Attribute | Value |
|-----------|-------|
| Purpose | Persistent side panels: sidebar, context rail |
| Background | `surface-50` or `surface-0` |
| Border | Right (sidebar) or left (context rail), `surface-200` |
| Elevation | Flat (0) in flow, raised when overlaid (mobile) |
| Usage | Sidebar (240px, z-40 on mobile), Context Rail (320px, z-10) |

### 4. Card

| Attribute | Value |
|-----------|-------|
| Purpose | Grouped content: alerts, releases, stats, profile |
| Background | `surface-0` (#FFFFFF) |
| Border | 1px `surface-200`, 8px-20px radius |
| Elevation | Card (`shadow-card`) |
| Usage | Most content containers |

### 5. Interactive

| Attribute | Value |
|-----------|-------|
| Purpose | Clickable cards, hover-responsive rows |
| Background | `surface-0`, shifts to `surface-50` on hover |
| Border | `surface-200`, shifts to `primary-200` on hover |
| Elevation | Card → Raised on hover |
| Usage | Table rows, link cards, interactive elements |

### 6. Overlay

| Attribute | Value |
|-----------|-------|
| Purpose | Modals, dialogs, drawers, dropdowns |
| Background | `surface-0` |
| Border | 1px `surface-200` |
| Elevation | Modal (`shadow-modal`, z-50) |
| Backdrop | `#000000` at 20% opacity + blur |
| Usage | Status dropdown, confirmation dialogs, stage drawers |

---

## Surface Rules

1. **Cards never contain cards.** If content needs grouping within a card, use visual separation (border, spacing) rather than nested surfaces.
2. **Interactive surfaces always provide feedback.** Hover, press, and focus must change the surface visually.
3. **Overlay surfaces always have a backdrop.** Modal surfaces must dim the content beneath them.
4. **Panels are persistent, not dismissible** (except on mobile where they overlay).
5. **The canvas is always visible.** No full-screen solid color screens. The warm `surface-50` must always peek through.

---

## Elevation System

```
Flat (0)          — Canvas, Page, Panel (in flow)
  │
  ▼
Card (10)         — Cards, table rows
  │
  ▼
Raised (—)        — Hovered cards, selected rows
  │
  ▼
Overlay (—)       — Dropdowns, popovers
  │
  ▼
Modal (50)        — Dialogs, drawers, modals
  │
  ▼
Toast (100)       — Toasts, notifications
```

Elevation communicates interaction depth. The further a surface rises from the canvas, the more it demands attention. Flat surfaces recede. Modal surfaces demand focus.
