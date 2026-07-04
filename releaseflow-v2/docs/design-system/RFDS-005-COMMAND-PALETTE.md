# RFDS-005 — Command Palette

**Status:** Active
**Version:** 1.0

---

## Principle

The command palette is power-user navigation. It provides instant access to any page, action, or search from the keyboard.

VH: 70. Higher than the navigation rail, lower than the primary action.

---

## Trigger

| Platform | Shortcut |
|----------|----------|
| macOS | ⌘K |
| Windows/Linux | Ctrl+K |

Clicking the search field in the topbar also opens the command palette.

---

## Anatomy

```
┌─────────────────────────────────────────────┐
│ 🔍 Search releases, artists, assets...       │
├─────────────────────────────────────────────┤
│ NAVIGATION                                   │
│   Home                    ⌘1                │
│   Releases                ⌘2                │
│   Artists                 ⌘3                │
│                                              │
│ ACTIONS                                      │
│   Create Release           +                │
│   Create Artist                               │
│   Upload Assets                               │
│                                              │
│ RECENT                                       │
│   Lua · EP                 2m ago           │
│   Midnight Sessions         1h ago           │
└─────────────────────────────────────────────┘
```

---

## Behaviour

| Action | Result |
|--------|--------|
| Open | Fade + scale 150ms, `ease-enter` |
| Close | Fade 100ms, `ease-exit` |
| Select item | Navigate to page, close palette |
| Esc | Close |
| Arrow keys | Navigate items |
| Enter | Select highlighted item |
| Type | Filter results |

---

## Commands (Minimum)

| Command | Shortcut | Action |
|---------|----------|--------|
| Go to Home | ⌘1 | Navigate to /dashboard |
| Go to Releases | ⌘2 | Navigate to /releases |
| Go to Artists | ⌘3 | Navigate to /artists |
| Create Release | — | Navigate to /releases/new |
| Create Artist | — | Navigate to /artists/new |
| Search | — | Search releases, artists, assets |

---

## Visual

| Element | Spec |
|---------|------|
| Width | 480px max |
| Position | Centered, 20% from top |
| Background | surface-0, shadow-modal |
| Border | 1px surface-200 |
| Radius | 14px (lg) |
| Search input | 16px body, placeholder text-400 |
| Item height | 40px |
| Item padding | 12px horizontal |
| Active item | bg-surface-100 |
| Section header | 10px annotation, text-400 |

---

## Accessibility

- `role="dialog" aria-label="Command palette"`
- `aria-modal="true"` (focus trapped while open)
- First item focused on open
- Esc closes and returns focus to trigger
- Arrow key navigation within items
