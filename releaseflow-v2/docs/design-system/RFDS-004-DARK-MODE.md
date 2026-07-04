# RFDS-004 — Dark Mode System

**Status:** Active
**Version:** 1.0

---

## Principle

Dark mode is a designed experience, not an inversion.

Light mode values must not be simply inverted to produce dark mode. Dark mode defines its own luminance ladder, surface relationships, and accent treatments.

---

## Luminance Ladder

| Layer | Light Luminance | Dark Luminance | PDS Light | PDS Dark |
|-------|----------------|----------------|-----------|----------|
| Canvas | 100 | 5 | surface-50 | surface-950 |
| Surface | 98 | 12 | surface-0 | surface-900 |
| Raised Surface | 96 | 18 | — | surface-800 |
| Divider | 90 | 20 | surface-200 | surface-700 |
| Metadata | 55 | 45 | text-500 | text-500 |
| Body | 25 | 82 | text-700 | text-300 |
| Heading | 10 | 96 | text-900 | text-50 |

---

## Surface Behaviour

### Light Mode
Surfaces are barely distinguishable: canvas (L=100) vs surface (L=98). The difference is 2 L. This creates subtle separation without visible borders.

### Dark Mode
Surfaces rise toward the user: canvas (L=5), surface (L=12), raised (L=18). Each step is 6–7 L. This is more pronounced because dark backgrounds require larger luminance differences to create separation.

### Rule: Surfaces rise, never sink

In both modes, surfaces that are "elevated" (cards, modals) should be lighter than the canvas. In dark mode, this means surface-900 (L=12) is lighter than surface-950 (L=5).

---

## Accent Treatment

| Accent | Light Mode | Dark Mode | Adjustment |
|--------|-----------|-----------|------------|
| Primary | primary-500 (CC5500) | primary-400 (FF9933) | Lighter for contrast |
| Success | success-500 (2A7D34) | success-400 (—) | Lighter for contrast |
| Warning | warning-500 (D97706) | warning-400 (—) | Lighter for contrast |
| Danger | danger-500 (C53030) | danger-400 (—) | Lighter for contrast |
| Info | info-500 (1D6FA4) | info-400 (—) | Lighter for contrast |

Accents shift lighter in dark mode because the same saturation against a dark background appears different than against a light background.

---

## Typography Adjustments

| Role | Light Weight | Dark Weight | Reason |
|------|-------------|-------------|--------|
| Display | 500 | 500 | Same — large enough already |
| Headline | 600 | 500 | Slightly lighter — white text on dark appears bolder |
| Body | 400 | 400 | Same |
| Annotation | 600 | 500 | Slightly lighter |

Dark mode text appears bolder because light-on-dark creates a perceived increase in weight. Compensate by reducing weight by one step.

---

## Focus Treatment

| Mode | Focus Ring |
|------|-----------|
| Light | 2px primary-500 + 4px rgba(204,85,0,0.15) halo |
| Dark | 2px primary-400 + 4px rgba(255,153,51,0.20) halo |

The focus ring must be visible on both light and dark backgrounds. Use the same colour but with adjusted luminance.

---

## Divider Visibility

| Mode | Divider | Opacity |
|------|---------|---------|
| Light | surface-200 | 100% |
| Dark | surface-700 | 50% |

Dark mode dividers are more visible because the surface-to-divider luminance ratio is larger (12→20 = 1.7× vs 98→90 = 1.1×). Reduce opacity to compensate.

---

## Inactive State

| Mode | Inactive |
|------|----------|
| Light | opacity-40 |
| Dark | opacity-30 |

In dark mode, disabled/inactive elements need lower opacity because they already have lower luminance contrast against the dark background.

---

## Validation

- [ ] All surfaces use PDS dark mode tokens
- [ ] No white text at L=100 in dark mode
- [ ] No black text at L=0 in dark mode
- [ ] Accents shift lighter for dark mode
- [ ] Focus ring visible on both modes
- [ ] Typography weight adjusted for dark mode
- [ ] Dividers have adjusted opacity
- [ ] All luminance ratios pass contrast checks
