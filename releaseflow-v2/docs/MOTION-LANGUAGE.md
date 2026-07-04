# Motion Language — ReleaseFlow

**Version:** 1.0
**Source:** PDS-13 motion tokens

---

## Philosophy

Motion communicates meaning:

| Motion Pattern | Meaning |
|---------------|---------|
| Appear (fade + slide up) | New information has arrived |
| Disappear (fade + slide out) | Information has been dismissed |
| Scale up | Element is receiving focus |
| Slide (horizontal) | Navigation between views |
| Pulse (soft) | Element is loading or processing |
| Shimmer | Content is loading (skeleton) |

Motion is never decorative. Every animation explains a state change.

---

## Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 0ms | State changes without animation (reduced motion) |
| `fast` | 100ms | Button presses, hover state transitions, focus ring appearance |
| `normal` | 200ms | Card reveals, tab switches, page transitions, dropdown opens |
| `slow` | 300ms | Sidebar open/close, drawer open, modal entrance |

---

## Easing Tokens

| Token | CSS Value | Usage |
|-------|-----------|-------|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | General interactions, hover transitions |
| `ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen (deceleration) |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen (acceleration) |

Entrances decelerate. Exits accelerate. Standard interactions use a gentle curve.

---

## Choreography Rules

### Staggered Entrances

When multiple items appear simultaneously (e.g., cards in a list), stagger by 50ms per item, up to 5 items. Beyond 5 items, all appear at once.

### Directional Meaning

| Direction | Meaning |
|-----------|---------|
| Slide up | Appear, reveal |
| Slide down | Dismiss |
| Slide right | Navigate forward |
| Slide left | Navigate backward |
| Scale up | Focus, expand |
| Scale down | Collapse, dismiss |

### Page Transitions

Page-to-page navigation uses a 160ms fade (no slide). Pages should not slide — that implies a spatial relationship that doesn't exist.

---

## Interruption Rules

1. **Animations can be interrupted.** A closing sidebar can be re-opened mid-animation.
2. **Interruption uses the current position.** The animation reverses from wherever the element currently is.
3. **Loading states suppress animations.** A loading skeleton does not pulse until data resolves.

---

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations collapse to near-instant when the user prefers reduced motion. No content is hidden or removed — only the motion is eliminated.

---

## Anti-Patterns

| Practice | Why |
|----------|-----|
| Bouncing or spring animations | Too playful for operational software |
| Auto-playing animations (infinite loops) | Distracting. Pulsing skeleton is the only exception. |
| Animations over 400ms | Feels sluggish. 300ms is the maximum. |
| Animations without purpose | Every animation must explain a state change. No "delight" animations that don't communicate. |
| Different easing on the same element | Easing should be consistent per element type. |
