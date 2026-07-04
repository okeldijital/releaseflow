# RFDS-006 — Component Lifecycle

**Status:** Active
**Version:** 1.0

---

## Every Component Follows This Lifecycle

```
Created
    ↓
Loading
    ↓
Ready
    ↓
Updating (optional)
    ↓
Empty (optional, if no data)
    ↓
Error (optional, if failure)
    ↓
Destroyed
```

State transitions are deterministic. A component cannot skip from Created to Ready without Loading. A component cannot go from Ready to Destroyed without passing through the appropriate intermediate state.

---

## Lifecycle State Definitions

| State | Meaning | Visual |
|-------|---------|--------|
| **Created** | Component mounted, no data yet | Minimum height, no content flicker |
| **Loading** | Data is being fetched | Skeleton (informational), Spinner (operational) |
| **Ready** | Data loaded, rendering complete | Full content |
| **Updating** | Data is being refreshed | Subtle opacity shift or skeleton overlay |
| **Empty** | No data to display | EmptyState component with guidance |
| **Error** | Data fetch failed | Error message with retry action |
| **Destroyed** | Component unmounted | Cleanup, no visual |

---

## Transition Rules

### Created → Loading

Immediate. No intermediate render visible to the user.

### Loading → Ready

Fade out skeleton (150ms), fade in content (200ms). No layout shift between skeleton and content — they must occupy identical dimensions.

### Ready → Updating

Subtle opacity shift to 0.8. No skeleton replacement for quick updates (<500ms). Skeleton after 500ms.

### Ready → Empty

Replace content with EmptyState. EmptyState must occupy at least the same vertical space to prevent layout collapse.

### Ready → Error

Replace content with error state. Error state must provide a retry action and a clear message. Never expose implementation details.

### Any → Destroyed

Cleanup subscriptions and event listeners. No visual.

---

## Lifecycle Validation

- [ ] No component skips Created → Loading
- [ ] No component goes from Ready → Loading (should be Updating)
- [ ] Skeletons match content dimensions exactly
- [ ] Empty states maintain minimum height
- [ ] Error states provide retry
- [ ] Destroyed cleans up all subscriptions
