# RFDS-002 — Grid System

**Status:** Active
**Version:** 1.0

---

## Principle

The grid is shared. No component may invent its own grid. Every layout element snaps to the same column structure.

The grid defines:
- How many columns
- How wide the margins are
- How wide the gutter is
- What column width results

This makes alignment predictable, and the entire application feels coordinated.

---

## Desktop (≥1024px)

```
12 columns
80px margin
24px gutter

Canvas width: 1280px
Content width: 1120px
Column width: (1120 - 11×24) / 12 = 71.3px
```

```
┌──────────────────────────────────────────────────────────┐
│ 80px margin                                            │
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│ │  │  │  │  │  │  │  │  │  │  │  │  │ 12 columns
│ │  │  │  │  │  │  │  │  │  │  │  │  │ each 71px
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘ with 24px gutter
│                                                          │
│ 80px margin                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Laptop (768–1023px)

```
12 columns (retained for consistency)
40px margin
20px gutter

Canvas width: 1024px
Content width: 944px
Column width: (944 - 11×20) / 12 = 60.3px
```

The column count stays the same. Margins and gutters compress.

---

## Tablet (640–767px)

```
8 columns
40px margin
20px gutter

Canvas width: 768px
Content width: 688px
Column width: (688 - 7×20) / 8 = 71px
```

The column count drops to 8. Components that span 6 columns (half-width) in desktop now span 4 columns in tablet.

---

## Mobile (<640px)

```
4 columns
20px margin
16px gutter

Canvas width: 360–639px
Content width: 320–599px
Column width: (480 - 3×16) / 4 = 108px (at 480px viewport)
```

The column count drops to 4. Most components become full-width or 2-column.

---

## Common Spans

| Span | Desktop | Laptop | Tablet | Mobile |
|------|---------|--------|--------|--------|
| Full width | 12/12 | 12/12 | 8/8 | 4/4 |
| Half width | 6/12 | 6/12 | 4/8 | 2/4 |
| Third width | 4/12 | 4/12 | — | — |
| Quarter width | 3/12 | 3/12 | 2/8 | — |
| Two-thirds | 8/12 | 8/12 | — | — |

---

## Column Gutter

The gutter is the space between columns. Content inside a column has padding within the column, never between columns.

- Desktop: 24px
- Laptop: 20px
- Tablet: 20px
- Mobile: 16px

The gutter defines the visual relationship between adjacent content. Tighter gutters = more dense. Looser gutters = more breathing.

---

## Reading Column

A reading column is a constrained-width zone for editorial content. It sits within the grid but is narrower than the full content width.

| Column | Span | Width |
|--------|------|------:|
| Reading (Situation) | 6/12 desktop | 640px |
| Reading (Assessment) | 6/12 desktop | 640px |
| Reading (Actions) | 6/12 desktop | 640px |
| Evidence (Tables) | 10/12 desktop | 960–1120px |
| Evidence (Metrics) | 8/12 desktop | 768px |
| Form (Inputs) | 6/12 desktop | 720px |

Reading columns are centered within the available content width. Evidence extends wider, up to the full content area minus margins.

---

## Grid Validation

Every page must pass:

- [ ] All content is aligned to the grid
- [ ] No element extends beyond the content width minus margins
- [ ] Reading column never exceeds 720px
- [ ] Evidence zone is 960–1120px max
- [ ] Mobile content uses 4-column grid
- [ ] No arbitrary column counts (no 5-col, no 7-col, no 9-col)
- [ ] Gutter is consistent within a page
