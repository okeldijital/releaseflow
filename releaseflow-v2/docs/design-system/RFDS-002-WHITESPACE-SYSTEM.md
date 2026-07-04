# RFDS-002 — Whitespace System

**Status:** Active
**Version:** 1.0

---

## Principle

Whitespace is semantic. Each size communicates a specific relationship.

Not decorative. Not leftover area. A design resource to be allocated with intent.

---

## The Spacing Scale

| Token | Value | Name | Purpose | Visual |
|-------|------:|------|---------|--------|
| `space.4` | 4px | inline | Adjacent (label ↔ value) | · |
| `space.8` | 8px | related | Related items (icon + text) | ·· |
| `space.12` | 12px | item | One logical item (badge padding) | ··· |
| `space.16` | 16px | relationship | Elements that belong together | ···· |
| `space.24` | 24px | component | Inside a component (card padding) | ······ |
| `space.32` | 40px | section | Between different thoughts | ········ |
| `space.40` | 40px | section | Between different thoughts (emphasis) | ·········· |
| `space.48` | 48px | component | Major component separation | ·········· |
| `space.64` | 64px | chapter | Between different operational zones | ················· |
| `space.96` | 96px | canvas | Page boundary | ························ |

All values are multiples of 8 (except 4px for fine alignment).

---

## Relationship Spacing

Elements that belong together share **16px** of space between them.

| Pair | Space |
|------|------:|
| Label ↔ Value | 16px |
| Icon ↔ Text | 16px |
| Heading ↔ Body | 16px |
| Card padding (small) | 16px |

If you remove 16px between two related elements, the eye reads them as one. If you add 16px where there is none, the eye reads them as two but wonders why.

---

## Section Spacing

Different thoughts receive **24–40px** between them.

| Separation | Space |
|-----------|------:|
| Same concept, different element | 24px |
| Different concept, related zone | 32px |
| Transition to evidence (Assessment → Actions → Metrics) | 20–24px |
| Major section start (between unrelated content) | 40px |

The reading column alternates tight (16–24px) and wide (32–40px) to create editorial rhythm.

---

## Chapter Spacing

Different operational zones receive **64px** between them.

Chapter spacing is used when:
- Moving from Decision zone to Evidence zone in a major way
- Separating the page from its footer
- Breaking between two unrelated workflows

On the Operations Center, chapter spacing (64px) might appear between Hero and Assessment if they are truly different zones. On shorter pages, 40px is sufficient.

---

## Canvas Spacing

Page boundaries use **96px**.

The canvas padding at the top and bottom of every page is 96px on desktop. This creates a distinct "page" feel — the user knows they are in a complete view, not scrolling through a long document.

| Breakpoint | Canvas Padding |
|-----------|----------------:|
| Desktop | 40–48px top, 96px bottom |
| Laptop | 32–40px top, 64px bottom |
| Tablet | 24–32px top, 48px bottom |
| Mobile | 20–24px top, 32px bottom |

The bottom canvas padding is always larger than the top — the page has room to breathe after the last piece of content.

---

## Silence Budget

Each page must reserve a minimum of:

- **35–45% negative space** on desktop
- **25–35%** on laptop
- **20–30%** on tablet
- **15–20%** on mobile

Whitespace is treated as a **design resource**, not leftover area. The budget is measured: the ratio of empty space to content space must fall within these ranges.

If your page has more than 65% content and less than 35% whitespace, the page is over-dense. Reduce content, increase spacing, or move sections off-page.

If your page has more than 55% whitespace, the page may be under-dense. Add supporting content or reduce the canvas padding.

---

## The Silence Formula

```
Whitespace = Canvas Area - Content Area - Functional Padding
Whitespace Ratio = Whitespace / (Canvas Area - Functional Padding)
```

Example (Operations Center desktop):

| Component | Size |
|-----------|------:|
| Canvas | 1280 × 800 = 1,024,000 px² |
| Nav rail | 240 × 800 = 192,000 px² |
| Margins | 2 × 32 × 736 = 47,104 px² |
| Content | ~520,000 px² (estimate) |
| Whitespace (padding) | ~264,896 px² |
| Whitespace ratio | ~25% of usable area |

This is near the lower bound. Pages with more reading content would have higher whitespace ratios.

---

## What Whitespace Does

| Whitespace Does | What It Means |
|---------------|----------------|
| Separates two thoughts | These are different things |
| Groups related items | These belong together |
| Frames the focal element | This is the answer |
| Reduces visual density | The page is not crowded |
| Allows the eye to rest | Reading is comfortable |

---

## Anti-Patterns

| Anti-Pattern | Why Wrong |
|-------------|-----------|
| "Add some breathing room" — 23px here, 17px there | Spacing is not subjective. Use tokens. |
| Packing 3 sections into 100px | Eye cannot distinguish zones. No breathing room. |
| 0px gap between major sections | No hierarchy. Everything is one blob. |
| Same gap everywhere | No rhythm. Monotony. |
| Removing gap to fit more content | The content is now denser than necessary. |
