# Component Behaviour — ReleaseFlow

**Version:** 1.0

---

## Behavioural States

Every interactive component must support these states:

| State | Trigger | Visual Response |
|-------|---------|-----------------|
| **Idle** | Default | Resting appearance |
| **Hover** | Pointer enters | Subtle background/border change |
| **Pressed** | Pointer down / click | Slight scale reduction or color deepen |
| **Focused** | Tab / keyboard focus | Focus ring (2px primary + 4px halo) |
| **Loading** | Async operation in progress | Spinner or shimmer, disabled interaction |
| **Disabled** | Insufficient permissions / invalid | Reduced opacity (40%), no interaction |
| **Success** | Operation completed | Brief green indicator or checkmark |
| **Error** | Operation failed | Red indicator, error message |

---

## Component Behaviour Matrix

### Button

| State | Visual |
|-------|--------|
| Idle | Primary fill (#CC5500), white text |
| Hover | Darken to #B34A00 (primary-600) |
| Pressed | Scale 0.98, darken to #8A3900 (primary-700) |
| Focused | Focus ring |
| Loading | Spinner replaces text, disabled |
| Disabled | 40% opacity, cursor: not-allowed |
| Success | Brief green (#2A7D34) fill, reverts to idle |
| Error | Brief red (#C53030) fill, reverts to idle |

### Card (Interactive)

| State | Visual |
|-------|--------|
| Idle | `shadow-card`, `border surface-200` |
| Hover | `shadow-raised`, `border primary-200`, translateY(-1px) |
| Pressed | `shadow-card`, translateY(0) |
| Focused | Focus ring on the card |
| Loading | Shimmer skeleton placeholder |
| Disabled | 40% opacity |

### Table Row

| State | Visual |
|-------|--------|
| Idle | White background |
| Hover | `surface-50` background, cursor pointer |
| Pressed | `surface-100` background |
| Focused | Focus ring within row |
| Selected | `primary-50` background, left border `primary-500` |

### Tab

| State | Visual |
|-------|--------|
| Idle | `text-text-500`, transparent bottom border |
| Hover | `text-text-900`, `border-surface-300` |
| Active | `text-primary-500`, `border-primary-500` (2px), bold |
| Focused | Focus ring |
| Disabled | 40% opacity |

### Sidebar Nav Item

| State | Visual |
|-------|--------|
| Idle | `text-text-600`, transparent background |
| Hover | `bg-surface-100`, `text-text-900` |
| Active | `bg-primary-50`, `text-primary-700`, active dot indicator |
| Focused | Focus ring |

### Dropdown (Status, Org Selector)

| State | Visual |
|-------|--------|
| Idle | Compact badge/select appearance |
| Open | Scale-in animation (200ms), `shadow-raised` |
| Option hover | `bg-surface-100` |
| Option selected | `bg-primary-50`, checkmark |
| Close | Scale-out animation (150ms) |

### Empty State

| State | Visual |
|-------|--------|
| Idle | Icon + title + description + optional CTA |
| N/A | Empty states are not interactive themselves — only their CTA button is |

### Loading Skeleton

| State | Visual |
|-------|--------|
| Appear | Shimmer animation (1.5s infinite) |
| Resolve | Fade out (150ms), content fades in (200ms) |
| N/A | Skeletons are non-interactive |

---

## State Transition Rules

1. **Hover → Pressed** is immediate (0ms delay). No hover animation should delay the press response.
2. **Loading → Success** should show success for 1.5s before reverting to idle (or redirecting).
3. **Loading → Error** persists until dismissed. Errors are not auto-dismissed.
4. **Disabled elements never receive focus.** Tab skips disabled elements.
5. **Focus ring appears on keyboard focus, not mouse click.** Use `:focus-visible`, not `:focus`.
