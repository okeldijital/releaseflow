# RFDS-005 — Focus Model

**Status:** Active
**Version:** 1.0

---

## Tab Order (Operations Center)

```
1. Skip link (#main-content)
2. Navigation Rail (top to bottom)
3. Primary Action (+ Create Release)
4. Content (Hero → Assessment → Actions → Evidence → Activity)
5. Topbar (Breadcrumbs → Search → Notifications → User Menu)
```

---

## Focus Persistence

- Focus position persists across page transitions within the same section
- Opening an overlay moves focus into the overlay
- Closing an overlay returns focus to the trigger element
- The navigation rail remembers the last focused item within a session

---

## Keyboard Traversal

```
Tab        → next focusable element
Shift+Tab  → previous focusable element
Arrow keys → within a group (nav items, list items, tabs)
Enter      → activate
Space      → toggle / activate
Esc        → dismiss / close / cancel
```

---

## Focus Indicators

All focusable elements use: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40`

The ring is 2px primary-500 with a 3px offset. It is always visible on keyboard focus. It never appears on mouse click.

---

## Modal Focus Trapping

- Focus enters the modal on open
- Tab cycles through modal elements only
- Shift+Tab cycles backward
- Focus cannot escape until modal closes
- Esc closes and returns focus

---

## Validation

- [ ] Every interactive element is in the tab order
- [ ] Focus ring visible on keyboard navigation
- [ ] No focus ring on mouse click
- [ ] Modals trap focus
- [ ] Focus returns on close
- [ ] Skip link reaches main content
