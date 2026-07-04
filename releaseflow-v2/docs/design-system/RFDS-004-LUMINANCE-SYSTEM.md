# RFDS-004 — Luminance System

**Status:** Active
**Version:** 1.0

---

## Principle

Stop defining colours. Define luminance.

Visual hierarchy is created by the difference in light and dark values between elements. The greater the luminance difference, the stronger the hierarchy.

Colour is the last layer. Luminance is the first.

---

## Luminance Ladder — Light Mode

| Layer | Luminance | Purpose | PDS Token |
|-------|-----------|---------|-----------|
| Canvas | 100 | Page background — the lightest surface | surface-50 |
| Surface | 98 | Cards, panels — slightly below canvas | surface-0 |
| Divider | 90 | Structural separation — subtle | surface-200 |
| Metadata | 55 | Secondary text, labels, timestamps | text-500 |
| Body | 25 | Primary text, operational content | text-700 |
| Heading | 10 | Titles, heavy text, H1 | text-900 |
| Critical (accent) | Accent | Critical state, primary action | primary-500, danger-500 |

---

## Luminance Ladder — Dark Mode

| Layer | Luminance | Purpose | PDS Token |
|-------|-----------|---------|-----------|
| Canvas | 5 | Page background — the darkest surface | surface-950 |
| Surface | 12 | Cards, panels — slightly above canvas | surface-900 |
| Divider | 20 | Structural separation — subtle | surface-700 |
| Metadata | 45 | Secondary text, labels — elevated | text-500 |
| Body | 82 | Primary text — brightest body | text-300 |
| Heading | 96 | Titles, H1 — near-white | text-50 |
| Critical (accent) | Accent | Critical state — adjusted for dark | primary-400, danger-400 |

---

## Luminance Ratios

| Relationship | Light Ratio | Dark Ratio | Effect |
|-------------|-------------|------------|--------|
| Heading / Body | 2.5:1 | 1.2:1 | Heading always more prominent than body |
| Body / Metadata | 2.2:1 | 1.8:1 | Metadata always quieter than body |
| Canvas / Surface | 1.02:1 | 2.4:1 | Surface separation is subtle in light, more pronounced in dark |
| Surface / Divider | 1.1:1 | 1.7:1 | Dividers are more visible in dark mode |
| Critical / Body | Accent | Accent | Critical always stands out |

---

## Luminance Behaviour Per State

| State | Luminance Shift | When |
|-------|-----------------|------|
| Hover | +5/-5 (surface lightens/darkens slightly) | Pointer enters |
| Active/Selected | +10/-10 | Component is selected |
| Disabled | ×0.4 opacity | Component inactive |
| Critical | Accent luminance | Operational state = critical |
| Healthy | Green luminance | Operational state = healthy |

---

## Dark Mode Rules

1. **No inversion**: Dark mode maps to a different set of luminance values, not inverted light mode values.
2. **Body text never pure white**: text-300 (82 luminance) — comfortable to read, not harsh.
3. **Surfaces rise toward the user**: Higher elevation surfaces are lighter (surface-950 → surface-900 → surface-800).
4. **Dividers are more visible**: In dark mode, 20 luminance creates a just-visible divider.
5. **Accents shift cooler**: Primary-500 (orange) shifts to primary-400 (lighter, for contrast against dark).
6. **Shadows are replaced by luminance**: In dark mode, raised surfaces use luminance (lighter background) rather than shadows.

---

## Implementation

Luminance values are exposed as PDS tokens:

```css
--color-text-900: 2A2319  /* L=10, light heading */
--color-text-700: 564F49  /* L=25, light body */
--color-text-500: 857D76  /* L=55, light metadata */
--color-surface-50: FAF8F5 /* L=100, light canvas */
```

Dark mode equivalents:

```css
--color-text-50:  F5F0EA  /* L=96, dark heading */
--color-text-300: BDB4A8  /* L=82, dark body */
--color-text-500: 857D76  /* L=45, dark metadata */
--color-surface-950: 130F0C /* L=5, dark canvas */
```

---

## Validation

- [ ] Heading-to-body luminance ratio ≥ 1.2:1
- [ ] Body-to-metadata luminance ratio ≥ 1.5:1
- [ ] Canvas-to-surface luminance ratio ≤ 1.05:1 (light) and ≥ 2:1 (dark)
- [ ] No pure white text in dark mode
- [ ] No pure black surface in light mode
- [ ] Critical state uses accent luminance, not structural luminance
