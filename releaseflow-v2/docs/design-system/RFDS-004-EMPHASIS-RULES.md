# RFDS-004 — Emphasis Rules

**Status:** Active
**Version:** 1.0

---

## Principle

Only four mechanisms may create emphasis. Everything else is forbidden.

---

## The Four Mechanisms

### 1. Typography

Size, weight, tracking, and leading create hierarchy.

| Technique | Effect |
|-----------|--------|
| Larger size | More important |
| Bolder weight | More important |
| Tighter tracking | More editorial |
| Wider tracking | More operational (labels) |
| Tighter leading | More compact |
| Looser leading | More breathing |

**Limit**: No more than 2 size changes within a single section.

### 2. Position

Vertical order and proximity create relationship.

| Technique | Effect |
|-----------|--------|
| Top of page | Most important |
| Left edge | Shared alignment |
| Closer to preceding element | Related |
| Further from preceding element | Different thought |

**Limit**: No element at an arbitrary position without reason.

### 3. Luminance

Light/dark value difference creates distinction.

| Technique | Effect |
|-----------|--------|
| Higher contrast | More important |
| Lower contrast | Less important |
| Larger luminance ratio | Stronger hierarchy |

**Limit**: No two adjacent elements at the same luminance.

### 4. Accent Colour

Reserved for operational state and primary action.

| Colour | State |
|--------|-------|
| Primary (orange) | Primary action, current stage |
| Success (green) | Healthy, approved, complete |
| Warning (amber) | Attention, needs review |
| Danger (red) | Critical, blocked, overdue |
| Info (blue) | Informational, neutral |

**Limit**: Max 5% of screen surface area uses accent. Never two accents at once in the same section.

---

## Forbidden Emphasis Mechanisms

| Mechanism | Why Banned |
|-----------|------------|
| Decorative borders | Unnecessary, adds noise |
| Unnecessary shadows | Visual clutter |
| Glowing effects | Distracting, amateurish |
| Oversized icons | Competes with content |
| Multiple competing accents | Confuses meaning |
| Decorative colour | Colour must communicate state |
| Gradients | Visual noise, inconsistent |
| Glass effects | Trendy, distracting |
| Auto-playing animation | Violates reduced-motion |
| Pulsing elements (non-status) | Distracting |

---

## Accent Usage Rules

### One accent at a time

If a section has a critical health indicator (danger), do NOT also have a primary button (orange). The user's eye should not choose between accents.

### Accent for state, not decoration

A green checkmark means "approved." It must never mean "just a nice icon." A red indicator means "blocked." It must never mean "important section."

### Accent and luminance together

Accent alone is insufficient for emphasis. The element must also carry higher luminance contrast than its surroundings. A red indicator on a low-contrast background is invisible. A red indicator on a bright background with 7:1 contrast is unmistakable.

---

## Validation

- [ ] No decorative borders anywhere
- [ ] No shadows on content (only on overlays)
- [ ] No glowing or glass effects
- [ ] No oversized icons (max 24px)
- [ ] No two adjacent accents in the same section
- [ ] Accent colour ≤5% of screen area
- [ ] High contrast elements ≤10% of screen area
