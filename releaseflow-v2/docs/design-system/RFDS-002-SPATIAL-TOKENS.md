# RFDS-002 — Spatial Tokens

**Status:** Active
**Version:** 1.0

---

## Purpose

These tokens replace arbitrary spacing values throughout the application. Every measurement must reference a named token. No `mt-[23px]`. No `p-[17px]`. No `w-[340px]`.

All components and page blueprints MUST consume these tokens.

---

## Spacing Tokens

| Token | Value | Purpose |
|-------|------:|---------|
| `space.4` | 4px | Fine alignment (icon ↔ text) |
| `space.8` | 8px | Related (icon + label) |
| `space.12` | 12px | Item (badge padding) |
| `space.16` | 16px | Relationship (label ↔ value) |
| `space.20` | 20px | Component internal (rare) |
| `space.24` | 24px | Component (card padding) |
| `space.32` | 32px | Section (related sections) |
| `space.40` | 40px | Section emphasis (Assessment → Metrics) |
| `space.48` | 48px | Major component separation |
| `space.64` | 64px | Chapter (different operational zones) |
| `space.96` | 96px | Canvas (page boundary) |

---

## Width Tokens

| Token | Value | Purpose |
|-------|------:|---------|
| `width.reading` | 640px | Editorial content |
| `width.reading.lg` | 720px | Forms, longer editorial |
| `width.evidence` | 960px | Table minimum |
| `width.evidence.lg` | 1120px | Table maximum |
| `width.form` | 720px | Form columns |
| `width.canvas` | 1280px | Desktop canvas |
| `width.rail.nav` | 256px | Navigation expanded |
| `width.rail.nav.collapsed` | 72px | Navigation collapsed |
| `width.rail.context` | 360px | Context rail |

---

## Height Tokens

| Token | Value | Purpose |
|-------|------:|---------|
| `height.header` | 64px | Topbar |
| `height.row` | 40px | Standard row |
| `height.row.lg` | 44px | Touch row (mobile) |
| `height.control` | 40px | Standard control |
| `height.canvas` | 100vh | Full viewport |

---

## Padding Tokens

| Token | Value | Purpose |
|-------|------:|---------|
| `padding.canvas` | 40px (desktop) | Canvas sides |
| `padding.canvas.md` | 32px (laptop) | Canvas sides |
| `padding.canvas.sm` | 24px (tablet) | Canvas sides |
| `padding.canvas.xs` | 16px (mobile) | Canvas sides |
| `padding.component` | 24px | Card padding |
| `padding.component.sm` | 16px | Compact card padding |

---

## Gap Tokens

| Token | Value | Purpose |
|-------|------:|---------|
| `gap.inline` | 8px | Icon + text |
| `gap.relationship` | 16px | Related items |
| `gap.component` | 24px | Card internal |
| `gap.section` | 32px | Section break |
| `gap.section.tight` | 24px | Tight section break |
| `gap.chapter` | 64px | Chapter break |
| `gap.canvas` | 96px | Page break |

---

## Border Radius Tokens

| Token | Value | Purpose |
|-------|------:|---------|
| `radius.none` | 0px | Flat surfaces |
| `radius.sm` | 6px | Subtle rounding |
| `radius.md` | 10px | Standard control |
| `radius.lg` | 14px | Cards |
| `radius.xl` | 20px | Major cards |
| `radius.full` | 9999px | Pills, avatars |

---

## Shadow Tokens

| Token | Value | Purpose |
|-------|------:|---------|
| `shadow.none` | none | Flat |
| `shadow.card` | 0 1px 3px | Default card elevation |
| `shadow.raised` | 0 4px 12px | Hovered card |
| `shadow.overlay` | 0 8px 24px | Popover, tooltip |
| `shadow.modal` | 0 24px 72px | Dialog, drawer |
| `shadow.focus` | 0 0 0 3px | Focus ring |

---

## Motion Tokens

| Token | Value | Use |
|-------|------:|-----|
| `motion.instant` | 0ms | State changes only |
| `motion.fast` | 100ms | Hover, focus |
| `motion.normal` | 200ms | Card reveals, tabs |
| `motion.slow` | 300ms | Drawers, modals |

See PDS for easing curves.

---

## Typography Tokens

Reference PDS — type system is defined there, not here.

---

## Token Usage Rules

### Rule 1: Never use raw values

If a value is not in the token list, either:
- The value is wrong (use a token)
- The value is missing from the spec (add the token to RFDS-002)

### Rule 2: Compose tokens when needed

Layouts may compose: `padding: space.24 space.32` (vertical 24, horizontal 32). This is acceptable because the components are tokens.

### Rule 3: Tokens are not opinions

Tokens are facts. If a designer disagrees with a token, they propose a change to RFDS-002. They do not invent new values.

---

## Cross-Reference

| This Document | Related |
|--------------|----------|
| Reading widths | RFDS-002-READING-WIDTH.md |
| Whitespace semantics | RFDS-002-WHITESPACE-SYSTEM.md |
| Grid columns | RFDS-002-GRID-SYSTEM.md |
| Motion timing | RFDS-007 (future) |
| Colour tokens | PDS |
| Typography | PDS |
