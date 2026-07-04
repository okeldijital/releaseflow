# RFDS-006 — State Model

**Status:** Active
**Version:** 1.0

---

## The Ten Standard States

Every interactive component must use these states. No custom terminology.

| # | State | Meaning | Visual Cue |
|---|-------|---------|------------|
| 1 | Idle | Default, not interacted with | Resting appearance |
| 2 | Hover | Pointer is over the element | Subtle bg/border change, 100ms |
| 3 | Focus | Element has keyboard focus | Focus ring (2px primary-500) |
| 4 | Active | Element is being pressed/used | Scale 0.98, colour deepen |
| 5 | Loading | Async operation in progress | Spinner or skeleton |
| 6 | Success | Operation completed successfully | Brief green, 1.5s then idle |
| 7 | Warning | Attention required | Amber indicator, persistent |
| 8 | Error | Operation failed | Red indicator + message, persistent |
| 9 | Disabled | Cannot be interacted with | 40% opacity, cursor-not-allowed |
| 10 | Empty | No data to display | EmptyState with guidance |

---

## State Applicability Per Category

| Category | Idle | Hover | Focus | Active | Loading | Success | Warning | Error | Disabled | Empty |
|----------|------|-------|-------|--------|---------|---------|---------|-------|----------|-------|
| Structural | ✓ | — | — | — | ✓ | — | — | — | — | ✓ |
| Informational | ✓ | — | — | — | ✓ | — | — | — | — | ✓ |
| Operational | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Navigational | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Contextual | ✓ | — | — | — | ✓ | — | — | — | — | ✓ |
| Feedback | ✓ | — | — | — | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Overlay | ✓ | — | — | — | ✓ | — | — | — | — | — |

---

## State Implementation Rules

1. Components that don't support a state must explicitly declare it as "not applicable"
2. States build on each other — Loading is Idle + spinner, not a replacement
3. Success auto-dismisses after 1.5s. Error persists until dismissed.
4. Disabled is a modifier — it applies on top of any other state
5. Empty replaces content, but maintains minimum height

---

## Validation

- [ ] All interactive components declare all 10 states
- [ ] No custom state names used
- [ ] States match the component's category
- [ ] Loading preserves component dimensions
- [ ] Empty maintains minimum height
