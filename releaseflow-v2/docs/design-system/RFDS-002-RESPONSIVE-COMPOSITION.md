# RFDS-002 — Responsive Composition

**Status:** Active
**Version:** 1.0

---

## Principle

Responsive is not resizing. Responsive is **recomposition**.

A layout that simply shrinks proportionally is not responsive. A layout that changes *structure* at each breakpoint is responsive.

When a page is read on a laptop, the user expects two-column layouts. When read on a phone, they expect stacked vertical flow. The breakpoints are not just width thresholds — they are structural transitions.

---

## Recomposition, Not Resize

### Anti-Pattern: Proportional Resize

```
Desktop:  [Assessment] | [Actions]   ← 6/6 columns
Laptop:   [Assessment] | [Actions]   ← 6/6 columns (just narrower)
Mobile:   [Assessment] | [Actions]   ← stacked
```

This is wrong. On mobile, Assessment and Actions are stacked, but on desktop they are not just narrower — they are in a different relationship.

### Correct: Structural Recomposition

```
Desktop:  [Assessment] | [Actions]   ← side by side
Laptop:   [Assessment]                ← full width
          [Actions]                   ← below, full width
Mobile:   [Assessment]                ← stacked
          [Actions]
```

At each breakpoint, the layout **changes structurally** — column count, flow direction, and element relationships all change.

---

## Breakpoint Recomposition Map

### Operations Center

| Desktop ≥1024px | Laptop 768–1023px | Tablet 640–767px | Mobile <640px |
|----------------|--------------------|-------------------|----------------|
| Hero (640px) | Hero (640px) | Hero (full) | Hero (full) |
| Assessment 2-col | Assessment 1-col | Assessment 1-col | Assessment 1-col |
| Actions list | Actions list | Actions list | Actions list |
| Metrics inline | Metrics inline | Metrics inline | Metrics stacked |
| Table full | Table full | Table scroll | Table cards |
| Activity list | Activity list | Activity list | Activity list |

### Release Workspace

| Desktop ≥1024px | Laptop | Tablet | Mobile |
|----------------|---------|---------|--------|
| Hero + Context rail (360px) | Hero + rail | Hero full | Hero full |
| Tabs horizontal | Tabs horizontal | Tabs scroll | Tabs scroll |
| 2-col workflow | 1-col | 1-col | 1-col |
| Context rail always | Context rail | Context rail | Context rail |
| Table full | Table scroll | Table scroll | Table cards |

### Artist Workspace

| Desktop ≥1024px | Laptop | Tablet | Mobile |
|----------------|---------|---------|--------|
| Hero + Context rail | Hero + rail | Hero full | Hero full |
| Releases grid 2-col | 1-col | 1-col | 1-col |
| Credits grid 3-col | 2-col | 1-col | 1-col |
| Context rail always | Context rail | Context rail | Context rail |

---

## Recomposition Rules

### Rule 1: At each breakpoint, evaluate structure, not just width

Ask: "What is the user's primary intent on this device?"

| Device | Primary Intent |
|--------|-----------------|
| Desktop | Scanning many things at once → multi-column |
| Laptop | Reading and acting → 1-2 columns max |
| Tablet | Quick reference → stacked, comfortable |
| Mobile | Single task → single column, maximum focus |

### Rule 2: Multi-column content stacks at laptop breakpoint

Two-column desktop layouts become one-column at ≤1023px. The eye does not benefit from side-by-side when the column width drops below ~280px.

### Rule 3: Tables never become cramped

| Device | Table Treatment |
|--------|-----------------|
| Desktop | Full table, all columns visible |
| Laptop | Full table, all columns visible |
| Tablet | Horizontal scroll, sticky first column |
| Mobile | Card list, each card = one row |

### Rule 4: Navigation changes role

| Device | Navigation |
|---------|-----------|
| Desktop | Persistent rail (72px collapsed, 256px expanded) |
| Laptop | Persistent rail (collapsed by default) |
| Tablet | Drawer overlay, auto-close after nav |
| Mobile | Drawer overlay, gesture dismiss |

### Rule 5: Touch targets grow on mobile

Touch targets on mobile must be at least 44px tall. Hit areas for icon buttons expand to fill their row. Text links maintain 16px padding.

---

## Recomposition Triggers

| Trigger | Action |
|---------|--------|
| Reading column drops below 480px | Stack all multi-column content |
| Table has > 4 columns on mobile | Convert to card list |
| Sidebar would occupy > 40% of viewport | Move to drawer |
| Touch target < 44px on mobile | Expand hit area |
| Image no longer meaningful at 200px | Stack with text below |

---

## Breakpoint Definitions (RFDS-002)

| Breakpoint | Range | Name |
|-----------|-------|------|
| xs | <640px | Mobile |
| sm | 640–767px | Mobile (large) |
| md | 768–1023px | Tablet |
| lg | 1024–1279px | Laptop |
| xl | ≥1280px | Desktop |

---

## Recomposition Validation

Every page must specify:

- [ ] Which zones are visible at each breakpoint
- [ ] Which zones collapse to one column
- [ ] Which zones stack vertically
- [ ] Which zones become hidden
- [ ] Table treatment at each breakpoint
- [ ] Navigation treatment at each breakpoint
- [ ] Touch target sizes at each breakpoint

A page that says "responsive" without specifying these is not specified.
